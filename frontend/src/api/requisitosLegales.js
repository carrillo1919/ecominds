import api from './axios.js';

export const getRequisitos = (params = {}) => api.get('/requisitos-legales', { params });
export const getRequisito = (id) => api.get(`/requisitos-legales/${id}`);
export const createRequisito = (data) => api.post('/requisitos-legales', data);
export const updateRequisito = (id, data) => api.put(`/requisitos-legales/${id}`, data);
export const patchRequisito = (id, data) => api.patch(`/requisitos-legales/${id}`, data);
export const deleteRequisito = (id) => api.delete(`/requisitos-legales/${id}`);