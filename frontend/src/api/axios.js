import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Se inyectan desde main/router para evitar dependencias circulares.
let onUnauthorized = null;
let csrfToken = '';

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const setCsrfToken = (token) => {
  csrfToken = token;
};

api.interceptors.request.use((config) => {
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase())) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    const isRefreshAttempt = url.includes('/auth/refresh');

    if (status === 401 && !isAuthAttempt && !isRefreshAttempt && typeof onUnauthorized === 'function') {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export const apiMessage = (error, fallback = 'Ocurrio un error inesperado') => {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors.map((e) => e.mensaje).join(' ');
  return data?.message || error?.message || fallback;
};

export default api;
