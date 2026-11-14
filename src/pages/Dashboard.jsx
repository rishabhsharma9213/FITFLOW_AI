import React from 'react';
import { Layers, AlertTriangle, ArrowLeftRight, CheckCircle2, TrendingUp, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../components/common/StatCard';
import SizeBadge from '../components/common/SizeBadge';
import { SUPPORTED_SIZES, APP_NAME, APP_TAGLINE } from '../types/constants';

// Initial baseline mock data demonstrating XL - 5XL extended sizing
const sizeDistributionData = [
  { size: 'XL', stock: 420, demand: 450, optimal: 400 },
  { size: 'XXL', stock: 380, demand: 520, optimal: 480 },
  { size: 'XXXL', stock: 190, demand: 340, optimal: 320 },
  { size: '4XL', stock: 120, demand: 210, optimal: 200 },
  { size: '5XL', stock: 85, demand: 160, optimal: 150 },
];

const samplePhantomAlerts = [
  {
    store: 'Metro Flagship (Store #101)',
    sku: 'OXFORD-PREM-NVY',
    productName: 'Heavyweight Oxford Button-Down',
    totalUnits: 42,
    brokenSizes: ['XXXL', '4XL'],
    message: 'Store displays in-stock status (42 units), but high-demand sizes XXXL & 4XL have 0 inventory.',
  },
  {
    store: 'Galleria Mall (Store #104)',
    sku: 'FLEX-CHINO-KHK',
    productName: 'Stretch Performance Chino',
    totalUnits: 28,
    brokenSizes: ['5XL'],
    message: '5XL completely stocked out; regional demand velocity is 14 units/week.',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {APP_NAME} Control Center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {APP_TAGLINE} &bull; Specialized Size Intelligence (XL to 5XL)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Network Monitor
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Size Availability Index"
          value="74.2%"
          change="+3.8% vs last week"
          changeType="positive"
          icon={CheckCircle2}
          subtitle="Target threshold: > 85%"
        />
        <StatCard
          title="Phantom Stockout Alerts"
          value="18 SKUs"
          change="Critical Size Breaks"
          changeType="negative"
          icon={AlertTriangle}
          subtitle="Depleted XL-5XL with false in-stock"
        />
        <StatCard
          title="Transfer Recommendations"
          value="12 Actions"
          change="Ready for Rebalance"
          changeType="neutral"
          icon={ArrowLeftRight}
          subtitle="Surplus to deficit store transfers"
        />
        <StatCard
          title="Protected Revenue"
          value="$14,850"
          change="Weekly Run Rate"
          changeType="positive"
          icon={TrendingUp}
          subtitle="Revenue safeguarded via size rebalancing"
        />
      </div>

      {/* Charts & Phantom Stockouts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extended Size Distribution Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Extended Size Inventory vs. Demand Curve</h2>
              <p className="text-xs text-slate-400">
                Network-wide comparison across core retailer sizes (XL - 5XL)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Current Stock
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Unmet Demand
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                />
                <Bar dataKey="stock" name="Current Stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="demand" name="Total Demand" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Phantom Stockout Alerts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Size Breakage Alerts
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Immediate Action
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Items showing overall in-stock status but completely stocked out in high-demand extended sizes.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {samplePhantomAlerts.map((alert) => (
              <div key={alert.sku} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                  <span>{alert.store}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{alert.sku}</span>
                </div>
                <p className="text-slate-200 font-medium">{alert.productName}</p>
                <p className="text-slate-400 mt-1 text-[11px]">{alert.message}</p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">Stocked Out:</span>
                  {alert.brokenSizes.map((size) => (
                    <SizeBadge key={size} size={size} quantity={0} showQuantity={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Size Curve Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-base font-semibold text-white mb-2">Extended Size Focus Matrix</h2>
        <p className="text-xs text-slate-400 mb-4">
          All demand forecasts, rebalancing algorithms, and AI explanations prioritize these five core extended sizes.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SUPPORTED_SIZES.map((size) => (
            <div key={size} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/50 text-center">
              <span className="text-lg font-bold text-indigo-400 font-mono">{size}</span>
              <p className="text-[11px] text-slate-400 mt-1">Managed Size Segment</p>
              <div className="mt-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 py-0.5 rounded border border-emerald-500/20">
                Active Tracking
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
