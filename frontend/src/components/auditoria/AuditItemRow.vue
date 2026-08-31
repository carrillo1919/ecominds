<script setup>
import { ESTADOS } from '@/utils/riesgo';

defineProps({
  item: { type: Object, required: true },
  editable: { type: Boolean, default: false },
  empleados: { type: Array, default: () => [] },
});
</script>

<template>
  <tr class="audit-item-row">
    <td data-label="Codigo">
      <strong>{{ item.requisito?.codigo }}</strong>
      <span v-if="item.requisito?.critico" class="pill pill--danger">Critico</span>
      <span class="muted"><br />{{ item.requisito?.bloque }}</span>
    </td>
    <td data-label="Requisito">
      {{ item.requisito?.requisito }}
      <span class="muted" v-if="item.requisito?.baseLegal"><br />{{ item.requisito.baseLegal }}</span>
    </td>
    <td data-label="Estado">
      <select v-model="item.estado" :disabled="!editable">
        <option :value="null">Sin evaluar</option>
        <option v-for="e in ESTADOS" :key="e.valor" :value="e.valor">{{ e.label }}</option>
      </select>
    </td>
    <td data-label="Observaciones / hallazgo">
      <textarea v-model="item.observaciones" rows="2" :disabled="!editable"></textarea>
    </td>
    <td data-label="Accion correctiva (CAPA)">
      <textarea
        v-model="item.accionCorrectiva"
        rows="2"
        :disabled="!editable || item.estado !== 'no_cumple'"
        :placeholder="item.estado === 'no_cumple' ? 'Accion correctiva' : 'Solo para No cumple'"
      ></textarea>
      <select
        v-model="item.responsableAccionId"
        :disabled="!editable || item.estado !== 'no_cumple'"
      >
        <option value="">— Seleccione responsable —</option>
        <option v-for="emp in empleados" :key="emp.id" :value="emp.id">
          {{ emp.apellido }}, {{ emp.nombre }}
        </option>
      </select>
      <input
        v-model="item.fechaCompromiso"
        type="date"
        :disabled="!editable || item.estado !== 'no_cumple'"
      />
    </td>
  </tr>
</template>

<style scoped>
.audit-item-row td { vertical-align: top; }
.audit-item-row select,
.audit-item-row textarea,
.audit-item-row input { width: 100%; margin-bottom: 0.25rem; }
</style>
