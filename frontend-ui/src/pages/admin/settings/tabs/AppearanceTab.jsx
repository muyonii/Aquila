// frontend-ui/src/pages/admin/settings/tabs/AppearanceTab.jsx
import React, { useState } from 'react';
import AppleToggle from '../components/AppleToggle';
import TextScaleSlider from '../components/TextScaleSlider';
import { settingsManager } from '../core/SettingsManager';

export default function AppearanceTab() {
  const [theme, setTheme] = useState(() => settingsManager.get('theme'));
  const [textScale, setTextScale] = useState(() => settingsManager.get('textScale'));
  const [highContrast, setHighContrast] = useState(() => settingsManager.get('highContrast'));
  const [reduceMotion, setReduceMotion] = useState(() => settingsManager.get('reduceMotion'));

  const selectTheme = (t) => {
    setTheme(t);
    settingsManager.setDraft('theme', t);
  };

  const handleScaleChange = (v) => {
    setTextScale(v);
    settingsManager.setDraft('textScale', v);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        <span>Appearance & display</span>
        </h2>
        <p className="text-sm text-slate-500">
        Adjust text scaling and workspace lighting to fit your screen.
        </p>
      </div>

      <div className="bg-white rounded-xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        {/* Theme Picker */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1d1d1f]">Theme</h3>
            <p className="text-[11px] text-[#86868b]">Workspace lighting preference.</p>
          </div>
          <div className="flex rounded-lg bg-[#efeff1] p-0.5 text-xs font-medium">
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => selectTheme(t)}
                className={`px-3 py-1 rounded-md capitalize cursor-pointer transition-colors ${
                  theme === t ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold' : 'text-[#86868b]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Scale */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-[#1d1d1f] mb-2">Display Readability Scale</h3>
          <TextScaleSlider value={textScale} onChange={handleScaleChange} />
        </div>
      </div>

      {/* Accessibility Card */}
      <div className="bg-white rounded-xl p-5 border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1d1d1f]">High Contrast (Glare Mode)</h3>
            <p className="text-[11px] text-[#86868b]">Sharpens borders and darkens text for bright sunlight in barangay offices.</p>
          </div>
          <AppleToggle
            checked={highContrast}
            onChange={(v) => {
              setHighContrast(v);
              settingsManager.setDraft('highContrast', v);
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#1d1d1f]">Reduce Motion</h3>
            <p className="text-[11px] text-[#86868b]">Turns off slide animations for faster performance on older desktops.</p>
          </div>
          <AppleToggle
            checked={reduceMotion}
            onChange={(v) => {
              setReduceMotion(v);
              settingsManager.setDraft('reduceMotion', v);
            }}
          />
        </div>
      </div>
    </div>
  );
}