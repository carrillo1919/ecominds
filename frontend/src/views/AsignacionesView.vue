<template>
  <section>
    <h2>Asignaciones Empresa-Requisito</h2>
    <button @click="cargar">Actualizar</button>
    <SimpleTable :headers="['empresa', 'nit', 'requisito', 'fechaAsignacion', 'observaciones']" :rows="rows" />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import SimpleTable from '../components/SimpleTable.vue';

const rows = ref([]);

async function cargar() {
  const asignaciones = await api.get('/empresa-requisitos');
  rows.value = asignaciones.map((a) => ({
    empresa: a.empresa?.razonSocial || '-',
    nit: a.empresa?.nit || '-',
    requisito: a.requisito?.codigo || '-',
    fechaAsignacion: a.fechaAsignacion,
    observaciones: a.observaciones || '-'
  }));
}

onMounted(cargar);
</script>
