import React from 'react';
import { Search, X } from 'lucide-react';

export default function MapSearchOverlay({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalNodes,
  leakCount,
  nodes = [],
  selectedNodeId = null,
  onSelectNode,
  disabled = false
}) {
  return (
    <div
      className={`absolute top-6 left-6 z-30 flex flex-col gap-2.5 max-w-sm w-full select-none transition-opacity duration-200 ${
        disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Search Input */}
      <div className="bg-white/90 backdrop-blur-2xl rounded-2xl p-2 border border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center gap-2">
        <Search className="h-4 w-4 text-[#86868b] ml-2 shrink-0 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search household, node ID, or street..."
          className="w-full bg-transparent text-xs text-[#1d1d1f] outline-none placeholder:text-[#86868b] py-1"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="p-1 rounded-full text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="self-start inline-flex p-1 bg-white/90 backdrop-blur-2xl rounded-xl border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-xs">
        {[
          { id: 'all', label: `All Meters (${totalNodes})` },
          { id: 'leak', label: `Leaks (${leakCount})` },
          { id: 'maintenance', label: 'Maintenance' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onStatusFilterChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-[#0c4a6e] text-white font-semibold shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick-Jump Node Pill Strip (Shows all filtered nodes) */}
      {nodes.length > 0 && (
        <div className="bg-white/85 backdrop-blur-2xl rounded-2xl p-2 border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {nodes.map((n) => {
            const isSelected = selectedNodeId === n.id;
            const dotColor = n.isLeaking()
              ? 'bg-rose-500 animate-ping'
              : n.isMaintenance()
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onSelectNode && onSelectNode(n)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0c4a6e] text-white shadow-2xs'
                    : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700'
                }`}
                title={`${n.label} (${n.locationName})`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span>{n.id.replace('NODE-', '')}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}