// frontend-ui/src/pages/admin/settings/tabs/ProfileTab.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../../../../stores/useAuthStore';
import { settingsManager } from '../core/SettingsManager';
import { Shield, Key, Smartphone, Mail, User as UserIcon } from 'lucide-react';

export default function ProfileTab() {
  const { user } = useAuthStore();

  const defaultFullName = user?.full_name || 'BAWASA System Admin';
  const nameParts = defaultFullName.split(' ');

  const [firstName, setFirstName] = useState(() => 
    settingsManager.get('firstName', nameParts[0] || 'Admin')
  );
  const [lastName, setLastName] = useState(() => 
    settingsManager.get('lastName', nameParts.length > 1 ? nameParts[nameParts.length - 1] : '')
  );
  const [nickname, setNickname] = useState(() => 
    settingsManager.get('nickname', 'Admin')
  );
  const [phone, setPhone] = useState(() => 
    settingsManager.get('emergencyPhone', '+63 912 345 6789')
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleFieldChange = (key, value, setter) => {
    setter(value);
    settingsManager.setDraft(key, value);
  };

  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'A';
  const displayTitle = nickname ? `${firstName} ${lastName} (${nickname})` : `${firstName} ${lastName}`;

  return (
    <div className="space-y-6 pb-28 sm:pb-36 animate-in fade-in duration-150">
      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        <span>My Account</span>
        </h2>
        <p className="text-sm text-slate-500">
            Manage your personal details and login credentials.
        </p>
      </div>
      
      {/* =====================================================================
          DISCORD SIGNATURE PROFILE BANNER CARD
          ===================================================================== */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Top Banner (Cerulean Gradient) */}
        <div className="h-28 bg-gradient-to-r from-sky-500 via-[#0284c7] to-[#0369a1] relative" />

        {/* Profile Card Body */}
        <div className="px-6 pb-6 relative">
          
          {/* Avatar Overlapping the Banner */}
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-[#18181b] text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0">
              {initials}
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>System Administrator</span>
            </span>
          </div>

          {/* User Names */}
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {user?.email || 'admin@bawasa.gov.ph'}
            </p>
          </div>

          {/* Discord Stacked Info Card (With Inline Edit Look) */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 space-y-3.5">
            
            {/* Row 1: Display Name */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  DISPLAY NAME / NICKNAME
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => handleFieldChange('nickname', e.target.value, setNickname)}
                  placeholder="Nickname"
                  className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none border-b border-transparent focus:border-[#0284c7] transition-all py-0.5"
                />
              </div>
            </div>

            {/* Row 2: Full Legal Name */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200/50">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    FIRST NAME
                  </span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value, setFirstName)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none border-b border-transparent focus:border-[#0284c7] transition-all py-0.5"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    LAST NAME
                  </span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value, setLastName)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none border-b border-transparent focus:border-[#0284c7] transition-all py-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Email */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200/50">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  EMAIL ADDRESS
                </span>
                <span className="text-xs font-mono text-slate-600 block py-0.5">
                  {user?.email || 'admin@bawasa.gov.ph'}
                </span>
              </div>
            </div>

            {/* Row 4: Phone Number */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200/50">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  EMERGENCY PHONE NUMBER
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handleFieldChange('emergencyPhone', e.target.value, setPhone)}
                  placeholder="+63 912 345 6789"
                  className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none border-b border-transparent focus:border-[#0284c7] transition-all py-0.5"
                />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Card 2: Password & Authentication */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-6 border border-white/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Password and Authentication</h3>
          <p className="text-xs text-slate-500 mt-0.5">Update your security passcode below.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
          <input
            type="password"
            placeholder="Current password"
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0284c7]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0284c7]"
          />
        </div>
      </div>

    </div>
  );
}