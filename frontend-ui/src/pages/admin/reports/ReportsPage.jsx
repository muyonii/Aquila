// frontend-ui/src/pages/admin/reports/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { reportManager } from './core/ReportManager';

import ReportsHeader from './components/ReportsHeader';
import ReportsTabBar from './components/ReportsTabBar';
import EquityView from './components/EquityView';
import LeakLossView from './components/LeakLossView';
import WorkforceView from './components/WorkforceView';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('equity'); // 'equity' | 'leaks' | 'workforce'
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    consumption: null,
    leaks: null,
    maintenance: null
  });

  const loadReports = async () => {
    setLoading(true);
    const data = await reportManager.fetchAll();
    setReportData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleExportCsv = () => {
    const typeMap = {
      equity: 'consumption',
      leaks: 'leaks',
      workforce: 'maintenance'
    };
    reportManager.exportCsv(typeMap[activeTab] || 'consumption');
  };

  return (
    <div className="min-h-full bg-[#f4f5f8] text-[#1d1d1f] p-6 sm:p-10 space-y-8 select-none font-sans">
      
      {/* 1. Standard Header */}
      <ReportsHeader
        onExport={handleExportCsv}
        onRefresh={loadReports}
        loading={loading}
      />

      {/* 2. Apple Recessed Segmented View Switcher */}
      <ReportsTabBar activeTab={activeTab} onChange={setActiveTab} />

      {/* 3. Dynamic Active View Content */}
      <main>
        {activeTab === 'equity' && <EquityView data={reportData.consumption} />}
        {activeTab === 'leaks' && <LeakLossView data={reportData.leaks} />}
        {activeTab === 'workforce' && <WorkforceView data={reportData.maintenance} />}
      </main>

    </div>
  );
}