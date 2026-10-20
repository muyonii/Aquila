import React from 'react';
import { ShieldAlert, AlertTriangle, Activity } from 'lucide-react';

/**
 * ActionCard Component (INV-01)
 * Renders non-actuating operational directives for human operators and plumbers.
 * @param {string} title - Action card heading
 * @param {string} priority - Priority tier ('P1', 'P2', 'P3')
 * @param {string} directive - Human operator instructions
 */
export default function ActionCard({
  title = "Incident Work Order",
  priority = "P1",
  directive = "Inspect pipe junction for pressure variations."
}) {
  const isP1 = priority === 'P1';
  const isP2 = priority === 'P2';

  const getTheme = () => {
    if (isP1) return {
      border: 'border-rose-200 bg-rose-50/40',
      badge: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: ShieldAlert,
      iconColor: 'text-rose-600'
    };
    if (isP2) return {
      border: 'border-amber-200 bg-amber-50/40',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600'
    };
    return {
      border: 'border-sky-200 bg-sky-50/40',
      badge: 'bg-sky-100 text-sky-700 border-sky-200',
      icon: Activity,
      iconColor: 'text-sky-600'
    };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div className={`p-4 rounded-2xl border ${theme.border} space-y-2.5 shadow-sm`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${theme.iconColor} shrink-0`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            MAS Advisory Directive (INV-01)
          </span>
        </div>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
          {priority} Priority
        </span>
      </div>

      <div>
        <h4 className="text-sm font-black text-slate-900">{title}</h4>
        <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/60">
          {directive}
        </p>
      </div>
    </div>
  );
}