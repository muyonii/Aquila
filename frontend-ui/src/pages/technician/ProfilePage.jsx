import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { authApi } from '../../api/auth_api';

import { 
  User, 
  Wrench, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Power, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Shield 
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { isOnDuty, toggleDutyStatus, tasks } = useTaskStore();
  const isConnected = useTelemetryStore((state) => state.isConnected);
  const navigate = useNavigate();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Stats
  const activeTasksCount = tasks.filter(t => t.status === 'DISPATCHED').length;
  const verifyingCount = tasks.filter(t => t.status === 'PENDING_VERIFICATION').length;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.changePassword(currentPassword, newPassword);
      setSuccessMsg('Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* 1. Header & Identity Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-sm">
            {user?.full_name?.slice(0, 2).toUpperCase() || 'TP'}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">{user?.full_name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md uppercase">
                Field Technician
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ID #{user?.user_id}</span>
            </div>
          </div>
        </div>

        {/* Hot Store Connectivity Chip */}
        <div 
          className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${
            isConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
          title={isConnected ? 'Firebase Hot Store Active' : 'Disconnected'}
        >
          {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isConnected ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* 2. Operational Duty Status Card */}
      <div className={`p-5 rounded-2xl border transition shadow-sm ${
        isOnDuty 
          ? 'bg-emerald-50/50 border-emerald-200' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isOnDuty ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Emergency Dispatch Availability</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isOnDuty 
                  ? 'Active on shift. Ready for P1 critical rupture dispatch.' 
                  : 'Currently off duty. Emergency dispatches will not ring on device.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleDutyStatus}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isOnDuty 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
          </button>
        </div>
      </div>

      {/* 3. Field Workload Snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Assigned Jobs</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{activeTasksCount}</span>
            <span className="text-xs text-slate-500">dispatched</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-semibold text-sky-600 uppercase">Verifying Line</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-sky-800 font-mono">{verifyingCount}</span>
            <span className="text-xs text-slate-500">in observation</span>
          </div>
        </div>
      </div>

      {/* 4. Password & Security Management */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <KeyRound className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-bold text-slate-900">Update Password</h3>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password (Min 8 chars)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 5. Logout Action Button */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full p-3 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-2xl border border-slate-200 hover:border-rose-200 transition shadow-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out from Device</span>
        </button>
      </div>
    </div>
  );
}