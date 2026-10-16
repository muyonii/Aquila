// frontend-ui/src/pages/admin/users/components/AddUserModal.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Droplets } from 'lucide-react';

export default function AddUserModal({ isOpen, onClose, nodes, onSubmit, submitting }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: 'Password123!',
    role: 'resident',
    assigned_node_id: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const modalContent = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-[100dvh] z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none font-sans animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl border border-white/80 space-y-5 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.05] pb-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Provision New User Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">Create credentials and assign system access permissions.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Full Legal Name</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="e.g. Maria Dela Cruz"
              className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Email Address (Login ID)</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@bawasa.gov.ph"
              className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Account Role */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">Account Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition-all cursor-pointer"
            >
              <option value="resident">Resident (Consumer)</option>
              <option value="technician">Field Technician (Plumber)</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          {/* Meter Node Assignment Card (Neutral Monochrome) */}
          {form.role === 'resident' && (
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-slate-500" />
                  <span>Assign Water Meter Node</span>
                </label>
                <span className="text-[10px] font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                  Mandatory
                </span>
              </div>

              <select
                required
                value={form.assigned_node_id}
                onChange={(e) => setForm({ ...form, assigned_node_id: e.target.value })}
                className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none transition-all cursor-pointer"
              >
                <option value="">Select a registered household meter...</option>
                {nodes && nodes.length > 0 ? (
                  nodes.map((n) => (
                    <option key={n.node_id} value={n.node_id}>
                      {n.node_id} — {n.household_label} ({n.purok_cluster})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="NODE-B1-001">NODE-B1-001 — Household 01 (Physical Testbed)</option>
                    <option value="NODE-B1-002">NODE-B1-002 — Household 02 (Santos Family)</option>
                    <option value="NODE-B1-003">NODE-B1-003 — Household 03 (Reyes Family)</option>
                  </>
                )}
              </select>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Under RA 10173 (Data Privacy), residents can only inspect telemetry and bill volume for their own assigned meter.
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-black/[0.05]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Provisioning...</span>
                </>
              ) : (
                'Provision Account'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}