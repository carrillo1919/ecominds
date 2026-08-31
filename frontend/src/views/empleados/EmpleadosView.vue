<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useEmpleadosStore } from '@/stores/empleados';
import { useAuthorization } from '@/composables/useAuthorization';
import * as empresasApi from '@/api/empresas';

const toast = useToast();
const store = useEmpleadosStore();
const { isAdmin, isAuditor, isResponsable } = useAuthorization();

const canEdit = computed(() => isAdmin.value || isAuditor.value || isResponsable.value);
const canSelectEmpresa = computed(() => isAdmin.value);

const editandoId = ref(null);
const guardando = ref(false);
const mostrarForm = ref(false);
const empresas = ref([]);

const form = reactive({
  nombre: '',
  apellido: '',
  cedula: '',
  cargo: '',
  telefono: '',
  email: '',
  empresaId: '',
});

const limpiar = () => {
  editandoId.value = null;
  mostrarForm.value = false;
  Object.keys(form).forEach((k) => { form[k] = ''; });
};

const editar = (emp) => {
  editandoId.value = emp.id;
  mostrarForm.value = true;
  form.nombre = emp.nombre || '';
  form.apellido = emp.apellido || '';
  form.cedula = emp.cedula || '';
  form.cargo = emp.cargo || '';
  form.telefono = emp.telefono || '';
  form.email = emp.email || '';
  form.empresaId = emp.empresaId || '';
};

const guardar = async () => {
  if (!form.nombre.trim() || !form.apellido.trim() || !form.cedula.trim() || !form.email.trim()) {
    toast.error('Nombre, apellido, cédula y correo son obligatorios');
    return;
  }
  if (canSelectEmpresa.value && !form.empresaId.trim()) {
    toast.error('Seleccione la empresa a la que pertenece el empleado');
    return;
  }
  guardando.value = true;
  const payload = { ...form };
  if (!canSelectEmpresa.value) delete payload.empresaId;
  let result;
  if (editandoId.value) {
    result = await store.update(editandoId.value, payload);
  } else {
    result = await store.create(payload);
  }
  guardando.value = false;
  if (result.ok) {
    toast.success(result.message);
    limpiar();
    await store.fetchAll();
  } else {
    toast.error(result.message);
  }
};

const darDeBaja = async (emp) => {
  if (!confirm(`¿Dar de baja a ${emp.nombre} ${emp.apellido}?`)) return;
  const result = await store.darDeBaja(emp.id);
  if (result.ok) {
    toast.success(result.message);
  } else {
    toast.error(result.message);
  }
};

const reactivar = async (emp) => {
  const result = await store.update(emp.id, { activo: true });
  if (result.ok) toast.success('Empleado reactivado');
  else toast.error(result.message);
};

const cargarEmpresas = async () => {
  if (!canSelectEmpresa.value) return;
  try {
    const { data } = await empresasApi.getEmpresas({ activo: true });
    empresas.value = data.empresas || [];
  } catch {
    empresas.value = [];
  }
};

onMounted(async () => {
  await store.fetchAll();
  await cargarEmpresas();
});
</script>

<template>
  <section>
    <div class="section-header">
      <div>
        <h1>Empleados</h1>
        <p class="muted">Gestión de empleados de su empresa.</p>
      </div>
      <button v-if="canEdit && !mostrarForm" class="btn-primary" type="button" @click="mostrarForm = true">
        + Nuevo empleado
      </button>
    </div>

    <div v-if="mostrarForm && canEdit" class="card">
      <h2>{{ editandoId ? 'Editar empleado' : 'Registrar empleado' }}</h2>
      <div class="form-grid">
        <label v-if="canSelectEmpresa">
          Empresa *
          <select v-model="form.empresaId">
            <option value="">Seleccione...</option>
            <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
        </label>
        <label>Nombre *<input v-model="form.nombre" type="text" /></label>
        <label>Apellido *<input v-model="form.apellido" type="text" /></label>
        <label>Cédula *<input v-model="form.cedula" type="text" /></label>
        <label>Cargo<input v-model="form.cargo" type="text" /></label>
        <label>Teléfono<input v-model="form.telefono" type="text" /></label>
        <label>Correo *<input v-model="form.email" type="email" /></label>
      </div>
      <div class="actions-row">
        <button class="btn-primary" type="button" :disabled="guardando" @click="guardar">
          {{ guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar' }}
        </button>
        <button class="btn-ghost" type="button" @click="limpiar">Cancelar</button>
      </div>
    </div>

    <div class="card">
      <div v-if="store.error" class="alert alert-error">{{ store.error }}</div>
      <p v-if="store.loading" class="muted">Cargando empleados...</p>

      <div v-else class="table-scroll">
        <table class="data">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Cédula</th>
              <th>Cargo</th>
              <th>Correo</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th v-if="canEdit"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in store.empleados" :key="emp.id">
              <td><strong>{{ emp.apellido }}, {{ emp.nombre }}</strong></td>
              <td>{{ emp.cedula }}</td>
              <td>{{ emp.cargo || '-' }}</td>
              <td>{{ emp.email }}</td>
              <td>
                <span v-if="emp.usuario" class="badge-rol">{{ emp.usuario.rol }}</span>
                <span v-else class="muted">Sin usuario</span>
              </td>
              <td>
                <span :class="emp.activo ? 'text-success' : 'muted'">
                  {{ emp.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td v-if="canEdit" style="white-space:nowrap">
                <button class="btn-ghost btn-sm" type="button" @click="editar(emp)">Editar</button>
                <button v-if="emp.activo" class="btn-ghost btn-sm" type="button" @click="darDeBaja(emp)">Dar de baja</button>
                <button v-else class="btn-ghost btn-sm" type="button" @click="reactivar(emp)">Reactivar</button>
                <router-link
                  v-if="isAdmin && !emp.usuario"
                  class="btn-ghost btn-sm"
                  :to="{ name: 'empleado-detalle', params: { id: emp.id } }"
                >Crear usuario</router-link>
              </td>
            </tr>
            <tr v-if="!store.empleados.length">
              <td colspan="7" class="muted">Aún no hay empleados registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; }
.text-success { color: #065f46; font-weight: 600; }
</style>
