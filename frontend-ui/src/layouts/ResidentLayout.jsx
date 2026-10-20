import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { rtdbSubscription } from '../firebase/rtdb_subscription';
import { Droplet, AlertCircle, History, User, LogOut } from 'lucide-react';
import { AmbientWash, Brand, initials } from '../components/portal/ui';

const NAV_ITEMS = [
  { name: 'Water Usage', short: 'Usage', path: '/usage', icon: Droplet },
  { name: 'Report Issue', short: 'Report', path: '/my-reports', icon: AlertCircle },
  { name: 'History', short: 'History', path: '/history', icon: History },
  { name: 'Settings', short: 'Account', path: '/account', icon: User }
];

export default function ResidentLayout() {
  const { user, logout } = useAuthStore();
  const isConnected = useTelemetryStore((state) => state.isConnected);
  const getNode = useTelemetryStore((state) => state.getNode);
  const navigate = useNavigate();

  const assignedNode = user?.assigned_node_id;

  // 1-second clock to evaluate 45s meter liveness accurately
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const timer = setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (assignedNode) {
      rtdbSubscription.subscribeConnectionStatus();
      rtdbSubscription.subscribeResidentNode(assignedNode);
      rtdbSubscription.subscribeBlackboardHypotheses();
    }
    return () => {
      rtdbSubscription.unsubscribeAll();
    };
  }, [assignedNode]);

  const nodeState = getNode(assignedNode);
  const rawTs = Number(nodeState?.telemetry?.timestamp || 0);
  const ts = rawTs > 1e11 ? Math.floor(rawTs / 1000) : rawTs;
  const isMeterStreaming = ts > 0 && Math.max(0, nowSec - ts) <= 45;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f5f8] text-slate-800 font-sans relative">
      <AmbientWash />

      {/* Top bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <Brand
          suffix={
            <span className="hidden sm:inline text-xs font-semibold text-slate-700 border border-slate-300 rounded-md px-2 py-0.5">
              Resident
            </span>
          }
        />

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0c4a6e] ${
                  isActive
                    ? 'border-b-2 border-[#0c4a6e] bg-slate-50 text-slate-900'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-b-2 border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 stroke-[1.75] text-slate-500" />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {/* Meter Stream Status — dot + label */}
          <span
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            title={
              isMeterStreaming
                ? `Meter ${assignedNode} is actively streaming`
                : `Meter ${assignedNode} has no packet in the last 45s`
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isMeterStreaming ? 'bg-emerald-600' : isConnected ? 'bg-slate-400' : 'bg-rose-600'
              }`}
            />
            <span className={isMeterStreaming ? 'text-emerald-700' : isConnected ? 'text-slate-600' : 'text-rose-700'}>
              {isMeterStreaming ? 'Meter Live' : isConnected ? 'Meter Idle' : 'Offline'}
            </span>
          </span>

          <div
            className="hidden sm:flex w-8 h-8 rounded-full bg-[#0c4a6e] text-white font-semibold text-xs items-center justify-center"
            title={user?.full_name}
          >
            {initials(user?.full_name)}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-md text-slate-600 hover:text-rose-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            <LogOut className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="h-16 grid grid-cols-4">
          {NAV_ITEMS.map(({ short, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-1 focus-visible:outline-none"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`w-12 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-[#0c4a6e] text-white' : 'text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </span>
                  <span
                    className={`text-xs ${
                      isActive
                        ? 'font-bold text-[#0c4a6e]'
                        : 'font-medium text-slate-600'
                    }`}
                  >
                    {short}
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