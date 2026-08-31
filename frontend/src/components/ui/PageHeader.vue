<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <header class="page-header">
    <div class="page-header__content">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.page-header__title { margin: 0; font-size: 1.5rem; font-weight: 700; }
.page-header__subtitle { margin: 0.25rem 0 0; color: #6b7280; font-size: 0.9375rem; }
.page-header__actions { display: flex; gap: 0.75rem; }
</style>
