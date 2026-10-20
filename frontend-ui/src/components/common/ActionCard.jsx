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
      border: 'border-slate-200 border-l-4 border-l-rose-600 bg-white',
      badge: 'bg-rose-50 text-rose-800 border-rose-300',
      icon: ShieldAlert,
      iconColor: 'text-rose-700'
    };
    if (isP2) return {
      border: 'border-slate-200 border-l-4 border-l-amber-600 bg-white',
      badge: 'bg-amber-50 text-amber-900 border-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-700'
    };
    return {
      border: 'border-slate-200 border-l-4 border-l-[#0c4a6e] bg-white',
      badge: 'bg-sky-50 text-sky-900 border-sky-300',
      icon: Activity,
      iconColor: 'text-[#0c4a6e]'
    };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div className={`p-4 rounded-xl border ${theme.border} space-y-2.5 shadow-sm`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${theme.iconColor} shrink-0 stroke-[2]`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            MAS Advisory Directive (INV-01)
          </span>
        </div>

        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${theme.badge}`}>
          {priority} Priority
        </span>
      </div>

      <div>
        <h4 className="text-base font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-800 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
          {directive}
        </p>
      </div>
    </div>
  );
}