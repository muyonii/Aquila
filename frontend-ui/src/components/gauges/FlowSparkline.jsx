import React from 'react';

export default function FlowSparkline({ 
  data = [], 
  height = 36, 
  isLeak = false 
}) {
  if (!data || data.length < 2) {
    return (
      <div 
        className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-400"
        style={{ height }}
      >
        Awaiting telemetry...
      </div>
    );
  }

  const flows = data.map(d => typeof d === 'number' ? d : d.flow);
  const maxFlow = Math.max(...flows, 4.0);
  const minFlow = 0;

  const width = 140;
  const padding = 3;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = flows.map((val, idx) => {
    const x = padding + (idx / (flows.length - 1)) * innerWidth;
    const y = height - padding - ((val - minFlow) / (maxFlow - minFlow)) * innerHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const strokeColor = isLeak ? '#ef4444' : '#0284c7';
  const fillColor = isLeak ? '#fecaca' : '#bae6fd';

  return (
    <div className="inline-block relative">
      <svg width={width} height={height} className="overflow-visible">
        <polygon
          points={`${padding},${height - padding} ${points.join(' ')} ${width - padding},${height - padding}`}
          fill={fillColor}
          opacity="0.3"
        />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="3"
            fill={strokeColor}
          />
        )}
      </svg>
    </div>
  );
}