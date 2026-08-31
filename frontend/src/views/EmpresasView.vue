<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import api, { apiMessage } from '@/api/axios';
import { useAuthorization } from '@/composables/useAuthorization';
import { fechaCorta, riesgoClase } from '@/utils/riesgo';
import * as empleadosApi from '@/api/empleados';

const toast = useToast();
const { canAuditar, isAdmin } = useAuthorization();

const empresas = ref([]);
const empleados = ref([]);
const cargando = ref(false);
const error = ref('');
const guardando = ref(false);
const editandoId = ref(null);
const mostrarFormEmpleado = ref(false);
const guardandoEmpleado = ref(false);

const form = reactive({
  nombre: '',
  rif: '',
  sector: '',
  actividad: '',
  direccion: '',
  telefono: '',
  email: '',
  responsableId: '',
});

const formEmpleado = reactive({
  nombre: '',
  apellido: '',
  cedula: '',
  cargo: '',
  telefono: '',
  email: '',
});

const limpiar = () => {
  editandoId.value = null;
  mostrarFormEmpleado.value = false;
  Object.keys(form).forEach((k) => {
    form[k] = '';
  });
  limpiarEmpleado();
};

const limpiarEmpleado = () => {
  Object.keys(formEmpleado).forEach((k) => {
    formEmpleado[k] = '';
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
  form.responsableId = empresa.responsableEmpleado?.id || '';
  cargarEmpleados(empresa.id);
};

const guardar = async () => {
  if (!form.nombre.trim() || !form.rif.trim()) {
    toast.error('Nombre y RIF son obligatorios');
    return;
  }

  // Validar empleado si se está creando junto a la empresa
  if (mostrarFormEmpleado.value && !editandoId.value) {
    if (!formEmpleado.nombre.trim() || !formEmpleado.apellido.trim() || !formEmpleado.cedula.trim() || !formEmpleado.email.trim()) {
      toast.error('Para crear un responsable, complete nombre, apellido, cédula y correo');
      return;
    }
  }

  guardando.value = true;
  try {
    let empresaId = editandoId.value;
    const payload = { ...form, responsableId: form.responsableId || null };

    if (editandoId.value) {
      await api.put(`/empresas/${editandoId.value}`, payload);
      toast.success('Empresa actualizada');
    } else {
      const { data } = await api.post('/empresas', payload);
      empresaId = data.empresa?.id;
      toast.success('Empresa registrada');
    }

    // Crear el empleado responsable si el form está visible y no existe empresa previa
    if (mostrarFormEmpleado.value && !editandoId.value && empresaId) {
      try {
        const { data } = await empleadosApi.createEmpleado({
          ...formEmpleado,
          empresaId,
        });
        toast.success('Empleado registrado');
        form.responsableId = data.empleado?.id || '';
        await api.put(`/empresas/${empresaId}`, { responsableId: form.responsableId });
        limpiarEmpleado();
        mostrarFormEmpleado.value = false;
      } catch (e) {
        toast.error(apiMessage(e, 'Empresa creada, pero no se pudo registrar el empleado'));
      }
    }

    limpiar();
    await cargar();
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo guardar la empresa'));
  } finally {
    guardando.value = false;
  }
};

const cargarEmpleados = async (empresaId) => {
  try {
    const params = empresaId ? { empresaId } : {};
    const { data } = await empleadosApi.getEmpleadosActivos(params);
    empleados.value = data.empleados || [];
  } catch {
    empleados.value = [];
  }
};

const empleadosEmpresa = computed(() => {
  if (!editandoId.value) return [];
  return empleados.value;
});

const guardarEmpleado = async () => {
  if (!formEmpleado.nombre.trim() || !formEmpleado.apellido.trim() || !formEmpleado.cedula.trim() || !formEmpleado.email.trim()) {
    toast.error('Nombre, apellido, cédula y correo son obligatorios');
    return;
  }
  // En modo crear empresa, el empleado se guarda junto con la empresa
  if (!editandoId.value) {
    toast.info('El empleado se guardará al registrar la empresa');
    return;
  }
  guardandoEmpleado.value = true;
  try {
    const { data } = await empleadosApi.createEmpleado({
      ...formEmpleado,
      empresaId: editandoId.value,
    });
    toast.success('Empleado registrado');
    form.responsableId = data.empleado?.id || '';
    limpiarEmpleado();
    mostrarFormEmpleado.value = false;
    await cargarEmpleados(editandoId.value);
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo registrar el empleado'));
  } finally {
    guardandoEmpleado.value = false;
  }
};

onMounted(async () => {
  await cargar();
  await cargarEmpleados();
});
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
        <label>
          Responsable principal
          <select v-model="form.responsableId">
            <option value="">— Sin responsable —</option>
            <option v-for="emp in empleadosEmpresa" :key="emp.id" :value="emp.id">
              {{ emp.apellido }}, {{ emp.nombre }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="mostrarFormEmpleado" class="card" style="margin-top: 1rem; background: #f9fafb">
        <h3>Nuevo empleado como responsable</h3>
        <div class="form-grid">
          <label>Nombre *<input v-model="formEmpleado.nombre" type="text" /></label>
          <label>Apellido *<input v-model="formEmpleado.apellido" type="text" /></label>
          <label>Cédula *<input v-model="formEmpleado.cedula" type="text" /></label>
          <label>Cargo<input v-model="formEmpleado.cargo" type="text" /></label>
          <label>Teléfono<input v-model="formEmpleado.telefono" type="text" /></label>
          <label>Correo *<input v-model="formEmpleado.email" type="email" /></label>
        </div>
        <div class="actions-row">
          <button v-if="editandoId" class="btn-primary" type="button" :disabled="guardandoEmpleado" @click="guardarEmpleado">
            {{ guardandoEmpleado ? 'Guardando...' : 'Registrar empleado' }}
          </button>
          <button class="btn-ghost" type="button" @click="mostrarFormEmpleado = false">Cancelar</button>
        </div>
      </div>

      <div class="actions-row" style="margin-top: 1rem">
        <button v-if="!mostrarFormEmpleado" class="btn-ghost" type="button" @click="mostrarFormEmpleado = true">
          + Nuevo empleado responsable
        </button>
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
                <span class="muted" v-if="e.responsableEmpleado"><br />{{ e.responsableEmpleado.apellido }}, {{ e.responsableEmpleado.nombre }}</span>
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
