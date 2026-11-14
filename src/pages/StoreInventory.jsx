import React, { useState, useEffect, useCallback } from 'react';
import { Store, Filter, Search, AlertCircle, RotateCw, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import SizeBadge from '../components/common/SizeBadge';
import { SUPPORTED_SIZES } from '../types/constants';
import { getInventory } from '../services/api';

const STORES = [
  'All Stores',
  'Jayanagar',
  'Marathahalli',
  'Peenya WH',
  'Rajajinagar',
  'Whitefield',
  'Yelahanka',
];

export default function StoreInventory() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(
    async (pageToLoad = 1, isManual = false) => {
      try {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const params = {
          page: pageToLoad,
          limit: 25,
        };

        if (selectedStore !== 'All Stores') {
          params.store = selectedStore;
        }
        if (selectedSize !== 'ALL') {
          // Normalize 3XL / XXXL
          params.size = selectedSize === 'XXXL' ? '3XL' : selectedSize;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const res = await getInventory(params);
        if (res?.success) {
          setItems(res.data || []);
          setTotalCount(res.total || 0);
          setPage(res.page || 1);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load store inventory:', err);
        setError(err.message || 'Failed to fetch inventory from server');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStore, selectedSize, searchQuery]
  );

  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-400" />
            Store-Wise Size Inventory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live SKU breakdown across 2,940 MongoDB inventory records with extended size tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchItems(page, true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer w-fit"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Store Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
            <Store className="w-3.5 h-3.5" /> Branch:
          </span>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {STORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Size Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Size:
          </span>
          <button
            type="button"
            onClick={() => setSelectedSize('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer shrink-0 ${
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
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer shrink-0 ${
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

      {/* Results Count & Meta */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white font-mono">{items.length}</strong> of{' '}
          <strong className="text-white font-mono">{totalCount.toLocaleString()}</strong> matching inventory records
        </span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Querying MongoDB inventory records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="font-semibold text-white">No Inventory Records Found</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the size or store filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Store Branch</th>
                  <th className="px-5 py-3.5">SKU & Style</th>
                  <th className="px-5 py-3.5">Category & Colour</th>
                  <th className="px-5 py-3.5 text-center">Size</th>
                  <th className="px-5 py-3.5 text-right">In-Stock Units</th>
                  <th className="px-5 py-3.5 text-right">Ageing (Days)</th>
                  <th className="px-5 py-3.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => {
                  const isStockout = item.stock === 0;
                  const isAgeing = item.ageingDays >= 90;

                  return (
                    <tr key={`${item._id || item.sku + item.store}`} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-white">{item.store}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-200">{item.productName}</div>
                        <div className="font-mono text-xs text-indigo-400 mt-0.5">{item.sku}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        <div>{item.category}</div>
                        <div className="text-slate-500">{item.colour || item.style}</div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <SizeBadge size={item.size} showQuantity={false} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`font-semibold font-mono px-2 py-0.5 rounded text-xs ${
                            isStockout
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : item.stock <= 3
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'text-white'
                          }`}
                        >
                          {item.stock} {isStockout ? '(Out)' : 'units'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs">
                        <span
                          className={isAgeing ? 'text-amber-400 font-semibold' : 'text-slate-400'}
                        >
                          {item.ageingDays}d
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-300">
                        ₹{item.sellingPrice?.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => fetchItems(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs text-slate-400 font-mono">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => fetchItems(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
