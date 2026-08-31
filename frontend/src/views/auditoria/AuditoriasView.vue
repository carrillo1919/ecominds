<script setup>
import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useToast } from 'vue-toastification';
import { useAuditoriasStore } from '@/stores/auditorias';
import { useEmpresasStore } from '@/stores/empresas';
import { useAuthorization } from '@/composables/useAuthorization';
import { fechaCorta, riesgoClase } from '@/utils/riesgo';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseSelect from '@/components/ui/BaseSelect.vue';
import BaseTable from '@/components/ui/BaseTable.vue';
import LoadingState from '@/components/ui/LoadingState.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { canAuditar } = useAuthorization();
const auditoriasStore = useAuditoriasStore();
const empresasStore = useEmpresasStore();

const { auditorias, proximas, loading } = storeToRefs(auditoriasStore);
const { empresas } = storeToRefs(empresasStore);

const filtros = reactive({
  empresaId: route.query.empresaId || '',
  estado: '',
  desde: '',
  hasta: '',
});

const nueva = reactive({
  empresaId: route.query.empresaId || '',
  fecha: new Date().toISOString().slice(0, 10),
  fechaProximaAuditoria: '',
  alcance: '',
});

const empresasOptions = computed(() => empresas.value.map((e) => ({ value: e.id, label: `${e.nombre} (${e.rif})` })));
const empresasFilterOptions = computed(() => empresas.value.map((e) => ({ value: e.id, label: e.nombre })));
const alertasOrdenadas = computed(() => proximas.value.slice(0, 6));

const cargar = async () => {
  const params = {};
  Object.entries(filtros).forEach(([k, v]) => {
    if (v) params[k] = v;
  });
  await Promise.all([
    auditoriasStore.fetchAll(params),
    empresasStore.fetchAll(),
    auditoriasStore.fetchProximas({ dias: 45 }),
  ]);
};

const crear = async () => {
  if (!nueva.empresaId) {
    toast.error('Seleccione la empresa a auditar');
    return;
  }
  const result = await auditoriasStore.create({
    empresaId: nueva.empresaId,
    fecha: nueva.fecha,
    fechaProximaAuditoria: nueva.fechaProximaAuditoria || undefined,
    alcance: nueva.alcance || undefined,
  });
  if (result.ok) {
    toast.success('Auditoria creada con el checklist completo');
    router.push({ name: 'auditoria-detalle', params: { id: result.auditoria.id } });
  } else {
    toast.error(result.message);
  }
};

const eliminar = async (auditoria) => {
  if (!window.confirm('Eliminar este borrador de auditoria?')) return;
  const result = await auditoriasStore.remove(auditoria.id);
  if (result.ok) {
    toast.success('Auditoria eliminada');
  } else {
    toast.error(result.message);
  }
};

const tableHeaders = [
  { key: 'codigo', label: 'Codigo' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'auditor', label: 'Auditor' },
  { key: 'porcentajeCumplimiento', label: '% Cumpl.' },
  { key: 'porcentajeNoCumplimiento', label: '% Incumpl.' },
  { key: 'nivelRiesgo', label: 'Riesgo' },
  { key: 'estado', label: 'Estado' },
];

onMounted(cargar);
</script>

<template>
  <section>
    <BaseCard v-if="alertasOrdenadas.length" title="Proximas auditorias" subtitle="Recordatorios generados a partir de la fecha de proxima auditoria registrada.">
      <ul class="alert-list">
        <li v-for="a in alertasOrdenadas" :key="a.auditoriaId">
          <span :class="a.vencida ? 'pill pill--danger' : 'pill pill--warn'">
            {{ a.vencida ? `Vencida hace ${Math.abs(a.diasRestantes)} dia(s)` : `En ${a.diasRestantes} dia(s)` }}
          </span>
          <strong>{{ a.empresa?.nombre }}</strong>
          <span class="muted">Programada: {{ fechaCorta(a.fechaProximaAuditoria) }}</span>
        </li>
      </ul>
    </BaseCard>

    <BaseCard v-if="canAuditar" title="Nueva auditoria" subtitle="Se aplica cada vez que el auditor lo requiera. Se cargan los 55 requisitos del checklist vigente.">
      <div class="form-grid">
        <BaseSelect
          id="nueva-empresa"
          v-model="nueva.empresaId"
          label="Empresa"
          required
          placeholder="Seleccione..."
          :options="empresasOptions"
        />
        <label>Fecha de auditoria<input v-model="nueva.fecha" type="date" /></label>
        <label>Fecha de proxima auditoria<input v-model="nueva.fechaProximaAuditoria" type="date" /></label>
        <label>Alcance<input v-model="nueva.alcance" type="text" placeholder="Areas o procesos evaluados" /></label>
      </div>
      <template #footer>
        <BaseButton variant="primary" @click="crear">Iniciar auditoria</BaseButton>
      </template>
    </BaseCard>

    <BaseCard title="Historial de auditorias">
      <div class="form-grid">
        <BaseSelect
          id="filtro-empresa"
          v-model="filtros.empresaId"
          label="Empresa"
          placeholder="Todas"
          :options="empresasFilterOptions"
          @change="cargar"
        />
        <BaseSelect
          id="filtro-estado"
          v-model="filtros.estado"
          label="Estado"
          placeholder="Todos"
          :options="[
            { value: 'borrador', label: 'Borrador' },
            { value: 'finalizada', label: 'Finalizada' },
          ]"
          @change="cargar"
        />
        <label>Desde<input v-model="filtros.desde" type="date" @change="cargar" /></label>
        <label>Hasta<input v-model="filtros.hasta" type="date" @change="cargar" /></label>
      </div>

      <div v-if="auditoriasStore.error" class="alert alert-error">{{ auditoriasStore.error }}</div>
      <LoadingState v-if="loading" text="Cargando auditorias..." />

      <BaseTable
        v-else
        :headers="tableHeaders"
        :items="auditorias"
        empty-text="No hay auditorias registradas con esos filtros."
      >
        <template #cell-empresa="{ item }">
          {{ item.empresa?.nombre }}
        </template>
        <template #cell-fecha="{ item }">
          {{ fechaCorta(item.fecha) }}
        </template>
        <template #cell-auditor="{ item }">
          {{ item.auditor ? `${item.auditor.nombre} ${item.auditor.apellido}` : '-' }}
        </template>
        <template #cell-porcentajeCumplimiento="{ item }">
          {{ Number(item.porcentajeCumplimiento) }}%
        </template>
        <template #cell-porcentajeNoCumplimiento="{ item }">
          {{ Number(item.porcentajeNoCumplimiento) }}%
        </template>
        <template #cell-nivelRiesgo="{ item }">
          <span :class="riesgoClase(item.nivelRiesgo)">{{ item.nivelRiesgo }}</span>
          <span v-if="item.riesgoEscalado" class="muted" title="Severidad elevada por hallazgo critico"> *</span>
        </template>
        <template #cell-estado="{ item }">
          {{ item.estado === 'finalizada' ? 'Finalizada' : 'Borrador' }}
        </template>
        <template #actions="{ item }">
          <router-link :to="{ name: 'auditoria-detalle', params: { id: item.id } }">Abrir</router-link>
          <BaseButton
            v-if="canAuditar && item.estado === 'borrador'"
            variant="ghost"
            size="sm"
            @click="eliminar(item)"
          >
            Eliminar
          </BaseButton>
        </template>
      </BaseTable>
    </BaseCard>
  </section>
</template>
