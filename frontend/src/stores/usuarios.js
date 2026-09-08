import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/users';

export const useUsuariosStore = defineStore('usuarios', {
  state: () => ({
    usuarios: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getUsers();
        this.usuarios = data.users;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los usuarios');
      } finally {
        this.loading = false;
      }
    },

    async updateRol(id, rol) {
      try {
        const { data } = await api.updateUserRole(id, rol);
        const idx = this.usuarios.findIndex((u) => u.id === id);
        if (idx !== -1) this.usuarios[idx] = data.user;
        return { ok: true, user: data.user, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar el rol') };
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createUser(payload);
        this.usuarios.unshift(data.user);
        return { ok: true, user: data.user, message: data.message };
      } catch (e) {
        return {
          ok: false,
          message: apiMessage(e, 'No se pudo crear el usuario'),
          errors: e?.response?.data?.errors || [],
        };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateUser(id, payload);
        const idx = this.usuarios.findIndex((u) => u.id === id);
        if (idx !== -1) this.usuarios[idx] = data.user;
        return { ok: true, user: data.user, message: data.message };
      } catch (e) {
        return {
          ok: false,
          message: apiMessage(e, 'No se pudo actualizar el usuario'),
          errors: e?.response?.data?.errors || [],
        };
      }
    },

    async fetchEmpresas(id) {
      try {
        const { data } = await api.getUserEmpresas(id);
        return { ok: true, asignaciones: data.asignaciones || [] };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudieron cargar las empresas asignadas') };
      }
    },

    async assignEmpresas(id, empresaIds) {
      try {
        const { data } = await api.setUserEmpresas(id, empresaIds);
        return { ok: true, asignaciones: data.asignaciones || [], message: data.message };
      } catch (e) {
        return {
          ok: false,
          message: apiMessage(e, 'No se pudieron actualizar las empresas asignadas'),
          errors: e?.response?.data?.errors || [],
        };
      }
    },

    async removeEmpresa(id, empresaId) {
      try {
        const { data } = await api.removeUserEmpresa(id, empresaId);
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo quitar la empresa asignada') };
      }
    },
  },
});
