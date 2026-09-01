import { defineStore } from 'pinia';
import api from '@/api/axios';

export const useCalendarioStore = defineStore('calendario', {
  state: () => ({
    eventos: [],
    cargando: false,
    error: null,
    fechaActual: new Date().toISOString().slice(0, 10),
    rango: { inicio: '', fin: '' },
  }),

  getters: {
    eventosPorDia: (state) => {
      const porDia = {};
      for (const evento of state.eventos) {
        if (!porDia[evento.fecha]) porDia[evento.fecha] = [];
        porDia[evento.fecha].push(evento);
      }
      return porDia;
    },
  },

  actions: {
    async cargarEventos(fechaInicio, fechaFin) {
      this.cargando = true;
      this.error = null;
      try {
        const response = await api.get('/calendario/eventos', {
          params: { inicio: fechaInicio, fin: fechaFin },
        });
        this.eventos = response.data?.eventos ?? [];
        this.rango = { inicio: fechaInicio, fin: fechaFin };
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      } finally {
        this.cargando = false;
      }
    },

    async crearEvento(payload) {
      const response = await api.post('/calendario/eventos', payload);
      return response.data;
    },

    async actualizarEvento(id, payload) {
      const response = await api.put(`/calendario/eventos/${id}`, payload);
      return response.data;
    },

    async eliminarEvento(id) {
      await api.delete(`/calendario/eventos/${id}`);
      this.eventos = this.eventos.filter((e) => e.id !== id && e.entidadId !== id);
    },
  },
});