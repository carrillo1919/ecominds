<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useReportesStore } from '@/stores/reportes';
import { useEmpresasStore } from '@/stores/empresas';
import { useAuthorization } from '@/composables/useAuthorization';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';

const toast = useToast();
const reportesStore = useReportesStore();
const empresasStore = useEmpresasStore();
const { rol, isAdmin } = useAuthorization();

const COLUMNAS_STORAGE_KEY = 'dashboard-avanzado-columnas';
// Subir la version agrega las columnas nuevas a las preferencias guardadas.
const COLUMNAS_VERSION = 3;

const filtros = reactive({
  empresaId: '',
  desde: '',
  hasta: '',
  estados: ['borrador', 'emitida', 'pagada', 'anulada'],
  tipo: 'todos',
  search: '',
  page: 1,
  limit: 20,
  sortBy: 'fechaEmision',
  sortDir: 'desc',
});

const todasColumnas = [
  { key: 'numero', label: 'Número' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'fechaEmision', label: 'Emisión' },
  { key: 'fechaPago', label: 'Pago' },
  { key: 'estado', label: 'Estado' },
  { key: 'tipoItems', label: 'Tipo' },
  { key: 'descripcionItems', label: 'Descripción ítems' },
  { key: 'cantidadItems', label: 'Líneas' },
  { key: 'cantidadTotal', label: 'Cantidad ítems' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'descuento', label: 'Descuento' },
  { key: 'impuesto', label: 'Impuesto' },
  { key: 'total', label: 'Total' },
  { key: 'deuda', label: 'Deuda' },
];

const columnasItemsDetalle = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'numero', label: 'Factura' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'fechaEmision', label: 'Emisión' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'unidadMedida', label: 'Unidad' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'descuento', label: 'Descuento' },
  { key: 'impuesto', label: 'Impuesto' },
  { key: 'total', label: 'Total' },
];

const columnasVisibles = ref([...todasColumnas.map((c) => c.key)]);

const headers = computed(() => todasColumnas.filter((c) => columnasVisibles.value.includes(c.key)));

// Solo el admin puede consultar sin empresa; el auditor con empresas asignadas y el empleado deben elegirla.
const empresaRequerida = computed(() => !isAdmin.value
  && ['auditor', 'responsable'].includes(rol.value)
  && empresasStore.empresas.length > 0);

const faltaEmpresa = () => empresaRequerida.value && !filtros.empresaId;

const paramsActuales = computed(() => {
  const params = {
    ...filtros,
    estados: filtros.estados.join(','),
    columns: columnasVisibles.value.join(','),
  };
  // Los filtros vacios (empresa, fechas, busqueda) no se envian.
  return Object.fromEntries(
    Object.entries(params).filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined),
  );
});

const numero = (valor) => Number(valor || 0).toFixed(2);

const cargar = async ({ avisar = false } = {}) => {
  if (faltaEmpresa()) {
    if (avisar) toast.info('Seleccione una empresa para consultar el dashboard.');
    return;
  }
  await reportesStore.fetchDashboard(paramsActuales.value);
};

const guardarColumnasPreferidas = () => {
  localStorage.setItem(COLUMNAS_STORAGE_KEY, JSON.stringify({ v: COLUMNAS_VERSION, columnas: columnasVisibles.value }));
};

const restaurarColumnasPreferidas = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(COLUMNAS_STORAGE_KEY) || 'null');
    const guardadas = Array.isArray(raw) ? raw : raw?.columnas;
    if (!Array.isArray(guardadas) || !guardadas.length) return;

    const validas = guardadas.filter((c) => todasColumnas.some((col) => col.key === c));
    const version = Array.isArray(raw) ? 0 : Number(raw?.v) || 0;
    const nuevas = version >= COLUMNAS_VERSION
      ? []
      : todasColumnas.filter((c) => !validas.includes(c.key)).map((c) => c.key);

    columnasVisibles.value = [...validas, ...nuevas];
    if (nuevas.length) guardarColumnasPreferidas();
  } catch {
    // Preferencia invalida: se conservan las columnas por defecto.
  }
};

