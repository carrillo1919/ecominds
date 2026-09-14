import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/configuracionFactura';

export const useConfiguracionFacturaStore = defineStore('configuracionFactura', {
  state: () => ({
    configuraciones: [],
    loading: false,
    error: null,
  }),

  getters: {
    impuestos: (state) => state.configuraciones.filter((c) => c.tipo === 'impuesto'),
    descuentos: (state) => state.configuraciones.filter((c) => c.tipo === 'descuento'),
    impuestosActivos: (state) => state.configuraciones.filter((c) => c.tipo === 'impuesto' && c.activo),
    descuentosActivos: (state) => state.configuraciones.filter((c) => c.tipo === 'descuento' && c.activo),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getConfiguraciones(params);
        this.configuraciones = data.configuraciones || [];
        return { ok: true };
      } catch (e) {
        this.error = apiMessage(e, 'No se pudo cargar la configuración de factura');
        return { ok: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createConfiguracion(payload);
        this.configuraciones.push(data.configuracion);
        this.ordenar();
        return { ok: true, configuracion: data.configuracion, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear la configuración') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateConfiguracion(id, payload);
        const idx = this.configuraciones.findIndex((c) => c.id === id);
        if (idx !== -1) this.configuraciones[idx] = data.configuracion;
        this.ordenar();
        return { ok: true, configuracion: data.configuracion, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar la configuración') };
      }
    },

    async remove(id) {
      try {
        const { data } = await api.deleteConfiguracion(id);
        const idx = this.configuraciones.findIndex((c) => c.id === id);
        if (idx !== -1) this.configuraciones[idx].activo = false;
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo desactivar la configuración') };
      }
    },

    ordenar() {
      this.configuraciones.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
    },
  },
});

export default useConfiguracionFacturaStore;
