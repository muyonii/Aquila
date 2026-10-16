// frontend-ui/src/pages/admin/dashboard/components/PriorityIncidentWidget.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function PriorityIncidentWidget({ incidents = [] }) {
  const openIncidents = incidents.filter((i) => i.status === 'OPEN').slice(0, 2);

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Priority Incident Queue</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Urgent pipe leaks requiring immediate plumber dispatch.</p>
        </div>

        <Link
          to="/incidents"
          className="inline-flex items-center gap-1 text-xs text-[#007aff] hover:underline font-semibold"
        >
          <span>View All</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {openIncidents.length > 0 ? (
        <div className="space-y-3">
          {openIncidents.map((inc) => (
            <div key={inc.incident_id || inc.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {inc.severity_level || 'P1'} Urgent
                </span>
                
                <Link
                  to="/incidents"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  <span>Dispatch</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">{inc.household_label || 'Household Branch'}</span>
                  <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">{inc.node_id} • {inc.incident_type || 'CRITICAL_LEAK'}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">23m ago</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 bg-slate-50 rounded-xl border border-slate-200/60 text-center space-y-1">
          <span className="text-xs font-bold text-emerald-700 block">Zero Urgent Leaks</span>
          <p className="text-[11px] text-slate-500">All work orders are currently dispatched or resolved.</p>
        </div>
      )}
    </div>
  );
}