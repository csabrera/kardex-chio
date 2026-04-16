import axios from 'axios';

// Get API URL dynamically based on current environment
const getApiUrl = () => {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return 'http://localhost:3011/api';
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Production environments
  if (hostname.includes('railway.app') || hostname.includes('yourdomain.com')) {
    // Use the hardcoded production Backend URL
    return 'https://backend-production-14c8.up.railway.app/api';
  }

  // Local development
  return 'http://localhost:3011/api';
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
