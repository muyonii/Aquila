import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { rtdbSubscription } from '../firebase/rtdb_subscription';
import { 
  Droplet, 
  AlertCircle, 
  History, 
  User, 
  LogOut, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

export default function ResidentLayout() {
  const { user, logout } = useAuthStore();
  const isConnected = useTelemetryStore((state) => state.isConnected);
  const navigate = useNavigate();

  const assignedNode = user?.assigned_node_id;

  // 1. Selective Firebase Streaming Lifecycle
  useEffect(() => {
    if (assignedNode) {
      rtdbSubscription.subscribeConnectionStatus();
      rtdbSubscription.subscribeResidentNode(assignedNode);
    }

    return () => {
      // Disconnect listener when navigating away or logging out
      rtdbSubscription.unsubscribeAll();
    };
  }, [assignedNode]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Water Usage', path: '/usage', icon: Droplet },
    { name: 'Report Issue', path: '/my-reports', icon: AlertCircle },
    { name: 'History', path: '/history', icon: History },
    { name: 'Settings', path: '/account', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-16 md:pb-0">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sky-600 text-sm sm:text-base leading-tight">AQUILA Portal</h1>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>Meter:</span>
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                {assignedNode || 'Unassigned'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                {isConnected ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <Wifi className="w-3 h-3" /> Live
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-0.5">
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-white text-sky-700 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Resident Consumer</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center z-50 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full text-[11px] font-semibold transition ${
                  isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}