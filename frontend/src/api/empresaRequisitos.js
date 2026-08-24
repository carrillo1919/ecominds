import api from './axios.js';

export const getByEmpresa = (empresaId) => api.get(`/empresa-requisitos/empresa/${empresaId}`);
export const assign = (data) => api.post('/empresa-requisitos', data);
export const bulkAssign = (data) => api.post('/empresa-requisitos/bulk', data);
export const updateAssignment = (id, data) => api.put(`/empresa-requisitos/${id}`, data);
export const removeAssignment = (id) => api.delete(`/empresa-requisitos/${id}`);