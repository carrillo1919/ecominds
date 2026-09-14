import api from './axios';

export const getConfiguraciones = (params = {}) => api.get('/configuracion-factura', { params });
export const getConfiguracion = (id) => api.get(`/configuracion-factura/${id}`);
export const createConfiguracion = (data) => api.post('/configuracion-factura', data);
export const updateConfiguracion = (id, data) => api.put(`/configuracion-factura/${id}`, data);
export const deleteConfiguracion = (id) => api.delete(`/configuracion-factura/${id}`);
