import api from './axios';

export const getFacturas = (params = {}) => api.get('/facturas', { params });
export const getFactura = (id) => api.get(`/facturas/${id}`);
export const createFactura = (data) => api.post('/facturas', data);
export const updateFactura = (id, data) => api.put(`/facturas/${id}`, data);
export const changeFacturaEstado = (id, estado) => api.patch(`/facturas/${id}/estado`, { estado });
export const deleteFactura = (id) => api.delete(`/facturas/${id}`);
