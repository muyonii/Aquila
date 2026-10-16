import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // 1. Session rehydration loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-500 font-medium">Verifying session...</p>
      </div>
    );
  }

  // 2. Unauthenticated -> Kick to Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Unauthorized role -> Redirect to the user's appropriate default screen
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
    if (user.role === 'technician') return <Navigate to="/tasks" replace />;
    if (user.role === 'resident') return <Navigate to="/usage" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}