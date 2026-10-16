// frontend-ui/src/pages/admin/users/components/UserInspectorDrawer.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Droplets, Wrench, KeyRound, Trash2, ChevronRight } from 'lucide-react';

export default function UserInspectorDrawer({
  user,
  adminCount,
  onClose,
  onResetPassword,
  onDeleteUser
}) {
  if (!user) return null;

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const formatRole = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'technician':
        return 'Field Technician';
      case 'resident':
        return 'Resident Consumer';
      default:
        return role;
    }
  };

  const drawerContent = (
    <aside
      className="fixed inset-y-0 top-0 bottom-0 right-0 h-[100dvh] w-full sm:w-[420px] z-[100] m-0 rounded-none rounded-l-2xl bg-white/80 backdrop-blur-2xl border-l border-white/70 shadow-[-16px_0_48px_-8px_rgba(0,0,0,0.08)] px-6 pt-5 pb-6 overflow-y-auto flex flex-col justify-between select-none animate-in slide-in-from-right duration-200 font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-6">
        
        {/* Header - Pinned cleanly near the top edge */}
        <div className="flex items-center justify-between pb-1">
          <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            User Dossier
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/[0.05] text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Identity Hero */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0 aspect-square shadow-sm">
            {initials}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-bold text-slate-900 truncate leading-tight">
              {user.full_name}
            </h3>
            <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
              {user.email}
            </p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-medium bg-black/[0.04] text-slate-700 border border-black/[0.06]">
              {formatRole(user.role)}
            </span>
          </div>
        </div>

        {/* ROLE INTEL: FROSTED INSET CARDS */}

        {/* 1. Resident Intel */}
        {user.role === 'resident' && (
          <div className="bg-white/75 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                <Droplets className="h-3.5 w-3.5 text-slate-500" />
                <span>Water Meter Telemetry</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono bg-black/[0.04] px-2 py-0.5 rounded">
                Live Stream
              </span>
            </div>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Meter Node</span>
                <span className="font-mono font-semibold text-slate-800">
                  {user.assigned_node_id || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Household Label</span>
                <span className="text-slate-800 font-medium">
                  {user.household_label || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Live Flow Rate</span>
                <span className="font-mono text-slate-800">1.22 L/min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">24h Volume Consumed</span>
                <span className="font-mono text-slate-800">245.50 L (0.246 m³)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Fairness Status</span>
                <span className="text-slate-800 font-medium">Normal Allocation</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Technician Intel */}
        {user.role === 'technician' && (
          <div className="bg-white/75 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-slate-500" />
                <span>Operational Track</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono bg-black/[0.04] px-2 py-0.5 rounded">
                On-Call
              </span>
            </div>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned Work Orders</span>
                <span className="font-mono text-slate-800">14 Dispatches</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Verified 15m Closures</span>
                <span className="font-mono text-slate-800">12 (85.7% Success)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Current Deployment</span>
                <span className="text-slate-800 font-medium">Available</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Administrator Intel */}
        {user.role === 'admin' && (
          <div className="bg-white/75 backdrop-blur-md rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-2.5">
            <span className="text-xs font-semibold text-slate-800 block">Governance & Audit Ledger</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Holds administrative authority. All provisioning, dispatching, and system actions are immutably logged under Rule INV-06.
            </p>
            {adminCount <= 1 && (
              <p className="text-[11px] text-slate-600 bg-black/[0.03] p-2.5 rounded-lg border border-black/[0.05]">
                Sole Administrator account protected against accidental deletion.
              </p>
            )}
          </div>
        )}

        {/* Account Administration Actions */}
        <div className="bg-white/75 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] space-y-1">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block px-1 pb-1">
            Account Management
          </span>

          <button
            type="button"
            onClick={() => onResetPassword(user.user_id)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-black/[0.03] text-xs text-slate-700 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset password to default</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteUser(user.user_id, user.role)}
            disabled={user.role === 'admin' && adminCount <= 1}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-50/60 text-xs text-slate-600 hover:text-rose-600 transition-colors cursor-pointer text-left disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-500" />
              <span>Delete account</span>
            </div>
            <span className="text-[10px] text-slate-400">Permanent</span>
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="pt-6 text-[11px] text-slate-400 font-mono text-center">
        Registered {user.created_at?.slice(0, 10) || '2026-09-01'}
      </div>
    </aside>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
}