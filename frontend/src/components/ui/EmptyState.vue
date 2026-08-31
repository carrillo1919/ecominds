<script setup>
defineProps({
  title: { type: String, default: 'No hay datos' },
  message: { type: String, default: 'Aun no se ha registrado informacion.' },
});
</script>

<template>
  <div class="empty-state">
    <span class="empty-state__icon" aria-hidden="true">inbox</span>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p class="empty-state__message">{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #6b7280;
}
.empty-state__icon {
  font-family: 'Material Symbols Outlined', sans-serif;
  font-size: 3rem;
  line-height: 1;
}
.empty-state__title { margin: 0.75rem 0 0.25rem; font-size: 1.125rem; color: #374151; }
.empty-state__message { margin: 0; font-size: 0.9375rem; }
</style>
