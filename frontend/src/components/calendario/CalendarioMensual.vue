<!-- filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\frontend\src\components\calendario\CalendarioMensual.vue -->
<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <!-- Encabezado de días de la semana -->
    <div class="grid grid-cols-7 border-b border-[var(--border)]">
      <div
        v-for="dia in diasSemana"
        :key="dia"
        class="py-2 text-center text-sm font-semibold text-[var(--primary)] bg-[var(--surface-alt)] border-r border-[var(--border)] last:border-r-0"
      >
        {{ dia }}
      </div>
    </div>

    <!-- Grid de días -->
    <div
      class="grid grid-cols-7 auto-rows-fr border border-[var(--border)] divide-x divide-y divide-[var(--border)]"
    >
      <div
        v-for="celda in celdas"
        :key="celda.key"
        class="min-h-[110px] p-2 bg-white cursor-pointer hover:bg-[var(--surface-alt)] transition-colors flex flex-col"
        :class="
          [
            esHoy(celda.fecha) ? 'bg-[var(--success-soft)]' : '',
            !celda.dia ? 'bg-[var(--surface-alt)]/50' : '',
          ]"
        @click="seleccionarDia(celda.fecha)"
      >
        <!-- Número del día + botón agregar -->
        <div class="flex justify-between items-start mb-1">
          <span
            class="text-sm font-medium"
            :class="
              [
                esHoy(celda.fecha) ? 'text-[var(--success)] font-bold' : 'text-[var(--text)]',
                !celda.dia ? 'text-[var(--border)]' : '',
              ]"
          >
            {{ celda.dia || '' }}
          </span>
          <button
            v-if="celda.dia"
            type="button"
            class="w-5 h-5 flex items-center justify-center text-xs rounded hover:bg-[var(--primary)] hover:text-white text-[var(--text-muted)] transition-colors"
            @click.stop="$emit('nuevo-evento', celda.fecha)"
          >
            +
          </button>
        </div>

        <!-- Lista de eventos del día -->
        <div v-if="celda.dia" class="flex flex-col gap-1 flex-1 overflow-hidden">
          <div
            v-for="evento in eventosDelDia(celda.fecha).slice(0, 4)"
            :key="evento.id"
            class="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate text-white shadow-sm"
            :style="{ backgroundColor: evento.color || 'var(--navy-600)' }"
            :title="tooltipEvento(evento)"
          >
            {{ textoEvento(evento) }}
          </div>
          <div
            v-if="eventosDelDia(celda.fecha).length > 4"
            class="text-[10px] text-[var(--text-muted)] mt-auto"
          >
            +{{ eventosDelDia(celda.fecha).length - 4 }} más
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
  selectedDate: { type: String, default: null },
  eventosPorDia: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['seleccionar-dia', 'nuevo-evento']);

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const celdas = computed(() => {
  const [anio, mes] = props.fechaActual.split('-').map(Number);
  const offset = new Date(anio, mes - 1, 1).getDay();
  const totalDias = new Date(anio, mes, 0).getDate();
  const lista = [];

  for (let i = 0; i < offset; i++) {
    lista.push({ dia: null, fecha: null, key: `vacio-${i}` });
  }

  for (let d = 1; d <= totalDias; d++) {
    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    lista.push({ dia: d, fecha, key: fecha });
  }

  // Rellenar hasta completar la última semana.
  const resto = lista.length % 7;
  if (resto > 0) {
    for (let i = 0; i < 7 - resto; i++) {
      lista.push({ dia: null, fecha: null, key: `fin-${i}` });
    }
  }

  return lista;
});

const eventosDelDia = (fecha) => (fecha ? props.eventosPorDia[fecha] || [] : []);

const esHoy = (fecha) => {
  if (!fecha) return false;
  return fecha === new Date().toISOString().slice(0, 10);
};

const seleccionarDia = (fecha) => {
  if (fecha) emit('seleccionar-dia', fecha);
};

const textoEvento = (evento) => {
  if (evento.tipo === 'compromiso' && evento.empresa) {
    return `Compromiso - ${evento.empresa}`;
  }
  return evento.titulo;
};

const tooltipEvento = (evento) => {
  if (evento.tipo === 'compromiso' && evento.empresa) {
    return `Compromiso - ${evento.empresa}`;
  }
  if (evento.empresa) {
    return `${evento.titulo} — ${evento.empresa}`;
  }
  return evento.titulo;
};
</script>