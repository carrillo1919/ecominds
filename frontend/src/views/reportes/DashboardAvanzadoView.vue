<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useReportesStore } from '@/stores/reportes';
import { useEmpresasStore } from '@/stores/empresas';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';

const toast = useToast();
const reportesStore = useReportesStore();
const empresasStore = useEmpresasStore();

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
  { key: 'total', label: 'Total' },
  { key: 'deuda', label: 'Deuda' },
  { key: 'tipoItems', label: 'Tipo' },
  { key: 'cantidadItems', label: 'Ítems' },
];

const columnasVisibles = ref([...todasColumnas.map((c) => c.key)]);

const headers = computed(() => todasColumnas.filter((c) => columnasVisibles.value.includes(c.key)));

const paramsActuales = computed(() => {
  const params = {
    ...filtros,
    estados: filtros.estados.join(','),
    columns: columnasVisibles.value.join(','),
  };

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== ''),
  );
});

const cargar = async () => {
  await reportesStore.fetchDashboard(paramsActuales.value);
};

const alternarColumna = (key) => {
  if (columnasVisibles.value.includes(key)) {
    if (columnasVisibles.value.length === 1) return;
    columnasVisibles.value = columnasVisibles.value.filter((c) => c !== key);
  } else {
    columnasVisibles.value = [...columnasVisibles.value, key];
  }
  localStorage.setItem('dashboard-avanzado-columnas', JSON.stringify(columnasVisibles.value));
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

const exportarPdf = async () => {
  const result = await reportesStore.exportPdf(paramsActuales.value);
  if (!result.ok) {
    toast.error(result.message);
    return;
  }
  descargar(result.archivo, 'dashboard-avanzado.pdf');
};

const exportarExcel = async () => {
  const result = await reportesStore.exportExcel(paramsActuales.value);
  if (!result.ok) {
    toast.error(result.message);
    return;
  }
  descargar(result.archivo, 'dashboard-avanzado.xls');
};

const data = computed(() => reportesStore.data);
const tablaItems = computed(() => data.value?.tablaFacturas?.items || []);

onMounted(async () => {
  try {
    const saved = JSON.parse(localStorage.getItem('dashboard-avanzado-columnas') || '[]');
    if (Array.isArray(saved) && saved.length) {
      columnasVisibles.value = saved.filter((c) => todasColumnas.some((col) => col.key === c));
    }
  } catch {
    // noop
  }
  await empresasStore.fetchAll({ activo: true });
  await cargar();
});
</script>

<template>
  <section>
    <PageToolbar title="Dashboard avanzado" subtitle="KPIs, estados de factura, ingresos por fecha de pago y empleados.">
      <template #actions>
        <button class="btn-ghost" type="button" @click="exportarPdf">Exportar PDF</button>
        <button class="btn-primary" type="button" @click="exportarExcel">Exportar Excel</button>
      </template>
    </PageToolbar>

    <div class="card">
      <div class="form-grid">
        <label>Empresa
          <select v-model="filtros.empresaId" @change="cargar">
            <option value="">Todas</option>
            <option v-for="emp in empresasStore.empresas" :key="emp.id" :value="emp.id">{{ emp.nombre }}</option>
          </select>
        </label>
        <label>Desde<input v-model="filtros.desde" type="date" @change="cargar" /></label>
        <label>Hasta<input v-model="filtros.hasta" type="date" @change="cargar" /></label>
        <label>Tipo
          <select v-model="filtros.tipo" @change="cargar">
            <option value="todos">Todos</option>
            <option value="producto">Productos</option>
            <option value="servicio">Servicios</option>
          </select>
        </label>
        <label>Buscar<input v-model="filtros.search" type="text" @change="cargar" /></label>
      </div>

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
      <div class="kpi"><span class="kpi__label">Facturado</span><strong class="kpi__value">{{ Number(data.kpis.totalFacturado).toFixed(2) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Deuda</span><strong class="kpi__value">{{ Number(data.kpis.deudaTotal).toFixed(2) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Ingresos (fecha pago)</span><strong class="kpi__value">{{ Number(data.kpis.ingresos).toFixed(2) }}</strong></div>
      <div class="kpi"><span class="kpi__label">Empleados</span><strong class="kpi__value">{{ data.kpis.totalEmpleados }}</strong></div>
      <div class="kpi"><span class="kpi__label">Cumplimiento prom.</span><strong class="kpi__value">{{ Number(data.kpis.promedioCumplimiento).toFixed(2) }}%</strong></div>
    </div>

    <div class="card" v-if="data">
      <h2>Distribución por estado de factura</h2>
      <div class="bar-row" v-for="(v, estado) in data.distribucionFacturas" :key="estado">
        <span class="bar-row__label">{{ estado }}</span>
        <span class="bar-row__value">{{ v.cantidad }} · {{ Number(v.monto).toFixed(2) }}</span>
      </div>
    </div>

    <div class="card">
      <DataTable
        :headers="headers"
        :items="tablaItems"
        :loading="reportesStore.loading"
        empty-text="Sin datos para los filtros actuales."
      />
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
