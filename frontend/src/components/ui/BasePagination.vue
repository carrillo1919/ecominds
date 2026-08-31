<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  totalItems: { type: Number, default: 0 },
});

const emit = defineEmits(['update:page']);

const pages = computed(() => Array.from({ length: props.totalPages }, (_, i) => i + 1));

const go = (p) => {
  if (p >= 1 && p <= props.totalPages && p !== props.page) {
    emit('update:page', p);
  }
};
</script>

<template>
  <nav v-if="totalPages > 1" class="base-pagination" aria-label="Paginacion">
    <button type="button" :disabled="page === 1" @click="go(page - 1)">Anterior</button>
    <button
      v-for="p in pages"
      :key="p"
      type="button"
      :class="{ active: p === page }"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button type="button" :disabled="page === totalPages" @click="go(page + 1)">Siguiente</button>
    <span v-if="totalItems" class="base-pagination__info">{{ totalItems }} en total</span>
  </nav>
</template>

<style scoped>
.base-pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.base-pagination button {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  background: #fff;
  border-radius: 0.375rem;
  cursor: pointer;
}
.base-pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.base-pagination button.active { background: var(--color-primary, #004532); color: #fff; border-color: var(--color-primary, #004532); }
.base-pagination__info { color: #6b7280; font-size: 0.875rem; margin-left: auto; }
</style>
