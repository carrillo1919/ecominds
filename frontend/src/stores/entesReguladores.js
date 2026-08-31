import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/entesReguladores';

export const useEntesReguladoresStore = defineStore('entesReguladores', {
  state: () => ({
    entes: [],
    ente: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getEntes(params);
        this.entes = data.entes;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los entes reguladores');
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createEnte(payload);
        this.entes.unshift(data.ente);
        return { ok: true, ente: data.ente, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear el ente regulador') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateEnte(id, payload);
        const idx = this.entes.findIndex((e) => e.id === id);
        if (idx !== -1) this.entes[idx] = data.ente;
        if (this.ente?.id === id) this.ente = data.ente;
        return { ok: true, ente: data.ente, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar el ente regulador') };
      }
    },

    async remove(id) {
      try {
        const { data } = await api.deleteEnte(id);
        this.entes = this.entes.filter((e) => e.id !== id);
        if (this.ente?.id === id) this.ente = null;
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo eliminar el ente regulador') };
      }
    },
  },
});
