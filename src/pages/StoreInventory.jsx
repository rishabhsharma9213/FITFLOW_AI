import React, { useState } from 'react';
import { Store, Filter, Search, AlertCircle } from 'lucide-react';
import SizeBadge from '../components/common/SizeBadge';
import { SUPPORTED_SIZES } from '../types/constants';

// Initial baseline mock data structured strictly around XL - 5XL
const sampleInventory = [
  {
    id: 1,
    store: 'Metro Flagship (Store #101)',
    location: 'Downtown Retail District',
    sku: 'OXFORD-PREM-NVY',
    name: 'Heavyweight Oxford Button-Down',
    category: 'Shirts',
    sizes: { XL: 12, XXL: 8, XXXL: 0, '4XL': 0, '5XL': 2 },
    unitPrice: 68,
  },
  {
    id: 2,
    store: 'Galleria Mall (Store #104)',
    location: 'Suburban Shopping Complex',
    sku: 'FLEX-CHINO-KHK',
    name: 'Stretch Performance Chino',
    category: 'Pants',
    sizes: { XL: 15, XXL: 18, XXXL: 6, '4XL': 3, '5XL': 0 },
    unitPrice: 84,
  },
  {
    id: 3,
    store: 'Northway Center (Store #108)',
    location: 'Northside Commercial Hub',
    sku: 'TECH-HOODIE-BLK',
    name: 'ThermaFit Heavyweight Zip Hoodie',
    category: 'Outerwear',
    sizes: { XL: 6, XXL: 14, XXXL: 12, '4XL': 8, '5XL': 4 },
    unitPrice: 95,
  },
  {
    id: 4,
    store: 'Metro Flagship (Store #101)',
    location: 'Downtown Retail District',
    sku: 'MERINO-CREW-CHA',
    name: 'All-Season Merino Crewneck',
    category: 'Knitwear',
    sizes: { XL: 20, XXL: 15, XXXL: 2, '4XL': 0, '5XL': 0 },
    unitPrice: 110,
  },
];

export default function StoreInventory() {
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = sampleInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedSize === 'ALL') return matchesSearch;
    // Check if the specific size is present
    return matchesSearch && item.sizes[selectedSize] !== undefined;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-indigo-400" />
          Store-Wise Size Inventory
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor SKU inventory and identify size stockouts across extended retail sizes (XL to 5XL).
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, style, or store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Size Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Size:
          </span>
          <button
            type="button"
            onClick={() => setSelectedSize('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${
              selectedSize === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            All Sizes
          </button>
          {SUPPORTED_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors ${
                selectedSize === size
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Store & SKU</th>
                <th className="px-5 py-3.5">Product Style</th>
                <th className="px-5 py-3.5 text-center">Extended Size Distribution (XL - 5XL)</th>
                <th className="px-5 py-3.5 text-right">Total Units</th>
                <th className="px-5 py-3.5 text-right">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => {
                const totalUnits = Object.values(item.sizes).reduce((acc, q) => acc + q, 0);
                const hasZeroStock = SUPPORTED_SIZES.some((s) => item.sizes[s] === 0);

                return (
                  <tr key={`${item.store}-${item.sku}`} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{item.store}</div>
                      <div className="font-mono text-xs text-indigo-400 mt-0.5">{item.sku}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-200">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.category}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {SUPPORTED_SIZES.map((size) => (
                          <SizeBadge
                            key={size}
                            size={size}
                            quantity={item.sizes[size] ?? 0}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-semibold text-white">{totalUnits}</div>
                      {hasZeroStock && (
                        <div className="text-[11px] text-rose-400 flex items-center justify-end gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" /> Size Broken
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-slate-300">
                      ${item.unitPrice}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
