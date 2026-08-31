<script setup>
defineProps({
  text: { type: String, default: 'Cargando...' },
});
</script>

<template>
  <div class="loading-state">
    <span class="spinner" aria-hidden="true"></span>
    <span v-if="text" class="loading-state__text">{{ text }}</span>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #6b7280;
}
.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid #e5e7eb;
  border-top-color: var(--color-primary, #004532);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state__text { font-size: 0.9375rem; }
</style>
