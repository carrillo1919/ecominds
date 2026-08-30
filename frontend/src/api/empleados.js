import api from './axios.js';

export const getEmpleados = (params = {}) => api.get('/empleados', { params });
export const getEmpleadosActivos = (params = {}) => api.get('/empleados/activos', { params });
export const getEmpleado = (id) => api.get(`/empleados/${id}`);
export const createEmpleado = (data) => api.post('/empleados', data);
export const updateEmpleado = (id, data) => api.put(`/empleados/${id}`, data);
export const deleteEmpleado = (id) => api.delete(`/empleados/${id}`);
export const asignarUsuarioEmpleado = (id, data) => api.post(`/empleados/${id}/usuario`, data);
