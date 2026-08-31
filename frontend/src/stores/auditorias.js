import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/auditorias';

export const useAuditoriasStore = defineStore('auditorias', {
  state: () => ({
    auditorias: [],
    auditoria: null,
    proximas: [],
    estadisticas: null,
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    finalizadas: (state) => state.auditorias.filter((a) => a.estado === 'finalizada'),
    borradores: (state) => state.auditorias.filter((a) => a.estado === 'borrador'),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getAuditorias(params);
        this.auditorias = data.auditorias;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar las auditorías');
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getAuditoria(id);
        this.auditoria = data.auditoria;
        return data.auditoria;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudo cargar la auditoría');
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchProximas(params = {}) {
      try {
        const { data } = await api.getProximasAuditorias(params);
        this.proximas = data.alertas || [];
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar las próximas auditorías');
      }
    },

    async fetchEstadisticas(params = {}) {
      try {
        const { data } = await api.getEstadisticas(params);
        this.estadisticas = data;
        return data;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar las estadísticas');
        return null;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createAuditoria(payload);
        this.auditorias.unshift(data.auditoria);
        return { ok: true, auditoria: data.auditoria, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear la auditoría') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateAuditoria(id, payload);
        const idx = this.auditorias.findIndex((a) => a.id === id);
        if (idx !== -1) this.auditorias[idx] = data.auditoria;
        if (this.auditoria?.id === id) {
          // El PATCH no devuelve items: conservar los que ya teníamos
          this.auditoria = { ...this.auditoria, ...data.auditoria };
        }
        return { ok: true, auditoria: data.auditoria, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar la auditoría') };
      }
    },

    async saveItems(id, items) {
      this.saving = true;
      try {
        const { data } = await api.saveAuditoriaItems(id, items);
        if (data.auditoria && this.auditoria?.id === id) {
          this.auditoria = data.auditoria;
        }
        return { ok: true, auditoria: data.auditoria, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudieron guardar los items') };
      } finally {
        this.saving = false;
      }
    },

    async finalizar(id) {
      this.saving = true;
      try {
        const { data } = await api.finalizarAuditoria(id);
        const idx = this.auditorias.findIndex((a) => a.id === id);
        if (idx !== -1) this.auditorias[idx] = data.auditoria;
        if (this.auditoria?.id === id) this.auditoria = data.auditoria;
        return { ok: true, auditoria: data.auditoria, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo finalizar la auditoría') };
      } finally {
        this.saving = false;
      }
    },

    async remove(id) {
      try {
        const { data } = await api.deleteAuditoria(id);
        this.auditorias = this.auditorias.filter((a) => a.id !== id);
        if (this.auditoria?.id === id) this.auditoria = null;
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo eliminar la auditoría') };
      }
    },

    getInformePdfUrl(id) {
      return api.getInformePdfUrl(id);
    },
  },
});
