<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useToast } from 'vue-toastification';
import { useAuditoriasStore } from '@/stores/auditorias';
import { useEmpleadosStore } from '@/stores/empleados';
import { useAuthorization } from '@/composables/useAuthorization';
import { calcularResultado, fechaCorta } from '@/utils/riesgo';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import AuditRiskMatrix from '@/components/auditoria/AuditRiskMatrix.vue';
import AuditItemRow from '@/components/auditoria/AuditItemRow.vue';
import api from '@/api/axios';

const route = useRoute();
const toast = useToast();
const { canAuditar } = useAuthorization();
const auditoriasStore = useAuditoriasStore();
const empleadosStore = useEmpleadosStore();

const { auditoria, loading, saving } = storeToRefs(auditoriasStore);
const { empleadosActivos } = storeToRefs(empleadosStore);

const filtroBloque = ref('');

const editable = computed(() => canAuditar.value && auditoria.value?.estado === 'borrador');
const items = computed(() => auditoria.value?.items || []);
const bloques = computed(() => [...new Set(items.value.map((i) => i.requisito?.bloque).filter(Boolean))]);
const itemsVisibles = computed(() =>
  filtroBloque.value ? items.value.filter((i) => i.requisito?.bloque === filtroBloque.value) : items.value
);
const resultado = computed(() => calcularResultado(items.value));

const cargar = async () => {
  const data = await auditoriasStore.fetchOne(route.params.id);
  if (data?.empresaId) {
    await empleadosStore.fetchActivos({ empresaId: data.empresaId });
  }
};

const guardar = async () => {
  // Validar que todo "No cumple" tenga fecha de compromiso
  const itemsSinFecha = items.value.filter(
    (i) => i.estado === 'no_cumple' && !i.fechaCompromiso
  );
  if (itemsSinFecha.length) {
    toast.error(`${itemsSinFecha.length} item(s) en "No cumple" requieren fecha de compromiso`);
    return;
  }

  // Capturar los items ANTES de update (update reemplaza this.auditoria)
  const itemsPayload = items.value.map((i) => ({
    id: i.id,
    estado: i.estado,
    observaciones: i.observaciones,
    accionCorrectiva: i.accionCorrectiva,
    responsableAccion: i.responsableEmpleado
      ? `${i.responsableEmpleado.apellido}, ${i.responsableEmpleado.nombre}`
      : i.responsableAccion,
    responsableAccionId: i.responsableAccionId,
    fechaCompromiso: i.fechaCompromiso,
  }));

  const result = await auditoriasStore.update(auditoria.value.id, {
    fecha: auditoria.value.fecha,
    fechaProximaAuditoria: auditoria.value.fechaProximaAuditoria,
    alcance: auditoria.value.alcance,
    conclusiones: auditoria.value.conclusiones,
  });
  if (!result.ok) {
    toast.error(result.message);
    return;
  }

  const itemsResult = await auditoriasStore.saveItems(auditoria.value.id, itemsPayload);

  if (itemsResult.ok) {
    toast.success('Evaluacion guardada');
    await cargar(); // recargar para reflejar los datos persistidos
  } else {
    toast.error(itemsResult.message);
  }
};

const finalizar = async () => {
  if (resultado.value.totalSinEvaluar) {
    toast.error(`Faltan ${resultado.value.totalSinEvaluar} item(s) por evaluar`);
    return;
  }
  if (!window.confirm('Al finalizar la auditoria no podra modificarse. Continuar?')) return;

  await guardar();
  const result = await auditoriasStore.finalizar(auditoria.value.id);
  if (result.ok) {
    toast.success('Auditoria finalizada');
  } else {
    toast.error(result.message);
  }
};

const descargarPdf = async () => {
  try {
    const { data } = await api.get(`/auditorias/${auditoria.value.id}/informe.pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `informe-${auditoria.value.codigo || auditoria.value.id}.pdf`;
    enlace.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    toast.error('No se pudo generar el informe');
  }
};

onMounted(cargar);
</script>

<template>
  <section>
    <LoadingState v-if="loading" text="Cargando auditoria..." />
    <div v-if="auditoriasStore.error" class="alert alert-error">{{ auditoriasStore.error }}</div>

    <template v-if="auditoria">
      <BaseCard>
        <template #header>
          <h1>{{ auditoria.codigo }}</h1>
          <p class="muted">
            {{ auditoria.empresa?.nombre }} ({{ auditoria.empresa?.rif }}) &middot;
            Auditor: {{ auditoria.auditor?.nombre }} {{ auditoria.auditor?.apellido }} &middot;
            Estado: {{ auditoria.estado === 'finalizada' ? 'Finalizada' : 'Borrador' }}
          </p>
        </template>

        <div class="form-grid">
          <label>Fecha de auditoria
            <input v-model="auditoria.fecha" type="date" :disabled="!editable" />
          </label>
          <label>Fecha de proxima auditoria
            <input v-model="auditoria.fechaProximaAuditoria" type="date" :disabled="!editable" />
          </label>
          <label>Alcance
            <input v-model="auditoria.alcance" type="text" :disabled="!editable" />
          </label>
        </div>

        <template #footer>
          <BaseButton v-if="editable" variant="primary" :loading="saving" @click="guardar">
            Guardar evaluacion
          </BaseButton>
          <BaseButton v-if="editable" variant="ghost" :disabled="saving" @click="finalizar">
            Finalizar auditoria
          </BaseButton>
          <BaseButton variant="ghost" @click="descargarPdf">Descargar informe PDF</BaseButton>
        </template>
      </BaseCard>

      <AuditRiskMatrix :items="items" />

      <BaseCard title="Checklist de cumplimiento">
        <div class="form-grid">
          <BaseSelect
            id="filtro-bloque"
            v-model="filtroBloque"
            label="Bloque"
            placeholder="Todos"
            :options="bloques.map((b) => ({ value: b, label: b }))"
          />
        </div>

        <div class="checklist-list">
          <AuditItemRow
            v-for="item in itemsVisibles"
            :key="item.id"
            :item="item"
            :editable="editable"
            :empleados="empleadosActivos"
          />
        </div>
      </BaseCard>

      <BaseCard title="Conclusiones del auditor">
        <textarea
          v-model="auditoria.conclusiones"
          rows="5"
          :disabled="!editable"
          class="textarea-alta"
        ></textarea>
        <p class="muted" v-if="auditoria.estado === 'finalizada'">
          Finalizada el {{ fechaCorta(auditoria.finalizadaEn) }}.
        </p>
        <template #footer v-if="editable">
          <BaseButton variant="primary" :loading="saving" @click="guardar">Guardar</BaseButton>
        </template>
      </BaseCard>
    </template>
  </section>
</template>

<style scoped>
:deep(table.data) {
  table-layout: fixed;
  width: 100%;
  min-width: 960px; /* evita que las columnas se aplasten */
}

:deep(table.data th),
:deep(table.data td) {
  overflow-wrap: break-word;
  vertical-align: top;
}

.table-scroll {
  overflow-x: auto;
}

.checklist-list {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.textarea-alta {
  display: block;
  width: 100%;
  min-height: 7rem;
  box-sizing: border-box;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: vertical;
}

.textarea-alta:focus {
  outline: none;
  border-color: #006c4a;
  box-shadow: 0 0 0 3px rgb(0 108 74 / 12%);
}
</style>
