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

  const dotStatus = isP1 ? 'danger' : isP2 ? 'warn' : 'ok';

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">
          MAS Advisory Directive (INV-01)
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <span className={`status-dot ${dotStatus}`} />
          <span className="text-ink-muted">{priority} Priority</span>
        </span>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        <p className="tile text-sm text-ink-muted mt-2 leading-relaxed">
          {directive}
        </p>
      </div>
    </div>
  );
}