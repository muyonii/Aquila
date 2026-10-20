import React from 'react';

export default function StatusBadge({ status = 'OPEN', className = '' }) {
  const normalized = (status || '').toUpperCase();

  const styles = {
    // Priorities
    'P1': 'bg-rose-100 text-rose-700 font-mono font-bold',
    'P2': 'bg-amber-100 text-amber-800 font-mono font-bold',
    'P3': 'bg-sky-100 text-sky-700 font-mono font-bold',

    // Work Order Lifecycle
    'OPEN': 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
    'DISPATCHED': 'bg-sky-50 text-sky-700 border border-sky-200 font-bold',
    'PENDING_VERIFICATION': 'bg-amber-50 text-amber-700 border border-amber-200 font-bold',
    'CLOSED_VERIFIED': 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
    'REPAIR_FAILED': 'bg-rose-100 text-rose-800 border border-rose-200 font-bold',
    'CANCELLED': 'bg-slate-100 text-slate-600 border border-slate-200',

    // Node States
    'ACTIVE': 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
    'MAINTENANCE': 'bg-amber-50 text-amber-800 border border-amber-200 font-bold',
    'INACTIVE': 'bg-slate-100 text-slate-500 border border-slate-200',
    'OFFLINE': 'bg-slate-100 text-slate-500 border border-slate-200',
  };

  const badgeStyle = styles[normalized] || 'bg-slate-100 text-slate-700 border border-slate-200';
  const label = normalized.replace('_', ' ');

  return (
    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full ${badgeStyle} ${className}`}>
      {label}
    </span>
  );
}