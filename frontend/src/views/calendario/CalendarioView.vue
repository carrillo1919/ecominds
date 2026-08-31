 <template>
  <div class="p-4">
    <PageHeader
      title="Calendario"
      subtitle="Auditorías, documentos, compromisos y notas"
    />

    <div class="flex flex-col lg:flex-row gap-4 mt-4">
      <div class="flex-1">
        <div class="flex items-center justify-between mb-2">
          <button
            type="button"
            class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            @click="cambiarMes(-1)"
          >
            ← Anterior
          </button>
          <button
            type="button"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            @click="irHoy"
          >
            Hoy
          </button>
          <button
            type="button"
            class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            @click="cambiarMes(1)"
          >
            Siguiente →
          </button>
        </div>

        <CalendarioMensual
          :fecha-actual="fechaActual"
          :eventos-por-dia="eventosPorDia"
          @seleccionar-dia="seleccionarDia"
          @nuevo-evento="abrirModalNuevo"
          @cambiar-mes="cambiarMes"
        />
      </div>

      <aside class="w-full lg:w-80">
        <DetalleDia
          :fecha="selectedDate"
          :eventos="eventosDelDia"
          @nuevo-evento="abrirModalNuevo(selectedDate)"
          @editar-evento="abrirModalEditar"
        />
      </aside>
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
import { useCalendarioStore } from '../../stores/calendario';
import CalendarioMensual from '../../components/calendario/CalendarioMensual.vue';
import DetalleDia from '../../components/calendario/DetalleDia.vue';
import ModalEvento from '../../components/calendario/ModalEvento.vue';
import PageHeader from '../../components/ui/PageHeader.vue';

const calendarioStore = useCalendarioStore();

const fechaActual = ref(inicioDelMes());
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const modalVisible = ref(false);
const eventoEnEdicion = ref(null);

const eventosPorDia = computed(() => calendarioStore.eventosPorDia);
const eventosDelDia = computed(() => eventosPorDia.value[selectedDate.value] || []);
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

function cambiarMes(delta) {
  const [anio, mes] = fechaActual.value.split('-').map(Number);
  const d = new Date(anio, mes - 1 + delta, 1);
  fechaActual.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
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

onMounted(cargarMes);
watch(fechaActual, cargarMes);
</script>