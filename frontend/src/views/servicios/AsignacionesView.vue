<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useEmpresaServiciosStore } from '@/stores/empresaServicios';
import { useProductosStore } from '@/stores/productos';
import { useServiciosStore } from '@/stores/servicios';
import { useEmpresasStore } from '@/stores/empresas';
import { useAuthorization } from '@/composables/useAuthorization';
import { useAuthStore } from '@/stores/auth';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import CrudModal from '@/components/ui/CrudModal.vue';

const toast = useToast();
const auth = useAuthStore();
const { canGestionarAsignaciones, isResponsable } = useAuthorization();

const asignacionesStore = useEmpresaServiciosStore();
const productosStore = useProductosStore();
const serviciosStore = useServiciosStore();
const empresasStore = useEmpresasStore();

const mostrarModal = ref(false);
const editandoId = ref(null);
const tipo = ref('producto');

const form = reactive({
  empresaId: '',
  productoId: '',
  servicioId: '',
  cantidad: 1,
  precioUnitario: '',
  impuesto: '',
  fechaEjecucion: '',
  fechaEntrega: '',
  observaciones: '',
});

const headers = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'item', label: 'Producto/Servicio' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'precioTotal', label: 'Total' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'estado', label: 'Estado' },
];

const empresasFiltradas = computed(() => {
  if (isResponsable.value && auth.user?.empresaId) {
    return empresasStore.empresas.filter((e) => e.id === auth.user.empresaId);
  }
  return empresasStore.empresas;
});

const itemsDisponibles = computed(() => (tipo.value === 'producto' ? productosStore.activos : serviciosStore.activos));

const itemSeleccionado = computed(() => {
  if (tipo.value === 'producto') return productosStore.activos.find((p) => p.id === form.productoId);
  return serviciosStore.activos.find((s) => s.id === form.servicioId);
});

const modalTitle = computed(() => (editandoId.value ? 'Editar asignación' : 'Nueva asignación'));
const saveLabel = computed(() => (editandoId.value ? 'Guardar cambios' : 'Crear asignación'));

const limpiar = () => {
  editandoId.value = null;
  form.empresaId = empresasFiltradas.value.length === 1 ? empresasFiltradas.value[0].id : '';
  form.productoId = '';
  form.servicioId = '';
  form.cantidad = 1;
  form.precioUnitario = '';
  form.impuesto = '';
  form.fechaEjecucion = '';
  form.fechaEntrega = '';
  form.observaciones = '';
  tipo.value = 'producto';
};

const onTipoChange = () => {
  form.productoId = '';
  form.servicioId = '';
  form.precioUnitario = '';
  form.impuesto = '';
};

const onItemChange = () => {
  const item = itemSeleccionado.value;
  if (item) {
    form.precioUnitario = item.precio;
    form.impuesto = item.impuesto;
  }
};

const abrirCrear = () => {
  limpiar();
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
  limpiar();
};

const editar = (item) => {
  editandoId.value = item.id;
  tipo.value = item.productoId ? 'producto' : 'servicio';
  form.empresaId = item.empresaId;
  form.productoId = item.productoId || '';
  form.servicioId = item.servicioId || '';
  form.cantidad = item.cantidad;
  form.precioUnitario = item.precioUnitario;
  form.impuesto = item.impuesto;
  form.fechaEjecucion = item.fechaEjecucion || '';
  form.fechaEntrega = item.fechaEntrega || '';
  form.observaciones = item.observaciones || '';
  mostrarModal.value = true;
};

const guardar = async () => {
  if (!form.empresaId) {
    toast.error('Debe seleccionar una empresa');
    return;
  }
  if (tipo.value === 'producto' && !form.productoId) {
    toast.error('Debe seleccionar un producto');
    return;
  }
  if (tipo.value === 'servicio' && !form.servicioId) {
    toast.error('Debe seleccionar un servicio');
    return;
  }

  const payload = {
    empresaId: form.empresaId,
    productoId: tipo.value === 'producto' ? form.productoId : null,
    servicioId: tipo.value === 'servicio' ? form.servicioId : null,
    cantidad: Number(form.cantidad) || 1,
    precioUnitario: form.precioUnitario === '' ? 0 : Number(form.precioUnitario),
    impuesto: form.impuesto === '' ? 0 : Number(form.impuesto),
    fechaEjecucion: form.fechaEjecucion || null,
    fechaEntrega: form.fechaEntrega || null,
    observaciones: form.observaciones.trim() || undefined,
  };

  let result;
  if (editandoId.value) {
    result = await asignacionesStore.update(editandoId.value, payload);
  } else {
    result = await asignacionesStore.create(payload);
  }

  if (result.ok) {
    toast.success(editandoId.value ? 'Asignación actualizada' : 'Asignación creada');
    cerrarModal();
    await asignacionesStore.fetchAll();
  } else {
    toast.error(result.message);
  }
};

