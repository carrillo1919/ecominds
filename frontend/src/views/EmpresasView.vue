<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useToast } from 'vue-toastification';
import api, { apiMessage } from '@/api/axios';
import { useAuthorization } from '@/composables/useAuthorization';
import { fechaCorta, riesgoClase } from '@/utils/riesgo';

const toast = useToast();
const { canAuditar } = useAuthorization();

const empresas = ref([]);
const cargando = ref(false);
const error = ref('');
const guardando = ref(false);
const editandoId = ref(null);

const form = reactive({
  nombre: '',
  rif: '',
  sector: '',
  actividad: '',
  direccion: '',
  telefono: '',
  email: '',
  responsable: '',
});

const limpiar = () => {
  editandoId.value = null;
  Object.keys(form).forEach((k) => {
    form[k] = '';
  });
};

const cargar = async () => {
  cargando.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/empresas');
    empresas.value = data.empresas;
  } catch (e) {
    error.value = apiMessage(e, 'No se pudieron cargar las empresas');
  } finally {
    cargando.value = false;
  }
};

const editar = (empresa) => {
  editandoId.value = empresa.id;
  Object.keys(form).forEach((k) => {
    form[k] = empresa[k] || '';
  });
};

const guardar = async () => {
  if (!form.nombre.trim() || !form.rif.trim()) {
    toast.error('Nombre y RIF son obligatorios');
    return;
  }

  guardando.value = true;
  try {
    if (editandoId.value) {
      await api.put(`/empresas/${editandoId.value}`, { ...form });
      toast.success('Empresa actualizada');
    } else {
      await api.post('/empresas', { ...form });
      toast.success('Empresa registrada');
    }
    limpiar();
    await cargar();
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo guardar la empresa'));
  } finally {
    guardando.value = false;
  }
};

onMounted(cargar);
</script>

<template>
  <section>
    <div class="card" v-if="canAuditar">
      <h1>{{ editandoId ? 'Editar empresa' : 'Registrar empresa' }}</h1>
      <p class="muted">Cada empresa acumula el historial de auditorias de cumplimiento.</p>

      <div class="form-grid">
        <label>Nombre o razon social *<input v-model="form.nombre" type="text" /></label>
        <label>RIF *<input v-model="form.rif" type="text" placeholder="J-12345678-9" /></label>
        <label>Sector<input v-model="form.sector" type="text" /></label>
        <label>Actividad<input v-model="form.actividad" type="text" /></label>
        <label>Direccion<input v-model="form.direccion" type="text" /></label>
        <label>Telefono<input v-model="form.telefono" type="text" /></label>
        <label>Correo<input v-model="form.email" type="email" /></label>
        <label>Responsable<input v-model="form.responsable" type="text" /></label>
      </div>

      <div class="actions-row">
        <button class="btn-primary" type="button" :disabled="guardando" @click="guardar">
          {{ guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar empresa' }}
        </button>
        <button v-if="editandoId" class="btn-ghost" type="button" @click="limpiar">Cancelar</button>
      </div>
    </div>

    <div class="card">
      <h2>Empresas registradas</h2>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <p v-if="cargando" class="muted">Cargando empresas...</p>

      <div v-else class="table-scroll">
        <table class="data">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>RIF</th>
              <th>Sector</th>
              <th>Ultima auditoria</th>
              <th>Riesgo</th>
              <th>Proxima</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in empresas" :key="e.id">
              <td>
                <strong>{{ e.nombre }}</strong>
                <span class="muted" v-if="e.responsable"><br />{{ e.responsable }}</span>
              </td>
              <td>{{ e.rif }}</td>
              <td>{{ e.sector || '-' }}</td>
              <td>{{ e.ultimaAuditoria ? fechaCorta(e.ultimaAuditoria.fecha) : 'Sin auditorias' }}</td>
              <td>
                <span v-if="e.ultimaAuditoria" :class="riesgoClase(e.ultimaAuditoria.nivelRiesgo)">
                  {{ e.ultimaAuditoria.nivelRiesgo }}
                </span>
                <span v-else class="muted">-</span>
              </td>
              <td>{{ e.ultimaAuditoria ? fechaCorta(e.ultimaAuditoria.fechaProximaAuditoria) : '-' }}</td>
              <td>
                <router-link :to="{ name: 'auditorias', query: { empresaId: e.id } }">Auditorias</router-link>
                <button v-if="canAuditar" class="btn-ghost btn-sm" type="button" @click="editar(e)">Editar</button>
              </td>
            </tr>
            <tr v-if="!empresas.length">
              <td colspan="7" class="muted">Aun no hay empresas registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
