import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { residentApi } from '../../api/resident_api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Plus, 
  X, 
  ShieldAlert, 
  FileText, 
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export default function ReportIssuePage() {
  const user = useAuthStore((state) => state.user);
  const assignedNodeId = user?.assigned_node_id;

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const [formData, setFormData] = useState({
    incident_type: 'CRITICAL_LEAK',
    severity_level: 'P1',
    complaint_notes: ''
  });

  // 1. Fetch tickets matching this resident's meter
  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const res = await residentApi.getMyIncidents();
      setIncidents(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (assignedNodeId) {
      loadIncidents();
    }
  }, [assignedNodeId]);

  // 2. Handle Ticket Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.complaint_notes.trim()) {
      setFormError('Please describe the problem you are experiencing.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await residentApi.reportIssue({
        node_id: assignedNodeId,
        incident_type: formData.incident_type,
        severity_level: formData.severity_level,
        complaint_notes: formData.complaint_notes
      });

      setFormSuccess('Your service request has been logged successfully.');
      setFormData({
        incident_type: 'CRITICAL_LEAK',
        severity_level: 'P1',
        complaint_notes: ''
      });
      loadIncidents();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err) {
      setFormError(
        err.response?.data?.error?.message || 
        'Failed to submit ticket. (Ensure you have network access to BAWASA).'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find most recent active ticket
  const activeTicket = incidents.find(i => 
    ['OPEN', 'DISPATCHED', 'PENDING_VERIFICATION'].includes(i.status)
  );

  // Map Backend IncidentStatus to 4-Stage Progress Tracker
  const getProgressStage = (status) => {
    switch (status) {
      case 'OPEN': return 1;
      case 'DISPATCHED': return 2;
      case 'PENDING_VERIFICATION': return 3;
      case 'CLOSED_VERIFIED': return 4;
      default: return 1;
    }
  };

  const currentStage = activeTicket ? getProgressStage(activeTicket.status) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Service Requests & Maintenance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track active repair work orders or report pipeline concerns for meter{' '}
            <span className="font-mono font-bold text-slate-700">{assignedNodeId}</span>
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Report an Issue</span>
        </button>
      </div>

      {/* 2. Active Ticket Progress Tracker */}
      {activeTicket && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-sky-200 bg-sky-50/20 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md uppercase">
                Active Work Order
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                {activeTicket.action_card_title || activeTicket.incident_type}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ticket ID: <span className="font-mono">{activeTicket.incident_id}</span> • Reported on {activeTicket.detected_at}
              </p>
            </div>

            <div className="text-right">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                activeTicket.severity_level === 'P1' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
              }`}>
                Priority {activeTicket.severity_level}
              </span>
            </div>
          </div>

          {/* Stepped Tracker */}
          <div className="pt-2">
            <div className="grid grid-cols-4 gap-2 relative">
              {[
                { stage: 1, label: 'Reported', desc: 'Logged in system' },
                { stage: 2, label: 'Dispatched', desc: 'Technician assigned' },
                { stage: 3, label: 'Repair & Verify', desc: '15-min observation' },
                { stage: 4, label: 'Resolved', desc: 'Flow verified quiescent' }
              ].map((step) => {
                const isPassed = currentStage >= step.stage;
                const isCurrent = currentStage === step.stage;

                return (
                  <div key={step.stage} className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isPassed 
                        ? 'bg-sky-600 text-white ring-4 ring-sky-100' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : step.stage}
                    </div>
                    <span className={`text-xs font-bold mt-2 ${isCurrent ? 'text-sky-700' : 'text-slate-600'}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Directive / Notes */}
          {activeTicket.action_directive && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-800">BAWASA Directive:</strong> {activeTicket.action_directive}
            </div>
          )}
        </div>
      )}

      {/* 3. Ticket History List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Incident & Ticket History</span>
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No service tickets recorded</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Your water connection has no pending or past incident records.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidents.map((t) => (
              <div key={t.incident_id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{t.action_card_title || t.incident_type}</span>
                    <span className="text-[10px] font-mono text-slate-400">#{t.incident_id.slice(0, 8)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.repair_notes || 'No additional notes logged.'}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Detected: {t.detected_at}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Report Issue Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File a Water Service Complaint"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category</label>
              <select
                value={formData.incident_type}
                onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="CRITICAL_LEAK">Visible Pipe Rupture / Leaking Joint (P1)</option>
                <option value="FAIRNESS_DEFICIT">Zero Pressure / Line Interruption (P2)</option>
                <option value="SUSPICIOUS_USAGE">Unusual High Continuous Flow / Meter Error (P3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Problem Description</label>
              <textarea
                rows={4}
                required
                value={formData.complaint_notes}
                onChange={(e) => setFormData({ ...formData, complaint_notes: e.target.value })}
                placeholder="Describe where the issue is occurring (e.g. standing water around meter box, low pressure since morning)..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}