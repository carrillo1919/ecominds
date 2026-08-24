import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Se inyectan desde main/router para evitar dependencias circulares.
let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('srcd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthAttempt && typeof onUnauthorized === 'function') {
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
