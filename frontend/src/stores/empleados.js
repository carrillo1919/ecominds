import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/empleados';

export const useEmpleadosStore = defineStore('empleados', {
  state: () => ({
    empleados: [],
    empleadosActivos: [],
    loading: false,
    error: null,
  }),

  getters: {
    activos: (state) => state.empleados.filter((e) => e.activo),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getEmpleados(params);
        this.empleados = data.empleados;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los empleados');
      } finally {
        this.loading = false;
      }
    },

    async fetchActivos(params = {}) {
      try {
        const { data } = await api.getEmpleadosActivos(params);
        this.empleadosActivos = data.empleados;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los empleados activos');
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createEmpleado(payload);
        this.empleados.push(data.empleado);
        return { ok: true, empleado: data.empleado, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear el empleado') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateEmpleado(id, payload);
        const idx = this.empleados.findIndex((e) => e.id === id);
        if (idx !== -1) this.empleados[idx] = data.empleado;
        return { ok: true, empleado: data.empleado, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar el empleado') };
      }
    },

    async darDeBaja(id) {
      try {
        const { data } = await api.deleteEmpleado(id);
        const idx = this.empleados.findIndex((e) => e.id === id);
        if (idx !== -1) this.empleados[idx] = data.empleado;
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo dar de baja al empleado') };
      }
    },

    async asignarUsuario(id, payload) {
      try {
        const { data } = await api.asignarUsuarioEmpleado(id, payload);
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear el usuario') };
      }
    },
  },
});
