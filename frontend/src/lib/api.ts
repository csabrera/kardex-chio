import axios from 'axios';

// Get API URL from environment variable or window location
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser: use environment variable or construct from current host
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl;

    // Fallback: if on production domain, use it
    if (window.location.hostname !== 'localhost') {
      return `${window.location.protocol}//backend-production-14c8.up.railway.app/api`;
    }
  }
  // Server-side or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
