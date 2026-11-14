import React from 'react';

export default function StatCard({ title, value, change, changeType = 'positive', icon: Icon, subtitle }) {
  const changeColor =
    changeType === 'positive'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : changeType === 'negative'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      : 'text-slate-400 bg-slate-800 border-slate-700';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-800/80 text-indigo-400 border border-slate-700/60">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {change && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${changeColor}`}>
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
