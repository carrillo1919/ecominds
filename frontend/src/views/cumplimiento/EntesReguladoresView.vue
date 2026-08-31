<template>
  <div class="page">
    <header class="page-header">
      <h1>Entes Reguladores</h1>
      <button v-if="canManage" class="btn btn-primary" @click="openModal()">
        + Nuevo ente
      </button>
    </header>

    <p v-if="loading" class="text-muted">Cargando...</p>
    <p v-else-if="error" class="alert alert-error">{{ error }}</p>

    <div v-else class="table-scroll">
      <table class="data">
        <thead>
          <tr>
            <th>Sigla</th>
            <th>Nombre</th>
            <th>Ámbito</th>
            <th>Contacto</th>
            <th>Sitio web</th>
            <th v-if="canManage">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ente in entes" :key="ente.id">
            <td data-label="Sigla">{{ ente.sigla }}</td>
            <td data-label="Nombre">{{ ente.nombre }}</td>
            <td data-label="Ámbito">{{ ente.ambito }}</td>
            <td data-label="Contacto">{{ ente.contacto || '—' }}</td>
            <td data-label="Sitio web">
              <a v-if="ente.sitioWeb" :href="ente.sitioWeb" target="_blank">Ver sitio</a>
              <span v-else>—</span>
            </td>
            <td v-if="canManage" data-label="Acciones">
              <button class="btn btn-sm" @click="openModal(ente)">Editar</button>
              <button class="btn btn-sm btn-danger" @click="remove(ente.id)">Desactivar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing ? 'Editar' : 'Nuevo' }} ente regulador</h2>
        <form @submit.prevent="save">
          <label>Nombre *</label>
          <input v-model="form.nombre" required />

          <label>Sigla *</label>
          <input v-model="form.sigla" required maxlength="20" />

          <label>Ámbito</label>
          <select v-model="form.ambito">
            <option value="nacional">Nacional</option>
            <option value="departamental">Departamental</option>
            <option value="municipal">Municipal</option>
            <option value="sectorial">Sectorial</option>
          </select>

          <label>Contacto</label>
          <input v-model="form.contacto" type="email" />

          <label>Sitio web</label>
          <input v-model="form.sitioWeb" type="url" />

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
  } finally {
    saving.value = false;
  }
}

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