// frontend-ui/src/pages/admin/settings/AdminSettingsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  User,
  Bell,
  Sun,
  Globe,
  BookOpen,
  FileCheck,
  Info
} from 'lucide-react';

import { TabRegistry, TabDefinition } from './core/TabRegistry';
import { settingsManager } from './core/SettingsManager';
import SettingsSubNav from './components/SettingsSubNav';
import UnsavedChangesBar from './components/UnsavedChangesBar';

// The 7 Consolidated Tabs
import ProfileTab from './tabs/ProfileTab';
import NotificationsTab from './tabs/NotificationsTab';
import AppearanceTab from './tabs/AppearanceTab';
import RegionalTab from './tabs/RegionalTab';
import FieldOperationsGuideTab from './tabs/FieldOperationsGuideTab';
import AdminManualTab from './tabs/AdminManualTab';
import AboutTab from './tabs/AboutTab';

export default function AdminSettingsPage() {
  const navigate = useNavigate();

  // 1. Build Tab Registry (7 Clean Items)
  const registry = useMemo(() => {
    const reg = new TabRegistry();

    // Group 1: Preferences
    if (ProfileTab) reg.register(new TabDefinition({ id: 'profile', label: 'My Profile', group: 'PREFERENCES', icon: User, keywords: ['name', 'phone', 'password'], component: ProfileTab }));
    if (NotificationsTab) reg.register(new TabDefinition({ id: 'notifications', label: 'Alerts & Sound', group: 'PREFERENCES', icon: Bell, keywords: ['siren', 'push'], component: NotificationsTab }));
    if (AppearanceTab) reg.register(new TabDefinition({ id: 'appearance', label: 'Text Size & Display', group: 'PREFERENCES', icon: Sun, keywords: ['theme', 'font', 'scale'], component: AppearanceTab }));
    if (RegionalTab) reg.register(new TabDefinition({ id: 'regional', label: 'Time & Language', group: 'PREFERENCES', icon: Globe, keywords: ['clock', 'liters', 'tagalog'], component: RegionalTab }));

    // Group 2: Consolidated Documentation & Guides
    if (FieldOperationsGuideTab) reg.register(new TabDefinition({ id: 'field-guide', label: 'Field Operations Guide', group: 'HELP & DOCUMENTATION', icon: BookOpen, keywords: ['leaks', 'verify', 'pipes', 'battery'], component: FieldOperationsGuideTab }));
    if (AdminManualTab) reg.register(new TabDefinition({ id: 'admin-manual', label: 'Administration Manual', group: 'HELP & DOCUMENTATION', icon: FileCheck, keywords: ['users', 'meters', 'reports', 'complaints'], component: AdminManualTab }));

    // Group 3: System
    if (AboutTab) reg.register(new TabDefinition({ id: 'about', label: 'System Health Check', group: 'SYSTEM', icon: Info, keywords: ['version', 'status', 'bpsu'], component: AboutTab }));

    return reg;
  }, []);

  const [activeTabId, setActiveTabId] = useState(() => registry.getDefaultTabId());
  const [isDirty, setIsDirty] = useState(() => settingsManager.isDirty());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = settingsManager.subscribe((state) => {
      setIsDirty(state.isDirty);
    });
    return () => unsubscribe();
  }, []);

  // Safe Exit Handler
  const handleExit = () => {
    if (isDirty) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      return;
    }
    navigate('/dashboard');
  };

  // Keyboard Escape Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty]);

  // Save changes action
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      settingsManager.saveDraft();
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    }, 400);
  };

  // Reset changes action
  const handleReset = () => {
    settingsManager.resetDraft();
  };

  const activeTab = registry.getTab(activeTabId);
  const ActiveComponent = activeTab?.component;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/50 via-[#f4f5f8] to-[#edf0f5] select-none text-slate-800">
      
      {/* 1. LEFT SUB-NAV: Text-Only, Zero Vertical Scrollbar */}
      <div className="bg-white/60 backdrop-blur-xl border-r border-slate-200/50 shrink-0 h-full">
        <SettingsSubNav
          registry={registry}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
        />
      </div>

      {/* 2. CENTER READING STAGE */}
      <div className="flex-1 overflow-y-auto h-full px-6 sm:px-12 pt-10 pb-40 flex justify-center [scrollbar-width:thin]">
        <div className="w-full max-w-[760px] pb-16">
          {typeof ActiveComponent === 'function' ? (
            <div className="[&_.bg-white]:bg-white/80 [&_.bg-white]:backdrop-blur-md [&_.bg-white]:border-white/70 [&_.bg-white]:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)]">
              <ActiveComponent />
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-rose-200">
              <p className="text-xs text-rose-700 font-bold">Tab failed to load: {activeTabId}</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT ESCAPE PILLAR */}
      <div className="fixed top-6 right-8 flex flex-col items-center gap-1.5 z-50">
        <button
          type="button"
          onClick={handleExit}
          className="group relative h-9 w-9 rounded-full bg-white/70 hover:bg-white backdrop-blur-md border border-slate-200/70 shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-900 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Return to Dashboard (Esc)"
        >
          <X className="h-4 w-4 stroke-[2]" />
        </button>

        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-white/80 backdrop-blur-md border border-slate-200/80 text-slate-400 shadow-2xs pointer-events-none">
          ESC
        </span>
      </div>

      {/* 4. DISCORD-STYLE FLOATING SAVE CAPSULE */}
      <UnsavedChangesBar
        isDirty={isDirty}
        isShaking={isShaking}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onReset={handleReset}
        onSave={handleSave}
      />

    </div>
  );
}