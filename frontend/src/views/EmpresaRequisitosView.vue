<template>
  <div class="page">
    <header class="page-header">
      <h1>Asignación de Requisitos por Empresa</h1>
    </header>

    <label class="label-empresa">Empresa *</label>
    <select v-model="empresaSeleccionada" class="select-empresa" @change="onSelectEmpresa">
      <option value="">Seleccione una empresa</option>
      <option v-for="emp in empresas" :key="emp.id" :value="emp.id">
        {{ emp.nombre }} ({{ emp.rif }})
      </option>
    </select>

    <p v-if="loading" class="text-muted">Cargando...</p>
    <p v-else-if="error" class="alert alert-error">{{ error }}</p>

    <div v-if="empresaSeleccionada && !loading" class="grid">
      <section class="panel">
        <h2>Requisitos asignados</h2>
        <p v-if="asignadas.length === 0" class="text-muted">Sin requisitos asignados</p>
        <ul class="list">
          <li v-for="a in asignadas" :key="a.id">
            <div>
              <strong>{{ a.requisito?.codigo }}</strong> - {{ a.requisito?.titulo }}
              <br />
              <small>{{ a.requisito?.ente?.sigla }} | {{ a.requisito?.categoria }}</small>
            </div>
            <div class="actions">
              <select v-model="a.responsableId" @change="updateResponsable(a)">
                <option value="">Sin responsable</option>
                <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }}</option>
              </select>
              <button class="btn btn-sm btn-danger" @click="remove(a.id)">Quitar</button>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="canManage" class="panel">
        <h2>Requisitos disponibles</h2>
        <p v-if="disponibles.length === 0" class="text-muted">No hay requisitos disponibles</p>
        <ul class="list">
          <li v-for="r in disponibles" :key="r.id">
            <label class="checkbox">
              <input v-model="seleccionados" type="checkbox" :value="r.id" />
              <span>
                <strong>{{ r.codigo }}</strong> - {{ r.titulo }}
                <br />
                <small>{{ r.ente?.sigla }} | {{ r.categoria }}</small>
              </span>
            </label>
          </li>
        </ul>

        <label>Responsable (opcional)</label>
        <select v-model="responsableAsignacion">
          <option value="">Sin responsable</option>
          <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }}</option>
        </select>

        <button
          class="btn btn-primary"
          :disabled="seleccionados.length === 0 || asignando"
          @click="assignBulk"
        >
          Asignar {{ seleccionados.length }} requisito(s)
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import * as api from '../api/empresaRequisitos.js';
import * as empresasApi from '../api/empresas.js';
import * as requisitosApi from '../api/requisitosLegales.js';
import * as usersApi from '../api/users.js';

const auth = useAuthStore();
const canManage = computed(() => ['admin', 'auditor'].includes(auth.user?.rol));

const empresas = ref([]);
const usuarios = ref([]);
const todasAsignadas = ref([]);
const todosRequisitos = ref([]);
const empresaSeleccionada = ref('');
const seleccionados = ref([]);
const responsableAsignacion = ref('');
const loading = ref(false);
const asignando = ref(false);
const error = ref('');

const asignadas = computed(() =>
  todasAsignadas.value.filter((a) => a.empresaId === empresaSeleccionada.value)
);

const asignadosIds = computed(() => new Set(asignadas.value.map((a) => a.requisitoId)));

const disponibles = computed(() =>
  todosRequisitos.value.filter((r) => !asignadosIds.value.has(r.id))
);

async function loadBase() {
  try {
    const [{ data: e }, { data: u }] = await Promise.all([
      empresasApi.getEmpresas({ activo: true }),
      canManage.value ? usersApi.getUsers() : Promise.resolve({ data: { users: [] } }),
    ]);
    empresas.value = e.empresas || [];
    usuarios.value = u.users || [];
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al cargar datos iniciales';
  }
}

async function onSelectEmpresa() {
  if (!empresaSeleccionada.value) return;
  await loadAssignments();
}

async function loadAssignments() {
  loading.value = true;
  error.value = '';
  seleccionados.value = [];
  try {
    const [{ data: a }, { data: r }] = await Promise.all([
      api.getByEmpresa(empresaSeleccionada.value),
      requisitosApi.getRequisitos({ activo: true }),
    ]);
    todasAsignadas.value = a.asignaciones || [];
    todosRequisitos.value = r.requisitos || [];
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al cargar asignaciones';
  } finally {
    loading.value = false;
  }
}

async function assignBulk() {
  asignando.value = true;
  try {
    await api.bulkAssign({
      empresaId: empresaSeleccionada.value,
      requisitoIds: seleccionados.value,
      responsableId: responsableAsignacion.value || null,
    });
    await loadAssignments();
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al asignar requisitos';
  } finally {
    asignando.value = false;
  }
}

async function updateResponsable(asignacion) {
  try {
    await api.updateAssignment(asignacion.id, { responsableId: asignacion.responsableId || null });
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al actualizar responsable';
  }
}

async function remove(id) {
  if (!confirm('¿Quitar este requisito de la empresa?')) return;
  try {
    await api.removeAssignment(id);
    await loadAssignments();
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al quitar requisito';
  }
}

onMounted(loadBase);
</script>