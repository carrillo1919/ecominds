import api from './axios';

export const getAsignaciones = (params = {}) => api.get('/empresa-servicios', { params });
export const createAsignacion = (data) => api.post('/empresa-servicios', data);
export const updateAsignacion = (id, data) => api.put(`/empresa-servicios/${id}`, data);
export const deleteAsignacion = (id) => api.delete(`/empresa-servicios/${id}`);
