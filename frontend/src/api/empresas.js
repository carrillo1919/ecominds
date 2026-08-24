import api from './axios.js';

export const getEmpresas = (params = {}) => api.get('/empresas', { params });
export const getEmpresa = (id) => api.get(`/empresas/${id}`);
export const createEmpresa = (data) => api.post('/empresas', data);
export const updateEmpresa = (id, data) => api.put(`/empresas/${id}`, data);
export const deleteEmpresa = (id) => api.delete(`/empresas/${id}`);