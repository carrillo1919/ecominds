import api from './axios';

export const getNotificacionConfigs = () => api.get('/notificaciones/config');
export const updateNotificacionConfig = (id, data) => api.put(`/notificaciones/config/${id}`, data);