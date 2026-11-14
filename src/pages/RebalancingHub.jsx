import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Check, Clock, TrendingUp, AlertOctagon, RotateCw, AlertCircle } from 'lucide-react';
import SizeBadge from '../components/common/SizeBadge';
import { getRecommendations } from '../services/api';

export default function RebalancingHub() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [approvedIds, setApprovedIds] = useState(new Set());

  const fetchTransfers = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      setError(null);
      const res = await getRecommendations();
      if (res?.success) {
        setTransfers(res.data?.transferRecommendations || []);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const toggleApproval = (id) => {
    setApprovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalUnlockedRevenue = transfers.reduce((sum, tr) => sum + (tr.potentialRevenue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-indigo-400" />
            Inter-Store Size Rebalancing Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Algorithmic surplus-to-deficit reallocations derived from live MongoDB inventory and sales velocity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTransfers(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer w-fit"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Transfers'}</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Algorithmic Rebalancing Opportunities</h3>
            <p className="text-xs text-slate-300">
              {transfers.length} actionable size transfers identified &bull; Total potential revenue unlocked: ₹{totalUnlockedRevenue.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Approved: <strong className="text-emerald-400 font-mono">{approvedIds.size}</strong> / {transfers.length}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Evaluating surplus and deficit stock across stores...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && transfers.length === 0 && !error && (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
          <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="font-semibold text-white">All Store Inventories Balanced</p>
          <p className="text-xs text-slate-400 mt-1">No severe deficit-to-surplus transfers are required at this time.</p>
        </div>
      )}

      {/* Recommendations Cards */}
      {!loading && transfers.length > 0 && (
        <div className="space-y-4">
          {transfers.map((tr) => {
            const isApproved = approvedIds.has(tr.id);
            return (
              <div
                key={tr.id}
                className={`rounded-xl border transition-all p-5 ${
                  isApproved
                    ? 'border-emerald-500/40 bg-slate-900/90 shadow-md shadow-emerald-950/20'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                      {tr.id}
                    </span>
                    <div>
                      <h4 className="text-base font-semibold text-white">{tr.productName}</h4>
                      <span className="text-xs font-mono text-slate-400">
                        {tr.sku} &bull; {tr.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-400">Transfer Size</div>
                      <SizeBadge size={tr.size} quantity={tr.recommendedUnits} />
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleApproval(tr.id)}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Approved
                        </>
                      ) : (
                        'Approve Transfer'
                      )}
                    </button>
                  </div>
                </div>

                {/* Routing Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400 block mb-1">Source Store (Surplus):</span>
                    <span className="font-semibold text-slate-200">{tr.sourceStore}</span>
                    <div className="text-[11px] text-emerald-400 mt-1">
                      Available Stock: {tr.sourceStock} units (Ageing: {tr.sourceAgeingDays}d)
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400 block mb-1">Destination Store (Deficit):</span>
                    <span className="font-semibold text-slate-200">{tr.destinationStore}</span>
                    <div className="text-[11px] text-rose-400 mt-1">
                      Current Stock: {tr.destinationStock} units (30d Sales: {tr.destinationDemand30d})
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400 block mb-1">Impact & Economics:</span>
                    <span className="font-semibold text-slate-200">
                      {tr.recommendedUnits} units to transfer
                    </span>
                    <div className="text-[11px] text-indigo-400 mt-1 font-semibold">
                      Protected Revenue: ₹{tr.potentialRevenue?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Calculation Note */}
                <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-300">Inventory Calculation:</strong> {tr.reason}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
