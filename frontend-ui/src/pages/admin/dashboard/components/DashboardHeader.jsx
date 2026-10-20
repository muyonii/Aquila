import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertTriangle, Wrench, Info, ShieldAlert } from 'lucide-react';
import { notificationApi } from '../../../../api/notification_api';
import { useTelemetryStore } from '../../../../stores/useTelemetryStore';
import { useSettings } from '../../settings/core/SettingsManager';

export default function DashboardHeader({ user }) {
  const navigate = useNavigate();
  const prefs = useSettings();
  const isConnected = useTelemetryStore((state) => state.isConnected);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll System Notifications (Table 3.13)
  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications(false);
      if (res?.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch {
      // Non-blocking if offline
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationApi.markAsRead(notif.notification_id);
        loadNotifications();
      } catch {}
    }
    setBellOpen(false);
    if (notif.incident_id) {
      navigate('/incidents');
    } else if (notif.title?.includes('APPROVAL')) {
      navigate('/users');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      loadNotifications();
    } catch {}
  };

  const adminName = user?.first_name || user?.full_name?.split(' ')[0] || 'System Admin';
  const hour = currentTime.getHours();
    const greeting =
      prefs.language === 'fil'
        ? hour < 12
          ? 'Magandang umaga'
          : hour < 18
          ? 'Magandang hapon'
          : 'Magandang gabi'
        : hour < 12
        ? 'Good morning'
        : hour < 18
        ? 'Good afternoon'
        : 'Good evening';

    const dateStr = currentTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const dayTimeStr =
      currentTime.toLocaleDateString('en-US', { weekday: 'short' }) +
      ' ' +
      currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: prefs.clockFormat !== '24h'
      });
    const getNotifIcon = (type) => {
      if (type?.includes('BURST') || type?.includes('FAILED')) {
        return <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
      }
      if (type?.includes('DISPATCH')) {
        return <Wrench className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />;
      }
      if (type?.includes('EQUITY') || type?.includes('FAULT')) {
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      }
      return <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />;
    };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/[0.05] pb-6">
      {/* Left: Greeting & Breadcrumb */}
      <div className="space-y-1">
        <div className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
          System Overview
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>{greeting}, {adminName}</span>
          <span className="text-xl">☀️</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {user?.full_name || 'BAWASA System Admin'} <span className="text-slate-300">•</span> Barangay Water &amp; Sanitation Association (BAWASA) Sector 03 Command Center
        </p>
      </div>

      {/* Right: Watchdog Status Pill + Notification Center Bell + Live Clock Badge */}
      <div className="flex items-center gap-3">
        {/* Live Connection Pill */}
        <div className="bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/90 shadow-2xs flex items-center gap-2.5 text-xs">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="font-mono font-semibold text-slate-800">
            {isConnected ? 'System Online' : 'Connecting...'} <span className="text-slate-300 font-normal">•</span> 15.0s Pulse
          </span>
        </div>

        {/* Notification Bell & Dropdown (Table 3.13) */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2.5 rounded-xl bg-white/80 hover:bg-white backdrop-blur-md border border-white/90 shadow-2xs text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.14)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-sky-50 text-[#0284c7] px-2 py-0.5 rounded-full border border-sky-200">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284c7] hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 [scrollbar-width:thin]">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs text-slate-400">
                    No system notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 12).map((n) => (
                    <button
                      key={n.notification_id}
                      type="button"
                      onClick={() => handleMarkRead(n)}
                      className={`w-full p-3.5 text-left flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.is_read ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      {getNotifIcon(n.notification_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs truncate ${!n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {n.title}
                          </span>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#0284c7] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                          {n.created_at}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clock */}
        <div className="bg-white/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/90 shadow-2xs text-right hidden sm:block">
          <div className="text-xs font-bold text-slate-900">{dateStr}</div>
          <div className="text-[11px] font-mono text-slate-500">{dayTimeStr}</div>
        </div>
      </div>
    </div>
  );
}