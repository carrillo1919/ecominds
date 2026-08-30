<script setup>
const props = defineProps({
  estado: { type: String, required: true },
});
</script>

<template>
  <span
    class="badge-estado"
    :class="{
      'badge-estado--vigente': estado === 'vigente',
      'badge-estado--vencido': estado === 'vencido',
      'badge-estado--archivado': estado === 'archivado',
    }"
  >{{ estado }}</span>
</template>

<style scoped>
.badge-estado {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.badge-estado--vigente  { background: #d1fae5; color: #065f46; }
.badge-estado--vencido  { background: #fee2e2; color: #991b1b; }
.badge-estado--archivado { background: #e5e7eb; color: #374151; }
</style>
