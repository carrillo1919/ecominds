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
        const { data } = await api.updateUserRole(id, { rol });
        const idx = this.usuarios.findIndex((u) => u.id === id);
        if (idx !== -1) this.usuarios[idx] = data.user;
        return { ok: true, user: data.user, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar el rol') };
      }
    },
  },
});
