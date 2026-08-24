<template>
  <section>
    <h2>Requisitos Legales</h2>
    <button @click="cargar">Actualizar</button>
    <SimpleTable :headers="['codigo', 'titulo', 'categoria', 'periodicidad', 'criticidad', 'ente']" :rows="rows" />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import SimpleTable from '../components/SimpleTable.vue';

const rows = ref([]);

async function cargar() {
  const requisitos = await api.get('/requisitos-legales');
  rows.value = requisitos.map((r) => ({
    codigo: r.codigo,
    titulo: r.titulo,
    categoria: r.categoria,
    periodicidad: r.periodicidad,
    criticidad: r.criticidad,
    ente: r.ente?.sigla || '-'
  }));
}

onMounted(cargar);
</script>
