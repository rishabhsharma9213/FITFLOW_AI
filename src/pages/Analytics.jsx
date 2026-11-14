import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, RotateCw, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getOverviewAnalytics } from '../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      setError(null);
      const res = await getOverviewAnalytics();
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const trendData = (data?.dailySalesTrend || []).map((d) => ({
    date: d.date.slice(5),
    qtySold: d.qtySold,
    revenue: Math.round(d.revenue / 1000),
  }));

  const breakageData = (data?.stockDistributionByStore || []).map((s) => ({
    store: s.store,
    totalStock: s.totalStock,
    breakageRate: s.skuCount > 0 ? Math.round((s.zeroStockCount / s.skuCount) * 100) : 0,
    zeroCount: s.zeroStockCount,
  }));

  const sizeCurveData = (data?.stockDistributionBySize || []).map((s) => ({
    size: s.size,
    units: s.totalStock,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Size Demand Velocity & Breakage Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical demand trajectories and size curve breakage frequency derived from 11,713 sales records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer w-fit"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Analytics'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Calculating velocity & store breakage metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Velocity Trend */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">30-Day Daily Sales Velocity</h2>
                <p className="text-xs text-slate-400">Total units sold per day across the network</p>
              </div>
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSalesQty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} units`, 'Units Sold']}
                  />
                  <Area
                    type="monotone"
                    dataKey="qtySold"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorSalesQty)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-400">
              <span>Verified Sales Transactions</span>
              <span className="text-emerald-400 font-semibold">
                {data?.salesQty30Days?.toLocaleString()} Total Units Sold
              </span>
            </div>
          </div>

          {/* Size Breakage Rate by Store */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Size Breakage Index by Store Location</h2>
                <p className="text-xs text-slate-400">% of SKUs currently at 0 stock at each branch</p>
              </div>
              <PieIcon className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="store" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val, name, item) => [
                      `${val}% (${item.payload.zeroCount} SKUs out)`,
                      'Zero-Stock Breakage',
                    ]}
                  />
                  <Bar dataKey="breakageRate" name="Breakage Rate (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-center text-slate-400">
              Stores with elevated breakage rates require prioritized rebalancing from Peenya WH.
            </p>
          </div>

          {/* Extended Size Distribution Chart */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Live Inventory by Product Size Curve</h2>
                <p className="text-xs text-slate-400">Total in-stock units across the retailer size spectrum</p>
              </div>
              <span className="text-xs text-indigo-400 font-mono">Extended Sizing Emphasis</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeCurveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="size" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} units`, 'Stock']}
                  />
                  <Bar dataKey="units" name="In-Stock Units" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
