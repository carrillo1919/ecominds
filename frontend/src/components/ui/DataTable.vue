<script setup>
import { computed } from 'vue';
import LoadingState from './LoadingState.vue';
import EmptyState from './EmptyState.vue';

const props = defineProps({
  headers: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'No hay datos disponibles.' },
  emptyTitle: { type: String, default: 'No hay datos' },
  keyField: { type: String, default: 'id' },
});

const hasActions = computed(() => !!props.$slots.actions);
</script>

<template>
  <div class="data-table">
    <LoadingState v-if="loading" :text="emptyText" />

    <template v-else>
      <!-- Vista desktop -->
      <div class="data-table__scroll">
        <table class="data">
          <thead>
            <tr>
              <th v-for="h in headers" :key="h.key" :class="h.class">{{ h.label }}</th>
              <th v-if="hasActions" class="data-table__actions-head"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item[keyField]">
              <td v-for="h in headers" :key="h.key" :data-label="h.label" :class="h.cellClass">
                <slot :name="`cell-${h.key}`" :item="item" :value="item[h.key]">
                  {{ item[h.key] ?? '—' }}
                </slot>
              </td>
              <td v-if="hasActions" class="data-table__actions" data-label="Acciones">
                <slot name="actions" :item="item" />
              </td>
            </tr>
            <tr v-if="!items.length">
              <td :colspan="headers.length + (hasActions ? 1 : 0)" class="data-table__empty">
                {{ emptyText }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vista mobile card-list -->
      <div v-if="items.length" class="data-table__mobile" aria-hidden="true">
        <article v-for="item in items" :key="`${item[keyField]}-card`" class="data-table__card">
          <div v-for="h in headers" :key="`${h.key}-${item[keyField]}`" class="data-table__row">
            <span class="data-table__label">{{ h.label }}</span>
            <span class="data-table__value">
              <slot :name="`cell-${h.key}`" :item="item" :value="item[h.key]">
                {{ item[h.key] ?? '—' }}
              </slot>
            </span>
          </div>
          <div v-if="hasActions" class="data-table__row data-table__row--actions">
            <span class="data-table__label">Acciones</span>
            <span class="data-table__value data-table__value--actions">
              <slot name="actions" :item="item" />
            </span>
          </div>
        </article>
      </div>

      <EmptyState
        v-else
        class="data-table__empty-state"
        :title="emptyTitle"
        :message="emptyText"
      />
    </template>
  </div>
</template>

<style scoped>
.data-table { width: 100%; }
.data-table__scroll { width: 100%; overflow-x: auto; }
.data-table__actions-head { width: 1%; white-space: nowrap; }
.data-table__actions { text-align: right; white-space: nowrap; }
.data-table__actions :deep(.btn-primary),
.data-table__actions :deep(.btn-ghost),
.data-table__actions :deep(.base-button) { margin-left: 0.35rem; }
.data-table__empty { text-align: center; color: var(--text-muted); padding: 1.5rem; }
.data-table__mobile { display: none; }

@media (max-width: 700px) {
  .data-table__scroll { display: none; }
  .data-table__mobile { display: grid; gap: 1rem; }
  .data-table__card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.9rem;
    box-shadow: var(--shadow-sm);
  }
  .data-table__row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--border);
  }
  .data-table__row:last-child { border-bottom: none; }
  .data-table__row--actions { padding-top: 0.75rem; }
  .data-table__label {
    flex: 0 0 auto;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .data-table__value {
    flex: 1 1 auto;
    text-align: right;
    font-size: 0.9rem;
  }
  .data-table__value--actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.35rem; }
}
</style>
