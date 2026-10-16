import { Outlet, Link } from 'react-router-dom';
import { Droplets, LogIn } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-sky-600 text-lg">
            <Droplets className="w-6 h-6 text-sky-500" />
            <span>AQUILA <span className="text-xs font-normal text-slate-500 uppercase tracking-wider">BAWASA</span></span>
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>AQUILA Distributed Multi-Agent Decision Support System &copy; 2026 BPSU BSCS</p>
      </footer>
    </div>
  );
}