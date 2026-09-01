<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import api, { apiMessage } from '@/api/axios';
import { useAuthorization } from '@/composables/useAuthorization';

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

onMounted(cargar);
</script>

<template>
  <section>
    <div class="card">
      <h1>Checklist de requisitos legales</h1>
      <p class="muted">
        Base del checklist de materiales y desechos peligrosos (Venezuela). Los requisitos marcados como
        <strong>criticos</strong> elevan automaticamente la severidad del riesgo cuando resultan en No cumple.
      </p>

      <label class="filter-inline">Bloque
        <select v-model="filtroBloque">
          <option value="">Todos</option>
          <option v-for="b in bloques" :key="b" :value="b">{{ b }}</option>
        </select>
      </label>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <p v-if="cargando" class="muted">Cargando requisitos...</p>

      <div v-else class="table-scroll">
        <table class="data">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Bloque</th>
              <th>Requisito</th>
              <th>Ente / base legal</th>
              <th>Critico</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in visibles" :key="r.id">
              <td data-label="Codigo">{{ r.codigo }}</td>
              <td data-label="Bloque">{{ r.bloque }}</td>
              <td data-label="Requisito">{{ r.requisito }}</td>
              <td data-label="Ente / base legal">
                {{ r.enteRegulador || '-' }}
                <span class="muted" v-if="r.baseLegal"><br />{{ r.baseLegal }}</span>
              </td>
              <td data-label="Critico">
                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="r.critico"
                    :disabled="!isAdmin"
                    @change="actualizar(r, 'critico', $event.target.checked)"
                  />
                  <span class="slider"></span>
                </label>
              </td>
              <td data-label="Activo">
                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="r.activo"
                    :disabled="!isAdmin"
                    @change="actualizar(r, 'activo', $event.target.checked)"
                  />
                  <span class="slider"></span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
