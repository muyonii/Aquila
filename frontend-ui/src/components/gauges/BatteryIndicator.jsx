import React from 'react';

export default function BatteryIndicator({ voltage = 4.10 }) {
  const safeVolts = Number(voltage) || 0;
  const isLow = safeVolts < 3.35;
  const isCritical = safeVolts < 3.20;

  // Map cell voltage: 3.0V (0%) to 4.2V (100%)
  const percentage = Math.max(0, Math.min(100, Math.round(((safeVolts - 3.0) / (4.2 - 3.0)) * 100)));

  const statusType = isCritical ? 'danger' : isLow ? 'warn' : 'ok';
  const textColor = isCritical ? 'text-state-danger' : isLow ? 'text-state-warn' : 'text-state-ok';

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${textColor}`}>
      <span className={`status-dot ${statusType}`} aria-hidden="true" />
      <span className="font-mono tabular-nums">{safeVolts.toFixed(2)}V</span>
      <span className="text-ink-muted text-xs font-normal">({percentage}%)</span>
    </span>
  );
}