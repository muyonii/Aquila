// frontend-ui/src/pages/admin/dashboard/components/SystemMapPreview.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Network, Navigation } from 'lucide-react';

export default function SystemMapPreview() {
  return (
    <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">System map</h2>
          <p className="text-sm text-slate-600 mt-0.5">Live view of network nodes and incident locations.</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-600" /> Leak</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Normal</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0c4a6e]" /> Plumber</span>
        </div>
      </div>

      {/* Clean OpenStreetMap Preview Box */}
      <Link
        to="/network-map"
        className="block relative h-40 w-full rounded-md overflow-hidden border border-slate-200 group cursor-pointer bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Schematic streets */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/3 w-2 h-full bg-slate-300 transform -rotate-12" />
          <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-300 transform rotate-6" />
        </div>

        {/* Node points */}
        <div className="absolute top-10 left-12 w-2.5 h-2.5 rounded-full bg-emerald-600" />
        <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-rose-600" />
        <div className="absolute bottom-8 left-1/3 w-2.5 h-2.5 rounded-full bg-emerald-600" />
        <div className="absolute bottom-12 right-1/4 w-2.5 h-2.5 rounded-full bg-[#0c4a6e]" />

        {/* Centered button */}
        <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
          <span className="px-3.5 py-1.5 rounded-md bg-white text-slate-900 font-semibold text-sm border border-slate-300">
            Open interactive map
          </span>
        </div>
      </Link>
    </div>
  );
}