import React from 'react';
import { ArrowLeftRight, Check, Clock, TrendingUp, AlertOctagon } from 'lucide-react';
import SizeBadge from '../components/common/SizeBadge';

const transferCandidates = [
  {
    id: 'TR-8091',
    sku: 'OXFORD-PREM-NVY',
    productName: 'Heavyweight Oxford Button-Down',
    size: 'XXXL',
    units: 8,
    fromStore: 'Suburban Outlet (Store #106)',
    fromSurplus: 19,
    toStore: 'Metro Flagship (Store #101)',
    toStock: 0,
    velocityDiff: '+4.2 units/week in Metro',
    potentialRevenue: '$544',
    status: 'Recommended',
    reason: 'Metro Flagship has 0 units of XXXL with weekend rush expected; Suburban Outlet has 45 days of supply.',
  },
  {
    id: 'TR-8092',
    sku: 'FLEX-CHINO-KHK',
    productName: 'Stretch Performance Chino',
    size: '5XL',
    units: 5,
    fromStore: 'Northway Center (Store #108)',
    fromSurplus: 11,
    toStore: 'Galleria Mall (Store #104)',
    toStock: 0,
    velocityDiff: '+2.8 units/week in Galleria',
    potentialRevenue: '$420',
    status: 'Recommended',
    reason: 'Galleria Mall 5XL size breakage resolved without triggering vendor backorders.',
  },
  {
    id: 'TR-8093',
    sku: 'TECH-HOODIE-BLK',
    productName: 'ThermaFit Heavyweight Zip Hoodie',
    size: '4XL',
    units: 6,
    fromStore: 'Galleria Mall (Store #104)',
    fromSurplus: 14,
    toStore: 'Metro Flagship (Store #101)',
    toStock: 0,
    velocityDiff: '+5.1 units/week in Metro',
    potentialRevenue: '$570',
    status: 'Approved',
    reason: 'Inter-store transfer transit scheduled via regional courier.',
  },
];

export default function RebalancingHub() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-indigo-400" />
          Inter-Store Size Rebalancing Hub
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Eliminate size stockouts and deadstock by algorithmically reallocating XL - 5XL units between stores.
        </p>
      </div>

      {/* Summary Banner */}
      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Algorithmic Rebalancing Opportunities</h3>
            <p className="text-xs text-slate-300">
              3 active size-rebalancing transfers identified &bull; Total potential revenue unlocked: $1,534
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        {transferCandidates.map((tr) => (
          <div
            key={tr.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                  {tr.id}
                </span>
                <div>
                  <h4 className="text-base font-semibold text-white">{tr.productName}</h4>
                  <span className="text-xs font-mono text-slate-400">{tr.sku}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-slate-400">Target Size</div>
                  <SizeBadge size={tr.size} quantity={tr.units} />
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium border ${
                    tr.status === 'Approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {tr.status}
                </span>
              </div>
            </div>

            {/* Routing Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400 block mb-1">Source Store (Surplus):</span>
                <span className="font-semibold text-slate-200">{tr.fromStore}</span>
                <div className="text-[11px] text-emerald-400 mt-1">
                  Surplus: {tr.fromSurplus} units available
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400 block mb-1">Destination Store (Deficit):</span>
                <span className="font-semibold text-slate-200">{tr.toStore}</span>
                <div className="text-[11px] text-rose-400 mt-1">
                  Stockout: 0 units in stock
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400 block mb-1">Impact & Velocity:</span>
                <span className="font-semibold text-slate-200">{tr.velocityDiff}</span>
                <div className="text-[11px] text-indigo-400 mt-1">
                  Protected Revenue: {tr.potentialRevenue}
                </div>
              </div>
            </div>

            {/* Deterministic Inventory Calculation Note */}
            <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300">Inventory Calculation:</strong> {tr.reason}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
