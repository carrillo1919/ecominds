import api from './axios';

export const getEventos = (fechaInicio, fechaFin) =>
  api.get('/calendario/eventos', { params: { fechaInicio, fechaFin } });

export const crearEvento = (payload) =>
  api.post('/calendario/eventos', payload);

export const actualizarEvento = (id, payload) =>
  api.put(`/calendario/eventos/${id}`, payload);

export const eliminarEvento = (id) =>
  api.delete(`/calendario/eventos/${id}`);

export const crearAuditoria = (payload) =>
  api.post('/calendario/auditorias', payload);

export default {
  getEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  crearAuditoria,
};