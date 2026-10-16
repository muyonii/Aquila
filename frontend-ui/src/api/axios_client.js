import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1/aquila-system/backend-api/public/api/v1';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10-second timeout budget
});

// 1. Request Interceptor: Inject JWT Bearer Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aquila_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Catch Token Expiration (401)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend rejects JWT (expired past 900s or tampered)
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config.url.includes('/auth/login');
      
      // Do not kick if the user was just typing the wrong password at the login screen
      if (!isAuthEndpoint) {
        localStorage.removeItem('aquila_token');
        localStorage.removeItem('aquila_user');
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);