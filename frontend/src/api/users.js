import api from './axios.js';

export const getUsers = (params = {}) => api.get('/users', { params });
export const getMe = () => api.get('/users/me');
export const updateUserRole = (id, rol) => api.patch(`/users/${id}/rol`, { rol });