const alternarColumna = (key) => {
  if (columnasVisibles.value.includes(key)) {
    if (columnasVisibles.value.length === 1) return;
    columnasVisibles.value = columnasVisibles.value.filter((c) => c !== key);
  } else {
    columnasVisibles.value = [...columnasVisibles.value, key];
  }
  guardarColumnasPreferidas();
  cargar();
};

const descargar = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
};

const validarExportacion = () => {
  if (!faltaEmpresa()) return true;
  toast.error('Seleccione una empresa para generar el reporte.');
  return false;
};

const exportarPdf = async () => {
  if (!validarExportacion()) return;
  const result = await reportesStore.exportPdf(paramsActuales.value);
  if (!result.ok) {
    toast.error(result.message);
    return;
  }
  descargar(result.archivo, 'dashboard-avanzado.pdf');
};

const exportarExcel = async () => {
  if (!validarExportacion()) return;
  const result = await reportesStore.exportExcel(paramsActuales.value);
  if (!result.ok) {
    toast.error(result.message);
    return;
  }
  descargar(result.archivo, 'dashboard-avanzado.xls');
};

const data = computed(() => reportesStore.data);
const tablaItems = computed(() => data.value?.tablaFacturas?.items || []);
const detalleItems = computed(() => data.value?.detalleItems || []);

const resumenVacio = () => ({ items: 0, cantidad: 0, subtotal: 0, descuento: 0, impuesto: 0, total: 0 });
const resumenItems = computed(() => data.value?.resumenItems || {
  todos: resumenVacio(),
  producto: resumenVacio(),
  servicio: resumenVacio(),
});

const filasResumenItems = computed(() => [
  { grupo: 'Total', ...resumenItems.value.todos },
  { grupo: 'Productos', ...resumenItems.value.producto },
  { grupo: 'Servicios', ...resumenItems.value.servicio },
]);

onMounted(async () => {
  restaurarColumnasPreferidas();
  await empresasStore.fetchAll({ activo: true });
  if (empresaRequerida.value && empresasStore.empresas.length === 1) {
    filtros.empresaId = empresasStore.empresas[0].id;
  }
  await cargar({ avisar: true });
});
</script>

