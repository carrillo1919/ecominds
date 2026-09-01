<script setup>
import { computed } from 'vue';
import { ESTADOS } from '@/utils/riesgo';

const props = defineProps({
  item: { type: Object, required: true },
  editable: { type: Boolean, default: false },
  empleados: { type: Array, default: () => [] },
});

const esNoCumple = computed(() => props.item.estado === 'no_cumple');
const fechaRequerida = computed(() => esNoCumple.value && props.editable);
const fechaInvalida = computed(() => esNoCumple.value && props.editable && !props.item.fechaCompromiso);
</script>

<template>
  <article class="checklist-item">
    <!-- Código -->
    <div class="cell cell-codigo">
      <span class="cell-label">Código</span>
      <div>
        <strong>{{ item.requisito?.codigo }}</strong>
        <span v-if="item.requisito?.critico" class="pill pill--danger">Crítico</span>
        <span class="muted cell-sub">{{ item.requisito?.bloque }}</span>
      </div>
    </div>

    <!-- Requisito -->
    <div class="cell cell-requisito">
      <span class="cell-label">Requisito</span>
      <div>
        <p class="cell-text">{{ item.requisito?.requisito }}</p>
        <p v-if="item.requisito?.baseLegal" class="muted cell-sub">{{ item.requisito.baseLegal }}</p>
      </div>
    </div>

    <!-- Estado -->
    <div class="cell cell-estado">
      <span class="cell-label">Estado</span>
      <select v-model="item.estado" :disabled="!editable" class="input">
        <option :value="null">Sin evaluar</option>
        <option v-for="e in ESTADOS" :key="e.valor" :value="e.valor">{{ e.label }}</option>
      </select>
    </div>

    <!-- Observaciones -->
    <div class="cell cell-observaciones">
      <span class="cell-label">Observaciones / Hallazgo</span>
      <textarea
        v-model="item.observaciones"
        rows="4"
        :disabled="!editable"
        class="input textarea-observaciones"
        placeholder="Describa el hallazgo..."
      ></textarea>
    </div>

    <!-- CAPA -->
    <div class="cell cell-capa">
      <span class="cell-label">Acción correctiva (CAPA)</span>
      <textarea
        v-model="item.accionCorrectiva"
        rows="5"
        :disabled="!editable || !esNoCumple"
        class="input"
        :placeholder="esNoCumple ? 'Acción correctiva' : 'Solo para No cumple'"
      ></textarea>

      <div class="capa-grid">
        <div class="capa-campo">
          <label class="capa-label" :class="{ requerido: esNoCumple }">Responsable</label>
          <select
            v-model="item.responsableAccionId"
            :disabled="!editable || !esNoCumple"
            class="input"
          >
            <option value="">— Seleccione —</option>
            <option v-for="emp in empleados" :key="emp.id" :value="emp.id">
              {{ emp.apellido }}, {{ emp.nombre }}
            </option>
          </select>
        </div>

        <div class="capa-campo">
          <label class="capa-label" :class="{ requerido: fechaRequerida }">
            Fecha compromiso
          </label>
          <input
            v-model="item.fechaCompromiso"
            type="date"
            :disabled="!editable || !esNoCumple"
            class="input"
            :class="{ 'input-error': fechaInvalida }"
            :required="fechaRequerida"
          />
          <span v-if="fechaInvalida" class="error-text">Campo requerido</span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* ========== Tarjeta base (móvil) ========== */
.checklist-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.cell {
  min-width: 0;
}

/* Etiqueta de cada campo: visible solo en móvil/tablet */
.cell-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.25rem;
}

.cell-text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: #1f2937;
}

.cell-sub {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

/* ========== Tablet (2 columnas, CAPA ocupa todo el ancho) ========== */
@media (min-width: 768px) and (max-width: 1023px) {
  .checklist-item {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .cell-capa {
    grid-column: 1 / -1;
  }
}

/* ========== Escritorio (fila tipo tabla, 5 columnas) ========== */
@media (min-width: 1024px) {
  .checklist-item {
    grid-template-columns: 80px minmax(0, 1.2fr) 110px minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: none;
  }

  .checklist-item:last-child {
    border-bottom: none;
  }

  /* Ocultar etiquetas externas en escritorio (el texto es la etiqueta) */
  .cell-label {
    display: none;
  }

  /* En CAPA se conservan los labels internos Responsable/Fecha */
  .cell-capa .cell-label {
    display: block;
  }
}

/* ========== Inputs ========== */
.input {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.25rem;
  color: #1f2937;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.input-error {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
}

.error-text {
  display: block;
  margin-top: 0.125rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #dc2626;
}

.capa-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.capa-campo {
  min-width: 0;
}

.capa-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.125rem;
}

.capa-label.requerido::after {
  content: ' *';
  color: #dc2626;
}

/* Tablet y escritorio:
   - Primera fila: código, requisito y estado.
   - Segunda fila: observaciones, ancho total (área amarilla).
   - Tercera fila: CAPA, ancho total. */
@media (min-width: 768px) {
  .checklist-item {
    grid-template-columns: 80px minmax(0, 1fr) minmax(150px, 0.45fr);
    grid-template-areas:
      "codigo requisito estado"
      "observaciones observaciones observaciones"
      "capa capa capa";
    gap: 0.875rem;
    padding: 1rem;
  }

  .cell-codigo {
    grid-area: codigo;
  }

  .cell-requisito {
    grid-area: requisito;
  }

  .cell-estado {
    grid-area: estado;
  }

  .cell-observaciones {
    grid-area: observaciones;
    width: 100%;
  }

  .cell-capa {
    grid-area: capa;
    width: 100%;
  }

  /* Las etiquetas siguen visibles porque el layout ya no es tabla. */
  .cell-label {
    display: block;
  }
}

@media (min-width: 1024px) {
  .checklist-item {
    grid-template-columns: 90px minmax(0, 1fr) minmax(180px, 0.45fr);
    grid-template-areas:
      "codigo requisito estado"
      "observaciones observaciones observaciones"
      "capa capa capa";
    padding: 1.25rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
  }

  .checklist-item:last-child {
    border-bottom: 1px solid #e5e7eb;
  }
}

.textarea-observaciones {
  min-height: 7rem;
  resize: vertical;
  line-height: 1.45;
}
</style>
