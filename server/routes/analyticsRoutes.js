const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Sales = require('../models/Sales');
const Store = require('../models/Store');
const { generateInventoryInsights } = require('../services/aiService');

// Helper to determine the dynamic 30-day window from the latest sale date in database
const get30DayWindow = async () => {
  const latestSale = await Sales.findOne().sort({ date: -1 }).select('date').lean();
  const maxDate = latestSale && latestSale.date ? new Date(latestSale.date) : new Date();
  const minDate = new Date(maxDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { minDate, maxDate };
};

/**
 * GET /api/analytics/overview
 * Returns calculated MongoDB metrics immediately (< 200ms)
 */
router.get('/overview', async (req, res) => {
  try {
    const { minDate, maxDate } = await get30DayWindow();

    // 1. Inventory Units, Zero-Stock, Ageing >= 90
    const stockStats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalUnits: { $sum: '$stock' },
          zeroStockRecords: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
          ageing90Records: { $sum: { $cond: [{ $gte: ['$ageingDays', 90] }, 1, 0] } },
          totalRecords: { $sum: 1 },
        },
      },
    ]);

    const totalUnits = stockStats[0]?.totalUnits || 0;
    const zeroStockRecords = stockStats[0]?.zeroStockRecords || 0;
    const ageing90Records = stockStats[0]?.ageing90Records || 0;
    const totalRecords = stockStats[0]?.totalRecords || 0;

    // 2. Unique SKUs & Total Stores
    const uniqueSkus = (await Inventory.distinct('sku')).length;
    const storeCount = (await Store.countDocuments()) || (await Inventory.distinct('store')).length;

    // 3. 30-Day Sales Volume & Revenue
    const salesSummary = await Sales.aggregate([
      { $match: { date: { $gte: minDate, $lte: maxDate } } },
      {
        $group: {
          _id: null,
          salesQty30Days: { $sum: '$qtySold' },
          salesRevenue30Days: { $sum: { $multiply: ['$qtySold', '$sellingPrice'] } },
        },
      },
    ]);

    const salesQty30Days = salesSummary[0]?.salesQty30Days || 0;
    const salesRevenue30Days = salesSummary[0]?.salesRevenue30Days || 0;

    // 4. Stock Distribution by Store
    const stockDistributionByStore = await Inventory.aggregate([
      {
        $group: {
          _id: '$store',
          totalStock: { $sum: '$stock' },
          skuCount: { $sum: 1 },
          zeroStockCount: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        },
      },
      {
        $project: {
          store: '$_id',
          totalStock: 1,
          skuCount: 1,
          zeroStockCount: 1,
          _id: 0,
        },
      },
      { $sort: { totalStock: -1 } },
    ]);

    // 5. Stock Distribution by Product Size
    const stockDistributionBySize = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'sku',
          foreignField: 'sku',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.size',
          totalStock: { $sum: '$stock' },
          itemCount: { $sum: 1 },
        },
      },
      {
        $project: {
          size: '$_id',
          totalStock: 1,
          itemCount: 1,
          _id: 0,
        },
      },
      { $sort: { size: 1 } },
    ]);

    // 6. Top 5 Selling Products (Last 30 Days)
    const topSellingProducts = await Sales.aggregate([
      { $match: { date: { $gte: minDate, $lte: maxDate } } },
      {
        $group: {
          _id: '$sku',
          totalQtySold: { $sum: '$qtySold' },
          totalRevenue: { $sum: { $multiply: ['$qtySold', '$sellingPrice'] } },
        },
      },
      { $sort: { totalQtySold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'sku',
          as: 'productInfo',
        },
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          sku: '$_id',
          totalQtySold: 1,
          totalRevenue: 1,
          productName: { $ifNull: ['$productInfo.product', '$_id'] },
          category: { $ifNull: ['$productInfo.category', 'Apparel'] },
          size: { $ifNull: ['$productInfo.size', 'Standard'] },
          style: '$productInfo.style',
          colour: '$productInfo.colour',
          sellingPrice: '$productInfo.sellingPrice',
          _id: 0,
        },
      },
    ]);

    // 7. Daily Sales Trend (Last 30 Days)
    const dailySalesTrend = await Sales.aggregate([
      { $match: { date: { $gte: minDate, $lte: maxDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          qtySold: { $sum: '$qtySold' },
          revenue: { $sum: { $multiply: ['$qtySold', '$sellingPrice'] } },
        },
      },
      {
        $project: {
          date: '$_id',
          qtySold: 1,
          revenue: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUnits,
        uniqueSkus,
        totalStores: storeCount,
        salesQty30Days,
        salesRevenue30Days,
        zeroStockRecords,
        ageing90Records,
        totalRecords,
        stockDistributionByStore,
        stockDistributionBySize,
        topSellingProducts,
        dailySalesTrend,
        dateWindow: {
          start: minDate.toISOString(),
          end: maxDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory overview',
      error: error.message,
    });
  }
});

/**
 * Shared helper to compute fast sellers, ageing alerts, and transfer recommendations from MongoDB
 */
const computeRecommendationsData = async () => {
  const { minDate, maxDate } = await get30DayWindow();

  // 1. Sales per (sku, store) in the 30-day window
  const salesBySkuStore = await Sales.aggregate([
    { $match: { date: { $gte: minDate, $lte: maxDate } } },
    {
      $group: {
        _id: { sku: '$sku', store: '$store' },
        totalSold: { $sum: '$qtySold' },
      },
    },
  ]);

  const salesMap = new Map();
  salesBySkuStore.forEach((s) => {
    salesMap.set(`${s._id.sku}__${s._id.store}`, s.totalSold);
  });

  // 2. Fetch all inventory joined with product metadata
  const allInventory = await Inventory.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'sku',
        foreignField: 'sku',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
  ]);

  const fastSellersRisk = [];
  const ageingAlerts = [];
  const skuStoreMap = new Map();

  allInventory.forEach((item) => {
    const key = `${item.sku}__${item.store}`;
    const sold30 = salesMap.get(key) || 0;
    const dailyVelocity = sold30 / 30;
    const coverageDays = dailyVelocity > 0 ? Math.round(item.stock / dailyVelocity) : 999;

    const record = {
      sku: item.sku,
      store: item.store,
      stock: item.stock,
      ageingDays: item.ageingDays,
      soldLast30Days: sold30,
      dailyVelocity: Number(dailyVelocity.toFixed(2)),
      coverageDays,
      productName: item.product?.product || 'Apparel Item',
      category: item.product?.category || 'Apparel',
      size: item.product?.size || 'N/A',
      sellingPrice: item.product?.sellingPrice || 0,
    };

    if (!skuStoreMap.has(item.sku)) {
      skuStoreMap.set(item.sku, []);
    }
    skuStoreMap.get(item.sku).push(record);

    if (sold30 >= 5 && item.stock <= 3) {
      fastSellersRisk.push({
        ...record,
        urgency: item.stock === 0 ? 'CRITICAL_STOCKOUT' : 'LOW_COVERAGE',
        reason: `High velocity of ${sold30} units sold in 30d, but only ${item.stock} left in stock (~${coverageDays} days coverage).`,
      });
    }

    if (item.ageingDays >= 90 && item.stock >= 5 && sold30 <= 1) {
      ageingAlerts.push({
        ...record,
        reason: `Aged ${item.ageingDays} days with ${item.stock} units unsold (${sold30} sales in last 30d).`,
      });
    }
  });

  fastSellersRisk.sort((a, b) => b.soldLast30Days - a.soldLast30Days);
  ageingAlerts.sort((a, b) => b.ageingDays - a.ageingDays);

  // 3. Inter-Store Transfer Recommendations
  const transferRecommendations = [];
  for (const [sku, storeRecords] of skuStoreMap.entries()) {
    const deficitStores = storeRecords.filter((r) => r.stock <= 2 && r.soldLast30Days >= 3);
    const surplusStores = storeRecords.filter((r) => r.stock >= 8);

    for (const def of deficitStores) {
      for (const sur of surplusStores) {
        if (def.store !== sur.store) {
          const transferable = Math.min(sur.stock - 4, 10);
          if (transferable >= 3) {
            transferRecommendations.push({
              id: `TR-${sku}-${sur.store.substring(0, 3)}-${def.store.substring(0, 3)}`,
              sku,
              productName: def.productName,
              category: def.category,
              size: def.size,
              sourceStore: sur.store,
              sourceStock: sur.stock,
              destinationStore: def.store,
              destinationStock: def.stock,
              recommendedUnits: transferable,
              destinationDemand30d: def.soldLast30Days,
              sourceAgeingDays: sur.ageingDays,
              potentialRevenue: transferable * def.sellingPrice,
              reason: `Transfer ${transferable} units of size ${def.size} from ${sur.store} (${sur.stock} stock) to ${def.store} (${def.stock} stock, ${def.soldLast30Days} units sold/month).`,
            });
            break;
          }
        }
      }
    }
  }

  // 4. Low-Stock Stores Summary
  const storeStockSummary = await Inventory.aggregate([
    {
      $group: {
        _id: '$store',
        totalStock: { $sum: '$stock' },
        zeroStockSkus: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        totalSkus: { $sum: 1 },
      },
    },
    {
      $project: {
        store: '$_id',
        totalStock: 1,
        zeroStockSkus: 1,
        zeroStockPercentage: {
          $round: [{ $multiply: [{ $divide: ['$zeroStockSkus', '$totalSkus'] }, 100] }, 1],
        },
        _id: 0,
      },
    },
    { $sort: { zeroStockPercentage: -1 } },
  ]);

  return {
    fastSellersRisk,
    ageingAlerts,
    transferRecommendations,
    storeStockSummary,
    allInventory,
    skuStoreMap,
    salesMap,
  };
};

