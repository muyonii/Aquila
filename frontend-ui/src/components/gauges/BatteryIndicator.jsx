import React from 'react';
import { Battery, BatteryLow, BatteryWarning, AlertTriangle } from 'lucide-react';

/**
 * 18650 Cell Voltage & Power Meter
 * @param {number} voltage - Battery voltage in Volts (e.g. 4.10)
 */
export default function BatteryIndicator({ voltage = 4.10 }) {
  const safeVolts = Number(voltage) || 0;
  const isLow = safeVolts < 3.35;
  const isCritical = safeVolts < 3.20;

  // Map 3.0V (0%) to 4.2V (100%)
  const percentage = Math.max(0, Math.min(100, Math.round(((safeVolts - 3.0) / (4.2 - 3.0)) * 100)));

  const getStatusColor = () => {
    if (isCritical) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (isLow) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor()}`}>
      {isCritical ? (
        <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-rose-600 shrink-0" />
      ) : isLow ? (
        <BatteryLow className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      ) : (
        <Battery className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      )}

      <span className="font-mono font-bold">{safeVolts.toFixed(2)}V</span>
      <span className="text-[10px] text-slate-500 font-normal">({percentage}%)</span>
    </div>
  );
}