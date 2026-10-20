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
    <div className="border border-slate-200 rounded-md bg-white p-5 space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-semibold text-slate-900">Administrative actions</h2>
        <p className="text-sm text-slate-600 mt-0.5">Municipal utility shortcuts and records export.</p>
      </div>

      <div className="divide-y divide-slate-200">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              className="w-full py-3 flex items-center justify-between text-left text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-slate-500 stroke-[1.75]" />
                <span className="font-medium">{act.label}</span>
              </div>
              <span className="text-slate-400 text-sm">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}