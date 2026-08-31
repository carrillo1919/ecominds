<!-- filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\frontend\src\components\calendario\CalendarioMensual.vue -->
<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="flex items-center justify-between p-4 border-b">
      <h2 class="text-lg font-semibold text-gray-800">{{ tituloMes }}</h2>
    </div>

    <div class="grid grid-cols-7 border-b bg-gray-50">
      <div
        v-for="dia in diasSemana"
        :key="dia"
        class="py-2 text-center text-sm font-medium text-gray-500"
      >
        {{ dia }}
      </div>
    </div>

    <div class="grid grid-cols-7">
      <div
        v-for="celda in celdas"
        :key="celda.key"
        class="min-h-[100px] border p-1 cursor-pointer hover:bg-gray-50"
        :class="esHoy(celda.fecha) ? 'bg-blue-50' : ''"
        @click="seleccionarDia(celda.fecha)"
      >
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-700">{{ celda.dia || '' }}</span>
          <button
            v-if="celda.dia"
            type="button"
            class="text-xs text-gray-400 hover:text-gray-700"
            @click.stop="$emit('nuevo-evento', celda.fecha)"
          >
            +
          </button>
        </div>

        <div v-if="celda.dia" class="mt-1 space-y-1">
          <div
            v-for="evento in eventosDelDia(celda.fecha).slice(0, 3)"
            :key="evento.id"
            class="text-xs px-1 py-0.5 rounded truncate text-white"
            :style="{ backgroundColor: evento.color || '#6b7280' }"
            :title="evento.empresa ? `${evento.titulo} — ${evento.empresa}` : evento.titulo"
          >
            {{ evento.titulo }}
          </div>
          <div
            v-if="eventosDelDia(celda.fecha).length > 3"
            class="text-xs text-gray-500"
          >
            +{{ eventosDelDia(celda.fecha).length - 3 }} más
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  fechaActual: { type: String, required: true },
  eventosPorDia: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['seleccionar-dia', 'nuevo-evento', 'cambiar-mes']);

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const celdas = computed(() => {
  const [anio, mes] = props.fechaActual.split('-').map(Number);
  const offset = new Date(anio, mes - 1, 1).getDay();
  const totalDias = new Date(anio, mes, 0).getDate();
  const lista = [];

  // Celdas vacías antes del primer día del mes.
  for (let i = 0; i < offset; i++) {
    lista.push({ dia: null, fecha: null, key: `vacio-${i}` });
  }

  // Días reales del mes.
  for (let d = 1; d <= totalDias; d++) {
    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    lista.push({ dia: d, fecha, key: fecha });
  }

  return lista;
});

const tituloMes = computed(() => {
  const [anio, mes] = props.fechaActual.split('-').map(Number);
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${meses[mes - 1]} ${anio}`;
});

const eventosDelDia = (fecha) => (fecha ? props.eventosPorDia[fecha] || [] : []);

const esHoy = (fecha) => {
  if (!fecha) return false;
  return fecha === new Date().toISOString().slice(0, 10);
};

const seleccionarDia = (fecha) => {
  if (fecha) emit('seleccionar-dia', fecha);
};
</script>