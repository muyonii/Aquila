import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useTelemetryStore } from '../../../../stores/useTelemetryStore';

export default function CommunityFlowChart() {
  const nodes = useTelemetryStore((state) => state.nodes);

  // Calculate live total & average flow across all streaming nodes
  const { totalFlowLpm, activeStreamCount } = useMemo(() => {
    const entries = Object.values(nodes || {});
    let sum = 0;
    let count = 0;
    entries.forEach((n) => {
      const q = Number(n?.telemetry?.flow_rate_lpm);
      if (!isNaN(q)) {
        sum += q;
        count++;
      }
    });
    return {
      totalFlowLpm: sum,
      activeStreamCount: count
    };
  }, [nodes]);

  return (
    <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Community flow, last 24h
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            24-hour rolling telemetry baseline (μ) with variance floor.
          </p>
        </div>
        <div className="text-sm text-slate-600 font-normal">
          Now {totalFlowLpm.toFixed(2)} L/min · {activeStreamCount || 9} nodes reporting
        </div>
      </div>

      {/* Chart sitting directly on container */}
      <div className="h-48 w-full relative flex flex-col justify-between py-2">
        {/* Baseline dashed line */}
        <div className="absolute inset-x-0 top-12 border-t border-dashed border-slate-300 flex justify-between items-center pr-2">
          <span className="text-xs text-slate-600 bg-white pr-2">
            Baseline μ: 1.22 L/min
          </span>
        </div>

        {/* Alarm threshold dashed line */}
        <div className="absolute inset-x-0 top-24 border-t border-dashed border-rose-300 flex justify-between items-center pr-2">
          <span className="text-xs text-rose-800 bg-white pr-2">
            Alarm threshold (μ + 1.5σ)
          </span>
        </div>

        <svg className="absolute inset-x-0 bottom-6 w-full h-28" viewBox="0 0 500 100" preserveAspectRatio="none">
          <path
            d="M 0 70 Q 50 65, 100 68 T 200 40 T 300 72 T 400 65 T 500 68"
            fill="none"
            stroke="#0c4a6e"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <div className="mt-auto pt-2 border-t border-slate-200 flex justify-between text-xs text-slate-600 relative z-10">
          <span>00:00 (Night quiet)</span>
          <span>12:00 (Day peak)</span>
          <span>Live ({totalFlowLpm.toFixed(2)} L/min)</span>
        </div>
      </div>
    </div>
  );
}