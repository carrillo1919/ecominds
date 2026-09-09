<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useFacturasStore } from '@/stores/facturas';
import { useEmpresaServiciosStore } from '@/stores/empresaServicios';
import { useEmpresasStore } from '@/stores/empresas';
import { useAuthorization } from '@/composables/useAuthorization';
import { useAuthStore } from '@/stores/auth';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import CrudModal from '@/components/ui/CrudModal.vue';

const toast = useToast();
const auth = useAuthStore();
const { canGestionarAsignaciones, canVerFacturacion, isResponsable } = useAuthorization();

const facturasStore = useFacturasStore();
const asignacionesStore = useEmpresaServiciosStore();
const empresasStore = useEmpresasStore();

const mostrarModal = ref(false);
const mostrarDetalle = ref(false);
const facturaSeleccionada = ref(null);

const form = reactive({
  empresaId: '',
  asignacionIds: [],
  fechaVencimiento: '',
  notas: '',
});

const headers = [
  { key: 'numero', label: 'Número' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'fechaEmision', label: 'Emisión' },
  { key: 'fechaVencimiento', label: 'Vencimiento' },
  { key: 'total', label: 'Total' },
  { key: 'estado', label: 'Estado' },
];

const empresasFiltradas = computed(() => {
  if (isResponsable.value && auth.user?.empresaId) {
    return empresasStore.empresas.filter((e) => e.id === auth.user.empresaId);
  }
  return empresasStore.empresas;
});

const asignacionesPorEmpresa = computed(() => {
  if (!form.empresaId) return [];
  return asignacionesStore.asignaciones.filter(
    (a) => a.empresaId === form.empresaId && a.estado === 'pendiente' && !a.facturaId
  );
});

const totalSeleccionado = computed(() => {
  return asignacionesPorEmpresa.value
    .filter((a) => form.asignacionIds.includes(a.id))
    .reduce((sum, a) => sum + Number(a.precioTotal), 0)
    .toFixed(2);
});

const abrirGenerar = () => {
  form.empresaId = empresasFiltradas.value.length === 1 ? empresasFiltradas.value[0].id : '';
  form.asignacionIds = [];
  form.fechaVencimiento = '';
  form.notas = '';
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
};

const generar = async () => {
  if (!form.empresaId) {
    toast.error('Debe seleccionar una empresa');
    return;
  }
  if (!form.asignacionIds.length) {
    toast.error('Debe seleccionar al menos una asignación');
    return;
  }

  const result = await facturasStore.create({
    empresaId: form.empresaId,
    asignacionIds: form.asignacionIds,
    fechaVencimiento: form.fechaVencimiento || null,
    notas: form.notas.trim() || undefined,
  });

  if (result.ok) {
    toast.success('Factura generada');
    cerrarModal();
    await Promise.all([facturasStore.fetchAll(), asignacionesStore.fetchAll()]);
  } else {
    toast.error(result.message);
  }
};

const verDetalle = async (factura) => {
  const data = await facturasStore.fetchOne(factura.id);
  if (data) {
    facturaSeleccionada.value = data;
    mostrarDetalle.value = true;
  }
};

const cambiarEstado = async (factura, estado) => {
  const result = await facturasStore.changeEstado(factura.id, estado);
  if (result.ok) {
    toast.success(`Factura ${estado}`);
    await facturasStore.fetchAll();
  } else {
    toast.error(result.message);
  }
};

const anular = async (factura) => {
  if (!confirm('¿Anular esta factura?')) return;
  const result = await facturasStore.remove(factura.id);
  if (result.ok) {
    toast.success('Factura anulada');
    await Promise.all([facturasStore.fetchAll(), asignacionesStore.fetchAll()]);
  } else {
    toast.error(result.message);
  }
};

const labelEstado = (estado) => ({
  borrador: 'Borrador',
  emitida: 'Emitida',
  pagada: 'Pagada',
  anulada: 'Anulada',
}[estado] || estado);

onMounted(async () => {
  await Promise.all([
    facturasStore.fetchAll(),
    asignacionesStore.fetchAll(),
    empresasStore.fetchAll({ activo: true }),
  ]);
});
</script>

