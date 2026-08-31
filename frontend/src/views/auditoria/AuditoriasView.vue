<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import api, { apiMessage } from '@/api/axios';
import { useAuthorization } from '@/composables/useAuthorization';
import { fechaCorta, riesgoClase } from '@/utils/riesgo';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { canAuditar } = useAuthorization();

const auditorias = ref([]);
const empresas = ref([]);
const alertas = ref([]);
const cargando = ref(false);
const creando = ref(false);
const error = ref('');

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

const cargar = async () => {
  cargando.value = true;
  error.value = '';
  try {
    const params = {};
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    const [aud, emp, prox] = await Promise.all([
      api.get('/auditorias', { params }),
      api.get('/empresas'),
      api.get('/auditorias/proximas', { params: { dias: 45 } }),
    ]);
    auditorias.value = aud.data.auditorias;
    empresas.value = emp.data.empresas;
    alertas.value = prox.data.alertas;
  } catch (e) {
    error.value = apiMessage(e, 'No se pudieron cargar las auditorias');
  } finally {
    cargando.value = false;
  }
};

const crear = async () => {
  if (!nueva.empresaId) {
    toast.error('Seleccione la empresa a auditar');
    return;
  }

  creando.value = true;
  try {
    const { data } = await api.post('/auditorias', {
      empresaId: nueva.empresaId,
      fecha: nueva.fecha,
      fechaProximaAuditoria: nueva.fechaProximaAuditoria || undefined,
      alcance: nueva.alcance || undefined,
    });
    toast.success('Auditoria creada con el checklist completo');
    router.push({ name: 'auditoria-detalle', params: { id: data.auditoria.id } });
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo crear la auditoria'));
  } finally {
    creando.value = false;
  }
};

const eliminar = async (auditoria) => {
  if (!window.confirm('Eliminar este borrador de auditoria?')) return;
  try {
    await api.delete(`/auditorias/${auditoria.id}`);
    toast.success('Auditoria eliminada');
    cargar();
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo eliminar'));
  }
};

const alertasOrdenadas = computed(() => alertas.value.slice(0, 6));

onMounted(cargar);
</script>

<template>
  <section>
    <div class="card" v-if="alertasOrdenadas.length">
      <h2>Proximas auditorias</h2>
      <p class="muted">Recordatorios generados a partir de la fecha de proxima auditoria registrada.</p>
      <ul class="alert-list">
        <li v-for="a in alertasOrdenadas" :key="a.auditoriaId">
          <span :class="a.vencida ? 'pill pill--danger' : 'pill pill--warn'">
            {{ a.vencida ? `Vencida hace ${Math.abs(a.diasRestantes)} dia(s)` : `En ${a.diasRestantes} dia(s)` }}
          </span>
          <strong>{{ a.empresa?.nombre }}</strong>
          <span class="muted">Programada: {{ fechaCorta(a.fechaProximaAuditoria) }}</span>
        </li>
      </ul>
    </div>

    <div class="card" v-if="canAuditar">
      <h1>Nueva auditoria</h1>
      <p class="muted">Se aplica cada vez que el auditor lo requiera. Se cargan los 55 requisitos del checklist vigente.</p>

      <div class="form-grid">
        <label>Empresa *
          <select v-model="nueva.empresaId">
            <option value="">Seleccione...</option>
            <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }} ({{ e.rif }})</option>
          </select>
        </label>
        <label>Fecha de auditoria<input v-model="nueva.fecha" type="date" /></label>
        <label>Fecha de proxima auditoria<input v-model="nueva.fechaProximaAuditoria" type="date" /></label>
        <label>Alcance<input v-model="nueva.alcance" type="text" placeholder="Areas o procesos evaluados" /></label>
      </div>

      <div class="actions-row">
        <button class="btn-primary" type="button" :disabled="creando" @click="crear">
          {{ creando ? 'Creando...' : 'Iniciar auditoria' }}
        </button>
      </div>
    </div>

    <div class="card">
      <h2>Historial de auditorias</h2>

      <div class="form-grid">
        <label>Empresa
          <select v-model="filtros.empresaId" @change="cargar">
            <option value="">Todas</option>
            <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
        </label>
        <label>Estado
          <select v-model="filtros.estado" @change="cargar">
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </label>
        <label>Desde<input v-model="filtros.desde" type="date" @change="cargar" /></label>
        <label>Hasta<input v-model="filtros.hasta" type="date" @change="cargar" /></label>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <p v-if="cargando" class="muted">Cargando auditorias...</p>

      <div v-else class="table-scroll">
        <table class="data">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Empresa</th>
              <th>Fecha</th>
              <th>Auditor</th>
              <th>% Cumpl.</th>
              <th>% Incumpl.</th>
              <th>Riesgo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in auditorias" :key="a.id">
              <td>{{ a.codigo }}</td>
              <td>{{ a.empresa?.nombre }}</td>
              <td>{{ fechaCorta(a.fecha) }}</td>
              <td>{{ a.auditor ? `${a.auditor.nombre} ${a.auditor.apellido}` : '-' }}</td>
              <td>{{ Number(a.porcentajeCumplimiento) }}%</td>
              <td>{{ Number(a.porcentajeNoCumplimiento) }}%</td>
              <td>
                <span :class="riesgoClase(a.nivelRiesgo)">{{ a.nivelRiesgo }}</span>
                <span v-if="a.riesgoEscalado" class="muted" title="Severidad elevada por hallazgo critico"> *</span>
              </td>
              <td>{{ a.estado === 'finalizada' ? 'Finalizada' : 'Borrador' }}</td>
              <td>
                <router-link :to="{ name: 'auditoria-detalle', params: { id: a.id } }">Abrir</router-link>
                <button
                  v-if="canAuditar && a.estado === 'borrador'"
                  class="btn-ghost btn-sm"
                  type="button"
                  @click="eliminar(a)"
                >
                  Eliminar
                </button>
              </td>
            </tr>
            <tr v-if="!auditorias.length">
              <td colspan="9" class="muted">No hay auditorias registradas con esos filtros.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
