import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as requisitosLegalesApi from '@/api/requisitosLegales';
import * as empresaRequisitosApi from '@/api/empresaRequisitos';

export const useRequisitosStore = defineStore('requisitos', {
  state: () => ({
    requisitos: [],
    requisito: null,
    asignadas: [],
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    porCategoria: (state) => {
      const grouped = {};
      state.requisitos.forEach((r) => {
        const key = r.categoria || 'Sin categoría';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      return grouped;
    },
    criticos: (state) => state.requisitos.filter((r) => r.criticidad === 'alta'),
  },

  actions: {
    async fetchRequisitosLegales(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await requisitosLegalesApi.getRequisitos(params);
        this.requisitos = data.requisitos;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los requisitos legales');
      } finally {
        this.loading = false;
      }
    },

    async fetchRequisitoLegal(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await requisitosLegalesApi.getRequisito(id);
        this.requisito = data.requisito;
        return data.requisito;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudo cargar el requisito legal');
        return null;
      } finally {
        this.loading = false;
      }
    },

    async createRequisitoLegal(payload) {
      try {
        const { data } = await requisitosLegalesApi.createRequisito(payload);
        this.requisitos.unshift(data.requisito);
        return { ok: true, requisito: data.requisito, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear el requisito legal') };
      }
    },

    async updateRequisitoLegal(id, payload) {
      try {
        const { data } = await requisitosLegalesApi.updateRequisito(id, payload);
        const idx = this.requisitos.findIndex((r) => r.id === id);
        if (idx !== -1) this.requisitos[idx] = data.requisito;
        if (this.requisito?.id === id) this.requisito = data.requisito;
        return { ok: true, requisito: data.requisito, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar el requisito legal') };
      }
    },

    async patchRequisitoLegal(id, payload) {
      try {
        const { data } = await requisitosLegalesApi.patchRequisito(id, payload);
        const idx = this.requisitos.findIndex((r) => r.id === id);
        if (idx !== -1) this.requisitos[idx] = { ...this.requisitos[idx], ...data.requisito };
        if (this.requisito?.id === id) this.requisito = { ...this.requisito, ...data.requisito };
        return { ok: true, requisito: data.requisito, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar la configuración') };
      }
    },

    async deleteRequisitoLegal(id) {
      try {
        const { data } = await requisitosLegalesApi.deleteRequisito(id);
        this.requisitos = this.requisitos.filter((r) => r.id !== id);
        if (this.requisito?.id === id) this.requisito = null;
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo eliminar el requisito legal') };
      }
    },

    async fetchAsignadasPorEmpresa(empresaId) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await empresaRequisitosApi.getByEmpresa(empresaId);
        this.asignadas = data.empresaRequisitos;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar las asignaciones');
      } finally {
        this.loading = false;
      }
    },

    async asignarRequisitos(payload) {
      this.saving = true;
      try {
        const { data } = await empresaRequisitosApi.bulkAssign(payload);
        this.asignadas.push(...data.empresaRequisitos);
        return { ok: true, asignadas: data.empresaRequisitos, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudieron asignar los requisitos') };
      } finally {
        this.saving = false;
      }
    },

    async quitarAsignacion(id) {
      try {
        const { data } = await empresaRequisitosApi.removeAssignment(id);
        this.asignadas = this.asignadas.filter((a) => a.id !== id);
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo quitar la asignación') };
      }
    },
  },
});
