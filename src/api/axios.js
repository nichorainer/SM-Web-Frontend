import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000, // 15s, sesuaikan jika perlu
});

api.interceptors.request.use(
  (config) => {

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      return Promise.reject({ status, data });
    }
    return Promise.reject({ message: error.message || 'Network Error' });
  }
);

export function setAuthHeader(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

export function clearAuthHeader() {
  delete api.defaults.headers.common.Authorization;
}

export default api;