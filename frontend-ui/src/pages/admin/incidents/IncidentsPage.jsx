// frontend-ui/src/pages/admin/incidents/IncidentsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { incidentManager } from './core/IncidentManager';

import IncidentHeader from './components/IncidentHeader';
import IncidentStageButtons from './components/IncidentStageButtons';
import IncidentQueueList from './components/IncidentQueueList';
import IncidentInspectorPane from './components/IncidentInspectorPane';
import LogComplaintModal from './components/LogComplaintModal';

export default function IncidentsPage() {
  const [data, setData] = useState({ incidents: [], technicians: [], nodes: [] });
  const [activeStage, setActiveStage] = useState('needs_dispatch'); // 'needs_dispatch' | 'verifying' | 'resolved'
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // 1. Initial Load via OOP IncidentManager
  const reload = async () => {
    const res = await incidentManager.loadAll();
    setData(res);

    // Auto-select the first incident in the active stage if none selected
    if (res?.incidents?.length > 0 && !selectedIncidentId) {
      const firstOpen = res.incidents.find((i) => i.isOpen()) || res.incidents[0];
      setSelectedIncidentId(firstOpen.id);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  // 2. Computed Counts for the 3 Stage Switchers
  const counts = useMemo(() => {
    const kpis = incidentManager.computeKpis(data.incidents);
    return {
      needsDispatch: kpis.needsDispatch,
      inVerification: kpis.inVerification,
      resolved: kpis.resolvedToday
    };
  }, [data.incidents]);

  // 3. Filtered Lists per Stage
  const stageIncidents = useMemo(() => {
    switch (activeStage) {
      case 'needs_dispatch':
        return data.incidents.filter((i) => i.isOpen());
      case 'verifying':
        return data.incidents.filter((i) => i.isVerifying());
      case 'resolved':
        return data.incidents.filter((i) => i.isResolved());
      default:
        return data.incidents;
    }
  }, [data.incidents, activeStage]);

  // Update selected ticket when switching stages
  useEffect(() => {
    if (stageIncidents.length > 0) {
      const stillInList = stageIncidents.some((i) => i.id === selectedIncidentId);
      if (!stillInList) {
        setSelectedIncidentId(stageIncidents[0].id);
      }
    } else {
      setSelectedIncidentId(null);
    }
  }, [activeStage, stageIncidents]);

  const activeIncident = useMemo(() => {
    return data.incidents.find((i) => i.id === selectedIncidentId) || null;
  }, [data.incidents, selectedIncidentId]);

  // 4. Action Handlers
  const handleDispatch = async (incidentId, technicianId) => {
    try {
      await incidentManager.dispatch(incidentId, technicianId);
      reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to dispatch plumber.');
    }
  };

  const handleDismiss = async (incidentId, reason) => {
    try {
      await incidentManager.dismiss(incidentId, reason);
      reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to dismiss incident.');
    }
  };

  const handleCreateComplaint = async (formPayload) => {
    setSubmittingComplaint(true);
    try {
      await incidentManager.createComplaint(formPayload);
      setIsComplaintModalOpen(false);
      reload();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to log complaint.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-[#f4f5f8] text-[#1d1d1f] p-5 sm:p-6 select-none font-sans overflow-hidden">
      
      {/* 1. Header with Breadcrumb (Fixed at top) */}
      <div className="shrink-0 mb-4">
        <IncidentHeader onLogComplaintClick={() => setIsComplaintModalOpen(true)} />
      </div>

      {/* 2. THE SPLIT-PANE WORKSPACE (Right side takes more width) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* ===================================================================
            LEFT COLUMN: Compact focused width (w-[390px] / xl:w-[420px])
            =================================================================== */}
        <div className="w-full lg:w-[390px] xl:w-[420px] flex flex-col h-full min-h-0 shrink-0 overflow-hidden">
          
          {/* The 3 Stage Buttons */}
          <div className="shrink-0 mb-3">
            <IncidentStageButtons
              activeStage={activeStage}
              onStageChange={setActiveStage}
              counts={counts}
            />
          </div>

          {/* Queue List with internal scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
            <IncidentQueueList
              incidents={stageIncidents}
              selectedId={selectedIncidentId}
              onSelect={(inc) => setSelectedIncidentId(inc.id)}
              activeStage={activeStage}
            />
          </div>
        </div>

        {/* ===================================================================
            RIGHT COLUMN: Takes all the generous remaining width (flex-1)
            =================================================================== */}
        <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden">
          <IncidentInspectorPane
            incident={activeIncident}
            technicians={data.technicians}
            onDispatch={handleDispatch}
            onDismiss={handleDismiss}
          />
        </div>

      </div>

      {/* 3. Log Citizen Complaint Modal */}
      <LogComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        nodes={data.nodes}
        onSubmit={handleCreateComplaint}
        submitting={submittingComplaint}
      />

    </div>
  );
}
