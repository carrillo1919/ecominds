import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/reportes';

export const useReportesStore = defineStore('reportes', {
  state: () => ({
    data: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchDashboard(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getDashboardAvanzado(params);
        this.data = data;
        return data;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los reportes');
        return null;
      } finally {
        this.loading = false;
      }
    },

    async exportPdf(params = {}) {
      try {
        const { data } = await api.getExportDashboardPdf(params);
        return { ok: true, archivo: data };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo exportar el PDF') };
      }
    },

    async exportExcel(params = {}) {
      try {
        const { data } = await api.getExportDashboardExcel(params);
        return { ok: true, archivo: data };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo exportar Excel') };
      }
    },
  },
});
