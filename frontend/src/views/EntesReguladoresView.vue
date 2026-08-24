<template>
  <section>
    <h2>Entes Reguladores</h2>
    <button @click="cargar">Actualizar</button>
    <SimpleTable :headers="['sigla', 'nombre', 'ambito', 'activo']" :rows="rows" />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import SimpleTable from '../components/SimpleTable.vue';

const rows = ref([]);

async function cargar() {
  const entes = await api.get('/entes-reguladores');
  rows.value = entes.map((e) => ({
    sigla: e.sigla,
    nombre: e.nombre,
    ambito: e.ambito,
    activo: e.activo ? 'Si' : 'No'
  }));
}

onMounted(cargar);
</script>
