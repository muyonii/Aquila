import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Inverse Guard: Only allows unauthenticated visitors.
 * If user is already logged in, redirects them to their respective home screen.
 */
export default function PublicOnlyRoute() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
    if (user.role === 'technician') return <Navigate to="/tasks" replace />;
    if (user.role === 'resident') return <Navigate to="/usage" replace />;
  }

  return <Outlet />;
}