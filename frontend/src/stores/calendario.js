import { defineStore } from 'pinia';
import {
  getEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  crearAuditoria,
} from '../api/calendario';

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
        const response = await getEventos(fechaInicio, fechaFin);
        this.eventos = response.eventos ?? response.data?.eventos ?? [];
        this.rango = { inicio: fechaInicio, fin: fechaFin };
      } catch (error) {
        this.error = error.response?.data?.message || error.message;
        throw error;
      } finally {
        this.cargando = false;
      }
    },

    async crearEvento(payload) {
      const response = await crearEvento(payload);
      const evento = response.data ?? response;
      this.eventos.push(evento);
      return evento;
    },

    async actualizarEvento(id, payload) {
      const response = await actualizarEvento(id, payload);
      const actualizado = response.data ?? response;
      const index = this.eventos.findIndex((e) => e.id === id || e.entidadId === id);
      if (index !== -1) this.eventos[index] = actualizado;
      return actualizado;
    },

    async eliminarEvento(id) {
      await eliminarEvento(id);
      this.eventos = this.eventos.filter((e) => e.id !== id && e.entidadId !== id);
    },

    async crearAuditoria(payload) {
      const response = await crearAuditoria(payload);
      return response.data ?? response;
    },
  },
});