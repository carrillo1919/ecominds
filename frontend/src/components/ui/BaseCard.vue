<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <div class="base-card">
    <div v-if="title || $slots.header" class="base-card__header">
      <slot name="header">
        <div>
          <h2 v-if="title" class="base-card__title">{{ title }}</h2>
          <p v-if="subtitle" class="base-card__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
    </div>
    <div class="base-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.base-card {
  background: #fff;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.base-card__header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.base-card__title { font-size: 1.125rem; font-weight: 600; margin: 0; }
.base-card__subtitle { color: #6b7280; font-size: 0.875rem; margin: 0.25rem 0 0; }
.base-card__body { padding: 1.25rem; }
.base-card__footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>
