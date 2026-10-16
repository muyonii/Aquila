// frontend-ui/src/pages/admin/dashboard/components/DashboardKpiGrid.jsx
import React from 'react';
import { Droplets, AlertTriangle, Users, Activity, ChevronRight } from 'lucide-react';

export function DashboardKpiGrid({ summary, kpis }) {
  const totalM3 = (summary.community24hLiters / 1000.0).toFixed(3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Active Water Leaks */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:border-slate-300 transition-all">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center border border-sky-100">
            <Droplets className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </div>

        <div className="mt-4 space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            Active Water Leaks
          </span>
          <div className="text-2xl font-black text-slate-900">{kpis.activeLeaks}</div>
          <p className="text-[11px] text-slate-500">Conduits currently breaching</p>
        </div>

        {/* Mini Sparkline Graphic */}
        <div className="mt-3 pt-2 border-t border-black/[0.03] flex items-end justify-between">
          <span className="text-[10px] font-mono text-slate-400">Trend</span>
          <svg className="w-20 h-5" viewBox="0 0 80 20" fill="none">
            <path d="M 0 15 Q 20 18, 40 10 T 80 5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 2. Pending Work Orders */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:border-slate-300 transition-all">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </div>

        <div className="mt-4 space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            Pending Work Orders
          </span>
          <div className="text-2xl font-black text-slate-900">{kpis.pendingTickets}</div>
          <p className="text-[11px] text-slate-500">Requires dispatcher attention</p>
        </div>

        <div className="mt-3 pt-2 border-t border-black/[0.03] flex items-end justify-between">
          <span className="text-[10px] font-mono text-slate-400">Queue</span>
          <svg className="w-20 h-5" viewBox="0 0 80 20" fill="none">
            <path d="M 0 12 Q 25 5, 50 15 T 80 8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 3. On-Duty Plumbers */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:border-slate-300 transition-all">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Users className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </div>

        <div className="mt-4 space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            On-Duty Plumbers
          </span>
          <div className="text-2xl font-black text-slate-900">{kpis.onDutyTechs}</div>
          <p className="text-[11px] text-slate-500">Ready for field dispatch</p>
        </div>

        <div className="mt-3 pt-2 border-t border-black/[0.03] flex items-end justify-between">
          <span className="text-[10px] font-mono text-slate-400">Capacity</span>
          <svg className="w-20 h-5" viewBox="0 0 80 20" fill="none">
            <path d="M 0 10 Q 30 15, 60 8 T 80 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* 4. 24h Community Usage */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:border-slate-300 transition-all">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Activity className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </div>

        <div className="mt-4 space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            24h Community Usage
          </span>
          <div className="text-2xl font-black text-slate-900">{totalM3} m³</div>
          <p className="text-[11px] text-slate-500">{summary.community24hLiters} Liters total draw</p>
        </div>

        <div className="mt-3 pt-2 border-t border-black/[0.03] flex items-end justify-between">
          <span className="text-[10px] font-mono text-slate-400">Volume</span>
          <svg className="w-20 h-5" viewBox="0 0 80 20" fill="none">
            <path d="M 0 16 Q 20 8, 50 12 T 80 4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

    </div>
  );
}