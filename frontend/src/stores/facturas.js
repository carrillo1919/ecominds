import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/facturas';

export const useFacturasStore = defineStore('facturas', {
  state: () => ({
    facturas: [],
    factura: null,
    loading: false,
    error: null,
  }),

  getters: {
    porEstado: (state) => (estado) => state.facturas.filter((f) => f.estado === estado),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getFacturas(params);
        this.facturas = data.facturas || [];
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar las facturas');
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getFactura(id);
        this.factura = data.factura;
        return data.factura;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudo cargar la factura');
        return null;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createFactura(payload);
        this.facturas.unshift(data.factura);
        return { ok: true, factura: data.factura, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo generar la factura') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateFactura(id, payload);
        const idx = this.facturas.findIndex((f) => f.id === id);
        if (idx !== -1) this.facturas[idx] = data.factura;
        if (this.factura?.id === id) this.factura = data.factura;
        return { ok: true, factura: data.factura, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar la factura') };
      }
    },

    async changeEstado(id, estado, datosPago = {}) {
      try {
        const { data } = await api.changeFacturaEstado(id, estado, datosPago);
        const idx = this.facturas.findIndex((f) => f.id === id);
        if (idx !== -1) this.facturas[idx] = data.factura;
        if (this.factura?.id === id) this.factura = data.factura;
        return { ok: true, factura: data.factura, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo cambiar el estado de la factura') };
      }
    },

    async remove(id) {
      try {
        const { data } = await api.deleteFactura(id);
        const idx = this.facturas.findIndex((f) => f.id === id);
        if (idx !== -1) this.facturas[idx].estado = 'anulada';
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo anular la factura') };
      }
    },

    async fetchPdf(id) {
      try {
        const { data } = await api.getFacturaPdf(id);
        return { ok: true, archivo: data };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo cargar el PDF de la factura') };
      }
    },
  },
});
