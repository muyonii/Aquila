// frontend-ui/src/pages/admin/reports/components/ReportsHeader.jsx
import React from 'react';
import { Download, RefreshCw } from 'lucide-react';

export default function ReportsHeader({ onExport, onRefresh, loading }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span className="text-slate-400 font-medium">Reports</span>
          <span className="text-slate-400 font-normal text-xl select-none">›</span>
          <span>Overview</span>
        </h1>
        <p className="text-sm text-slate-500">
          Official regulatory audits for water equity, non-revenue water (NRW) leak loss, and workforce performance.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <button
          type="button"
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer shadow-xs"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Download className="h-4 w-4 stroke-[2]" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}