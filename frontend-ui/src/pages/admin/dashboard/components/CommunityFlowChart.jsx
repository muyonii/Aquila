// frontend-ui/src/pages/admin/dashboard/components/CommunityFlowChart.jsx
import React from 'react';
import { Activity } from 'lucide-react';

export default function CommunityFlowChart() {
  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#0284c7]" />
            <span>Live Sector 03 Community Flow Waveform</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">24-hour rolling telemetry baseline (μ) with variance floor (σ ≥ 0.05).</p>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0284c7] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
          15.0s Cadence
        </span>
      </div>

      {/* Simulated Clean SVG Telemetry Waveform */}
      <div className="h-48 w-full bg-slate-50/80 rounded-xl border border-slate-200/60 p-4 flex flex-col justify-between relative overflow-hidden">
        {/* Baseline marker lines */}
        <div className="absolute inset-x-0 top-12 border-t border-dashed border-sky-300/60 flex justify-end pr-3">
          <span className="text-[9px] font-mono text-sky-700 bg-white/80 px-1 rounded">Baseline μ: 1.22 L/min</span>
        </div>
        <div className="absolute inset-x-0 top-24 border-t border-dashed border-rose-300/60 flex justify-end pr-3">
          <span className="text-[9px] font-mono text-rose-700 bg-white/80 px-1 rounded">Alarm Threshold (μ + 1.5σ)</span>
        </div>

        {/* SVG Waveform Curve */}
        <svg className="absolute inset-x-0 bottom-4 w-full h-28 px-4" viewBox="0 0 500 100" preserveAspectRatio="none">
          <path
            d="M 0 70 Q 50 65, 100 68 T 200 40 T 300 72 T 400 65 T 500 68"
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 0 70 Q 50 65, 100 68 T 200 40 T 300 72 T 400 65 T 500 68 L 500 100 L 0 100 Z"
            fill="rgba(2, 132, 199, 0.06)"
          />
        </svg>

        <div className="flex justify-between text-[10px] font-mono text-slate-400 relative z-10">
          <span>00:00 (Night Quiet)</span>
          <span>12:00 (Day Peak)</span>
          <span>23:45 (Live)</span>
        </div>
      </div>
    </div>
  );
}