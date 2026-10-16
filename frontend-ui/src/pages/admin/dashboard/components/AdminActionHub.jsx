// frontend-ui/src/pages/admin/dashboard/components/AdminActionHub.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, UserPlus, PlusSquare, Download } from 'lucide-react';
import { reportManager } from '../../reports/core/ReportManager';

export default function AdminActionHub() {
  const navigate = useNavigate();

  const handleExport = () => {
    reportManager.exportCsv('consumption');
  };

  const actions = [
    { label: 'Log Citizen Complaint', icon: FileText, onClick: () => navigate('/incidents') },
    { label: 'Register New User', icon: UserPlus, onClick: () => navigate('/users') },
    { label: 'Add Water Meter Node', icon: PlusSquare, onClick: () => navigate('/network-map') },
    { label: 'Export Monthly Council CSV', icon: Download, onClick: handleExport }
  ];

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] p-6 space-y-4">
      <div className="border-b border-black/[0.05] pb-3">
        <h3 className="text-sm font-bold text-slate-900">Quick Administrative Actions</h3>
        <p className="text-xs text-slate-500 mt-0.5">Common municipal utility shortcuts.</p>
      </div>

      <div className="space-y-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 text-xs font-semibold text-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-slate-500" />
                <span>{act.label}</span>
              </div>
              <span className="text-slate-400">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}