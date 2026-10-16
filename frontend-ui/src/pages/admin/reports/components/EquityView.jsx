// frontend-ui/src/pages/admin/reports/components/EquityView.jsx
import React from 'react';

export default function EquityView({ data }) {
  const summary = data?.community_summary || {
    total_community_liters: 0,
    total_cubic_meters: 0,
    community_mean_daily_liters: 0,
    disadvantaged_nodes_count: 0
  };
  const households = data?.household_breakdown || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* 4 Neutral KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Total Community Water</span>
          <div className="text-2xl font-black text-slate-900">{summary.total_cubic_meters} m³</div>
          <span className="text-[11px] text-slate-500">({summary.total_community_liters} Liters)</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Community Mean Daily</span>
          <div className="text-2xl font-black text-slate-900">{summary.community_mean_daily_liters} L</div>
          <span className="text-[11px] text-slate-500">Per household / day</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Disadvantaged Nodes</span>
          <div className="text-2xl font-black text-slate-900">{summary.disadvantaged_nodes_count}</div>
          <span className="text-[11px] text-slate-500">Below 0.70 RDI threshold</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Audit Horizon</span>
          <div className="text-2xl font-black text-slate-900">30 Days</div>
          <span className="text-[11px] text-slate-500">Sliding window audit</span>
        </div>
      </div>

      {/* Neutral Context Banner */}
      {summary.disadvantaged_nodes_count > 0 && (
        <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-700 flex items-start gap-3">
          <span className="font-bold text-slate-900 shrink-0 mt-0.5">ℹ️ Equity Notice:</span>
          <p className="leading-relaxed">
            {summary.disadvantaged_nodes_count} household(s) received less than 70% of the community mean. The coordinator agent recommends checking upstream gate valve restrictions.
          </p>
        </div>
      )}

      {/* Household Breakdown Table */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.05] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 pl-6">Node & Household</th>
                <th className="py-3 px-4">Purok</th>
                <th className="py-3 px-4">Total Volume</th>
                <th className="py-3 px-4">Daily Mean</th>
                <th className="py-3 px-4">Peak Flow</th>
                <th className="py-3 px-4">RDI Score</th>
                <th className="py-3 px-4 pr-6 text-right">Equity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {households.map((h) => (
                <tr key={h.node_id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="py-3.5 px-4 pl-6">
                    <span className="font-semibold text-xs text-slate-900 block">{h.household_label}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{h.node_id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{h.purok_cluster}</td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">{h.total_cubic_meters} m³</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{h.mean_daily_liters} L/day</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{h.peak_flow_rate_lpm} L/min</td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">{h.rdi_score}</td>
                  <td className="py-3.5 px-4 pr-6 text-right">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-medium border ${
                      h.equity_status === 'DISADVANTAGED' 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-black/[0.04] text-slate-700 border-black/[0.06]'
                    }`}>
                      {h.equity_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}