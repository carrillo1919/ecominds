<script setup>
defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});

defineEmits(['click']);
</script>

<template>
  <button
    :type="type"
    class="base-button"
    :class="[`base-button--${variant}`, `base-button--${size}`]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s, opacity 0.2s;
}
.base-button:disabled { cursor: not-allowed; opacity: 0.65; }
.base-button--sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
.base-button--md { padding: 0.625rem 1rem; font-size: 0.9375rem; }
.base-button--lg { padding: 0.75rem 1.25rem; font-size: 1rem; }
.base-button--primary { background: var(--color-primary, #004532); color: #fff; }
.base-button--secondary { background: var(--color-secondary, #0a7c7c); color: #fff; }
.base-button--ghost { background: transparent; color: var(--color-primary, #004532); border-color: currentColor; }
.base-button--danger { background: #b91c1c; color: #fff; }
.base-button:not(:disabled):hover { filter: brightness(1.1); }
.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
