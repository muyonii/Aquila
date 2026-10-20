import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore } from '../stores/useTaskStore';
import { rtdbSubscription } from '../firebase/rtdb_subscription';
import { notificationApi } from '../api/notification_api';
import { Wrench, MapPin, User, LogOut, Bell, CheckCheck } from 'lucide-react';
import { AmbientWash, Brand, initials } from '../components/portal/ui';

const NAV_ITEMS = [
  { to: '/tasks', label: 'My Tasks', icon: Wrench, hasCount: true },
  { to: '/map', label: 'Field Map', icon: MapPin },
  { to: '/profile', label: 'Profile', icon: User }
];

export default function TechLayout() {
  const { user, logout } = useAuthStore();
  const { tasks, fetchMyTasks, isOnDuty, toggleDutyStatus } = useTaskStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  // Subscribe to Firebase RTDB + Poll tasks & dispatch notifications
  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications(false);
      if (res?.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch {}
  };

  useEffect(() => {
    rtdbSubscription.subscribeConnectionStatus();
    rtdbSubscription.subscribeAllNodes();
    rtdbSubscription.subscribeBlackboardHypotheses();
    fetchMyTasks().catch(() => {});
    loadNotifications();

    const interval = setInterval(() => {
      fetchMyTasks().catch(() => {});
      loadNotifications();
    }, 15000);

    return () => {
      clearInterval(interval);
      rtdbSubscription.unsubscribeAll();
    };
  }, [fetchMyTasks]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = async (n) => {
    if (!n.is_read) {
      try {
        await notificationApi.markAsRead(n.notification_id);
        loadNotifications();
      } catch {}
    }
    setBellOpen(false);
    if (n.incident_id) {
      navigate(`/tasks/${n.incident_id}`);
    } else {
      navigate('/tasks');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      loadNotifications();
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const actionableCount = tasks.filter(
    (t) => t.status === 'DISPATCHED' || t.status === 'REPAIR_FAILED'
  ).length;
  const isMapRoute = pathname.startsWith('/map');

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f5f8] text-slate-800 font-sans relative">
      {!isMapRoute && <AmbientWash />}

      {/* Top bar */}
      <header className="h-14 bg-white/80 backdrop-blur-2xl border-b border-black/[0.05] px-4 flex items-center justify-between sticky top-0 z-40">
        <Brand
          suffix={
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase">
              Field
            </span>
          }
        />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map(({ to, label, icon: Icon, hasCount }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900/95 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`
              }
            >
              <Icon className="w-4 h-4 stroke-[1.8]" />
              <span>{label}</span>
              {hasCount && actionableCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  {actionableCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDutyStatus}
            title="Click to toggle On/Off duty status"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-semibold transition cursor-pointer ${
              isOnDuty
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {isOnDuty ? 'On duty' : 'Off duty'}
          </button>

          {/* Technician Dispatch Notification Bell */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Dispatch Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Dispatch Alerts ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-[#0284c7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" /> Read all
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No dispatch alerts yet.
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.notification_id}
                        type="button"
                        onClick={() => handleNotifClick(n)}
                        className={`w-full p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                          !n.is_read ? 'bg-sky-50/40' : ''
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {n.title}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                          {n.created_at}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className="hidden sm:flex w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs items-center justify-center ring-2 ring-white/90"
            title={user?.full_name}
          >
            {initials(user?.full_name)}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main
        className={`relative z-10 flex-1 w-full ${
          isMapRoute ? '' : 'p-4 pb-28 md:pb-10'
        }`}
      >
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/85 backdrop-blur-2xl border-t border-black/[0.05] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="h-16 grid grid-cols-3 max-w-2xl mx-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, hasCount }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-1"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`relative w-14 h-7 rounded-full flex items-center justify-center transition-all ${
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] stroke-[1.8]" />
                    {hasCount && actionableCount > 0 && (
                      <span className="absolute -top-1.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {actionableCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[11px] ${
                      isActive
                        ? 'font-bold text-slate-900'
                        : 'font-medium text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}