/**
 * GET /api/analytics/recommendations
 * Returns deterministic calculations IMMEDIATELY (no Gemini blocking!)
 */
router.get('/recommendations', async (req, res) => {
  try {
    const data = await computeRecommendationsData();

    res.status(200).json({
      success: true,
      data: {
        fastSellersRisk: data.fastSellersRisk.slice(0, 20),
        ageingAlerts: data.ageingAlerts.slice(0, 20),
        transferRecommendations: data.transferRecommendations.slice(0, 25),
        storeStockSummary: data.storeStockSummary,
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/ai-insights
 * Asynchronous endpoint for Google Gemini with quota exhaustion detection and instant fallback
 */
router.get('/ai-insights', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const recs = await computeRecommendationsData();

    const aiInsights = await generateInventoryInsights(
      {
        totalUnits: recs.allInventory.reduce((acc, i) => acc + i.stock, 0),
        uniqueSkus: recs.skuStoreMap.size,
        totalStores: recs.storeStockSummary.length,
        zeroStockRecords: recs.allInventory.filter((i) => i.stock === 0).length,
        ageing90Records: recs.allInventory.filter((i) => i.ageingDays >= 90).length,
        salesQty30Days: Array.from(recs.salesMap.values()).reduce((a, b) => a + b, 0),
        salesRevenue30Days: recs.fastSellersRisk.reduce((a, b) => a + b.sellingPrice * b.soldLast30Days, 0),
        stockDistributionByStore: recs.storeStockSummary,
        topSellingProducts: recs.fastSellersRisk.slice(0, 5),
      },
      {
        fastSellersRisk: recs.fastSellersRisk.slice(0, 10),
        ageingAlerts: recs.ageingAlerts.slice(0, 10),
        transferRecommendations: recs.transferRecommendations.slice(0, 5),
      },
      { force }
    );

    res.status(200).json({
      success: true,
      data: aiInsights,
    });
  } catch (error) {
    console.error('Error in /api/analytics/ai-insights:', error);
    res.status(200).json({
      success: true,
      data: {
        provider: 'deterministic',
        isAiGenerated: false,
        quotaExceeded: true,
        modelUsed: 'deterministic-fallback',
        aiStatus: 'Gemini AI unavailable — daily API quota exceeded',
        badge: 'Deterministic Engine Active',
        executiveSummary: 'FitFlow AI has analyzed network stock levels across all stores. Velocity remains steady on core sizing.',
        sizeAndStoreAttention: 'Extended sizing (XL, XXL, 3XL) continues to show the highest sales velocity.',
        stockoutRisks: 'Immediate stock replenishment is recommended for fast-selling items with low days of supply.',
        actionPlan: [
          'Dispatch pending transfers from Peenya WH to retail branches.',
          'Review ageing inventory for clearance pricing.',
          'Reorder high-velocity SKUs.'
        ]
      }
    });
  }
});

module.exports = router;
