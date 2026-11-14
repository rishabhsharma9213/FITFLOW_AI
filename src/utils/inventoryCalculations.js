/**
 * FitFlow AI - Core Inventory & Size-Aware Calculations
 * 
 * Provides deterministic mathematical models for size availability,
 * phantom stockout detection, size curve breakage, and inter-store rebalancing.
 * These metrics provide the grounding data that Gemini analyzes and explains.
 */

import { SUPPORTED_SIZES } from '../types/constants';

/**
 * Calculates the Size Availability Index (SAI) for a store or network.
 * SAI measures what percentage of the extended size range (XL, XXL, XXXL, 4XL, 5XL)
 * is actively available for shoppers.
 * 
 * @param {Array<{ size: string, quantity: number }>} sizeBreakdown
 * @returns {number} Percentage between 0 and 100
 */
export function calculateSizeAvailabilityIndex(sizeBreakdown) {
  if (!Array.isArray(sizeBreakdown) || sizeBreakdown.length === 0) return 0;
  
  const inStockSizes = sizeBreakdown.filter(item => item.quantity > 0).length;
  return Math.round((inStockSizes / SUPPORTED_SIZES.length) * 100);
}

/**
 * Detects "Phantom Stockouts" (Size Breakage).
 * In retail, a product may be technically marked "In-Stock" (total count > 0),
 * but if high-demand sizes (e.g. 2XL / 3XL) have 0 units, customers walk away.
 * 
 * @param {number} totalUnits - Aggregate quantity for the SKU at this store
 * @param {Array<{ size: string, quantity: number }>} sizeBreakdown
 * @returns {{ isPhantomStockout: boolean, brokenSizes: string[], severity: 'low' | 'medium' | 'high' }}
 */
export function detectPhantomStockout(totalUnits, sizeBreakdown) {
  if (totalUnits <= 0) {
    return { isPhantomStockout: false, brokenSizes: [], severity: 'none' };
  }

  const brokenSizes = sizeBreakdown
    .filter(item => SUPPORTED_SIZES.includes(item.size) && item.quantity === 0)
    .map(item => item.size);

  const isPhantomStockout = brokenSizes.length > 0;
  let severity = 'none';

  if (brokenSizes.length >= 3) {
    severity = 'high';
  } else if (brokenSizes.length >= 1) {
    severity = 'medium';
  }

  return {
    isPhantomStockout,
    brokenSizes,
    severity,
  };
}

/**
 * Calculate Size Curve Health Score (0-100)
 * Evaluates how balanced the store's inventory is across the XL-5XL curve.
 */
export function calculateSizeCurveHealth(sizeBreakdown) {
  if (!sizeBreakdown || sizeBreakdown.length === 0) return 0;

  const quantities = sizeBreakdown.map(s => s.quantity);
  const minQty = Math.min(...quantities);
  const maxQty = Math.max(...quantities);

  if (maxQty === 0) return 0;

  // Zero stock penalty
  const zeroCount = quantities.filter(q => q === 0).length;
  const zeroPenalty = (zeroCount / SUPPORTED_SIZES.length) * 50;

  // Imbalance penalty
  const ratio = minQty / maxQty;
  const balanceScore = ratio * 50;

  const healthScore = Math.max(0, Math.round(50 - zeroPenalty + balanceScore));
  return Math.min(100, healthScore);
}

/**
 * Evaluates whether an inter-store transfer is mathematically justified.
 * Prevents transferring stock if the donor store would fall into low-stock status.
 */
export function evaluateTransferCandidate({
  donorStoreInventory,
  recipientStoreInventory,
  weeklyVelocityDonor,
  weeklyVelocityRecipient,
  safetyStock = 5,
}) {
  const surplus = donorStoreInventory - (safetyStock + weeklyVelocityDonor * 2);
  const deficit = (safetyStock + weeklyVelocityRecipient * 2) - recipientStoreInventory;

  if (surplus > 0 && deficit > 0) {
    const recommendedUnits = Math.min(surplus, deficit);
    return {
      isViable: recommendedUnits > 0,
      recommendedUnits,
      reason: `Donor has ${surplus} surplus units beyond 2-week safety buffer; Recipient has unmet weekly demand of ${weeklyVelocityRecipient} units.`,
    };
  }

  return {
    isViable: false,
    recommendedUnits: 0,
    reason: 'Insufficient surplus at donor store or deficit does not justify freight.',
  };
}
