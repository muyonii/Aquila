import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../stores/useTaskStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { rtdbSubscription } from '../../firebase/rtdb_subscription';

import ActionCard from '../../components/common/ActionCard';
import VerificationTimer from '../../components/common/VerificationTimer';
import SvgNeedleGauge from '../../components/gauges/SvgNeedleGauge';

import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle, 
  CheckSquare, 
  Droplets 
} from 'lucide-react';

const COMMON_REPAIR_ACTIONS = [
  'Replaced 3/4" PVC elbow coupling',
  'Tightened brass water meter union',
  'Excavated & clamped subterranean lateral rupture',
  'Replaced gate valve packing seal',
  'Purged sediment blockage from meter chamber'
];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { activeTask, fetchTaskDetails, submitRepair, isLoading, error } = useTaskStore();
  const { getNode } = useTelemetryStore();

  const [repairNotes, setRepairNotes] = useState('');
  const [selectedActions, setSelectedActions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 1. Fetch task details & subscribe to target node telemetry
  useEffect(() => {
    fetchTaskDetails(id);
  }, [id, fetchTaskDetails]);

  useEffect(() => {
    if (activeTask?.node_id) {
      rtdbSubscription.subscribeResidentNode(activeTask.node_id);
    }
  }, [activeTask?.node_id]);

  const nodeState = getNode(activeTask?.node_id);
  const currentFlow = Number(nodeState?.telemetry?.flow_rate_lpm) || 0.0;

  // Toggle quick-fill repair actions
  const toggleAction = (actionText) => {
    const exists = selectedActions.includes(actionText);
    const updated = exists 
      ? selectedActions.filter((a) => a !== actionText) 
      : [...selectedActions, actionText];

    setSelectedActions(updated);
    setRepairNotes(updated.join('. ') + (updated.length ? '.' : ''));
  };

  // Handle Repair Submission
  const handleSubmitRepair = async (e) => {
    e.preventDefault();
    if (!repairNotes.trim()) {
      setSubmitError('Please enter notes detailing the repairs performed.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitRepair(id, repairNotes);
      fetchTaskDetails(id); // Reload updated PENDING_VERIFICATION state
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit repair.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !activeTask) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading task details...</div>;
  }

  if (error || !activeTask) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">{error || 'Task not found'}</h3>
        <Link to="/tasks" className="inline-block text-xs font-bold text-sky-600 underline">
          Return to Queue
        </Link>
      </div>
    );
  }

  const isPendingVerification = activeTask.status === 'PENDING_VERIFICATION';
  const isClosedVerified = activeTask.status === 'CLOSED_VERIFIED';
  const isFailed = activeTask.status === 'REPAIR_FAILED';

  const mapsUrl = activeTask.latitude && activeTask.longitude 
    ? `https://www.google.com/maps/dir/?api=1&destination=${activeTask.latitude},${activeTask.longitude}`
    : null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-6">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link 
          to="/tasks" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Queue</span>
        </Link>

        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
          isClosedVerified 
            ? 'bg-emerald-100 text-emerald-800' 
            : isPendingVerification 
            ? 'bg-sky-100 text-sky-800 border border-sky-200' 
            : isFailed
            ? 'bg-rose-100 text-rose-800 border border-rose-200'
            : 'bg-slate-100 text-slate-700'
        }`}>
          {activeTask.status.replace('_', ' ')}
        </span>
      </div>

      {/* 2. Household Location Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md">
            {activeTask.purok_cluster || 'Purok 2'} Cluster
          </span>
          <h2 className="text-base font-black text-slate-900 mt-1">
            {activeTask.household_label || activeTask.node_id}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
            <span>{activeTask.node_id}</span>
            <span>•</span>
            <span>{activeTask.is_physical ? 'Physical ESP32' : 'Synthetic Node'}</span>
          </div>
        </div>

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>Open Maps</span>
          </a>
        )}
      </div>

      {/* 3. Action Card Directive (INV-01) */}
      <ActionCard 
        title={activeTask.action_card_title || activeTask.incident_type}
        priority={activeTask.severity_level}
        directive={activeTask.action_directive || activeTask.repair_notes}
      />

      {/* 4. Live Pipe Flow Velocity */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-sky-600" /> Live Pipe Flow
          </h4>
          <p className="text-[10px] text-slate-500">Real-time YF-S201 turbine reading from Hot Store</p>
        </div>

        <div className="text-right">
          <span className="text-xl font-black font-mono text-slate-900">
            {currentFlow.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 font-medium ml-1">LPM</span>
        </div>
      </div>

      {/* 5. Closed-Loop State Handling */}

      {/* State A: PENDING_VERIFICATION (Show 15-Minute Timer) */}
      {isPendingVerification && (
        <VerificationTimer
          taskId={id}
          nodeId={activeTask.node_id}
          pendingSince={activeTask.pending_verification_since || activeTask.detected_at}
          onStatusChange={() => fetchTaskDetails(id)}
        />
      )}

      {/* State B: CLOSED_VERIFIED (Job Completed) */}
      {isClosedVerified && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-900">Repair Verified & Closed</h3>
          <p className="text-xs text-emerald-700 max-w-sm mx-auto">
            Quiescent flow rate maintained for the 15-minute observation window. Work order is successfully closed.
          </p>
          {activeTask.resolved_at && (
            <span className="inline-block text-[10px] text-emerald-600 font-mono mt-2">
              Resolved: {activeTask.resolved_at}
            </span>
          )}
        </div>
      )}

      {/* State C: DISPATCHED or REPAIR_FAILED (Show Repair Form) */}
      {(!isPendingVerification && !isClosedVerified) && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wrench className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900">Submit Repair Report</h3>
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {isFailed && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Previous Verification Failed:</strong> Recurrent flow detected during the last observation. Please re-check the pipe seal and re-submit.
              </div>
            </div>
          )}

          {/* Quick-fill Action Checkbox Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-2">
              Common Repair Actions (Tap to Add)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_REPAIR_ACTIONS.map((action) => {
                const isSelected = selectedActions.includes(action);
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => toggleAction(action)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition text-left font-medium ${
                      isSelected
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {action}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmitRepair} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Technician Field Remarks
              </label>
              <textarea
                rows={3}
                required
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="Describe actions taken (e.g. Replaced PVC coupling, verified static pressure)..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Submit Repair & Start 15-Min Verification</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}