<template>
  <section>
    <PageToolbar title="Requisitos Legales" subtitle="Requisitos legales aplicables al cumplimiento.">
      <template #actions>
        <button v-if="canManage" class="btn-primary" type="button" @click="openModal()">
          + Nuevo requisito
        </button>
      </template>
    </PageToolbar>

    <div class="card">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div class="filters">
        <label>
          Ente:
          <select v-model="filters.enteId" @change="load">
            <option value="">Todos los entes</option>
            <option v-for="ente in entes" :key="ente.id" :value="ente.id">
              {{ ente.sigla }} - {{ ente.nombre }}
            </option>
          </select>
        </label>

        <label>
          Categoría:
          <select v-model="filters.categoria" @change="load">
            <option value="">Todas las categorías</option>
            <option value="Tributario">Tributario</option>
            <option value="Laboral">Laboral</option>
            <option value="Seguridad ocupacional">Seguridad ocupacional</option>
            <option value="Municipal">Municipal</option>
            <option value="Ambiental">Ambiental</option>
          </select>
        </label>
      </div>

      <DataTable
        :headers="headers"
        :items="requisitos"
        :loading="loading"
        empty-text="No hay requisitos registrados."
      >
        <template #cell-ente="{ item }">
          {{ item.ente?.sigla || '—' }}
        </template>
        <template #cell-criticidad="{ item }">
          <span :class="['badge', item.criticidad]">{{ item.criticidad }}</span>
        </template>
        <template #cell-vigencia="{ item }">
          {{ item.vigenciaDesde }} {{ item.vigenciaHasta ? ' / ' + item.vigenciaHasta : '' }}
        </template>
        <template v-if="canManage" #actions="{ item }">
          <button class="btn-ghost btn-sm" type="button" @click="openModal(item)">Editar</button>
          <button class="btn-ghost btn-sm btn-danger" type="button" @click="remove(item.id)">Desactivar</button>
        </template>
      </DataTable>
    </div>

    <CrudModal
      :show="showModal"
      :title="editing ? 'Editar requisito legal' : 'Nuevo requisito legal'"
      save-label="Guardar"
      :saving="saving"
      @close="closeModal"
      @save="save"
    >
      <div class="form-grid">
        <label>Ente regulador *
          <select v-model="form.enteId" required>
            <option v-for="ente in entes" :key="ente.id" :value="ente.id">
              {{ ente.sigla }} - {{ ente.nombre }}
            </option>
          </select>
        </label>
        <label>Código *
          <input v-model="form.codigo" required maxlength="40" />
        </label>
        <label>Título *
          <input v-model="form.titulo" required maxlength="200" />
        </label>
        <label>Categoría *
          <input v-model="form.categoria" required maxlength="80" />
        </label>
        <label>Periodicidad
          <select v-model="form.periodicidad">
            <option value="unica">Única</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </label>
        <label>Criticidad
          <select v-model="form.criticidad">
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </label>
        <label>Vigencia desde
          <input v-model="form.vigenciaDesde" type="date" />
        </label>
        <label>Vigencia hasta
          <input v-model="form.vigenciaHasta" type="date" />
        </label>
        <label style="grid-column: 1 / -1">Descripción
          <textarea v-model="form.descripcion" rows="3"></textarea>
        </label>
        <label style="grid-column: 1 / -1">Norma de respaldo
          <input v-model="form.normaRespaldo" maxlength="200" />
        </label>
      </div>
    </CrudModal>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import CrudModal from '@/components/ui/CrudModal.vue';
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
  error.value = '';
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
    throw e;
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

const headers = [
  { key: 'codigo', label: 'Código' },
  { key: 'titulo', label: 'Título' },
  { key: 'ente', label: 'Ente' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'periodicidad', label: 'Periodicidad' },
  { key: 'criticidad', label: 'Criticidad' },
  { key: 'vigencia', label: 'Vigencia' },
];

onMounted(load);
</script>