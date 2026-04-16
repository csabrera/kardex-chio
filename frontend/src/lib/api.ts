import axios, { AxiosInstance } from 'axios';

let api: AxiosInstance;

// Initialize API client - called on client-side
const initializeApi = (): AxiosInstance => {
  if (api) return api;

  // Determine API URL based on environment
  let baseURL = 'http://localhost:3011/api';

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Production: Railway deployment
    if (hostname.includes('railway.app')) {
      baseURL = 'https://backend-production-14c8.up.railway.app/api';
    }
  }

  api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: add auth token
  api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Response interceptor: handle 401
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

  return api;
};

// Export a proxy that initializes the API on first use
export default new Proxy({} as AxiosInstance, {
  get(target, prop) {
    const instance = initializeApi();
    return Reflect.get(instance, prop);
  },
});
