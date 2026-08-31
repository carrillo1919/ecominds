import api from './axios.js';

export const getDocumentos = (params = {}) => api.get('/documentos', { params });
export const getDocumento = (id) => api.get(`/documentos/${id}`);
export const createDocumento = (data) => api.post('/documentos', data);
export const updateDocumento = (id, data) => api.put(`/documentos/${id}`, data);
export const deleteDocumento = (id) => api.delete(`/documentos/${id}`);

export const uploadArchivo = (documentoId, file) => {
  const form = new FormData();
  form.append('archivo', file);
  return api.post(`/documentos/${documentoId}/archivos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteArchivo = (documentoId, archivoId) =>
  api.delete(`/documentos/${documentoId}/archivos/${archivoId}`);

export const getArchivoDownloadUrl = (documentoId, archivoId) =>
  `${api.defaults.baseURL}/documentos/${documentoId}/archivos/${archivoId}/download`;

export const previewArchivo = (documentoId, archivoId) => {
  return api.get(`/documentos/${documentoId}/archivos/${archivoId}/preview`, {
    responseType: 'blob',
  });
};
