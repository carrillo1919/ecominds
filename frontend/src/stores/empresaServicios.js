import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/empresaServicios';

export const useEmpresaServiciosStore = defineStore('empresaServicios', {
  state: () => ({
    asignaciones: [],
    asignacion: null,
    loading: false,
    error: null,
  }),

  getters: {
    pendientes: (state) => state.asignaciones.filter((a) => a.estado === 'pendiente'),
    facturables: (state) => state.asignaciones.filter((a) => a.estado === 'pendiente' && !a.facturaId),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getAsignaciones(params);
        this.asignaciones = data.asignaciones || [];
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar las asignaciones');
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createAsignacion(payload);
        this.asignaciones.unshift(data.asignacion);
        return { ok: true, asignacion: data.asignacion, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear la asignación') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateAsignacion(id, payload);
        const idx = this.asignaciones.findIndex((a) => a.id === id);
        if (idx !== -1) this.asignaciones[idx] = data.asignacion;
        if (this.asignacion?.id === id) this.asignacion = data.asignacion;
        return { ok: true, asignacion: data.asignacion, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar la asignación') };
      }
    },

    async remove(id) {
      try {
        const { data } = await api.deleteAsignacion(id);
        const idx = this.asignaciones.findIndex((a) => a.id === id);
        if (idx !== -1) this.asignaciones[idx].estado = 'cancelado';
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo cancelar la asignación') };
      }
    },
  },
});
