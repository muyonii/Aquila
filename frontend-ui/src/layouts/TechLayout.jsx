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
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-sans relative">
      {!isMapRoute && <AmbientWash />}

      {/* Top bar */}
      <header className="h-16 bg-white border-b border-line px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <Brand
          suffix={
            <span className="hidden sm:inline text-xs font-semibold text-ink-muted border border-line rounded-tile px-2 py-0.5 tracking-wide uppercase">
              Field
            </span>
          }
        />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Primary">
          {NAV_ITEMS.map(({ to, label, icon: Icon, hasCount }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-tile text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-brand ${
                  isActive
                    ? 'bg-white shadow-soft text-ink font-semibold border border-line'
                    : 'text-ink-muted hover:text-ink hover:bg-canvas border border-transparent'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] stroke-[1.75] text-ink-muted shrink-0" />
              <span>{label}</span>
              {hasCount && actionableCount > 0 && (
                <span className="status-dot danger" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDutyStatus}
            title="Click to toggle On/Off duty status"
            className={`inline-flex items-center gap-1.5 h-11 px-3 rounded-control border text-sm font-medium transition cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-brand ${
              isOnDuty
                ? 'bg-white text-state-ok border-[#a7f3d0] hover:bg-state-ok-tint'
                : 'bg-white text-ink-muted border-line hover:bg-canvas'
            }`}
          >
            <span
              className={`status-dot ${isOnDuty ? 'ok' : 'warn'}`}
            />
            {isOnDuty ? 'On duty' : 'Off duty'}
          </button>

          {/* Technician Dispatch Notification Bell */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen(!bellOpen)}
              className="relative p-2.5 rounded-control text-ink-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-brand"
              title="Dispatch Notifications"
            >
              <Bell className="w-[18px] h-[18px] stroke-[1.75]" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-state-danger ring-2 ring-white" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-card border border-line shadow-soft z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">
                    Dispatch Alerts ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Read all
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-line">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-ink-muted">
                      No dispatch alerts yet.
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.notification_id}
                        type="button"
                        onClick={() => handleNotifClick(n)}
                        className={`w-full p-3 text-left hover:bg-canvas transition-colors cursor-pointer ${
                          !n.is_read ? 'bg-[#f0f9ff]' : ''
                        }`}
                      >
                        <div className="text-sm font-semibold text-ink truncate">
                          {n.title}
                        </div>
                        <p className="text-sm text-ink-muted line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-xs text-ink-muted mt-1 block">
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
            className="hidden sm:flex w-8 h-8 rounded-full bg-white border border-line text-ink font-semibold text-xs items-center justify-center"
            title={user?.full_name}
          >
            {initials(user?.full_name)}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2.5 rounded-control text-ink-muted hover:text-state-danger hover:bg-canvas transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-state-danger"
          >
            <LogOut className="w-[18px] h-[18px] stroke-[1.75]" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main
        className={`relative z-10 flex-1 w-full ${
          isMapRoute ? '' : 'p-6 pb-28 md:pb-10'
        }`}
      >
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-line pb-[env(safe-area-inset-bottom)] shadow-soft"
      >
        <div className="h-16 grid grid-cols-3 max-w-2xl mx-auto px-2 items-center">
          {NAV_ITEMS.map(({ to, label, icon: Icon, hasCount }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-1 min-h-[44px] py-1 focus-visible:outline-none"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`relative px-4 py-1 rounded-pill flex items-center justify-center transition-all ${
                      isActive ? 'bg-white shadow-soft text-ink font-semibold border border-line' : 'text-ink-muted border border-transparent'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] stroke-[1.75]" />
                    {hasCount && actionableCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-pill bg-state-danger text-white text-xs font-semibold flex items-center justify-center ring-2 ring-white">
                        {actionableCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-xs ${
                      isActive
                        ? 'font-semibold text-ink'
                        : 'font-medium text-ink-muted'
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