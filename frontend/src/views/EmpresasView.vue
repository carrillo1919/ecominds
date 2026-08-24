<template>
  <section>
    <h2>Empresas</h2>
    <button @click="cargar">Actualizar</button>
    <SimpleTable :headers="['nit', 'razonSocial', 'estado', 'requisitosAsignados']" :rows="rows" />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api/client';
import SimpleTable from '../components/SimpleTable.vue';

const rows = ref([]);

async function cargar() {
  const empresas = await api.get('/empresas/with-requisitos/all');
  rows.value = empresas.map((e) => ({
    nit: e.nit,
    razonSocial: e.razonSocial,
    estado: e.estado,
    requisitosAsignados: e.requisitos?.length || 0
  }));
}

onMounted(cargar);
</script>
