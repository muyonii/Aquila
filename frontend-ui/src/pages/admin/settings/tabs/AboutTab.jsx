// frontend-ui/src/pages/admin/settings/tabs/AboutTab.jsx
import React from 'react';

export default function AboutTab() {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-[#1d1d1f] tracking-tight">System Status & Credits</h2>
        <p className="text-xs text-[#86868b]">Live architectural health and research provenance.</p>
      </div>

      <div className="bg-white rounded-xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <h3 className="text-xs font-bold text-[#1d1d1f]">Live Architecture Diagnostics</h3>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-[#f5f5f7] rounded-lg">
            <span>Firebase Cloud Hot Store (Singapore)</span>
            <span className="text-emerald-700 font-semibold">● Connected</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-[#f5f5f7] rounded-lg">
            <span>MySQL 8.0 Relational Core (+08:00 PST)</span>
            <span className="text-emerald-700 font-semibold">● Connected</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-[#f5f5f7] rounded-lg">
            <span>Physical Testbed Node 01 (15.0s Pulse)</span>
            <span className="text-emerald-700 font-semibold">● Streaming</span>
          </div>
        </div>

        <div className="pt-2 text-xs text-[#86868b] space-y-1">
          <p><strong>Platform:</strong> AQUILA Decision Support System v2.1</p>
          <p><strong>Academic Home:</strong> Bataan Peninsula State University (BPSU) Main Campus</p>
          <p><strong>Partner Utility:</strong> Barangay Water and Sanitation Association (BWSA) Sector 03</p>
        </div>
      </div>
    </div>
  );
}