import { defineStore } from 'pinia';
import { apiMessage } from '@/api/axios';
import * as api from '@/api/productos';

export const useProductosStore = defineStore('productos', {
  state: () => ({
    productos: [],
    producto: null,
    loading: false,
    error: null,
  }),

  getters: {
    activos: (state) => state.productos.filter((p) => p.activo),
  },

  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getProductos(params);
        this.productos = data.productos || [];
      } catch (e) {
        this.error = apiMessage(e, 'No se pudieron cargar los productos');
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.getProducto(id);
        this.producto = data.producto;
        return data.producto;
      } catch (e) {
        this.error = apiMessage(e, 'No se pudo cargar el producto');
        return null;
      } finally {
        this.loading = false;
      }
    },

    async create(payload) {
      try {
        const { data } = await api.createProducto(payload);
        this.productos.push(data.producto);
        return { ok: true, producto: data.producto, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo crear el producto') };
      }
    },

    async update(id, payload) {
      try {
        const { data } = await api.updateProducto(id, payload);
        const idx = this.productos.findIndex((p) => p.id === id);
        if (idx !== -1) this.productos[idx] = data.producto;
        if (this.producto?.id === id) this.producto = data.producto;
        return { ok: true, producto: data.producto, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo actualizar el producto') };
      }
    },

    async remove(id) {
      try {
        const { data } = await api.deleteProducto(id);
        const idx = this.productos.findIndex((p) => p.id === id);
        if (idx !== -1) this.productos[idx].activo = false;
        return { ok: true, message: data.message };
      } catch (e) {
        return { ok: false, message: apiMessage(e, 'No se pudo desactivar el producto') };
      }
    },
  },
});
