import React from 'react';

export default function StatusBadge({ status = 'OPEN', className = '' }) {
  const normalized = (status || '').toUpperCase();

  const styles = {
    // Priorities
    'P1': 'bg-rose-50 text-rose-800 border border-rose-300 font-mono font-bold',
    'P2': 'bg-amber-50 text-amber-900 border border-amber-300 font-mono font-bold',
    'P3': 'bg-sky-50 text-sky-900 border border-sky-300 font-mono font-bold',

    // Work Order Lifecycle
    'OPEN': 'bg-rose-50 text-rose-800 border border-rose-300 font-bold',
    'DISPATCHED': 'bg-sky-50 text-sky-900 border border-sky-300 font-bold',
    'PENDING_VERIFICATION': 'bg-amber-50 text-amber-900 border border-amber-300 font-bold',
    'CLOSED_VERIFIED': 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold',
    'REPAIR_FAILED': 'bg-rose-50 text-rose-800 border border-rose-300 font-bold',
    'CANCELLED': 'bg-slate-100 text-slate-700 border border-slate-300 font-medium',

    // Node States
    'ACTIVE': 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold',
    'MAINTENANCE': 'bg-amber-50 text-amber-900 border border-amber-300 font-bold',
    'INACTIVE': 'bg-slate-100 text-slate-700 border border-slate-300 font-medium',
    'OFFLINE': 'bg-slate-100 text-slate-700 border border-slate-300 font-medium',
  };

  const badgeStyle = styles[normalized] || 'bg-slate-100 text-slate-800 border border-slate-300 font-medium';
  const label = normalized.replace('_', ' ');

  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-lg border ${badgeStyle} ${className}`}>
      {label}
    </span>
  );
}