<template>
  <section>
    <PageToolbar title="Dashboard avanzado" subtitle="KPIs, estados de factura, ítems (productos y servicios), ingresos por fecha de pago y empleados.">
      <template #actions>
        <button class="btn-ghost" type="button" :disabled="faltaEmpresa()" @click="exportarPdf">Exportar PDF</button>
        <button class="btn-primary" type="button" :disabled="faltaEmpresa()" @click="exportarExcel">Exportar Excel</button>
      </template>
    </PageToolbar>

    <div class="card">
      <div class="form-grid">
        <label>Empresa <span v-if="empresaRequerida">*</span>
          <select v-model="filtros.empresaId" :required="empresaRequerida" @change="cargar({ avisar: true })">
            <option value="">{{ empresaRequerida ? 'Seleccione una empresa' : 'Todas' }}</option>
            <option v-for="emp in empresasStore.empresas" :key="emp.id" :value="emp.id">{{ emp.nombre }}</option>
          </select>
        </label>
        <label>Desde (opcional)<input v-model="filtros.desde" type="date" @change="cargar" /></label>
        <label>Hasta (opcional)<input v-model="filtros.hasta" type="date" @change="cargar" /></label>
        <label>Tipo
          <select v-model="filtros.tipo" @change="cargar">
            <option value="todos">Todos</option>
            <option value="producto">Productos</option>
            <option value="servicio">Servicios</option>
          </select>
        </label>
        <label>Buscar<input v-model="filtros.search" type="text" @change="cargar" /></label>
      </div>

      <p v-if="faltaEmpresa()" class="error-text">La empresa es obligatoria para este usuario.</p>

      <div class="mt-4 flex gap-3 flex-wrap">
        <label v-for="col in todasColumnas" :key="col.key" class="col-toggle">
          <input type="checkbox" :checked="columnasVisibles.includes(col.key)" @change="alternarColumna(col.key)" />
          {{ col.label }}
        </label>
      </div>
    </div>

    <div v-if="reportesStore.error" class="alert alert-error">{{ reportesStore.error }}</div>

    <div v-if="data" class="kpi-grid">
      <div class="kpi"><span class="kpi__label">Facturas</span><strong class="kpi__value">{{ data.kpis.totalFacturas }}</strong></div>
      <div class="kpi"><span class="kpi__label">Facturado sin impuesto</span><strong class="kpi__value">{{ numero(data.kpis.totalFacturadoSinImpuesto) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Descuentos</span><strong class="kpi__value">{{ numero(data.kpis.totalDescuentos) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Impuestos</span><strong class="kpi__value">{{ numero(data.kpis.totalImpuestos) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Facturado con impuesto</span><strong class="kpi__value">{{ numero(data.kpis.totalFacturado) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Deuda</span><strong class="kpi__value">{{ numero(data.kpis.deudaTotal) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Ingresos (fecha pago)</span><strong class="kpi__value">{{ numero(data.kpis.ingresos) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Empleados</span><strong class="kpi__value">{{ data.kpis.totalEmpleados }}</strong></div>
      <div class="kpi"><span class="kpi__label">Cumplimiento prom.</span><strong class="kpi__value">{{ numero(data.kpis.promedioCumplimiento) }}%</strong></div>
    </div>

    <div class="card" v-if="data">
      <h2>Distribución por estado de factura</h2>
      <div class="bar-row" v-for="(v, estado) in data.distribucionFacturas" :key="estado">
        <span class="bar-row__label">{{ estado }}</span>
        <span class="bar-row__value">{{ v.cantidad }} · {{ numero(v.monto) }}</span>
      </div>
    </div>

    <div class="card" v-if="data">
      <h2>Resumen de ítems por tipo</h2>
      <p class="muted">Líneas y montos por tipo de ítem (productos y servicios) de todas las facturas filtradas.</p>
      <div class="table-scroll">
        <table class="data">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Ítems</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th>Descuento</th>
              <th>Impuesto</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in filasResumenItems" :key="fila.grupo">
              <td data-label="Grupo">{{ fila.grupo }}</td>
              <td data-label="Ítems">{{ fila.items }}</td>
              <td data-label="Cantidad">{{ fila.cantidad }}</td>
              <td data-label="Subtotal">{{ numero(fila.subtotal) }}</td>
              <td data-label="Descuento">{{ numero(fila.descuento) }}</td>
              <td data-label="Impuesto">{{ numero(fila.impuesto) }}</td>
              <td data-label="Total">{{ numero(fila.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <DataTable
        :headers="headers"
        :items="tablaItems"
        :loading="reportesStore.loading"
        empty-text="Sin datos para los filtros actuales."
      >
        <template #cell-subtotal="{ item }">{{ numero(item.subtotal) }}</template>
        <template #cell-descuento="{ item }">{{ numero(item.descuento) }}</template>
        <template #cell-impuesto="{ item }">{{ numero(item.impuesto) }}</template>
        <template #cell-total="{ item }">{{ numero(item.total) }}</template>
        <template #cell-deuda="{ item }">{{ numero(item.deuda) }}</template>
      </DataTable>
    </div>

    <div class="card" v-if="data">
      <h2>Detalle de ítems</h2>
      <p class="muted">Descripción, cantidad, unidad y montos con y sin impuesto de cada ítem de las facturas filtradas.</p>
      <DataTable
        :headers="columnasItemsDetalle"
        :items="detalleItems"
        :loading="reportesStore.loading"
        empty-text="Sin ítems para los filtros actuales."
      >
        <template #cell-cantidad="{ item }">{{ numero(item.cantidad) }} {{ item.unidadMedida || '' }}</template>
        <template #cell-unidadMedida="{ item }">{{ item.unidadMedida || '—' }}</template>
        <template #cell-subtotal="{ item }">{{ numero(item.subtotal) }}</template>
        <template #cell-descuento="{ item }">{{ numero(item.descuento) }}</template>
        <template #cell-impuesto="{ item }">{{ numero(item.impuesto) }}</template>
        <template #cell-total="{ item }">{{ numero(item.total) }}</template>
      </DataTable>
    </div>
  </section>
</template>

<style scoped>
.col-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
}
</style>