import api from './axios.js';

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const verifyEmail = (token) => api.get('/auth/verify-email', { params: { token } });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (payload) => api.post('/auth/reset-password', payload);
