<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <div class="form-section">
    <div v-if="title || subtitle" class="form-section__header">
      <h3 v-if="title" class="form-section__title">{{ title }}</h3>
      <p v-if="subtitle" class="form-section__subtitle">{{ subtitle }}</p>
    </div>
    <div class="form-section__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.form-section { margin-bottom: 1rem; }
.form-section__header { margin-bottom: 0.75rem; }
.form-section__title { margin: 0; font-size: 1.05rem; font-weight: 600; color: var(--navy-900); }
.form-section__subtitle { margin: 0.25rem 0 0; color: var(--text-muted); font-size: 0.85rem; }
.form-section__body { display: grid; gap: 0.85rem; }
</style>
