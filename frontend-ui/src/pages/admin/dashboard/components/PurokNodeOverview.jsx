import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ChevronRight } from 'lucide-react';
import { useTelemetryStore } from '../../../../stores/useTelemetryStore';

export default function PurokNodeOverview({ nodes = [] }) {
  const rtdbNodes = useTelemetryStore((state) => state.nodes);
  const leakHypotheses = useTelemetryStore((state) => state.leakHypotheses);

  const getNodeStatus = (n) => {
    const nodeId = n.node_id;
    const leak = leakHypotheses?.[nodeId];
    const rtdbStatus = rtdbNodes?.[nodeId]?.status || n.status;
    const flow = Number(rtdbNodes?.[nodeId]?.telemetry?.flow_rate_lpm ?? 0);

    if (leak?.classification === 'LEAK') {
      return {
        label: `Leak (${flow.toFixed(1)} L/min)`,
        dotColor: 'text-rose-600'
      };
    }
    if (rtdbStatus === 'MAINTENANCE') {
      return {
        label: 'Maintenance',
        dotColor: 'text-amber-600'
      };
    }
    if (leak?.classification === 'SUSPICIOUS') {
      return {
        label: 'Suspicious flow',
        dotColor: 'text-amber-600'
      };
    }
    return {
      label: flow > 0 ? `${flow.toFixed(2)} L/min` : 'Normal',
      dotColor: 'text-emerald-600'
    };
  };

  return (
    <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
      <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Purok 2 node overview
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Monitored neighborhood tap nodes and sensor health.
          </p>
        </div>

        <Link
          to="/network-map"
          className="text-sm font-semibold text-[#0c4a6e] hover:underline"
        >
          Open map
        </Link>
      </div>

      <div className="divide-y divide-slate-200">
        {nodes.slice(0, 6).map((n) => {
          const status = getNodeStatus(n);
          return (
            <Link
              to="/network-map"
              key={n.node_id}
              className="py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors px-1"
            >
              <div className="min-w-0 pr-3">
                <span className="font-semibold text-sm text-slate-900 block truncate">
                  {n.household_label || n.node_id}
                </span>
                <span className="text-xs font-mono text-slate-600">{n.node_id}</span>
              </div>
              <span className="text-sm text-slate-700 flex items-center gap-1.5 shrink-0">
                <span className={status.dotColor} aria-hidden="true">●</span>
                <span>{status.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}