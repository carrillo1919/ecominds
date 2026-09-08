<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { useEmpleadosStore } from '@/stores/empleados';
import { useAuthorization } from '@/composables/useAuthorization';
import * as empresasApi from '@/api/empresas';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import CrudModal from '@/components/ui/CrudModal.vue';

const toast = useToast();
const store = useEmpleadosStore();
const { isAdmin, isAuditor, isResponsable } = useAuthorization();

const canEdit = computed(() => isAdmin.value || isAuditor.value || isResponsable.value);
const canSelectEmpresa = computed(() => isAdmin.value);

const editandoId = ref(null);
const guardando = ref(false);
const mostrarModal = ref(false);
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
  Object.keys(form).forEach((k) => { form[k] = ''; });
};

const abrirCrear = () => {
  limpiar();
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
  limpiar();
};

const editar = (emp) => {
  editandoId.value = emp.id;
  form.nombre = emp.nombre || '';
  form.apellido = emp.apellido || '';
  form.cedula = emp.cedula || '';
  form.cargo = emp.cargo || '';
  form.telefono = emp.telefono || '';
  form.email = emp.email || '';
  form.empresaId = emp.empresaId || '';
  mostrarModal.value = true;
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
    cerrarModal();
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

const modalTitle = computed(() => (editandoId.value ? 'Editar empleado' : 'Registrar empleado'));
const saveLabel = computed(() => (editandoId.value ? 'Guardar cambios' : 'Registrar'));

const headers = [
  { key: 'empleado', label: 'Empleado' },
  { key: 'cedula', label: 'Cédula' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'email', label: 'Correo' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'estado', label: 'Estado' },
];
</script>

<template>
  <section>
    <PageToolbar title="Empleados" subtitle="Gestión de empleados de su empresa.">
      <template #actions>
        <button v-if="canEdit" class="btn-primary" type="button" @click="abrirCrear">
          + Nuevo empleado
        </button>
      </template>
    </PageToolbar>

    <div class="card">
      <div v-if="store.error" class="alert alert-error">{{ store.error }}</div>
      <DataTable
        :headers="headers"
        :items="store.empleados"
        :loading="store.loading"
        empty-text="Aún no hay empleados registrados."
      >
        <template #cell-empleado="{ item }">
          <strong>{{ item.apellido }}, {{ item.nombre }}</strong>
        </template>
        <template #cell-cargo="{ item }">
          {{ item.cargo || '—' }}
        </template>
        <template #cell-usuario="{ item }">
          <span v-if="item.usuario" class="badge-rol">{{ item.usuario.rol }}</span>
          <span v-else class="muted">Sin usuario</span>
        </template>
        <template #cell-estado="{ item }">
          <span :class="item.activo ? 'text-success' : 'muted'">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </span>
        </template>
        <template v-if="canEdit" #actions="{ item }">
          <button class="btn-ghost btn-sm" type="button" @click="editar(item)">Editar</button>
          <button v-if="item.activo" class="btn-ghost btn-sm" type="button" @click="darDeBaja(item)">Dar de baja</button>
          <button v-else class="btn-ghost btn-sm" type="button" @click="reactivar(item)">Reactivar</button>
          <router-link
            v-if="isAdmin && !item.usuario"
            class="btn-ghost btn-sm"
            :to="{ name: 'empleado-detalle', params: { id: item.id } }"
          >Crear usuario</router-link>
        </template>
      </DataTable>
    </div>

    <CrudModal
      :show="mostrarModal"
      :title="modalTitle"
      :save-label="saveLabel"
      :saving="guardando"
      @close="cerrarModal"
      @save="guardar"
    >
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
    </CrudModal>
  </section>
</template>

<style scoped>
.text-success { color: #065f46; font-weight: 600; }
</style>
