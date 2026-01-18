import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: attach token if present
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Optionally handle 401 globally
    if (err?.response?.status === 401) {
      // e.g., emit event or clear token
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(err);
  }
);

export default api;