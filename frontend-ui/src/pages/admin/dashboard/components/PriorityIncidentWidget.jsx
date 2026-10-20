// frontend-ui/src/pages/admin/dashboard/components/PriorityIncidentWidget.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function PriorityIncidentWidget({ incidents = [] }) {
  const openIncidents = incidents.filter((i) => i.status === 'OPEN').slice(0, 3);

  const getSeverityDot = (severity) => {
    if (severity === 'P1') return 'text-rose-600';
    if (severity === 'P2') return 'text-amber-600';
    return 'text-slate-600';
  };

  return (
    <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
      <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
        <h2 className="text-base font-semibold text-slate-900">
          Priority incidents
        </h2>
        <Link
          to="/incidents"
          className="text-sm font-semibold text-[#0c4a6e] hover:underline"
        >
          View all
        </Link>
      </div>

      {openIncidents.length > 0 ? (
        <div className="divide-y divide-slate-200">
          {openIncidents.map((inc) => {
            const severity = inc.severity_level || 'P1';
            const dotColor = getSeverityDot(severity);
            const typeLabel = (inc.incident_type || 'Leak detected').replace('_', ' ');

            return (
              <div
                key={inc.incident_id || inc.id}
                className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {inc.household_label || inc.node_id || 'Household Branch'}
                    </span>
                    <span className="text-sm text-slate-700 flex items-center gap-1 shrink-0">
                      <span className={dotColor} aria-hidden="true">●</span>
                      <span>{severity}</span>
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-mono text-slate-700">{inc.node_id}</span>
                    <span> · </span>
                    <span className="capitalize">{typeLabel}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-0.5">
                  <div className="text-sm text-slate-600">
                    {inc.created_at || 'Just now'}
                  </div>
                  <div>
                    <Link
                      to="/incidents"
                      className="text-sm font-semibold text-[#0c4a6e] hover:underline"
                    >
                      Dispatch
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-slate-600">
          Zero open incidents. All work orders dispatched or closed.
        </div>
      )}
    </div>
  );
}