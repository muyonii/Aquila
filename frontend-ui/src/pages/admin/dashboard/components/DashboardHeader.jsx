// frontend-ui/src/pages/admin/dashboard/components/DashboardHeader.jsx
import React, { useState, useEffect } from 'react';

export default function DashboardHeader({ user }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const adminName = user?.full_name?.split(' ')[0] || 'System Admin';
  
  // Time-aware greeting
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Format date: "Oct 19, 2026 • Mon 08:24 AM"
  const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dayTimeStr = currentTime.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/[0.05] pb-6">
      {/* Left: Greeting & Breadcrumb */}
      <div className="space-y-1">
        <div className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
          System Overview
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>{greeting}, {adminName}</span>
          <span className="text-xl">☀️</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Bawasa System Admin <span className="text-slate-300">•</span> Barangay Water & Sanitation Association (BWSA) Sector 03 Command Center
        </p>
      </div>

      {/* Right: Watchdog Status Pill + Live Clock Badge */}
      <div className="flex items-center gap-3">
        <div className="bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/90 shadow-2xs flex items-center gap-2.5 text-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono font-semibold text-slate-800">
            System Online <span className="text-slate-300 font-normal">•</span> 15.0s Pulse Active
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/90 shadow-2xs text-right hidden sm:block">
          <div className="text-xs font-bold text-slate-900">{dateStr}</div>
          <div className="text-[11px] font-mono text-slate-500">{dayTimeStr}</div>
        </div>
      </div>
    </div>
  );
}