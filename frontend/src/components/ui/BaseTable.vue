<script setup>
defineProps({
  headers: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'No hay datos disponibles.' },
  keyField: { type: String, default: 'id' },
});
</script>

<template>
  <div class="table-scroll">
    <table class="data base-table">
      <thead>
        <tr>
          <th v-for="h in headers" :key="h.key">{{ h.label }}</th>
          <th v-if="$slots.actions" class="base-table__actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item[keyField]">
          <td v-for="h in headers" :key="h.key">
            <slot :name="`cell-${h.key}`" :item="item" :value="item[h.key]">
              {{ item[h.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="base-table__actions">
            <slot name="actions" :item="item" />
          </td>
        </tr>
        <tr v-if="!loading && !items.length">
          <td :colspan="headers.length + ($slots.actions ? 1 : 0)" class="base-table__empty">
            {{ emptyText }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-scroll { overflow-x: auto; }
.base-table { width: 100%; border-collapse: collapse; }
.base-table th,
.base-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--color-border, #e5e7eb); }
.base-table th { font-weight: 600; background: #f9fafb; font-size: 0.875rem; }
.base-table__actions { text-align: right; white-space: nowrap; }
.base-table__empty { text-align: center; color: #6b7280; padding: 1.5rem; }
</style>
