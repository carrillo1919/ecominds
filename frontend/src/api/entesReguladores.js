import api from './axios.js';

export const getEntes = (params = {}) => api.get('/entes-reguladores', { params });
export const getEnte = (id) => api.get(`/entes-reguladores/${id}`);
export const createEnte = (data) => api.post('/entes-reguladores', data);
export const updateEnte = (id, data) => api.put(`/entes-reguladores/${id}`, data);
export const deleteEnte = (id) => api.delete(`/entes-reguladores/${id}`);