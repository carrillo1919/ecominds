<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { apiMessage } from '@/api/axios';
import * as checklistApi from '@/api/checklist';
import { useAuthorization } from '@/composables/useAuthorization';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import CrudModal from '@/components/ui/CrudModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const toast = useToast();
const { isAdmin } = useAuthorization();

const requisitos = ref([]);
const cargando = ref(false);
const error = ref('');
const filtroBloque = ref('');
const showModal = ref(false);
const editing = ref(false);
const saving = ref(false);
const formError = ref('');

const defaultForm = {
  bloque: 'General',
  codigo: '',
  requisito: '',
  enteRegulador: '',
  baseLegal: '',
  critico: false,
  activo: true,
  orden: 0,
};
const form = ref({ ...defaultForm });

const bloques = computed(() => [...new Set(requisitos.value.map((r) => r.bloque))]);

const visibles = computed(() =>
  filtroBloque.value ? requisitos.value.filter((r) => r.bloque === filtroBloque.value) : requisitos.value
);

const cargar = async () => {
  cargando.value = true;
  error.value = '';
  try {
    const { data } = await checklistApi.getChecklist();
    requisitos.value = data.requisitos;
  } catch (e) {
    error.value = apiMessage(e, 'No se pudieron cargar los requisitos');
  } finally {
    cargando.value = false;
  }
};

const openModal = (requisito = null) => {
  editing.value = Boolean(requisito);
  formError.value = '';
  form.value = requisito
    ? { ...defaultForm, ...requisito }
    : { ...defaultForm, orden: requisitos.value.length };
  showModal.value = true;
};

const closeModal = () => {
  if (!saving.value) showModal.value = false;
};

const save = async () => {
  if (!form.value.bloque.trim() || !form.value.codigo.trim() || !form.value.requisito.trim()) {
    formError.value = 'Bloque, código y requisito son obligatorios.';
    return;
  }

  saving.value = true;
  formError.value = '';
  const payload = {
    ...form.value,
    bloque: form.value.bloque.trim(),
    codigo: form.value.codigo.trim(),
    requisito: form.value.requisito.trim(),
    enteRegulador: form.value.enteRegulador.trim(),
    baseLegal: form.value.baseLegal.trim(),
    orden: Number(form.value.orden) || 0,
  };

  try {
    const { data } = editing.value
      ? await checklistApi.updateChecklistItem(form.value.id, payload)
      : await checklistApi.createChecklistItem(payload);
    const index = requisitos.value.findIndex((requisito) => requisito.id === data.requisito.id);
    if (index === -1) requisitos.value.push(data.requisito);
    else requisitos.value[index] = data.requisito;
    requisitos.value.sort((a, b) => a.orden - b.orden || a.codigo.localeCompare(b.codigo));
    showModal.value = false;
    toast.success(data.message);
  } catch (e) {
    formError.value = apiMessage(e, 'No se pudo guardar el requisito');
  } finally {
    saving.value = false;
  }
};

const actualizar = async (requisito, campo, valor) => {
  try {
    const { data } = await checklistApi.patchChecklistItem(requisito.id, { [campo]: valor });
    Object.assign(requisito, data.requisito);
    toast.success('Requisito actualizado');
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo actualizar el requisito'));
    cargar();
  }
};

const headers = [
  { key: 'codigo', label: 'Código' },
  { key: 'bloque', label: 'Bloque' },
  { key: 'requisito', label: 'Requisito' },
  { key: 'ente', label: 'Ente / base legal' },
  { key: 'critico', label: 'Crítico' },
  { key: 'activo', label: 'Activo' },
];

onMounted(cargar);
</script>

<template>
  <section>
    <PageToolbar title="Checklist de requisitos legales" subtitle="Base del checklist de materiales y desechos peligrosos (Venezuela).">
      <template v-if="isAdmin" #actions>
        <BaseButton @click="openModal()">Agregar nuevo</BaseButton>
      </template>
    </PageToolbar>

    <div class="card">
      <label class="filter-inline">Bloque
        <select v-model="filtroBloque">
          <option value="">Todos</option>
          <option v-for="b in bloques" :key="b" :value="b">{{ b }}</option>
        </select>
      </label>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <DataTable
        :headers="headers"
        :items="visibles"
        :loading="cargando"
        empty-text="No hay requisitos registrados."
      >
        <template #cell-requisito="{ item }">
          {{ item.requisito }}
        </template>
        <template #cell-ente="{ item }">
          {{ item.enteRegulador || '—' }}
          <span v-if="item.baseLegal" class="muted"><br />{{ item.baseLegal }}</span>
        </template>
        <template #cell-critico="{ item }">
          <label class="switch">
            <input
              type="checkbox"
              :checked="item.critico"
              :disabled="!isAdmin"
              @change="actualizar(item, 'critico', $event.target.checked)"
            />
            <span class="slider"></span>
          </label>
        </template>
        <template #cell-activo="{ item }">
          <label class="switch">
            <input
              type="checkbox"
              :checked="item.activo"
              :disabled="!isAdmin"
              @change="actualizar(item, 'activo', $event.target.checked)"
            />
            <span class="slider"></span>
          </label>
        </template>
        <template v-if="isAdmin" #actions="{ item }">
          <BaseButton size="sm" variant="ghost" @click="openModal(item)">Editar</BaseButton>
        </template>
      </DataTable>
    </div>

    <CrudModal
      :show="showModal"
      :title="editing ? 'Editar requisito del checklist' : 'Agregar requisito al checklist'"
      :saving="saving"
      @close="closeModal"
      @save="save"
    >
      <div v-if="formError" class="alert alert-error">{{ formError }}</div>
      <div class="form-grid">
        <label>Bloque *
          <input v-model="form.bloque" maxlength="100" required />
        </label>
        <label>Código *
          <input v-model="form.codigo" maxlength="100" required />
        </label>
        <label class="form-grid__wide">Requisito *
          <textarea v-model="form.requisito" rows="4" required></textarea>
        </label>
        <label>Ente / regulador
          <input v-model="form.enteRegulador" maxlength="200" />
        </label>
        <label>Base legal
          <input v-model="form.baseLegal" maxlength="200" />
        </label>
        <label>Orden
          <input v-model.number="form.orden" min="0" type="number" />
        </label>
        <label class="checkbox-label">
          <input v-model="form.critico" type="checkbox" />
          Requisito crítico
        </label>
        <label class="checkbox-label">
          <input v-model="form.activo" type="checkbox" />
          Requisito activo
        </label>
      </div>
    </CrudModal>
  </section>
</template>

<style scoped>
.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 9999px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2563eb;
}

input:checked + .slider:before {
  transform: translateX(18px);
}

input:focus + .slider {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3);
}

input:disabled + .slider {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-grid label {
  display: grid;
  gap: 0.35rem;
  font-weight: 600;
}

.form-grid input,
.form-grid textarea {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 0.4rem;
  font: inherit;
}

.form-grid textarea { resize: vertical; }
.form-grid__wide { grid-column: 1 / -1; }
.checkbox-label { display: flex !important; align-items: center; grid-template-columns: auto 1fr; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-grid__wide { grid-column: auto; }
}
</style>
