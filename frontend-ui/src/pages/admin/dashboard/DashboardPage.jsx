// frontend-ui/src/pages/admin/dashboard/DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { dashboardManager } from './core/DashboardManager';
import { useAuthStore } from '../../../stores/useAuthStore';

import DashboardHeader from './components/DashboardHeader';
import { DashboardKpiGrid } from './components/DashboardKpiGrid';
import CommunityFlowChart from './components/CommunityFlowChart';
import PurokNodeOverview from './components/PurokNodeOverview';
import PriorityIncidentWidget from './components/PriorityIncidentWidget';
import AdminActionHub from './components/AdminActionHub';
import SystemMapPreview from './components/SystemMapPreview';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState({
    totalNodes: 9,
    community24hLiters: 1193.5,
    nodes: [],
    incidentBreakdown: [],
    systemStatus: 'OPERATIONAL'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardManager.fetchDashboardData().then((res) => {
      setSummary(res);
      setLoading(false);
    });
  }, []);

  const kpis = useMemo(() => {
    const openIncidents = summary.incidentBreakdown.find((i) => i.status === 'OPEN')?.total || 0;
    return {
      activeLeaks: openIncidents,
      pendingTickets: openIncidents,
      onDutyTechs: 4
    };
  }, [summary]);

  return (
    <div className="min-h-full bg-[#f4f5f8] text-[#1d1d1f] p-6 sm:p-10 space-y-8 select-none font-sans">
      
      {/* 1. Time-Aware Header & Live Watchdog Clock */}
      <DashboardHeader user={user} />

      {/* 2. Tier 1: 4 Frosted Sparkline Metric Cards */}
      <DashboardKpiGrid summary={summary} kpis={kpis} />

      {/* 3. Tier 2: Asymmetric 2-Column Workstation (60% / 40%) matching reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (60%): Waveform & Purok Grid */}
        <div className="lg:col-span-7 space-y-6">
          <CommunityFlowChart />
          <PurokNodeOverview nodes={summary.nodes} />
        </div>

        {/* Right Column (40%): Priority Triage, Action Hub & System Map Preview */}
        <div className="lg:col-span-5 space-y-6">
          <PriorityIncidentWidget incidents={summary.incidentBreakdown} />
          <AdminActionHub />
          <SystemMapPreview />
        </div>

      </div>

    </div>
  );
}