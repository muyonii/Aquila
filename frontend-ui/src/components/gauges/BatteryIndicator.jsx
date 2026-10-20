import React from 'react';
import { Battery, BatteryLow, AlertTriangle } from 'lucide-react';

export default function BatteryIndicator({ voltage = 4.10 }) {
  const safeVolts = Number(voltage) || 0;
  const isLow = safeVolts < 3.35;
  const isCritical = safeVolts < 3.20;

  // Map cell voltage: 3.0V (0%) to 4.2V (100%)
  const percentage = Math.max(0, Math.min(100, Math.round(((safeVolts - 3.0) / (4.2 - 3.0)) * 100)));

  const getStatusColor = () => {
    if (isCritical) return 'text-rose-800 bg-rose-50 border-rose-300';
    if (isLow) return 'text-amber-900 bg-amber-50 border-amber-300';
    return 'text-emerald-800 bg-emerald-50 border-emerald-300';
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${getStatusColor()}`}>
      {isCritical ? (
        <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0 stroke-[2]" />
      ) : isLow ? (
        <BatteryLow className="w-3.5 h-3.5 text-amber-700 shrink-0 stroke-[2]" />
      ) : (
        <Battery className="w-3.5 h-3.5 text-emerald-700 shrink-0 stroke-[2]" />
      )}

      <span className="font-mono font-bold">{safeVolts.toFixed(2)}V</span>
      <span className="text-xs font-mono opacity-80">({percentage}%)</span>
    </div>
  );
}