import api from './axios.js';

export const getAuditorias = (params = {}) => api.get('/auditorias', { params });
export const getAuditoria = (auditoriaId) => {
  return api.get(`/auditorias/${auditoriaId}`);
};
export const createAuditoria = (data) => api.post('/auditorias', data);
export const updateAuditoria = (id, data) => api.patch(`/auditorias/${id}`, data);
export const saveAuditoriaItems = (id, items) => api.put(`/auditorias/${id}/items`, { items });
export const finalizarAuditoria = (id) => api.post(`/auditorias/${id}/finalizar`);
export const deleteAuditoria = (id) => api.delete(`/auditorias/${id}`);
export const getProximasAuditorias = (params = {}) => api.get('/auditorias/proximas', { params });
export const getEstadisticas = (params = {}) => api.get('/auditorias/estadisticas', { params });
export const getInformePdfUrl = (id) => `${api.defaults.baseURL}/auditorias/${id}/informe.pdf`;

