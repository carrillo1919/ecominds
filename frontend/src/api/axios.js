import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const refreshApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Se inyectan desde main/router para evitar dependencias circulares.
let onUnauthorized = null;
let csrfToken = '';
let isRefreshing = false;
let refreshSubscribers = [];

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const setCsrfToken = (token) => {
  csrfToken = token;
};

const onRefreshed = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
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
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    const isRefreshAttempt = url.includes('/auth/refresh');

    if (status !== 401 || isAuthAttempt || isRefreshAttempt) {
      return Promise.reject(error);
    }

    if (!originalRequest?._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber(() => {
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        await refreshApi.post('/auth/refresh');
        onRefreshed();
        return api(originalRequest);
      } catch (refreshError) {
        if (typeof onUnauthorized === 'function') {
          onUnauthorized();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (typeof onUnauthorized === 'function') {
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
