/**
 * FitFlow AI - Core Constants & Business Definitions
 * Tagline: Right Size. Right Store. Right Time.
 * 
 * Specializing in extended size curves: XL, XXL, XXXL, 4XL, and 5XL.
 */

export const APP_NAME = 'FitFlow AI';
export const APP_TAGLINE = 'Right Size. Right Store. Right Time.';
export const APP_DESCRIPTION = 
  'AI-powered, size-aware inventory intelligence platform for extended-size apparel retailers.';

/**
 * The core size curve for the retailer.
 * FitFlow AI tracks inventory, sales velocity, and phantom stockouts across these exact sizes.
 */
export const SUPPORTED_SIZES = ['XL', 'XXL', 'XXXL', '4XL', '5XL'];

export const SIZE_LABELS = {
  XL: 'XL (Extra Large)',
  XXL: 'XXL (2X Large)',
  XXXL: 'XXXL (3X Large)',
  '4XL': '4XL (4X Large)',
  '5XL': '5XL (5X Large)',
};

export const SIZE_BADGE_COLORS = {
  XL: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  XXL: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  XXXL: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  '4XL': 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  '5XL': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

export const INVENTORY_STATUS = {
  CRITICAL_STOCKOUT: { label: 'Stockout', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  LOW_STOCK: { label: 'Low Stock', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  HEALTHY: { label: 'Optimal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  OVERSTOCK: { label: 'Overstock Risk', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  DEADSTOCK: { label: 'Deadstock Risk', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
};
