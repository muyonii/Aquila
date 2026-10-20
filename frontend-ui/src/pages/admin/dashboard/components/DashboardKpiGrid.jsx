import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, AlertTriangle, Users, Activity, ChevronRight } from 'lucide-react';
import { useSettings } from '../../settings/core/SettingsManager';

export function DashboardKpiGrid({ summary, kpis }) {
  const prefs = useSettings();
  const totalLiters = Number(summary.community24hLiters || 0);
  const totalM3 = (totalLiters / 1000.0).toFixed(3);
  const primaryVolumeDisplay =
    prefs.volumeUnit === 'liters' ? `${totalLiters.toFixed(1)} L` : `${totalM3} m³`;
  const secondaryVolumeDisplay =
    prefs.volumeUnit === 'liters'
      ? `${totalM3} m³ cubic volume`
      : `${totalLiters.toFixed(1)} Liters total draw`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Active Water Leaks -> /incidents */}
      <Link
        to="/incidents"
        className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center border border-sky-100">
            <Droplets className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="mt-4 space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            Active Water Leaks
          </span>
          <div className="text-2xl font-black text-slate-900">{kpis.activeLeaks}</div>
          <p className="text-[11px] text-slate-500">Conduits currently breaching</p>
        </div>

        <div className="mt-3 pt-2 border-t border-black/[0.03] flex items-end justify-between">
          <span className="text-[10px] font-mono text-slate-400">Live Status</span>
          <svg className="w-20 h-5" viewBox="0 0 80 20" fill="none">
            <path d="M 0 15 Q 20 18, 40 10 T 80 5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </Link>

      {/* 2. Pending Work Orders -> /incidents */}
      <Link
        to="/incidents"
        className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
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
      </Link>

      {/* 3. On-Duty Plumbers -> /users */}
      <Link
        to="/users"
        className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Users className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="mt-4 space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            On-Duty Plumbers
          </span>
          <div className="text-2xl font-black text-slate-900">{kpis.onDutyTechs}</div>
          <p className="text-[11px] text-slate-500">Ready for field dispatch</p>
        </div>

        <div className="mt-3 pt-2 border-t border-black/[0.03] flex items-end justify-between">
          <span className="text-[10px] font-mono text-slate-400">Workforce</span>
          <svg className="w-20 h-5" viewBox="0 0 80 20" fill="none">
            <path d="M 0 10 Q 30 15, 60 8 T 80 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </Link>

      {/* 4. 24h Community Usage -> /reports */}
      <Link
        to="/reports"
        className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative group hover:border-slate-300 transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Activity className="h-4 w-4" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="mt-4 space-y-0.5">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
            24h Community Usage
          </span>
          <div className="text-2xl font-black text-slate-900">{totalM3} m³</div>
          <p className="text-[11px] text-slate-500">{Number(summary.community24hLiters).toFixed(1)} Liters total draw</p>
        </div>

        <div className="mt-3 pt-2 border-t border-black/[0.03] flex items-end justify-between">
          <span className="text-[10px] font-mono text-slate-400">Volume</span>
          <svg className="w-20 h-5" viewBox="0 0 80 20" fill="none">
            <path d="M 0 16 Q 20 8, 50 12 T 80 4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </Link>

    </div>
  );
}