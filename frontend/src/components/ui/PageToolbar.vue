<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <header class="page-toolbar">
    <div class="page-toolbar__copy">
      <h1 class="page-toolbar__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-toolbar__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-toolbar__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.page-toolbar__title { margin: 0; font-size: 1.6rem; font-weight: 700; color: var(--navy-900); }
.page-toolbar__subtitle { margin: 0.25rem 0 0; color: var(--text-muted); font-size: 0.9375rem; }
.page-toolbar__actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

@media (max-width: 700px) {
  .page-toolbar { flex-direction: column; }
  .page-toolbar__actions { width: 100%; }
  .page-toolbar__actions :deep(.btn-primary),
  .page-toolbar__actions :deep(.btn-ghost) { flex: 1 1 auto; justify-content: center; }
}
</style>
