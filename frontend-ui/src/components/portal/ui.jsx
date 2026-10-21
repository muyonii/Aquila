import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

/* =========================================================================
   Shared UI primitives for the Resident + Technician portals.
   Pattern: Soft water blue system with cards, tiles, and WCAG AA contrast.
   ========================================================================= */

export const cardClass = 'card';

export const inputClass = 'input w-full';

export const btnPrimary = 'btn-primary';
export const btnSecondary = 'btn-secondary';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 h-11 px-4 rounded-control text-sm font-semibold transition bg-state-danger hover:opacity-95 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-danger shadow-soft cursor-pointer disabled:opacity-50 disabled:pointer-events-none';
export const btnAccent = 'btn-primary';

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** @deprecated — replaced by bare icon. Stub kept for build compatibility until Batch 5-6. */
export function IconTile({ icon: Icon, className = '' }) {
  if (!Icon) return null;
  return (
    <span className="icon-chip">
      <Icon className={`w-[18px] h-[18px] stroke-[1.75] text-ink ${className}`} />
    </span>
  );
}

/** Plain section label — 12px semibold ink-muted, uppercase tracked */
export function Eyebrow({ children, className = '' }) {
  return (
    <div className={`text-xs font-semibold text-ink-muted uppercase tracking-wider ${className}`}>
      {children}
    </div>
  );
}

/** Form field label — 14px semibold ink */
export function Label({ children, className = '' }) {
  return (
    <span className={`text-sm font-semibold text-ink block ${className}`}>
      {children}
    </span>
  );
}

const TONES = {
  sky:     { alert: 'bg-[#f0f9ff] text-brand border-line', icon: Info },
  amber:   { alert: 'bg-state-warn-tint text-state-warn border-[#fde68a]', icon: AlertTriangle },
  emerald: { alert: 'bg-state-ok-tint text-state-ok border-[#a7f3d0]', icon: CheckCircle2 },
  rose:    { alert: 'bg-state-danger-tint text-state-danger border-[#fecaca]', icon: AlertCircle },
  indigo:  { alert: 'bg-canvas text-ink border-line', icon: Info },
  slate:   { alert: 'bg-canvas text-ink border-line', icon: Info },
};

export function Alert({ tone = 'rose', icon, children, action, className = '' }) {
  const Icon = icon || TONES[tone]?.icon || Info;
  const alertStyles = TONES[tone]?.alert || TONES.slate.alert;
  return (
    <div role="alert" className={`p-3.5 rounded-tile border text-sm flex items-start gap-2.5 ${alertStyles} ${className}`}>
      <Icon className="w-[18px] h-[18px] mt-0.5 shrink-0 stroke-[1.75]" />
      <div className="flex-1 min-w-0">{children}</div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-semibold text-ink tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted leading-relaxed">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/** Stat item inside a stat strip — use inside a grid divide-x container */
export function StatTile({ label, value, unit, hint, loading = false }) {
  return (
    <div className="p-5 flex flex-col justify-between">
      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{label}</span>
      <div className="text-[32px] leading-tight font-semibold text-ink tabular-nums my-1.5">
        {loading ? '—' : value}
        {unit && <span className="text-sm font-medium text-ink-muted ml-1.5">{unit}</span>}
      </div>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`bg-line rounded-tile ${className}`} />;
}

/** Plain one-line empty state with optional link */
export function EmptyState({ title, action }) {
  return (
    <div className="py-6 text-sm text-ink-muted">
      {title}{action && <> · {action}</>}
    </div>
  );
}

/** Live status — dot + label, no pill */
export function LivePill({ connected }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span className={`status-dot ${connected ? 'ok' : 'neutral bg-slate-400'}`} />
      <span className={connected ? 'text-state-ok font-semibold' : 'text-ink-muted'}>
        {connected ? 'Live' : 'Offline'}
      </span>
    </span>
  );
}

export function Brand({ suffix }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
      <span className="font-semibold text-base text-brand font-mono">AQUILA</span>
      {suffix}
    </span>
  );
}

/** No ambient gradient wash */
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

