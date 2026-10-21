import React from 'react';

/**
 * Semi-circular analog needle gauge for instantaneous flow rate (L/min)
 * @param {number} value - Current flow rate in LPM (0.0 to 45.0)
 * @param {number} max - Upper display scale limit (default 10.0 LPM for domestic)
 * @param {string} label - Gauge label below the readout
 * @param {number} size - Width of the gauge in pixels
 */
export default function SvgNeedleGauge({ 
  value = 0, 
  max = 10, 
  label = "Flow Rate (L/min)",
  size = 200 
}) {
  const safeValue = Math.max(0, Math.min(value, max));
  
  // Map value (0 to max) to needle rotation angle (-90deg to +90deg)
  const angle = -90 + (safeValue / max) * 180;

  // Dynamic zone styling
  const getZoneColor = (v) => {
    if (v <= 0.05) return 'text-ink-muted';     // Quiescent / Still
    if (v <= 4.5) return 'text-state-ok';       // Normal consumption
    if (v <= 7.0) return 'text-state-warn';     // High domestic draw
    return 'text-state-danger';                 // Sustained pipe rupture
  };

  return (
    <div className="flex flex-col items-center select-none" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size * 0.58 }}>
        <svg 
          viewBox="0 0 200 120" 
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Color Arc Gradients */}
            <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a5b67" />   {/* 0 LPM Quiescent */}
              <stop offset="20%" stopColor="#0f766e" />  {/* Normal Flow */}
              <stop offset="65%" stopColor="#b45309" />  {/* High Draw */}
              <stop offset="100%" stopColor="#b42318" /> {/* Rupture Floor */}
            </linearGradient>
          </defs>

          {/* Background Arc Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#dde6ec"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Colored Active Arc Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeArcGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="251.3"
            strokeDashoffset="0"
            opacity="0.9"
          />

          {/* Ticks (0, 2.5, 5.0, 7.5, 10.0) */}
          <text x="18" y="115" fontSize="12" fill="#4a5b67" textAnchor="middle" fontWeight="500">0</text>
          <text x="56" y="44" fontSize="12" fill="#4a5b67" textAnchor="middle" fontWeight="500">2.5</text>
          <text x="100" y="24" fontSize="12" fill="#4a5b67" textAnchor="middle" fontWeight="500">5.0</text>
          <text x="144" y="44" fontSize="12" fill="#4a5b67" textAnchor="middle" fontWeight="500">7.5</text>
          <text x="182" y="115" fontSize="12" fill="#4a5b67" textAnchor="middle" fontWeight="500">{max}</text>

          {/* Rotating Needle */}
          <g 
            transform={`rotate(${angle} 100 100)`} 
            className="transition-transform duration-500 ease-out"
          >
            <polygon 
              points="97,100 103,100 100.8,26 99.2,26" 
              fill="#0f1f2b" 
            />
            <circle cx="100" cy="100" r="7" fill="#0f1f2b" />
            <circle cx="100" cy="100" r="3" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Numeric Readout */}
      <div className="text-center -mt-2">
        <span className={`text-[32px] leading-tight font-semibold tracking-tight font-mono tabular-nums ${getZoneColor(value)}`}>
          {Number(value).toFixed(2)}
        </span>
        <span className="text-sm font-semibold text-ink-muted ml-1">LPM</span>
        <p className="text-xs text-ink-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}