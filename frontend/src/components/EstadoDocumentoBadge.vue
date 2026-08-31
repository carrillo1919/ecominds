<script setup>
const props = defineProps({
  estado: { type: String, default: 'vigente' },
  proximo: { type: Boolean, default: false },
  dias: { type: Number, default: null },
});
</script>

<template>
  <span
    class="estado-badge"
    :class="{
      'estado-vigente': estado === 'vigente' && !proximo,
      'estado-proximo': proximo,
      'estado-vencido': estado === 'vencido',
    }"
  >
    <template v-if="estado === 'vencido'">Vencido</template>
    <template v-else-if="proximo">
      Próximo a vencer
      <span v-if="dias !== null" class="estado-badge__dias">({{ dias }} días)</span>
    </template>
    <template v-else>Vigente</template>
  </span>
</template>

<style scoped>
.estado-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.estado-vigente {
  background: #e8f5e9;
  color: #2e7d32;
}

.estado-proximo {
  background: #fff3e0;
  color: #ef6c00;
}

.estado-vencido {
  background: #ffebee;
  color: #c62828;
}

.estado-badge__dias {
  font-weight: 500;
  text-transform: none;
}
</style>
