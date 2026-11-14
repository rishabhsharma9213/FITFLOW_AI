import React from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';
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
import { SUPPORTED_SIZES } from '../types/constants';

const weeklyVelocityTrend = [
  { week: 'W1', XL: 120, XXL: 140, XXXL: 95, '4XL': 60, '5XL': 40 },
  { week: 'W2', XL: 135, XXL: 155, XXXL: 110, '4XL': 72, '5XL': 48 },
  { week: 'W3', XL: 150, XXL: 170, XXXL: 130, '4XL': 85, '5XL': 55 },
  { week: 'W4', XL: 175, XXL: 195, XXXL: 150, '4XL': 98, '5XL': 68 },
];

const breakageByStore = [
  { store: 'Metro Flagship', breakageRate: 28 },
  { store: 'Galleria Mall', breakageRate: 19 },
  { store: 'Northway Center', breakageRate: 12 },
  { store: 'Suburban Outlet', breakageRate: 35 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          Size Demand Velocity & Breakage Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical demand trajectories and size curve breakage frequency across the extended sizing spectrum (XL - 5XL).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Velocity Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Weekly Extended Size Sales Velocity</h2>
              <p className="text-xs text-slate-400">Total units sold per size over the past 4 weeks</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyVelocityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXXL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorXXXL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 12 }} />
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
                <Area type="monotone" dataKey="XXL" stroke="#6366f1" fillOpacity={1} fill="url(#colorXXL)" />
                <Area type="monotone" dataKey="XXXL" stroke="#a855f7" fillOpacity={1} fill="url(#colorXXXL)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500" /> XXL Velocity
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500" /> XXXL Velocity
            </span>
          </div>
        </div>

        {/* Size Breakage Rate by Store */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Size Breakage Index by Store Location</h2>
              <p className="text-xs text-slate-400">% of SKUs suffering from one or more broken XL-5XL sizes</p>
            </div>
            <PieIcon className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakageByStore} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                />
                <Bar dataKey="breakageRate" name="Breakage Rate (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-center text-slate-400">
            Stores with &gt;20% breakage require urgent rebalancing before vendor restock cycles.
          </p>
        </div>
      </div>
    </div>
  );
}
