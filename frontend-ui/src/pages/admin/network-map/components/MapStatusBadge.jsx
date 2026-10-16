// frontend-ui/src/pages/admin/network-map/components/MapStatusBadge.jsx
import React from 'react';
import { Plus } from 'lucide-react';

export default function MapStatusBadge({ activeCount, leakCount, onAddClick, isAddingNode }) {
  // If operator is actively drafting a pin, hide this badge to keep the screen uncluttered
  if (isAddingNode) return null;

  return (
    <div className="absolute top-6 right-6 z-30 flex items-center gap-3 select-none">
      
      {/* Live Health Status Pill */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-xl px-3.5 py-2 border border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center gap-2.5 text-xs">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-semibold text-slate-800">
          {activeCount} Active <span className="text-slate-400 font-normal">•</span> {leakCount} Leaks
        </span>
      </div>

      {/* Apple Dark Pill Button */}
      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all active:scale-95 cursor-pointer"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>Add Water Meter</span>
      </button>

    </div>
  );
}