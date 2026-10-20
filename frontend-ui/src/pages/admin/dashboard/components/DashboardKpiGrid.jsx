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
    <div className="border border-slate-200 rounded-md bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
      
      {/* 1. Active water leaks */}
      <Link
        to="/incidents"
        className="p-5 flex flex-col justify-between hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
      >
        <span className="text-sm text-slate-600">Active water leaks</span>
        <div className="text-[32px] leading-tight font-semibold text-slate-900 tabular-nums my-1">
          {kpis.activeLeaks}
        </div>
        <p className="text-sm text-slate-600">Conduits currently breaching</p>
      </Link>

      {/* 2. Pending work orders */}
      <Link
        to="/incidents"
        className="p-5 flex flex-col justify-between hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
      >
        <span className="text-sm text-slate-600">Pending work orders</span>
        <div className="text-[32px] leading-tight font-semibold text-slate-900 tabular-nums my-1">
          {kpis.pendingTickets}
        </div>
        <p className="text-sm text-slate-600">Requires dispatcher attention</p>
      </Link>

      {/* 3. On-duty plumbers */}
      <Link
        to="/users"
        className="p-5 flex flex-col justify-between hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
      >
        <span className="text-sm text-slate-600">On-duty plumbers</span>
        <div className="text-[32px] leading-tight font-semibold text-slate-900 tabular-nums my-1">
          {kpis.onDutyTechs}
        </div>
        <p className="text-sm text-slate-600">Ready for field dispatch</p>
      </Link>

      {/* 4. 24h community usage */}
      <Link
        to="/reports"
        className="p-5 flex flex-col justify-between hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
      >
        <span className="text-sm text-slate-600">24h community usage</span>
        <div className="text-[32px] leading-tight font-semibold text-slate-900 tabular-nums my-1">
          {primaryVolumeDisplay}
        </div>
        <p className="text-sm text-slate-600">{secondaryVolumeDisplay}</p>
      </Link>

    </div>
  );
}