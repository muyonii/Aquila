import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Wrench, MapPin, User, LogOut } from 'lucide-react';

export default function TechLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true }); // Overwrites history entry instead of pushing a new one
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sky-600 tracking-wide">AQUILA FIELD</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">TECH</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-medium">{user?.full_name}</span>
          <button onClick={handleLogout} className="text-slate-400 hover:text-rose-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4">
        <Outlet />
      </main>

      {/* Persistent Bottom Tab Bar (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center z-50">
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs font-medium ${
              isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <Wrench className="w-5 h-5 mb-1" />
          <span>My Tasks</span>
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs font-medium ${
              isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <MapPin className="w-5 h-5 mb-1" />
          <span>Field Map</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center text-xs font-medium ${
              isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <User className="w-5 h-5 mb-1" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}