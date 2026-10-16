import { create } from 'zustand';
import { authApi } from '../api/auth_api.js';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('aquila_user') || 'null'),
  token: localStorage.getItem('aquila_token') || null,
  isAuthenticated: !!localStorage.getItem('aquila_token'),
  isLoading: false,
  error: null,

  /**
   * Authenticate user with PHP API
   * Returns user role for instant routing
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(email, password);
      const { token, user } = res.data;

      // Save to localStorage
      localStorage.setItem('aquila_token', token);
      localStorage.setItem('aquila_user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return user.role; // 'admin' | 'technician' | 'resident'
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw new Error(message);
    }
  },

  /**
   * Session Rehydration: Validates token against backend on page refresh
   */
  restoreSession: async () => {
    const token = localStorage.getItem('aquila_token');
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await authApi.getMe();
      const user = res.data;

      localStorage.setItem('aquila_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      // Token is stale or invalid; wipe it
      localStorage.removeItem('aquila_token');
      localStorage.removeItem('aquila_user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  /**
   * Log out and wipe session
   */
  logout: () => {
    localStorage.removeItem('aquila_token');
    localStorage.removeItem('aquila_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  clearError: () => set({ error: null })
}));