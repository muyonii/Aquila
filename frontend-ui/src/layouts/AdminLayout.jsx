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
  PanelLeft
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle, hasBadge: true },
  { to: '/network-map', label: 'Network Map', icon: Network },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: Users },
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
        
        {/* ===================================================================
            2. THE FROSTED WHITE GLASSMORPHIC SIDEBAR
               • 40% Ambient Blue Gradient Wash rising from bottom
               • Frosted glass panel letting underlying page colors faintly bleed
            =================================================================== */}
        <aside
          onMouseEnter={() => sidebarMode === 'hover' && setIsHovered(true)}
          onMouseLeave={() => sidebarMode === 'hover' && setIsHovered(false)}
          className={`fixed top-0 left-0 h-screen transition-[width,box-shadow] duration-300 ease-out z-40 flex flex-col justify-between select-none
            bg-white/75 backdrop-blur-2xl border-r border-white/80 text-slate-800
            ${isExpanded ? 'w-64' : 'w-20'}
            ${isHoverOverlay ? 'shadow-[16px_0_48px_rgba(0,0,0,0.12)] bg-white/90' : ''}
          `}
        >
          {/* =================================================================
              3. AMBIENT BLUE GRADIENT (Exactly 40% of Sidebar Height)
              ================================================================= */}
          <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-sky-400/25 via-sky-300/10 to-transparent pointer-events-none" />

          {/* Top: Logo & Navigation */}
          <div className="relative z-10">
            {/* Logo Row */}
            <div className="h-16 px-4 flex items-center border-b border-black/[0.04]">
              <Link
                to="/dashboard"
                className={`flex items-center gap-3 transition-opacity hover:opacity-80 ${
                  !isExpanded ? 'mx-auto' : ''
                }`}
                title="AQUILA"
              >
                {/* Clean Solid Dot Logo */}
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0 shadow-xs" />

                {isExpanded && (
                  <span className="font-bold text-base text-slate-900 font-mono tracking-wider">
                    AQUILA
                  </span>
                )}
              </Link>
            </div>

            {/* Navigation Links (macOS Selection with Soft Glassmorphism) */}
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] [scrollbar-width:none]">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={!isExpanded ? item.label : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-slate-900/95 text-white font-semibold shadow-xs backdrop-blur-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      } ${!isExpanded ? 'justify-center px-0' : ''}`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105 stroke-[1.8]" />
                    
                    {isExpanded && (
                      <div className="flex items-center justify-between flex-1 truncate">
                        <span className="truncate">{item.label}</span>
                        {item.hasBadge && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* ===================================================================
              4. USER PROFILE & SUPABASE EXTEND CONTROL (Inside 40% Gradient Zone)
              =================================================================== */}
          <div className="p-3 relative z-10 shrink-0" ref={popoverRef}>
            
            {/* Upward-Opening Supabase Popover Menu (Frosted Glass) */}
            {popoverOpen && (
              <div className="absolute bottom-16 left-3 w-48 bg-white/90 backdrop-blur-2xl border border-white/90 rounded-xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] text-xs space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-slate-700 hover:text-slate-900 hover:bg-black/[0.04] transition-colors cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {sidebarMode === opt.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Elevated Frosted Glass User Card */}
            <div className="p-2.5 rounded-2xl bg-white/65 backdrop-blur-md border border-white/80 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)]">
              {isExpanded ? (
                /* Expanded: Avatar + Stacked Name/Email + Extend + Logout */
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-white/90">
                      {userInitials}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {user?.full_name || 'System Admin'}
                      </div>
                      <div className="text-[10.5px] text-slate-500 font-mono truncate mt-0.5">
                        {user?.email || 'admin@bawasa.gov.ph'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Supabase Extend / Collapse Button */}
                    <button
                      type="button"
                      onClick={() => setPopoverOpen(!popoverOpen)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors cursor-pointer"
                      title="Sidebar control"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </button>

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Sign Out"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 stroke-[1.8]" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Collapsed: Centered Avatar + Extend + Logout */
                <div className="flex flex-col items-center gap-2 py-1">
                  <div
                    className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-white/90 shadow-2xs"
                    title={user?.full_name || 'System Admin'}
                  >
                    {userInitials}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPopoverOpen(!popoverOpen)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors cursor-pointer"
                    title="Sidebar control"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 stroke-[1.8]" />
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