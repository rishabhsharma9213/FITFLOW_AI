import React from 'react';
import { SIZE_BADGE_COLORS } from '../../types/constants';

export default function SizeBadge({ size, quantity, showQuantity = true }) {
  const colorClass = SIZE_BADGE_COLORS[size] || 'bg-slate-800 text-slate-300 border-slate-700';
  const isOutOfStock = quantity === 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
        isOutOfStock
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 line-through opacity-75'
          : colorClass
      }`}
    >
      <span>{size}</span>
      {showQuantity && typeof quantity === 'number' && (
        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
          isOutOfStock ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-900/60 text-slate-200'
        }`}>
          {quantity}
        </span>
      )}
    </span>
  );
}
