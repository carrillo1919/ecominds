import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/documentos';

export const useDocumentosStore = defineStore('documentos', {
  state: () => ({
    documentos: [],
    loading: false,
    error: null,
  }),

  getters: {
    vigentes: (state) => state.documentos.filter((d) => d.estadoEfectivo === 'vigente'),
    vencidos: (state) => state.documentos.filter((d) => d.estadoEfectivo === 'vencido'),
    archivados: (state) => state.documentos.filter((d) => d.estadoEfectivo === 'archivado'),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getDocumentos(params);
        this.documentos = data.documentos;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los documentos');
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createDocumento(payload);
        this.documentos.push(data.documento);
        return { ok: true, documento: data.documento, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear el documento') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateDocumento(id, payload);
        const idx = this.documentos.findIndex((d) => d.id === id);
        if (idx !== -1) this.documentos[idx] = { ...this.documentos[idx], ...data.documento };
        return { ok: true, documento: data.documento, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar el documento') };
      }
    },

    async archivar(id) {
      try {
        const { data } = await api.deleteDocumento(id);
        const idx = this.documentos.findIndex((d) => d.id === id);
        if (idx !== -1) this.documentos[idx] = { ...this.documentos[idx], ...data.documento, estadoEfectivo: 'archivado' };
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo archivar el documento') };
      }
    },

    async uploadArchivo(documentoId, file) {
      try {
        const { data } = await api.uploadArchivo(documentoId, file);
        return { ok: true, archivo: data.archivo, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo subir el archivo') };
      }
    },

    async deleteArchivo(documentoId, archivoId) {
      try {
        const { data } = await api.deleteArchivo(documentoId, archivoId);
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo eliminar el archivo') };
      }
    },
  },
});
