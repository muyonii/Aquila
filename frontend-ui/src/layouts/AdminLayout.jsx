// frontend-ui/src/layouts/AdminLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Network,
  BarChart3,
  Users,
  Settings,
  LogOut,
  PanelLeft,
  Activity
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle, hasBadge: true },
  { to: '/network-map', label: 'Network Map', icon: Network },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/inspector', label: 'System Inspector', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Mode: 'expanded' | 'collapsed' | 'hover'
  const [sidebarMode, setSidebarMode] = useState(() => {
    return localStorage.getItem('aquila_sidebar_mode') || 'expanded';
  });

  const [isHovered, setIsHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectMode = (mode) => {
    setSidebarMode(mode);
    localStorage.setItem('aquila_sidebar_mode', mode);
    setPopoverOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // State calculations
  const isExpanded = sidebarMode === 'expanded' || (sidebarMode === 'hover' && isHovered);
  const isHoverOverlay = sidebarMode === 'hover' && isHovered;
  const spacerWidthClass = sidebarMode === 'expanded' ? 'w-64' : 'w-20';

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'BA';

  return (
    <div className="min-h-screen bg-[#f4f5f8] flex font-sans">
      
      {/* =====================================================================
          1. STRUCTURAL SPACER (Handles layout reflow vs static spacing)
          ===================================================================== */}
      <div className={`h-screen shrink-0 transition-[width] duration-300 ease-out select-none ${spacerWidthClass}`}>
        
        {/* Clean Solid Sidebar */}
        <aside
          onMouseEnter={() => sidebarMode === 'hover' && setIsHovered(true)}
          onMouseLeave={() => sidebarMode === 'hover' && setIsHovered(false)}
          className={`fixed top-0 left-0 h-screen transition-[width,box-shadow] duration-200 ease-out z-40 flex flex-col justify-between select-none
            bg-white border-r border-slate-200 text-slate-800
            ${isExpanded ? 'w-64' : 'w-20'}
            ${isHoverOverlay ? 'shadow-lg' : ''}
          `}
        >
          {/* Top: Logo & Navigation */}
          <div className="relative z-10">
            {/* Logo Row */}
            <div className="h-16 px-4 flex items-center border-b border-slate-200">
              <Link
                to="/dashboard"
                className={`flex items-center gap-3 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#0c4a6e] rounded-lg p-1 ${
                  !isExpanded ? 'mx-auto' : ''
                }`}
                title="AQUILA"
              >
                {/* Clean Solid Dot Logo */}
                <span className="w-3 h-3 rounded-full bg-[#0c4a6e] shrink-0" />

                {isExpanded && (
                  <span className="font-bold text-base text-[#0c4a6e] font-mono tracking-wider">
                    AQUILA
                  </span>
                )}
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] [scrollbar-width:none]">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={!isExpanded ? item.label : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0c4a6e] focus-visible:outline-none ${
                        isActive
                          ? 'bg-[#0c4a6e] text-white shadow-sm'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      } ${!isExpanded ? 'justify-center px-0' : ''}`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-none stroke-[2]" />
                    
                    {isExpanded && (
                      <div className="flex items-center justify-between flex-1 truncate">
                        <span className="truncate">{item.label}</span>
                        {item.hasBadge && (
                          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom: User Profile & View Control */}
          <div className="p-3 relative z-10 shrink-0" ref={popoverRef}>
            
            {/* Supabase Popover Menu */}
            {popoverOpen && (
              <div className="absolute bottom-16 left-3 w-48 bg-white border border-slate-200 rounded-xl p-1.5 shadow-lg text-sm space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Sidebar View
                </div>

                {[
                  { id: 'expanded', label: 'Expanded' },
                  { id: 'collapsed', label: 'Collapsed' },
                  { id: 'hover', label: 'Expand on hover' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectMode(opt.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    {sidebarMode === opt.id && (
                      <span className="w-2 h-2 rounded-full bg-[#0c4a6e]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Elevated Solid User Card */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              {isExpanded ? (
                /* Expanded: Avatar + Stacked Name/Email + Extend + Logout */
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-[#0c4a6e] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {userInitials}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-semibold text-slate-900 truncate leading-tight">
                        {user?.full_name || 'System Admin'}
                      </div>
                      <div className="text-xs text-slate-600 font-mono truncate mt-0.5">
                        {user?.email || 'admin@bawasa.gov.ph'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Supabase Extend / Collapse Button */}
                    <button
                      type="button"
                      onClick={() => setPopoverOpen(!popoverOpen)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
                      title="Sidebar control"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </button>

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Sign Out"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-600"
                    >
                      <LogOut className="h-4 w-4 stroke-[2]" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Collapsed: Centered Avatar + Extend + Logout */
                <div className="flex flex-col items-center gap-2 py-1">
                  <div
                    className="w-8 h-8 rounded-full bg-[#0c4a6e] text-white font-bold text-xs flex items-center justify-center shrink-0"
                    title={user?.full_name || 'System Admin'}
                  >
                    {userInitials}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPopoverOpen(!popoverOpen)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0c4a6e]"
                    title="Sidebar control"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-600"
                  >
                    <LogOut className="h-4 w-4 stroke-[2]" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </aside>
      </div>

      {/* =====================================================================
          5. MAIN VIEWPORT CONTENT
          ===================================================================== */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}