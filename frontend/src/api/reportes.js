import api from './axios';

export const getDashboardAvanzado = (params = {}) => api.get('/reportes/dashboard', { params });

export const getExportDashboardPdf = (params = {}) => api.get('/reportes/dashboard/export/pdf', {
  params,
  responseType: 'blob',
});

export const getExportDashboardExcel = (params = {}) => api.get('/reportes/dashboard/export/excel', {
  params,
  responseType: 'blob',
});
