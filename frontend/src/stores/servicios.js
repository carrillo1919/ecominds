import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/servicios';

export const useServiciosStore = defineStore('servicios', {
  state: () => ({
    servicios: [],
    servicio: null,
    loading: false,
    error: null,
  }),

  getters: {
    activos: (state) => state.servicios.filter((s) => s.activo),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getServicios(params);
        this.servicios = data.servicios || [];
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los servicios');
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getServicio(id);
        this.servicio = data.servicio;
        return data.servicio;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudo cargar el servicio');
        return null;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createServicio(payload);
        this.servicios.push(data.servicio);
        return { ok: true, servicio: data.servicio, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear el servicio') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateServicio(id, payload);
        const idx = this.servicios.findIndex((s) => s.id === id);
        if (idx !== -1) this.servicios[idx] = data.servicio;
        if (this.servicio?.id === id) this.servicio = data.servicio;
        return { ok: true, servicio: data.servicio, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar el servicio') };
      }
    },

    async remove(id) {
      try {
        const { data } = await api.deleteServicio(id);
        const idx = this.servicios.findIndex((s) => s.id === id);
        if (idx !== -1) this.servicios[idx].activo = false;
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo desactivar el servicio') };
      }
    },
  },
});
