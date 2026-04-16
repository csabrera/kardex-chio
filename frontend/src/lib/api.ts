'use client';

import axios, { AxiosInstance } from 'axios';

let api: AxiosInstance | null = null;

function getApiBaseUrl(): string {
  // Only in browser
  if (typeof window === 'undefined') {
    return 'http://localhost:3011/api';
  }

  const { hostname } = window.location;

  // Railway production
  if (hostname.includes('railway.app')) {
    return 'https://backend-production-14c8.up.railway.app/api';
  }

  // Local development
  return 'http://localhost:3011/api';
}

function createApiInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request: Add token
  instance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Response: Handle 401
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

function getApi(): AxiosInstance {
  if (!api) {
    api = createApiInstance();
  }
  return api;
}

export default getApi();