<template>
  <section>
    <PageToolbar title="Facturas" subtitle="Facturación de asignaciones pendientes.">
      <template #actions>
        <button v-if="canGestionarAsignaciones" class="btn-primary" type="button" @click="abrirGenerar">
          + Generar factura
        </button>
      </template>
    </PageToolbar>

    <div class="card">
      <div v-if="facturasStore.error" class="alert alert-error">{{ facturasStore.error }}</div>
      <DataTable
        :headers="headers"
        :items="facturasStore.facturas"
        :loading="facturasStore.loading"
        empty-text="Aún no hay facturas registradas."
      >
        <template #cell-empresa="{ item }">
          {{ item.empresa?.nombre || '—' }}
        </template>
        <template #cell-total="{ item }">
          {{ Number(item.total).toFixed(2) }}
        </template>
        <template #cell-estado="{ item }">
          <span class="badge" :class="`badge-${item.estado}`">{{ labelEstado(item.estado) }}</span>
        </template>
        <template #actions="{ item }">
          <button class="btn-ghost btn-sm" type="button" @click="verDetalle(item)">Ver</button>
          <button v-if="canGestionarAsignaciones && item.estado === 'borrador'" class="btn-primary btn-sm" type="button" @click="cambiarEstado(item, 'emitida')">Emitir</button>
          <button v-if="canGestionarAsignaciones && item.estado === 'emitida'" class="btn-primary btn-sm" type="button" @click="cambiarEstado(item, 'pagada')">Marcar pagada</button>
          <button v-if="canGestionarAsignaciones && item.estado !== 'anulada'" class="btn-danger btn-sm" type="button" @click="anular(item)">Anular</button>
        </template>
      </DataTable>
    </div>

    <CrudModal
      :show="mostrarModal"
      title="Generar factura"
      save-label="Generar"
      :saving="facturasStore.loading"
      @close="cerrarModal"
      @save="generar"
    >
      <div class="form-grid">
        <label>Empresa *
          <select v-model="form.empresaId" :disabled="empresasFiltradas.length === 1">
            <option value="">Seleccione...</option>
            <option v-for="emp in empresasFiltradas" :key="emp.id" :value="emp.id">{{ emp.nombre }}</option>
          </select>
        </label>
        <label>Fecha vencimiento<input v-model="form.fechaVencimiento" type="date" /></label>
        <label class="span-2">Notas<textarea v-model="form.notas" rows="2"></textarea></label>
      </div>

      <div v-if="form.empresaId" class="mt-4">
        <h4>Asignaciones pendientes</h4>
        <p v-if="!asignacionesPorEmpresa.length" class="muted">No hay asignaciones pendientes para esta empresa.</p>
        <div v-else class="space-y-2">
          <label v-for="a in asignacionesPorEmpresa" :key="a.id" class="flex items-center gap-2 p-2 border rounded">
            <input v-model="form.asignacionIds" type="checkbox" :value="a.id" />
            <span class="flex-1">{{ a.producto?.nombre || a.servicio?.nombre }} — {{ Number(a.precioTotal).toFixed(2) }}</span>
          </label>
        </div>
        <p class="mt-2 font-semibold">Total seleccionado: {{ totalSeleccionado }}</p>
      </div>
    </CrudModal>

    <CrudModal
      :show="mostrarDetalle"
      title="Detalle de factura"
      save-label="Cerrar"
      :saving="false"
      @close="mostrarDetalle = false"
      @save="mostrarDetalle = false"
    >
      <div v-if="facturaSeleccionada">
        <p><strong>Número:</strong> {{ facturaSeleccionada.numero }}</p>
        <p><strong>Empresa:</strong> {{ facturaSeleccionada.empresa?.nombre }}</p>
        <p><strong>Estado:</strong> {{ labelEstado(facturaSeleccionada.estado) }}</p>
        <p><strong>Subtotal:</strong> {{ Number(facturaSeleccionada.subtotal).toFixed(2) }}</p>
        <p><strong>Impuesto:</strong> {{ Number(facturaSeleccionada.impuesto).toFixed(2) }}</p>
        <p><strong>Total:</strong> {{ Number(facturaSeleccionada.total).toFixed(2) }}</p>
        <p v-if="facturaSeleccionada.notas"><strong>Notas:</strong> {{ facturaSeleccionada.notas }}</p>

        <h4 class="mt-4">Ítems</h4>
        <table class="table">
          <thead>
            <tr><th>Descripción</th><th>Cantidad</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in facturaSeleccionada.items" :key="item.id">
              <td>{{ item.descripcion }}</td>
              <td>{{ Number(item.cantidad).toFixed(2) }}</td>
              <td>{{ Number(item.total).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </CrudModal>
  </section>
</template>
