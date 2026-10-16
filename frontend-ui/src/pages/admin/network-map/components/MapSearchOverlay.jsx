// frontend-ui/src/pages/admin/network-map/components/MapSearchOverlay.jsx
import React from 'react';
import { Search, X } from 'lucide-react';

export default function MapSearchOverlay({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalNodes,
  leakCount,
  disabled = false
}) {
  return (
    <div className={`absolute top-6 left-6 z-30 flex flex-col gap-2.5 max-w-sm w-full select-none transition-opacity duration-200 ${disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Apple Pill Search Input */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-2xl p-2 border border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center gap-2">
        <Search className="h-4 w-4 text-[#86868b] ml-2 shrink-0 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search household, node ID, or Purok..."
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

      {/* Apple Recessed Segmented Filter */}
      <div className="self-start inline-flex p-1 bg-white/85 backdrop-blur-2xl rounded-xl border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-xs">
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
                ? 'bg-[#18181b] text-white font-semibold shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

    </div>
  );
}