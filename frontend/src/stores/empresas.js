import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/empresas';

export const useEmpresasStore = defineStore('empresas', {
  state: () => ({
    empresas: [],
    empresa: null,
    loading: false,
    error: null,
  }),

  getters: {
    activas: (state) => state.empresas.filter((e) => e.activo),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getEmpresas(params);
        this.empresas = data.empresas;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar las empresas');
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getEmpresa(id);
        this.empresa = data.empresa;
        return data.empresa;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudo cargar la empresa');
        return null;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createEmpresa(payload);
        this.empresas.push(data.empresa);
        return { ok: true, empresa: data.empresa, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear la empresa') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateEmpresa(id, payload);
        const idx = this.empresas.findIndex((e) => e.id === id);
        if (idx !== -1) this.empresas[idx] = data.empresa;
        if (this.empresa?.id === id) this.empresa = data.empresa;
        return { ok: true, empresa: data.empresa, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar la empresa') };
      }
    },

    setEmpresa(empresa) {
      this.empresa = empresa;
    },

    clearEmpresa() {
      this.empresa = null;
    },
  },
});
