<script setup>
import { computed } from 'vue';
import { calcularResultado, riesgoClase } from '@/utils/riesgo';

const props = defineProps({
  items: { type: Array, default: () => [] },
});

const resultado = computed(() => calcularResultado(props.items));

const resumenBloques = computed(() => {
  const bloques = [...new Set(props.items.map((i) => i.requisito?.bloque).filter(Boolean))];
  return bloques.map((bloque) => {
    const propios = props.items.filter((i) => i.requisito?.bloque === bloque);
    return { bloque, ...calcularResultado(propios) };
  });
});
</script>

<template>
  <div class="audit-risk-matrix">
    <div class="kpi-grid">
      <div class="kpi">
        <span class="kpi__label">% Cumplimiento</span>
        <strong class="kpi__value">{{ resultado.porcentajeCumplimiento }}%</strong>
        <span class="muted">{{ resultado.totalCumple }} de {{ resultado.aplicables }} aplicables</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">% No cumplimiento</span>
        <strong class="kpi__value">{{ resultado.porcentajeNoCumplimiento }}%</strong>
        <span class="muted">{{ resultado.totalNoCumple }} incumplimientos</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">No aplica (N/A)</span>
        <strong class="kpi__value">{{ resultado.totalNoAplica }}</strong>
        <span class="muted">{{ resultado.totalSinEvaluar }} sin evaluar</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">Matriz de riesgo</span>
        <strong class="kpi__value"><span :class="riesgoClase(resultado.nivelRiesgo)">{{ resultado.nivelRiesgo }}</span></strong>
        <span class="muted" v-if="resultado.riesgoEscalado">
          Elevado desde {{ resultado.nivelBase }} por {{ resultado.hallazgosCriticos.length }} hallazgo(s) critico(s)
        </span>
        <span class="muted" v-else>Bajo &lt;15% &middot; Medio 15-29,9% &middot; Alto &ge;30%</span>
      </div>
    </div>

    <div class="card" style="margin-top: 1rem;">
      <h2>Cumplimiento por bloque</h2>
      <div v-for="b in resumenBloques" :key="b.bloque" class="bar-row">
        <span class="bar-row__label">{{ b.bloque }}</span>
        <span class="bar">
          <span class="bar__fill" :style="{ width: `${b.porcentajeCumplimiento}%` }"></span>
        </span>
        <span class="bar-row__value">{{ b.porcentajeCumplimiento }}%</span>
        <span :class="riesgoClase(b.nivelRiesgo)">{{ b.nivelRiesgo }}</span>
      </div>
      <p v-if="!resumenBloques.length" class="muted">Sin items para evaluar.</p>
    </div>
  </div>
</template>

<style scoped>
.audit-risk-matrix { width: 100%; }
</style>
