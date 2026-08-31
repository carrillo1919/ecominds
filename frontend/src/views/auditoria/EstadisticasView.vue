<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api, { apiMessage } from '@/api/axios';
import { fechaCorta, riesgoClase } from '@/utils/riesgo';

const stats = ref(null);
const empresas = ref([]);
const cargando = ref(false);
const error = ref('');

const hoy = new Date();
const haceUnAnio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());

const filtros = reactive({
  empresaId: '',
  desde: haceUnAnio.toISOString().slice(0, 10),
  hasta: hoy.toISOString().slice(0, 10),
});

const cargar = async () => {
  cargando.value = true;
  error.value = '';
  try {
    const params = {};
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    const [res, emp] = await Promise.all([
      api.get('/auditorias/estadisticas', { params }),
      api.get('/empresas'),
    ]);
    stats.value = res.data;
    empresas.value = emp.data.empresas;
  } catch (e) {
    error.value = apiMessage(e, 'No se pudieron cargar las estadisticas');
  } finally {
    cargando.value = false;
  }
};

const maxTendencia = computed(() => 100);

onMounted(cargar);
</script>

<template>
  <section>
    <div class="card">
      <h1>Tablero de cumplimiento</h1>
      <p class="muted">Indicadores del periodo seleccionado (solo auditorias finalizadas).</p>

      <div class="form-grid">
        <label>Empresa
          <select v-model="filtros.empresaId" @change="cargar">
            <option value="">Todas</option>
            <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
        </label>
        <label>Desde<input v-model="filtros.desde" type="date" @change="cargar" /></label>
        <label>Hasta<input v-model="filtros.hasta" type="date" @change="cargar" /></label>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <p v-if="cargando" class="muted">Calculando indicadores...</p>

    <template v-if="stats && !cargando">
      <div class="kpi-grid">
        <div class="kpi">
          <span class="kpi__label">Auditorias en el periodo</span>
          <strong class="kpi__value">{{ stats.totalAuditorias }}</strong>
        </div>
        <div class="kpi">
          <span class="kpi__label">Cumplimiento promedio</span>
          <strong class="kpi__value">{{ stats.promedioCumplimiento }}%</strong>
        </div>
        <div class="kpi">
          <span class="kpi__label">Incumplimiento promedio</span>
          <strong class="kpi__value">{{ stats.promedioNoCumplimiento }}%</strong>
        </div>
        <div class="kpi">
          <span class="kpi__label">Riesgo promedio</span>
          <strong class="kpi__value"><span :class="riesgoClase(stats.nivelRiesgoPromedio)">{{ stats.nivelRiesgoPromedio }}</span></strong>
        </div>
      </div>

      <div class="card">
        <h2>Distribucion por nivel de riesgo</h2>
        <div class="bar-row" v-for="(cantidad, nivel) in stats.distribucionRiesgo" :key="nivel">
          <span class="bar-row__label">{{ nivel }}</span>
          <span class="bar">
            <span
              class="bar__fill"
              :class="`bar__fill--${nivel.toLowerCase()}`"
              :style="{ width: stats.totalAuditorias ? `${(cantidad / stats.totalAuditorias) * 100}%` : '0%' }"
            ></span>
          </span>
          <span class="bar-row__value">{{ cantidad }}</span>
        </div>
      </div>

      <div class="card">
        <h2>Cumplimiento por bloque legal</h2>
        <div class="bar-row" v-for="b in stats.bloques" :key="b.bloque">
          <span class="bar-row__label">{{ b.bloque }}</span>
          <span class="bar"><span class="bar__fill" :style="{ width: `${b.porcentajeCumplimiento}%` }"></span></span>
          <span class="bar-row__value">{{ b.porcentajeCumplimiento }}%</span>
          <span :class="riesgoClase(b.nivelRiesgo)">{{ b.nivelRiesgo }}</span>
        </div>
        <p v-if="!stats.bloques.length" class="muted">Sin datos en el periodo.</p>
      </div>

      <div class="card">
        <h2>Evolucion del cumplimiento</h2>
        <div class="bar-row" v-for="t in stats.tendencia" :key="t.id">
          <span class="bar-row__label">{{ fechaCorta(t.fecha) }} &middot; {{ t.empresa }}</span>
          <span class="bar">
            <span class="bar__fill" :style="{ width: `${(t.porcentajeCumplimiento / maxTendencia) * 100}%` }"></span>
          </span>
          <span class="bar-row__value">{{ t.porcentajeCumplimiento }}%</span>
          <span :class="riesgoClase(t.nivelRiesgo)">{{ t.nivelRiesgo }}</span>
        </div>
        <p v-if="!stats.tendencia.length" class="muted">No hay auditorias finalizadas en el periodo.</p>
      </div>

      <div class="card">
        <h2>Hallazgos criticos recurrentes</h2>
        <div class="table-scroll">
          <table class="data">
            <thead>
              <tr><th>Codigo</th><th>Bloque</th><th>Requisito</th><th>Veces</th></tr>
            </thead>
            <tbody>
              <tr v-for="h in stats.hallazgosCriticosRecurrentes" :key="h.codigo">
                <td data-label="Codigo">{{ h.codigo }}</td>
                <td data-label="Bloque">{{ h.bloque }}</td>
                <td data-label="Requisito">{{ h.requisito }}</td>
                <td data-label="Veces">{{ h.veces }}</td>
              </tr>
              <tr v-if="!stats.hallazgosCriticosRecurrentes.length">
                <td colspan="4" class="muted">Sin incumplimientos criticos en el periodo.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>
