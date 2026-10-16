// frontend-ui/src/pages/admin/dashboard/components/SystemMapPreview.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Network, Navigation } from 'lucide-react';

export default function SystemMapPreview() {
  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Network className="h-4 w-4 text-slate-700" />
            <span>System Map</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Live view of network nodes and incident locations.</p>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Leak</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Normal</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Plumber</span>
        </div>
      </div>

      {/* Simulated Clean OpenStreetMap Preview Box */}
      <Link
        to="/network-map"
        className="block relative h-40 w-full rounded-xl overflow-hidden border border-slate-200/80 group cursor-pointer bg-slate-100"
      >
        {/* Abstract Map Roads Background simulation */}
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Simulated river / roads */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-1/3 w-2 h-full bg-sky-200 transform -rotate-12" />
          <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-200 transform rotate-6" />
        </div>

        {/* Floating Pins */}
        <div className="absolute top-10 left-12 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shadow-sm" />
        <div className="absolute top-20 right-20 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-500/30 animate-pulse shadow-md" />
        <div className="absolute bottom-8 left-1/3 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shadow-sm" />
        <div className="absolute bottom-12 right-1/4 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-600/20 shadow-sm" />

        {/* Floating Action Hint */}
        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 font-bold text-xs shadow-md group-hover:scale-105 transition-transform flex items-center gap-1.5">
            <Navigation className="h-3 w-3 text-[#0284c7]" />
            <span>Open Interactive Map</span>
          </span>
        </div>
      </Link>
    </div>
  );
}