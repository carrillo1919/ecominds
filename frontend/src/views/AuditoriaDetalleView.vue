<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import api, { apiMessage } from '@/api/axios';
import { useAuthorization } from '@/composables/useAuthorization';
import { ESTADOS, calcularResultado, fechaCorta, riesgoClase } from '@/utils/riesgo';

const route = useRoute();
const toast = useToast();
const { canAuditar } = useAuthorization();

const auditoria = ref(null);
const cargando = ref(false);
const guardando = ref(false);
const error = ref('');
const filtroBloque = ref('');

const editable = computed(() => canAuditar.value && auditoria.value?.estado === 'borrador');

const items = computed(() => auditoria.value?.items || []);

const bloques = computed(() => [...new Set(items.value.map((i) => i.requisito?.bloque))]);

const itemsVisibles = computed(() =>
  filtroBloque.value ? items.value.filter((i) => i.requisito?.bloque === filtroBloque.value) : items.value
);

// RF-03.2: el resultado se recalcula en vivo mientras se evalua.
const resultado = computed(() => calcularResultado(items.value));

const resumenBloques = computed(() =>
  bloques.value.map((bloque) => {
    const propios = items.value.filter((i) => i.requisito?.bloque === bloque);
    const r = calcularResultado(propios);
    return { bloque, ...r };
  })
);

const cargar = async () => {
  cargando.value = true;
  error.value = '';
  try {
    const { data } = await api.get(`/auditorias/${route.params.id}`);
    auditoria.value = data.auditoria;
  } catch (e) {
    error.value = apiMessage(e, 'No se pudo cargar la auditoria');
  } finally {
    cargando.value = false;
  }
};

const guardar = async () => {
  guardando.value = true;
  try {
    await api.patch(`/auditorias/${auditoria.value.id}`, {
      fecha: auditoria.value.fecha,
      fechaProximaAuditoria: auditoria.value.fechaProximaAuditoria,
      alcance: auditoria.value.alcance,
      conclusiones: auditoria.value.conclusiones,
    });

    await api.put(`/auditorias/${auditoria.value.id}/items`, {
      items: items.value.map((i) => ({
        id: i.id,
        estado: i.estado,
        observaciones: i.observaciones,
        accionCorrectiva: i.accionCorrectiva,
        responsableAccion: i.responsableAccion,
        fechaCompromiso: i.fechaCompromiso,
      })),
    });

    toast.success('Evaluacion guardada');
    await cargar();
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo guardar la evaluacion'));
  } finally {
    guardando.value = false;
  }
};

const finalizar = async () => {
  if (resultado.value.totalSinEvaluar) {
    toast.error(`Faltan ${resultado.value.totalSinEvaluar} item(s) por evaluar`);
    return;
  }
  if (!window.confirm('Al finalizar la auditoria no podra modificarse. Continuar?')) return;

  guardando.value = true;
  try {
    await guardar();
    await api.post(`/auditorias/${auditoria.value.id}/finalizar`, {
      conclusiones: auditoria.value.conclusiones,
      fechaProximaAuditoria: auditoria.value.fechaProximaAuditoria || undefined,
    });
    toast.success('Auditoria finalizada');
    await cargar();
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo finalizar la auditoria'));
  } finally {
    guardando.value = false;
  }
};

// RF-06.1: descarga del informe ejecutivo en PDF.
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
    toast.error(apiMessage(e, 'No se pudo generar el informe'));
  }
};

onMounted(cargar);
</script>

<template>
  <section>
    <p v-if="cargando" class="muted">Cargando auditoria...</p>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <template v-if="auditoria">
      <div class="card">
        <h1>{{ auditoria.codigo }}</h1>
        <p class="muted">
          {{ auditoria.empresa?.nombre }} ({{ auditoria.empresa?.rif }}) &middot;
          Auditor: {{ auditoria.auditor?.nombre }} {{ auditoria.auditor?.apellido }} &middot;
          Estado: {{ auditoria.estado === 'finalizada' ? 'Finalizada' : 'Borrador' }}
        </p>

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

        <div class="actions-row">
          <button v-if="editable" class="btn-primary" type="button" :disabled="guardando" @click="guardar">
            {{ guardando ? 'Guardando...' : 'Guardar evaluacion' }}
          </button>
          <button v-if="editable" class="btn-ghost" type="button" :disabled="guardando" @click="finalizar">
            Finalizar auditoria
          </button>
          <button class="btn-ghost" type="button" @click="descargarPdf">Descargar informe PDF</button>
        </div>
      </div>

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

      <div class="card">
        <h2>Cumplimiento por bloque</h2>
        <div v-for="b in resumenBloques" :key="b.bloque" class="bar-row">
          <span class="bar-row__label">{{ b.bloque }}</span>
          <span class="bar">
            <span class="bar__fill" :style="{ width: `${b.porcentajeCumplimiento}%` }"></span>
          </span>
          <span class="bar-row__value">{{ b.porcentajeCumplimiento }}%</span>
          <span :class="riesgoClase(b.nivelRiesgo)">{{ b.nivelRiesgo }}</span>
        </div>
      </div>

      <div class="card">
        <h2>Checklist de cumplimiento</h2>
        <label class="filter-inline">Bloque
          <select v-model="filtroBloque">
            <option value="">Todos</option>
            <option v-for="b in bloques" :key="b" :value="b">{{ b }}</option>
          </select>
        </label>

        <div class="table-scroll">
          <table class="data">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Requisito</th>
                <th>Estado</th>
                <th>Observaciones / hallazgo</th>
                <th>Accion correctiva (CAPA)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itemsVisibles" :key="item.id">
                <td>
                  <strong>{{ item.requisito?.codigo }}</strong>
                  <span v-if="item.requisito?.critico" class="pill pill--danger">Critico</span>
                  <span class="muted"><br />{{ item.requisito?.bloque }}</span>
                </td>
                <td>
                  {{ item.requisito?.requisito }}
                  <span class="muted" v-if="item.requisito?.baseLegal"><br />{{ item.requisito.baseLegal }}</span>
                </td>
                <td>
                  <select v-model="item.estado" :disabled="!editable">
                    <option :value="null">Sin evaluar</option>
                    <option v-for="e in ESTADOS" :key="e.valor" :value="e.valor">{{ e.label }}</option>
                  </select>
                </td>
                <td>
                  <textarea v-model="item.observaciones" rows="2" :disabled="!editable"></textarea>
                </td>
                <td>
                  <textarea
                    v-model="item.accionCorrectiva"
                    rows="2"
                    :disabled="!editable || item.estado !== 'no_cumple'"
                    :placeholder="item.estado === 'no_cumple' ? 'Accion correctiva' : 'Solo para No cumple'"
                  ></textarea>
                  <input
                    v-model="item.responsableAccion"
                    type="text"
                    placeholder="Responsable"
                    :disabled="!editable || item.estado !== 'no_cumple'"
                  />
                  <input
                    v-model="item.fechaCompromiso"
                    type="date"
                    :disabled="!editable || item.estado !== 'no_cumple'"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h2>Conclusiones del auditor</h2>
        <textarea v-model="auditoria.conclusiones" rows="4" :disabled="!editable"></textarea>
        <p class="muted" v-if="auditoria.estado === 'finalizada'">
          Finalizada el {{ fechaCorta(auditoria.finalizadaEn) }}.
        </p>
        <div class="actions-row" v-if="editable">
          <button class="btn-primary" type="button" :disabled="guardando" @click="guardar">Guardar</button>
        </div>
      </div>
    </template>
  </section>
</template>
