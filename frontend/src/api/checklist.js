import api from './axios.js';

export const getChecklist = (params = {}) => api.get('/requisitos', { params });
export const createChecklistItem = (data) => api.post('/requisitos', data);
export const updateChecklistItem = (id, data) => api.put(`/requisitos/${id}`, data);
export const patchChecklistItem = (id, data) => api.patch(`/requisitos/${id}`, data);
