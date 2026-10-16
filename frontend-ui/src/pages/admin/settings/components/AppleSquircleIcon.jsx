// frontend-ui/src/pages/admin/settings/components/AppleSquircleIcon.jsx
import React from 'react';

const COLOR_MAP = {
  blue: 'bg-gradient-to-b from-[#0088ff] to-[#0071e3] text-white',
  red: 'bg-gradient-to-b from-[#ff453a] to-[#d70015] text-white',
  indigo: 'bg-gradient-to-b from-[#5e5ce6] to-[#4338ca] text-white',
  teal: 'bg-gradient-to-b from-[#30b0c7] to-[#0284c7] text-white',
  orange: 'bg-gradient-to-b from-[#ff9f0a] to-[#d97706] text-white',
  green: 'bg-gradient-to-b from-[#34c759] to-[#248a3d] text-white',
  gray: 'bg-gradient-to-b from-[#8e8e93] to-[#636366] text-white',
  slate: 'bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] text-white'
};

export default function AppleSquircleIcon({ icon: Icon, color = 'blue', size = 26 }) {
  const gradient = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-[7px] flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${gradient}`}
    >
      <Icon style={{ width: size * 0.58, height: size * 0.58 }} className="stroke-[2.2]" />
    </div>
  );
}