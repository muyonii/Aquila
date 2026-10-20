import React, { useMemo } from 'react';

export default function WorkforceView({ data }) {
  const technicians = data?.technicians || [];

  const { totalDispatches, passRate } = useMemo(() => {
    let assigned = 0;
    let verified = 0;
    let failed = 0;

    technicians.forEach((t) => {
      assigned += Number(t.total_assigned || 0);
      verified += Number(t.completed_verified || 0);
      failed += Number(t.failed_inspections || 0);
    });

    const totalEvaluated = verified + failed;
    const rate = totalEvaluated > 0 ? ((verified / totalEvaluated) * 100).toFixed(1) : '100.0';

    return {
      totalDispatches: assigned,
      passRate: `${rate}%`
    };
  }, [technicians]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Workforce Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            On-Duty Plumbers
          </span>
          <div className="text-2xl font-black text-slate-900">{technicians.length}</div>
          <span className="text-[11px] text-slate-500">Active maintenance personnel</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            Total Dispatches Handled
          </span>
          <div className="text-2xl font-black text-slate-900">{totalDispatches}</div>
          <span className="text-[11px] text-slate-500">Work orders assigned</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            Verification Success Rate
          </span>
          <div className="text-2xl font-black text-emerald-700">{passRate}</div>
          <span className="text-[11px] text-slate-500">15-minute quiet verification pass</span>
        </div>
      </div>

      {/* Technician Performance Table */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.05] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 pl-6">Technician Name</th>
                <th className="py-3 px-4">Total Assigned</th>
                <th className="py-3 px-4">Verified Closures</th>
                <th className="py-3 px-4">Failed Inspections</th>
                <th className="py-3 px-4 pr-6 text-right">In Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {technicians.map((tech) => (
                <tr key={tech.user_id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="py-3.5 px-4 pl-6 font-semibold text-xs text-slate-900">
                    {tech.technician_name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-800">
                    {tech.total_assigned}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-700">
                    {tech.completed_verified}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-rose-600">
                    {tech.failed_inspections}
                  </td>
                  <td className="py-3.5 px-4 pr-6 text-right font-mono text-xs text-slate-600">
                    {tech.in_progress}
                  </td>
                </tr>
              ))}
              {technicians.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                    No technician records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}