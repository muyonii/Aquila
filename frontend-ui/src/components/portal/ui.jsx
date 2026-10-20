import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

/* =========================================================================
   Shared UI primitives for the Resident + Technician portals.
   Mirrors the admin theme: #f4f5f8 canvas, frosted-white cards, slate-900
   primary actions, sky accent, mono uppercase eyebrow labels.
   ========================================================================= */

export const cardClass =
  'bg-white rounded-2xl border border-slate-200 shadow-sm';

export const inputClass =
  'w-full bg-white border border-slate-300 focus:border-[#0c4a6e] focus:ring-2 focus:ring-[#0c4a6e]/20 text-slate-900 px-3.5 py-2.5 rounded-xl text-base outline-none transition placeholder:text-slate-500';

const btnBase =
  'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
export const btnPrimary = `${btnBase} bg-[#0c4a6e] hover:bg-[#075985] text-white shadow-sm focus-visible:ring-[#0c4a6e]`;
export const btnSecondary = `${btnBase} bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus-visible:ring-[#0c4a6e]`;
export const btnDanger = `${btnBase} bg-rose-700 hover:bg-rose-800 text-white shadow-sm focus-visible:ring-rose-700`;
export const btnAccent = `${btnBase} bg-[#0c4a6e] hover:bg-[#075985] text-white shadow-sm focus-visible:ring-[#0c4a6e]`;

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`${cardClass} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className = '' }) {
  return (
    <div className={`text-xs font-mono font-bold tracking-wider text-slate-600 uppercase ${className}`}>
      {children}
    </div>
  );
}

export function Label({ children, className = '' }) {
  return (
    <span className={`text-xs font-bold text-slate-600 tracking-wider uppercase block ${className}`}>
      {children}
    </span>
  );
}

const TONES = {
  sky: { tile: 'bg-sky-50 text-[#0c4a6e] border-sky-200', alert: 'bg-sky-50 text-sky-950 border-sky-300', icon: AlertCircle },
  amber: { tile: 'bg-amber-50 text-amber-800 border-amber-200', alert: 'bg-amber-50 text-amber-950 border-amber-300', icon: AlertTriangle },
  emerald: { tile: 'bg-emerald-50 text-emerald-800 border-emerald-200', alert: 'bg-emerald-50 text-emerald-950 border-emerald-300', icon: CheckCircle2 },
  rose: { tile: 'bg-rose-50 text-rose-800 border-rose-200', alert: 'bg-rose-50 text-rose-950 border-rose-300', icon: AlertCircle },
  indigo: { tile: 'bg-slate-50 text-slate-800 border-slate-200', alert: 'bg-slate-50 text-slate-900 border-slate-300', icon: Info },
  slate: { tile: 'bg-slate-100 text-slate-800 border-slate-300', alert: 'bg-slate-50 text-slate-900 border-slate-300', icon: Info },
};

export function IconTile({ icon: Icon, tone = 'sky', className = '' }) {
  return (
    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${TONES[tone].tile} ${className}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

export function Alert({ tone = 'rose', icon, children, action, className = '' }) {
  const Icon = icon || TONES[tone].icon;
  return (
    <div role="alert" className={`p-3.5 rounded-xl border text-sm flex items-start gap-2.5 ${TONES[tone].alert} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1 min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600 font-medium">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatTile({ label, value, unit, hint, tone = 'slate', loading = false }) {
  const valueColor = {
    slate: 'text-slate-900',
    sky: 'text-[#0c4a6e]',
    amber: 'text-amber-800',
    emerald: 'text-emerald-800',
    rose: 'text-rose-800',
    indigo: 'text-slate-800',
  }[tone];

  return (
    <Card className="p-4 flex flex-col justify-between">
      <Label>{label}</Label>
      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono ${valueColor}`}>{value}</span>
            {unit && <span className="text-xs font-bold text-slate-600">{unit}</span>}
          </div>
        )}
        {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
      </div>
    </Card>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

export function EmptyState({ icon: Icon = CheckCircle2, tone = 'emerald', title, body, action }) {
  return (
    <div className="py-10 px-6 text-center flex flex-col items-center">
      <IconTile icon={Icon} tone={tone} className="w-12 h-12 rounded-2xl" />
      <h3 className="text-base font-bold text-slate-900 mt-3">{title}</h3>
      {body && <p className="text-sm text-slate-600 mt-1 max-w-xs">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LivePill({ connected }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-semibold ${
        connected
          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
          : 'bg-slate-100 text-slate-700 border-slate-300'
      }`}
    >
      <span className="flex h-1.5 w-1.5 relative">
        {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? 'bg-emerald-600' : 'bg-slate-500'}`} />
      </span>
      {connected ? 'Live' : 'Offline'}
    </span>
  );
}

export function Brand({ suffix }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="w-2.5 h-2.5 rounded-full bg-[#0c4a6e] shrink-0" />
      <span className="font-bold text-base text-[#0c4a6e] font-mono tracking-wider">AQUILA</span>
      {suffix}
    </span>
  );
}

/** No ambient gradient wash per anti-slop rules */
export function AmbientWash() {
  return null;
}

export function initials(name = '') {
  return (
    name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'AQ'
  );
}

/** "12 min ago" style label. Returns null for unparseable input. */
export function timeAgo(ts) {
  if (!ts) return null;
  const then = new Date(String(ts).replace(' ', 'T')).getTime();
  if (Number.isNaN(then)) return null;
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
