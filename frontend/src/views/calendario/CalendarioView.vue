<template>
  <div class="p-4">
    <PageHeader
      title="Calendario"
      subtitle="Auditorías, documentos, compromisos y notas"
    />

    <div
      class="mt-4 flex flex-col lg:flex-row min-h-[640px] rounded-[var(--radius)] overflow-hidden shadow border border-[var(--border)]"
    >
      <!-- Panel izquierdo: detalle del día -->
      <aside
        class="w-full lg:w-[40%] p-6 lg:p-8 flex flex-col"
        style="background: linear-gradient(180deg, var(--navy-800), var(--primary));"
      >
        <DetalleDia
          :fecha="selectedDate"
          :eventos="eventosDelDiaFiltrados"
          :total-eventos="eventosDelDia.length"
          @nuevo-evento="abrirModalNuevo(selectedDate)"
          @editar-evento="abrirModalEditar"
        />
      </aside>

      <!-- Panel derecho: calendario mensual -->
      <div class="w-full lg:w-[60%] bg-[var(--surface)] p-6 lg:p-8 flex flex-col">
        <!-- Navegación con selects de mes, año y filtros -->
        <div class="flex flex-wrap items-center justify-center gap-3 mb-4">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-[var(--surface-alt)] border border-[var(--border)] rounded-md text-[var(--navy-800)] hover:bg-white hover:border-[var(--primary)] transition-colors"
            @click="cambiarMes(-1)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          <div class="flex items-center gap-2">
            <select
              :value="mesActual"
              class="px-2 py-1.5 text-sm border border-[var(--border)] rounded-md bg-[var(--surface-alt)] text-[var(--navy-800)] hover:border-[var(--primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
              @change="irAMes(anioActual + '-' + String($event.target.value).padStart(2, '0') + '-01')"
            >
              <option v-for="m in meses" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>

            <select
              :value="anioActual"
              class="px-2 py-1.5 text-sm border border-[var(--border)] rounded-md bg-[var(--surface-alt)] text-[var(--navy-800)] hover:border-[var(--primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
              @change="irAMes(Number($event.target.value) + '-' + String(mesActual).padStart(2, '0') + '-01')"
            >
              <option v-for="a in aniosDisponibles" :key="a" :value="a">
                {{ a }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-4 py-1.5 text-sm font-semibold text-white rounded-md transition-colors"
            style="background: linear-gradient(135deg, var(--primary), var(--primary-strong));"
            @click="irHoy"
          >
            Hoy
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-[var(--surface-alt)] border border-[var(--border)] rounded-md text-[var(--navy-800)] hover:bg-white hover:border-[var(--primary)] transition-colors"
            @click="cambiarMes(1)"
          >
            Siguiente
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap items-center justify-center gap-3 mb-4">
          <select
            v-model="filtroTipo"
            class="w-48 px-2 py-1.5 text-sm border border-[var(--border)] rounded-md bg-[var(--surface-alt)] text-[var(--navy-800)] hover:border-[var(--primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
          >
            <option v-for="t in tiposFiltro" :key="t.value" :value="t.value">
              {{ t.label }}
            </option>
          </select>

          <select
            v-model="filtroEmpresa"
            class="w-64 px-2 py-1.5 text-sm border border-[var(--border)] rounded-md bg-[var(--surface-alt)] text-[var(--navy-800)] hover:border-[var(--primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
            :disabled="cargandoEmpresas"
          >
            <option value="todas">Todas las empresas</option>
            <option v-for="emp in empresas" :key="emp.id" :value="emp.nombre">
              {{ emp.nombre }}
            </option>
          </select>
        </div>

        <CalendarioMensual
          :fecha-actual="fechaActual"
          :selected-date="selectedDate"
          :eventos-por-dia="eventosPorDiaFiltrados"
          @seleccionar-dia="seleccionarDia"
          @nuevo-evento="abrirModalNuevo"
        />
      </div>
    </div>

    <ModalEvento
      :visible="modalVisible"
      :fecha="selectedDate"
      :evento="eventoEnEdicion"
      @close="cerrarModal"
      @guardado="onGuardado"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import api from '@/api/axios';
import { useCalendarioStore } from '../../stores/calendario';
import CalendarioMensual from '../../components/calendario/CalendarioMensual.vue';
import DetalleDia from '../../components/calendario/DetalleDia.vue';
import ModalEvento from '../../components/calendario/ModalEvento.vue';
import PageHeader from '../../components/ui/PageHeader.vue';

const toast = useToast();
const calendarioStore = useCalendarioStore();

const fechaActual = ref(inicioDelMes());
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const modalVisible = ref(false);
const eventoEnEdicion = ref(null);

const filtroTipo = ref('todos');
const filtroEmpresa = ref('todas');
const empresas = ref([]);
const cargandoEmpresas = ref(false);

const meses = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const tiposFiltro = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'auditoria', label: 'Auditorías' },
  { value: 'documento', label: 'Documentos' },
  { value: 'compromiso', label: 'Compromisos' },
  { value: 'nota', label: 'Notas' },
];

