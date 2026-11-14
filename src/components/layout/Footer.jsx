import React from 'react';
import { APP_NAME, APP_TAGLINE, SUPPORTED_SIZES } from '../../types/constants';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-200">{APP_NAME}</span> &bull; {APP_TAGLINE}
        </div>
        <div className="flex items-center gap-2">
          <span>Extended Size Coverage:</span>
          <div className="flex gap-1.5">
            {SUPPORTED_SIZES.map((size) => (
              <span
                key={size}
                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-indigo-300"
              >
                {size}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
