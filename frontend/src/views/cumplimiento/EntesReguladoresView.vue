<template>
  <section>
    <PageToolbar title="Entes Reguladores" subtitle="Organismos reguladores aplicables.">
      <template #actions>
        <button v-if="canManage" class="btn-primary" type="button" @click="openModal()">
          + Nuevo ente
        </button>
      </template>
    </PageToolbar>

    <div class="card">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <DataTable
        :headers="headers"
        :items="entes"
        :loading="loading"
        empty-text="No hay entes reguladores registrados."
      >
        <template #cell-contacto="{ item }">
          {{ item.contacto || '—' }}
        </template>
        <template #cell-sitioWeb="{ item }">
          <a v-if="item.sitioWeb" :href="item.sitioWeb" target="_blank">Ver sitio</a>
          <span v-else>—</span>
        </template>
        <template v-if="canManage" #actions="{ item }">
          <button class="btn-ghost btn-sm" type="button" @click="openModal(item)">Editar</button>
          <button class="btn-ghost btn-sm btn-danger" type="button" @click="remove(item.id)">Desactivar</button>
        </template>
      </DataTable>
    </div>

    <CrudModal
      :show="showModal"
      :title="editing ? 'Editar ente regulador' : 'Nuevo ente regulador'"
      save-label="Guardar"
      :saving="saving"
      @close="closeModal"
      @save="save"
    >
      <div class="form-grid">
        <label>Nombre *
          <input v-model="form.nombre" required />
        </label>
        <label>Sigla *
          <input v-model="form.sigla" required maxlength="20" />
        </label>
        <label>Ámbito
          <select v-model="form.ambito">
            <option value="nacional">Nacional</option>
            <option value="departamental">Departamental</option>
            <option value="municipal">Municipal</option>
            <option value="sectorial">Sectorial</option>
          </select>
        </label>
        <label>Contacto
          <input v-model="form.contacto" type="email" />
        </label>
        <label style="grid-column: 1 / -1">Sitio web
          <input v-model="form.sitioWeb" type="url" />
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
import * as api from '@/api/entesReguladores.js';

const auth = useAuthStore();
const canManage = computed(() => ['admin', 'auditor'].includes(auth.user?.rol));

const entes = ref([]);
const loading = ref(true);
const error = ref('');
const showModal = ref(false);
const editing = ref(false);
const saving = ref(false);

const defaultForm = {
  nombre: '',
  sigla: '',
  ambito: 'nacional',
  contacto: '',
  sitioWeb: '',
};

const form = ref({ ...defaultForm });

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.getEntes({ activo: true });
    entes.value = data.entes || [];
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al cargar entes reguladores';
  } finally {
    loading.value = false;
  }
}

function openModal(ente = null) {
  editing.value = !!ente;
  form.value = ente ? { ...ente } : { ...defaultForm };
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
      await api.updateEnte(form.value.id, form.value);
    } else {
      await api.createEnte(form.value);
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

const headers = [
  { key: 'sigla', label: 'Sigla' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'ambito', label: 'Ámbito' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'sitioWeb', label: 'Sitio web' },
];

async function remove(id) {
  if (!confirm('¿Desactivar este ente regulador?')) return;
  try {
    await api.deleteEnte(id);
    await load();
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al eliminar';
  }
}

onMounted(load);
</script>