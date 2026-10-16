// frontend-ui/src/pages/admin/incidents/components/IncidentInspectorPane.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets,
  ExternalLink,
  Clock,
  Send,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function IncidentInspectorPane({
  incident,
  technicians = [],
  onDispatch,
  onDismiss
}) {
  const navigate = useNavigate();
  const [selectedTechId, setSelectedTechId] = useState('');
  const [dismissReason, setDismissReason] = useState('');
  const [isDismissing, setIsDismissing] = useState(false);
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  useEffect(() => {
    setSelectedTechId('');
    setDismissReason('');
    setIsDismissing(false);
  }, [incident?.id]);

  if (!incident) {
    return (
      <div className="flex-1 h-full bg-white/70 backdrop-blur-xl rounded-2xl p-10 border border-white/90 text-center text-xs text-slate-400 select-none flex flex-col items-center justify-center">
        <Droplets className="h-8 w-8 text-slate-300 mb-2" />
        <p className="font-semibold text-slate-700">No Incident Selected</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Select a household from the queue to inspect real-time leak telemetry.</p>
      </div>
    );
  }

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      alert('Please select an on-duty plumber.');
      return;
    }
    setIsSubmittingDispatch(true);
    await onDispatch(incident.id, Number(selectedTechId));
    setIsSubmittingDispatch(false);
  };

  const handleDismissSubmit = async (e) => {
    e.preventDefault();
    if (!dismissReason.trim()) {
      alert('Please enter a brief dismissal reason.');
      return;
    }
    await onDismiss(incident.id, dismissReason.trim());
  };

  const sevBadge = incident.getSeverityBadgeProps();
  const statBadge = incident.getStatusBadgeProps();

  return (
    <div className="flex-1 h-full bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* ===================================================================
          TOP SECTION: Header, Telemetry, Directive, Workforce Hub
          =================================================================== */}
      <div className="space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
        
        {/* 1. Header Lockup */}
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.05] pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${sevBadge.className}`}>
                {sevBadge.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] border ${statBadge.className}`}>
                {statBadge.label}
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {incident.householdLabel}
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              {incident.nodeId} • {incident.purokCluster} • Detected {incident.getElapsedTime()}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/network-map')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            <span>View on Map</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        {/* 2. Live Flow Telemetry & Loss Strip */}
        <div className="bg-[#f5f5f7] rounded-xl p-3.5 border border-black/[0.04] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Droplets className="h-3.5 w-3.5 text-[#007aff]" />
              <span>Live Flow Telemetry & Loss</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              Real-Time
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leak Velocity</span>
              <span className="text-base font-black font-mono text-slate-900">{incident.flowRateLpm.toFixed(2)} L/min</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conduit Type</span>
              <span className="text-xs font-semibold text-slate-800 truncate block mt-1">{incident.getReadableType()}</span>
            </div>
          </div>
        </div>

        {/* 3. Operator Directive (INV-01) */}
        <div className="bg-[#f5f5f7] rounded-xl p-3.5 border border-black/[0.04] space-y-1.5">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-600" />
            <span>Operator Directive</span>
          </span>
          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200/60">
            "{incident.actionDirective}"
          </p>
        </div>

        {/* 4. Workforce & Verification Hub */}
        <div className="bg-[#f5f5f7] rounded-xl p-3.5 border border-black/[0.04] space-y-2.5">
          <span className="text-xs font-bold text-slate-900 block">Workforce & Verification</span>

          {/* If Open: Fast Dispatch Form */}
          {incident.isOpen() && (
            <form onSubmit={handleDispatchSubmit} className="space-y-2.5">
              <select
                required
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer"
              >
                <option value="">Choose an on-duty plumber...</option>
                {technicians.map((t) => (
                  <option key={t.user_id} value={t.user_id}>
                    {t.full_name} ({t.email})
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={isSubmittingDispatch}
                className="w-full py-2.5 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmittingDispatch ? 'Dispatching...' : 'Assign & Dispatch Plumber'}</span>
              </button>
            </form>
          )}

          {/* If Dispatched */}
          {incident.isDispatched() && (
            <div className="p-3 bg-white rounded-lg border border-slate-200/60 text-xs flex items-center justify-between">
              <span className="text-slate-600">On-Site Plumber:</span>
              <span className="font-bold text-slate-900">{incident.technicianName || 'Field Plumber'}</span>
            </div>
          )}

          {/* If in 15-Minute Verification */}
          {incident.isVerifying() && (
            <div className="p-3 bg-white rounded-lg border border-slate-200/60 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  <span>15-Minute Quiet Observation</span>
                </span>
                <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Active Check
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Plumber submitted repair notes. System is verifying flow &le; 0.05 L/min before auto-closing.
              </p>
            </div>
          )}

          {/* If Resolved */}
          {incident.isResolved() && (
            <div className="p-3 bg-white rounded-lg border border-slate-200/60 text-xs flex items-center justify-between text-slate-800">
              <span className="font-bold text-emerald-700 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Closed & Verified</span>
              </span>
              <span className="text-[11px] text-slate-400">15m quiet test passed</span>
            </div>
          )}
        </div>

      </div>

      {/* ===================================================================
          BOTTOM FOOTER: Guaranteed INSIDE the white card
          =================================================================== */}
      <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between text-xs mt-3 shrink-0">
        <span className="text-[11px] font-mono text-slate-400">
          Ticket: {incident.id ? `${incident.id.slice(0, 16)}...` : 'Active'}
        </span>

        {!incident.isResolved() && (
          <div>
            {!isDismissing ? (
              <button
                type="button"
                onClick={() => setIsDismissing(true)}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Dismiss as False Alarm
              </button>
            ) : (
              <form onSubmit={handleDismissSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="Dismissal reason..."
                  className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                />
                <button type="submit" className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-xs cursor-pointer">
                  Confirm
                </button>
                <button type="button" onClick={() => setIsDismissing(false)} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>

    </div>
  );
}