const cancelar = async (item) => {
  if (!confirm(`¿Cancelar la asignación para ${item.producto?.nombre || item.servicio?.nombre}?`)) return;
  const result = await asignacionesStore.remove(item.id);
  if (result.ok) {
    toast.success('Asignación cancelada');
    await asignacionesStore.fetchAll();
  } else {
    toast.error(result.message);
  }
};

const formatoFecha = (item) => item.fechaEntrega || item.fechaEjecucion || '—';

const getItemLabel = (item) => {
  if (item.producto) return `Producto: ${item.producto.nombre}`;
  if (item.servicio) return `Servicio: ${item.servicio.nombre}`;
  return '—';
};

onMounted(async () => {
  limpiar();
  await Promise.all([
    asignacionesStore.fetchAll(),
    productosStore.fetchAll(),
    serviciosStore.fetchAll(),
    empresasStore.fetchAll({ activo: true }),
  ]);
});
</script>

<template>
  <section>
    <PageToolbar title="Asignaciones" subtitle="Productos y servicios asignados a empresas.">
      <template #actions>
        <button v-if="canGestionarAsignaciones" class="btn-primary" type="button" @click="abrirCrear">
          + Nueva asignación
        </button>
      </template>
    </PageToolbar>

    <div class="card">
      <div v-if="asignacionesStore.error" class="alert alert-error">{{ asignacionesStore.error }}</div>
      <DataTable
        :headers="headers"
        :items="asignacionesStore.asignaciones"
        :loading="asignacionesStore.loading"
        empty-text="Aún no hay asignaciones registradas."
      >
        <template #cell-empresa="{ item }">
          {{ item.empresa?.nombre || '—' }}
        </template>
        <template #cell-item="{ item }">
          {{ getItemLabel(item) }}
        </template>
        <template #cell-precioTotal="{ item }">
          {{ Number(item.precioTotal).toFixed(2) }}
        </template>
        <template #cell-fecha="{ item }">
          {{ formatoFecha(item) }}
        </template>
        <template #cell-estado="{ item }">
          <span class="badge" :class="`badge-${item.estado}`">{{ item.estado }}</span>
        </template>
        <template #actions="{ item }">
          <button v-if="canGestionarAsignaciones && item.estado !== 'cancelado' && item.estado !== 'facturado'" class="btn-ghost btn-sm" type="button" @click="editar(item)">Editar</button>
          <button v-if="canGestionarAsignaciones && item.estado !== 'cancelado' && item.estado !== 'facturado'" class="btn-danger btn-sm" type="button" @click="cancelar(item)">Cancelar</button>
        </template>
      </DataTable>
    </div>

    <CrudModal
      :show="mostrarModal"
      :title="modalTitle"
      :save-label="saveLabel"
      :saving="asignacionesStore.loading"
      @close="cerrarModal"
      @save="guardar"
    >
      <div class="form-grid">
        <label>Empresa *
          <select v-model="form.empresaId" :disabled="empresasFiltradas.length === 1">
            <option value="">Seleccione...</option>
            <option v-for="emp in empresasFiltradas" :key="emp.id" :value="emp.id">{{ emp.nombre }}</option>
          </select>
        </label>

        <label>Tipo *
          <select v-model="tipo" @change="onTipoChange">
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </select>
        </label>

        <label>{{ tipo === 'producto' ? 'Producto' : 'Servicio' }} *
          <select v-model="tipo === 'producto' ? form.productoId : form.servicioId" @change="onItemChange">
            <option value="">Seleccione...</option>
            <option v-for="item in itemsDisponibles" :key="item.id" :value="item.id">{{ item.nombre }} ({{ Number(item.precio).toFixed(2) }})</option>
          </select>
        </label>

        <label>Cantidad *<input v-model="form.cantidad" type="number" step="0.01" min="0" /></label>
        <label>Precio unitario *<input v-model="form.precioUnitario" type="number" step="0.01" min="0" /></label>
        <label>Impuesto %<input v-model="form.impuesto" type="number" step="0.01" min="0" /></label>
        <label>Fecha de ejecución<input v-model="form.fechaEjecucion" type="date" /></label>
        <label>Fecha de entrega<input v-model="form.fechaEntrega" type="date" /></label>
        <label class="span-2">Observaciones<textarea v-model="form.observaciones" rows="3"></textarea></label>
      </div>
    </CrudModal>
  </section>
</template>
