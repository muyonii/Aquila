import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const { restoreSession, logout } = useAuthStore();

  useEffect(() => {
    // 1. Initial boot session validation
    restoreSession();

    // 2. Multi-Tab Logout Sync: Listens for token removal in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'aquila_token' && !e.newValue) {
        logout();
      }
    };

    // 3. Prevent bfcache (Back-Forward Cache) restoring private screens after logout
    const handlePageShow = (e) => {
      if (e.persisted) {
        const token = localStorage.getItem('aquila_token');
        if (!token) {
          logout();
        } else {
          restoreSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [restoreSession, logout]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}