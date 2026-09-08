<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import api, { apiMessage } from '@/api/axios';
import { useAuthorization } from '@/composables/useAuthorization';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';

const toast = useToast();
const { isAdmin } = useAuthorization();

const requisitos = ref([]);
const cargando = ref(false);
const error = ref('');
const filtroBloque = ref('');

const bloques = computed(() => [...new Set(requisitos.value.map((r) => r.bloque))]);

const visibles = computed(() =>
  filtroBloque.value ? requisitos.value.filter((r) => r.bloque === filtroBloque.value) : requisitos.value
);

const cargar = async () => {
  cargando.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/requisitos');
    requisitos.value = data.requisitos;
  } catch (e) {
    error.value = apiMessage(e, 'No se pudieron cargar los requisitos');
  } finally {
    cargando.value = false;
  }
};

const actualizar = async (requisito, campo, valor) => {
  try {
    const { data } = await api.patch(`/requisitos/${requisito.id}`, { [campo]: valor });
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
    <PageToolbar title="Checklist de requisitos legales" subtitle="Base del checklist de materiales y desechos peligrosos (Venezuela)." />

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
      </DataTable>
    </div>
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
</style>
