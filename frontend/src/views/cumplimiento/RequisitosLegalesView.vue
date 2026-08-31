<template>
  <div class="page">
    <header class="page-header">
      <h1>Requisitos Legales</h1>
      <button v-if="canManage" class="btn btn-primary" @click="openModal()">
        + Nuevo requisito
      </button>
    </header>

    <div class="filters">
      <select v-model="filters.enteId" @change="load">
        <option value="">Todos los entes</option>
        <option v-for="ente in entes" :key="ente.id" :value="ente.id">
          {{ ente.sigla }} - {{ ente.nombre }}
        </option>
      </select>

      <select v-model="filters.categoria" @change="load">
        <option value="">Todas las categorías</option>
        <option value="Tributario">Tributario</option>
        <option value="Laboral">Laboral</option>
        <option value="Seguridad ocupacional">Seguridad ocupacional</option>
        <option value="Municipal">Municipal</option>
        <option value="Ambiental">Ambiental</option>
      </select>
    </div>

    <p v-if="loading" class="text-muted">Cargando...</p>
    <p v-else-if="error" class="alert alert-error">{{ error }}</p>

    <table v-else class="table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Título</th>
          <th>Ente</th>
          <th>Categoría</th>
          <th>Periodicidad</th>
          <th>Criticidad</th>
          <th>Vigencia</th>
          <th v-if="canManage">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="req in requisitos" :key="req.id">
          <td>{{ req.codigo }}</td>
          <td>{{ req.titulo }}</td>
          <td>{{ req.ente?.sigla || '—' }}</td>
          <td>{{ req.categoria }}</td>
          <td>{{ req.periodicidad }}</td>
          <td>
            <span :class="['badge', req.criticidad]">{{ req.criticidad }}</span>
          </td>
          <td>{{ req.vigenciaDesde }} {{ req.vigenciaHasta ? ' / ' + req.vigenciaHasta : '' }}</td>
          <td v-if="canManage">
            <button class="btn btn-sm" @click="openModal(req)">Editar</button>
            <button class="btn btn-sm btn-danger" @click="remove(req.id)">Desactivar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing ? 'Editar' : 'Nuevo' }} requisito legal</h2>
        <form @submit.prevent="save">
          <label>Ente regulador *</label>
          <select v-model="form.enteId" required>
            <option v-for="ente in entes" :key="ente.id" :value="ente.id">
              {{ ente.sigla }} - {{ ente.nombre }}
            </option>
          </select>

          <label>Código *</label>
          <input v-model="form.codigo" required maxlength="40" />

          <label>Título *</label>
          <input v-model="form.titulo" required maxlength="200" />

          <label>Descripción</label>
          <textarea v-model="form.descripcion" rows="3" />

          <label>Norma de respaldo</label>
          <input v-model="form.normaRespaldo" maxlength="200" />

          <label>Categoría *</label>
          <input v-model="form.categoria" required maxlength="80" />

          <label>Periodicidad</label>
          <select v-model="form.periodicidad">
            <option value="unica">Única</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>

          <label>Criticidad</label>
          <select v-model="form.criticidad">
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <label>Vigencia desde</label>
          <input v-model="form.vigenciaDesde" type="date" />

          <label>Vigencia hasta</label>
          <input v-model="form.vigenciaHasta" type="date" />

          <div class="modal-actions">
            <button type="button" class="btn" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import * as api from '@/api/requisitosLegales.js';
import * as entesApi from '@/api/entesReguladores.js';

const auth = useAuthStore();
const canManage = computed(() => ['admin', 'auditor'].includes(auth.user?.rol));

const requisitos = ref([]);
const entes = ref([]);
const loading = ref(true);
const error = ref('');
const showModal = ref(false);
const editing = ref(false);
const saving = ref(false);

const filters = ref({ enteId: '', categoria: '' });

const defaultForm = {
  enteId: '',
  codigo: '',
  titulo: '',
  descripcion: '',
  normaRespaldo: '',
  categoria: '',
  periodicidad: 'anual',
  criticidad: 'media',
  vigenciaDesde: '',
  vigenciaHasta: '',
};

const form = ref({ ...defaultForm });

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const params = {};
    if (filters.value.enteId) params.enteId = filters.value.enteId;
    if (filters.value.categoria) params.categoria = filters.value.categoria;
    params.activo = true;

    const [{ data: r }, { data: e }] = await Promise.all([
      api.getRequisitos(params),
      entesApi.getEntes({ activo: true }),
    ]);
    requisitos.value = r.requisitos || [];
    entes.value = e.entes || [];
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al cargar requisitos';
  } finally {
    loading.value = false;
  }
}

function openModal(req = null) {
  editing.value = !!req;
  form.value = req ? { ...req } : { ...defaultForm };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function save() {
  saving.value = true;
  try {
    if (editing.value) {
      await api.updateRequisito(form.value.id, form.value);
    } else {
      await api.createRequisito(form.value);
    }
    closeModal();
    await load();
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al guardar';
  } finally {
    saving.value = false;
  }
}

async function remove(id) {
  if (!confirm('¿Desactivar este requisito?')) return;
  try {
    await api.deleteRequisito(id);
    await load();
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al eliminar';
  }
}

onMounted(load);
</script>