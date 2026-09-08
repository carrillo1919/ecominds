import { defineStore } from 'pinia';
import api, { apiMessage, setCsrfToken } from '@/api/axios';

const USER_KEY = 'srcd_user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    rol: (state) => state.user?.rol || null,
    nombreCompleto: (state) => (state.user ? `${state.user.nombre} ${state.user.apellido}` : ''),
  },

  actions: {
    restore() {
      const raw = localStorage.getItem(USER_KEY);
      try {
        this.user = raw ? JSON.parse(raw) : null;
      } catch {
        this.user = null;
      }
    },

    persist(user) {
      this.user = user;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    async fetchCsrfToken() {
      try {
        const { data } = await api.get('/csrf-token');
        setCsrfToken(data.csrfToken);
      } catch {
        setCsrfToken('');
      }
    },

    async register(userData) {
      this.loading = true;
      try {
        await this.fetchCsrfToken();
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
        await this.fetchCsrfToken();
        const { data } = await api.post('/auth/login', credentials);
        this.persist(data.user);
        return { ok: true, user: data.user };
      } catch (error) {
        return { ok: false, message: apiMessage(error, 'No se pudo iniciar sesion') };
      } finally {
        this.loading = false;
      }
    },

    async fetchUser() {
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
        await this.fetchCsrfToken();
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
        await this.fetchCsrfToken();
        const { data } = await api.post('/auth/reset-password', payload);
        return { ok: true, message: data.message };
      } catch (error) {
        return { ok: false, message: apiMessage(error, 'No se pudo actualizar la contrasena') };
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await this.fetchCsrfToken();
        await api.post('/auth/logout');
      } catch {
        // ignorar errores de red en logout
      }
      this.user = null;
      localStorage.removeItem(USER_KEY);
    },
  },
});