const anioActual = computed(() => {
  const [anio] = fechaActual.value.split('-').map(Number);
  return anio;
});

const mesActual = computed(() => {
  const [, mes] = fechaActual.value.split('-').map(Number);
  return mes;
});

const aniosDisponibles = computed(() => {
  const actual = new Date().getFullYear();
  const lista = [];
  for (let a = actual - 5; a <= actual + 5; a++) {
    lista.push(a);
  }
  return lista;
});

const eventosPorDia = computed(() => calendarioStore.eventosPorDia);

const eventosPorDiaFiltrados = computed(() => {
  const resultado = {};
  for (const [fecha, eventos] of Object.entries(eventosPorDia.value)) {
    resultado[fecha] = eventos.filter((evento) => {
      const coincideTipo = filtroTipo.value === 'todos' || evento.tipo === filtroTipo.value;
      const coincideEmpresa =
        filtroEmpresa.value === 'todas' || evento.empresa === filtroEmpresa.value;
      return coincideTipo && coincideEmpresa;
    });
  }
  return resultado;
});

const eventosDelDia = computed(() => eventosPorDia.value[selectedDate.value] || []);
const eventosDelDiaFiltrados = computed(
  () => eventosPorDiaFiltrados.value[selectedDate.value] || []
);
const cargando = computed(() => calendarioStore.cargando);

function inicioDelMes() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;
}

function getRangoMes(fecha) {
  const [anio, mes] = fecha.split('-').map(Number);
  const ultimoDia = new Date(anio, mes, 0).getDate();
  return {
    inicio: `${anio}-${String(mes).padStart(2, '0')}-01`,
    fin: `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

async function cargarMes() {
  const { inicio, fin } = getRangoMes(fechaActual.value);
  await calendarioStore.cargarEventos(inicio, fin);
}

async function cargarEmpresas() {
  cargandoEmpresas.value = true;
  try {
    const response = await api.get('/empresas');
    const data = response.data ?? response;
    const lista = Array.isArray(data)
      ? data
      : (data.empresas ?? data.data ?? data.rows ?? []);
    empresas.value = lista;
  } catch (e) {
    toast.error('No se pudieron cargar las empresas para el filtro.');
  } finally {
    cargandoEmpresas.value = false;
  }
}

function cambiarMes(delta) {
  const [anio, mes] = fechaActual.value.split('-').map(Number);
  const d = new Date(anio, mes - 1 + delta, 1);
  fechaActual.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function irAMes(nuevaFecha) {
  fechaActual.value = nuevaFecha;
}

function irHoy() {
  fechaActual.value = inicioDelMes();
  selectedDate.value = new Date().toISOString().slice(0, 10);
}

function seleccionarDia(fecha) {
  selectedDate.value = fecha;
}

function abrirModalNuevo(fecha) {
  eventoEnEdicion.value = null;
  selectedDate.value = fecha;
  modalVisible.value = true;
}

function abrirModalEditar(evento) {
  if (evento.origen !== 'calendario') return;
  eventoEnEdicion.value = evento;
  selectedDate.value = evento.fecha;
  modalVisible.value = true;
}

function cerrarModal() {
  modalVisible.value = false;
  eventoEnEdicion.value = null;
}

async function onGuardado() {
  cerrarModal();
  await cargarMes();
}

onMounted(() => {
  cargarMes();
  cargarEmpresas();
});
watch(fechaActual, cargarMes);
</script>