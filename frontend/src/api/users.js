import api from './axios.js';

export const getUsers = (params = {}) => api.get('/users', { params });
export const getMe = () => api.get('/users/me');
export const updateUserRole = (id, rol) => api.patch(`/users/${id}/rol`, { rol });
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const getUserEmpresas = (id) => api.get(`/users/${id}/empresas`);
export const setUserEmpresas = (id, empresaIds) => api.post(`/users/${id}/empresas`, { empresaIds });
export const removeUserEmpresa = (id, empresaId) => api.delete(`/users/${id}/empresas/${empresaId}`);