// frontend-ui/src/pages/admin/users/components/UserKpiCards.jsx
import React from 'react';

export default function UserKpiCards({ kpis }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
          Total Users
        </span>
        <div className="text-2xl font-black text-slate-900">{kpis.total}</div>
        <span className="text-[11px] text-slate-500">Registered accounts</span>
      </div>

      {/* Metric 2 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
          Bound Households
        </span>
        <div className="text-2xl font-black text-slate-900">{kpis.boundCount}</div>
        <span className="text-[11px] text-slate-500">
          {kpis.unboundCount > 0 ? (
            <span className="text-slate-600 font-medium">{kpis.unboundCount} unassigned meter(s)</span>
          ) : (
            '100% meters linked'
          )}
        </span>
      </div>

      {/* Metric 3 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
          Field Plumbers
        </span>
        <div className="text-2xl font-black text-slate-900">{kpis.techs}</div>
        <span className="text-[11px] text-slate-500 font-medium">Available for dispatch</span>
      </div>

      {/* Metric 4 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
          Administrators
        </span>
        <div className="text-2xl font-black text-slate-900">{kpis.admins}</div>
        <span className="text-[11px] text-slate-500 font-medium">Protected governance</span>
      </div>
    </div>
  );
}