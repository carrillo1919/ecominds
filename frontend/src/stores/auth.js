import { defineStore } from 'pinia';
import api, { apiMessage } from '@/api/axios';

const TOKEN_KEY = 'srcd_token';
const USER_KEY = 'srcd_user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    rol: (state) => state.user?.rol || null,
    nombreCompleto: (state) => (state.user ? `${state.user.nombre} ${state.user.apellido}` : ''),
  },

  actions: {
    restore() {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);

      if (!token) return;

      this.token = token;
      try {
        this.user = raw ? JSON.parse(raw) : null;
      } catch {
        this.user = null;
      }
    },

    persist(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    async register(userData) {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/register', userData);
        return { ok: true, message: data.message };
      } catch (error) {
        return { ok: false, message: apiMessage(error, 'No se pudo completar el registro') };
      } finally {
        this.loading = false;
      }
    },

    async login(credentials) {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/login', credentials);
        this.persist(data.token, data.user);
        return { ok: true, user: data.user };
      } catch (error) {
        return { ok: false, message: apiMessage(error, 'No se pudo iniciar sesion') };
      } finally {
        this.loading = false;
      }
    },

    async fetchUser() {
      if (!this.token) return null;

      try {
        const { data } = await api.get('/users/me');
        this.user = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      } catch {
        return null;
      }
    },

    async verifyEmail(token) {
      try {
        const { data } = await api.get('/auth/verify-email', { params: { token } });
        return { ok: true, message: data.message };
      } catch (error) {
        return { ok: false, message: apiMessage(error, 'No se pudo verificar la cuenta') };
      }
    },

    async forgotPassword(email) {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/forgot-password', { email });
        return { ok: true, message: data.message };
      } catch (error) {
        return { ok: false, message: apiMessage(error, 'No se pudo enviar el correo') };
      } finally {
        this.loading = false;
      }
    },

    async resetPassword(payload) {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/reset-password', payload);
        return { ok: true, message: data.message };
      } catch (error) {
        return { ok: false, message: apiMessage(error, 'No se pudo actualizar la contrasena') };
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});
