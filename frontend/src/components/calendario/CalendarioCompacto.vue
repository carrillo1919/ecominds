<template>
  <div class="calendario-compacto">
    <!-- Encabezado de días abreviados -->
    <div class="calendario-compacto__dias">
      <div v-for="dia in diasSemana" :key="dia" class="calendario-compacto__dia-nombre">
        {{ dia }}
      </div>
    </div>

    <!-- Grid de días -->
    <div class="calendario-compacto__grid">
      <button
        v-for="celda in celdas"
        :key="celda.key"
        type="button"
        class="calendario-compacto__celda"
        :class="{
          'is-hoy': esHoy(celda.fecha),
          'is-vacio': !celda.dia,
          'is-seleccionado': celda.fecha === selectedDate,
        }"
        :disabled="!celda.dia"
        @click="seleccionarDia(celda.fecha)"
      >
        <span class="calendario-compacto__numero">{{ celda.dia || '' }}</span>
        <span v-if="celda.dia && eventosDelDia(celda.fecha).length" class="calendario-compacto__indicadores">
          <span
            v-for="(evento, idx) in eventosDelDia(celda.fecha).slice(0, 3)"
            :key="idx"
            class="calendario-compacto__punto"
            :style="{ backgroundColor: evento.color || 'var(--primary)' }"
          ></span>
        </span>
      </button>
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

const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

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
</script>

<style scoped>
.calendario-compacto { width: 100%; }
.calendario-compacto__dias {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}
.calendario-compacto__dia-nombre {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}
.calendario-compacto__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}
.calendario-compacto__celda {
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.calendario-compacto__celda:disabled {
  background: transparent;
  border-color: transparent;
  cursor: default;
}
.calendario-compacto__celda:not(:disabled):hover {
  background: var(--surface-alt);
  border-color: var(--primary);
}
.calendario-compacto__celda.is-hoy {
  background: var(--success-soft);
  color: var(--success);
  border-color: var(--success);
}
.calendario-compacto__celda.is-seleccionado {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary-strong);
}
.calendario-compacto__indicadores {
  display: flex;
  gap: 0.15rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.calendario-compacto__punto {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
</style>
