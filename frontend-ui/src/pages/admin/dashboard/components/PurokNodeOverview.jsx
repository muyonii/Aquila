// frontend-ui/src/pages/admin/dashboard/components/PurokNodeOverview.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ChevronRight } from 'lucide-react';

export default function PurokNodeOverview({ nodes = [] }) {
  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Network className="h-4 w-4 text-slate-700" />
            <span>Purok 2 Sector Status Overview</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Monitored neighborhood tap nodes and physical sensor health.</p>
        </div>

        <Link
          to="/network-map"
          className="inline-flex items-center gap-1 text-xs text-[#007aff] hover:underline font-semibold"
        >
          <span>Open Map</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {nodes.slice(0, 6).map((n) => (
          <div key={n.node_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <span className="font-semibold text-xs text-slate-900 block truncate">{n.household_label}</span>
              <span className="text-[10.5px] font-mono text-slate-400">{n.node_id}</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Normal</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}