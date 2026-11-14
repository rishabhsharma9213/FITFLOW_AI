const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

let cachedSnapshot = null;
const getSnapshotInventory = () => {
  if (!cachedSnapshot) {
    const snapPath = path.join(__dirname, '..', 'data', 'fitflowSnapshot.json');
    if (fs.existsSync(snapPath)) {
      cachedSnapshot = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
    }
  }
  return cachedSnapshot?.inventory || [];
};

// 1. Add a new inventory record
router.post('/', async (req, res) => {
  try {
    const inventory = await Inventory.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Inventory added successfully',
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// 2. Get all inventory with optional search, store, size, category filters and product joining
router.get('/', async (req, res) => {
  try {
    const { search, store, storeId, size, category, page = 1, limit = 100 } = req.query;
    const targetStore = store || storeId;
    const parsedLimit = limit === 'all' ? 5000 : parseInt(limit, 10) || 100;
    const parsedPage = parseInt(page, 10) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    // Fallback to verified fitflow_ai snapshot if MongoDB Atlas IP whitelist blocks cloud connection
    if (req.dbConnected === false) {
      let items = getSnapshotInventory();
      if (targetStore) {
        items = items.filter((i) => i.store === targetStore);
      }
      if (size) {
        if (size === 'XXXL' || size === '3XL') {
          items = items.filter((i) => i.size === '3XL' || i.size === 'XXXL');
        } else {
          items = items.filter((i) => i.size === size);
        }
      }
      if (category) {
        items = items.filter((i) => i.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(
          (i) =>
            (i.sku && i.sku.toLowerCase().includes(q)) ||
            (i.productName && i.productName.toLowerCase().includes(q)) ||
            (i.store && i.store.toLowerCase().includes(q))
        );
      }
      const total = items.length;
      const paged = items.slice(skip, skip + parsedLimit);
      return res.status(200).json({
        success: true,
        count: paged.length,
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit),
        data: paged,
      });
    }

    const pipeline = [];

    // Filter by store if provided
    if (targetStore) {
      pipeline.push({ $match: { store: targetStore } });
    }

    // Join with products collection
    pipeline.push({
      $lookup: {
        from: 'products',
        localField: 'sku',
        foreignField: 'sku',
        as: 'productInfo',
      },
    });

    pipeline.push({
      $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true },
    });

    // Additional filters on joined product
    const matchConditions = {};
    if (size) {
      if (size === 'XXXL' || size === '3XL') {
        matchConditions['productInfo.size'] = { $in: ['3XL', 'XXXL'] };
      } else {
        matchConditions['productInfo.size'] = size;
      }
    }
    if (category) {
      matchConditions['productInfo.category'] = category;
    }
    if (search) {
      matchConditions.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { 'productInfo.product': { $regex: search, $options: 'i' } },
        { store: { $regex: search, $options: 'i' } },
      ];
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Sort by store and SKU
    pipeline.push({ $sort: { store: 1, sku: 1 } });

    // Use facet to get total count and paginated data
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: parsedLimit }],
      },
    });

    const results = await Inventory.aggregate(pipeline);
    const total = results[0]?.metadata[0]?.total || 0;
    const data = results[0]?.data || [];

    // Format output with flattened product fields for convenience
    const formattedData = data.map((item) => ({
      _id: item._id,
      sku: item.sku,
      store: item.store,
      stock: item.stock,
      ageingDays: item.ageingDays,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      productName: item.productInfo?.product || item.sku,
      category: item.productInfo?.category || 'Apparel',
      style: item.productInfo?.style,
      colour: item.productInfo?.colour,
      size: item.productInfo?.size,
      sellingPrice: item.productInfo?.sellingPrice || 0,
    }));

    res.status(200).json({
      success: true,
      count: formattedData.length,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      data: formattedData,
    });
  } catch (error) {
    console.error('Error in GET /api/inventory:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 3. Update an inventory record
router.put('/:id', async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// 4. Delete an inventory record
router.delete('/:id', async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
