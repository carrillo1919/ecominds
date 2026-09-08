<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { format } from 'date-fns';
import BaseModal from '@/components/ui/BaseModal.vue';
import PageToolbar from '@/components/ui/PageToolbar.vue';
import DataTable from '@/components/ui/DataTable.vue';
import { getEmpresas } from '@/api/empresas';
import { useUsuariosStore } from '@/stores/usuarios';
import { roleLabel } from '@/utils/validators';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const usuariosStore = useUsuariosStore();
const toast = useToast();

const roles = ['admin', 'auditor', 'responsable', 'lector'];
const usuarios = computed(() => usuariosStore.usuarios);
const cargando = computed(() => usuariosStore.loading);
const error = computed(() => usuariosStore.error);
const empresas = ref([]);
const cargandoEmpresas = ref(false);
const mostrarModalUsuario = ref(false);
const modoModalUsuario = ref('create');
const guardandoUsuario = ref(false);
const errorModalUsuario = ref('');
const mostrarModalEmpresas = ref(false);
const guardandoEmpresas = ref(false);
const cargandoEmpresasUsuario = ref(false);
const errorModalEmpresas = ref('');
const usuarioEmpresas = ref(null);
const empresasSeleccionadas = ref([]);

const userFieldErrors = reactive({
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: '',
  empresaIds: '',
  activo: '',
});
const empresasFieldErrors = reactive({ empresaIds: '' });
const formUsuario = reactive({
  id: '',
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: 'lector',
  activo: true,
  empresaIds: [],
});

const tituloModalUsuario = computed(() =>
  modoModalUsuario.value === 'create' ? 'Nuevo usuario' : 'Editar usuario'
);
const esCreacion = computed(() => modoModalUsuario.value === 'create');
const usuarioEditaSuCuenta = computed(() => formUsuario.id && formUsuario.id === auth.user?.id);
const rolGestionaEmpresas = (rol) => ['auditor', 'lector'].includes(rol);
const puedeGestionarEmpresas = (usuario) => rolGestionaEmpresas(usuario?.rol);
const empresaSeleccionadaLector = computed({
  get: () => formUsuario.empresaIds[0] || '',
  set: (value) => {
    formUsuario.empresaIds = value ? [value] : [];
  },
});
const empresaAsignadaLector = computed({
  get: () => empresasSeleccionadas.value[0] || '',
  set: (value) => {
    empresasSeleccionadas.value = value ? [value] : [];
  },
});

const limpiarErrores = (state) => {
  Object.keys(state).forEach((key) => {
    state[key] = '';
  });
};

const aplicarErrores = (state, errors = []) => {
  limpiarErrores(state);
  errors.forEach(({ campo, mensaje }) => {
    const key = String(campo || '').split('.')[0];
    if (Object.hasOwn(state, key)) {
      state[key] = state[key] ? `${state[key]} ${mensaje}` : mensaje;
    }
  });
};

const cargar = async () => {
  await usuariosStore.fetchAll();
};

const cargarEmpresas = async (force = false) => {
  if (cargandoEmpresas.value || (empresas.value.length && !force)) return;
  cargandoEmpresas.value = true;
  try {
    const { data } = await getEmpresas();
    empresas.value = data.empresas || [];
  } catch {
    empresas.value = [];
    toast.error('No se pudieron cargar las empresas');
  } finally {
    cargandoEmpresas.value = false;
  }
};

const resetFormUsuario = () => {
  Object.assign(formUsuario, {
    id: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'lector',
    activo: true,
    empresaIds: [],
  });
  errorModalUsuario.value = '';
  limpiarErrores(userFieldErrors);
};

const cerrarModalUsuario = () => {
  mostrarModalUsuario.value = false;
  resetFormUsuario();
};

const abrirNuevoUsuario = async () => {
  resetFormUsuario();
  modoModalUsuario.value = 'create';
  mostrarModalUsuario.value = true;
  await cargarEmpresas();
};

const abrirEditarUsuario = (usuario) => {
  resetFormUsuario();
  modoModalUsuario.value = 'edit';
  Object.assign(formUsuario, {
    id: usuario.id,
    nombre: usuario.nombre || '',
    apellido: usuario.apellido || '',
    email: usuario.email || '',
    password: '',
    rol: usuario.rol,
    activo: !!usuario.activo,
    empresaIds: [],
  });
  mostrarModalUsuario.value = true;
};

const cambiarRol = async (usuario, nuevoRol) => {
  const result = await usuariosStore.updateRol(usuario.id, nuevoRol);
  if (result.ok) {
    toast.success(result.message || 'Rol actualizado');
  } else {
    toast.error(result.message);
    await cargar();
  }
};

const guardarUsuario = async () => {
  guardandoUsuario.value = true;
  errorModalUsuario.value = '';
  limpiarErrores(userFieldErrors);

  const payload = esCreacion.value
    ? {
        nombre: formUsuario.nombre.trim(),
        apellido: formUsuario.apellido.trim(),
        email: formUsuario.email.trim(),
        password: formUsuario.password,
        rol: formUsuario.rol,
        empresaIds: rolGestionaEmpresas(formUsuario.rol) ? [...formUsuario.empresaIds] : [],
      }
    : {
        nombre: formUsuario.nombre.trim(),
        apellido: formUsuario.apellido.trim(),
        email: formUsuario.email.trim(),
        activo: formUsuario.activo,
      };

  const result = esCreacion.value
    ? await usuariosStore.create(payload)
    : await usuariosStore.update(formUsuario.id, payload);

  guardandoUsuario.value = false;

  if (result.ok) {
    toast.success(result.message);
    cerrarModalUsuario();
    return;
  }

  errorModalUsuario.value = result.message;
  aplicarErrores(userFieldErrors, result.errors);
  toast.error(result.message);
};

const quitarEmpresa = async (empresaId) => {
  if (!usuarioEmpresas.value) return;
  const result = await usuariosStore.removeEmpresa(usuarioEmpresas.value.id, empresaId);
  if (!result.ok) {
    toast.error(result.message);
    return;
  }

  empresasSeleccionadas.value = empresasSeleccionadas.value.filter((id) => id !== empresaId);
  if (usuarioEmpresas.value.rol === 'lector' && empresasSeleccionadas.value.length > 1) {
    empresasSeleccionadas.value = empresasSeleccionadas.value.slice(0, 1);
  }
  toast.success(result.message);
};

const abrirModalEmpresas = async (usuario) => {
  usuarioEmpresas.value = usuario;
  empresasSeleccionadas.value = [];
  errorModalEmpresas.value = '';
  limpiarErrores(empresasFieldErrors);
  mostrarModalEmpresas.value = true;
  await cargarEmpresas();
  cargandoEmpresasUsuario.value = true;
  const result = await usuariosStore.fetchEmpresas(usuario.id);
  cargandoEmpresasUsuario.value = false;

  if (!result.ok) {
    errorModalEmpresas.value = result.message;
    toast.error(result.message);
    return;
  }

  empresasSeleccionadas.value = (result.asignaciones || []).map((asignacion) => asignacion.empresaId);
  if (usuario.rol === 'lector' && empresasSeleccionadas.value.length > 1) {
    empresasSeleccionadas.value = empresasSeleccionadas.value.slice(0, 1);
  }
};

const cerrarModalEmpresas = () => {
  mostrarModalEmpresas.value = false;
  usuarioEmpresas.value = null;
  empresasSeleccionadas.value = [];
  errorModalEmpresas.value = '';
  limpiarErrores(empresasFieldErrors);
};

const guardarEmpresas = async () => {
  if (!usuarioEmpresas.value) return;
  guardandoEmpresas.value = true;
  errorModalEmpresas.value = '';
  limpiarErrores(empresasFieldErrors);
  const result = await usuariosStore.assignEmpresas(usuarioEmpresas.value.id, [...empresasSeleccionadas.value]);
  guardandoEmpresas.value = false;

  if (result.ok) {
    toast.success(result.message);
    cerrarModalEmpresas();
    return;
  }

  errorModalEmpresas.value = result.message;
  aplicarErrores(empresasFieldErrors, result.errors);
  toast.error(result.message);
};

const fecha = (valor) => (valor ? format(new Date(valor), 'dd/MM/yyyy') : '-');

const tableHeaders = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Correo' },
  { key: 'rol', label: 'Rol' },
  { key: 'verificado', label: 'Verificado' },
  { key: 'activo', label: 'Activo' },
  { key: 'registro', label: 'Registro' },
];

watch(
  () => formUsuario.rol,
  (rol) => {
    if (!rolGestionaEmpresas(rol)) {
      formUsuario.empresaIds = [];
      return;
    }
    if (rol === 'lector' && formUsuario.empresaIds.length > 1) {
      formUsuario.empresaIds = formUsuario.empresaIds.slice(0, 1);
    }
  }
);

onMounted(async () => {
  await cargar();
  await cargarEmpresas();
});
</script>

<template>
  <section>
    <PageToolbar title="Usuarios del sistema" subtitle="Solo el administrador puede consultar y modificar los roles.">
      <template #actions>
        <button class="btn-primary" type="button" @click="abrirNuevoUsuario">+ Nuevo usuario</button>
      </template>
    </PageToolbar>

    <div class="card" style="margin-bottom:1.25rem">
      <p class="muted" style="margin:0">
        El admin ve todas las empresas, el auditor ve las empresas que se le asignen, el responsable
        solo edita los datos de su empresa asignada (gestionada desde Empleados/Empresas) y el lector
        solo visualiza la empresa que se le asigne (por defecto una empresa de demostración).
      </p>
    </div>

    <div class="card">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <DataTable
        :headers="tableHeaders"
        :items="usuarios"
        :loading="cargando"
        empty-text="No hay usuarios registrados."
      >
        <template #cell-rol="{ item }">
          <select :value="item.rol" :disabled="item.id === auth.user?.id" @change="cambiarRol(item, $event.target.value)">
            <option v-for="r in roles" :key="r" :value="r">{{ roleLabel(r) }}</option>
          </select>
        </template>
        <template #cell-verificado="{ item }">
          {{ item.verified ? 'Sí' : 'No' }}
        </template>
        <template #cell-activo="{ item }">
          {{ item.activo ? 'Sí' : 'No' }}
        </template>
        <template #cell-registro="{ item }">
          {{ fecha(item.createdAt) }}
        </template>
        <template #actions="{ item }">
          <button class="btn-ghost btn-sm" type="button" @click="abrirEditarUsuario(item)">Editar</button>
          <button
            v-if="puedeGestionarEmpresas(item)"
            class="btn-ghost btn-sm"
            type="button"
            @click="abrirModalEmpresas(item)"
          >
            Empresas asignadas
          </button>
        </template>
      </DataTable>
    </div>

    <BaseModal :show="mostrarModalUsuario" :title="tituloModalUsuario" @close="cerrarModalUsuario">
      <div v-if="errorModalUsuario" class="alert alert-error">{{ errorModalUsuario }}</div>

      <form class="modal-form" @submit.prevent="guardarUsuario">
        <div class="form-grid">
          <div class="field">
            <label for="nombre">Nombre</label>
            <input id="nombre" v-model.trim="formUsuario.nombre" type="text" />
            <span v-if="userFieldErrors.nombre" class="error-text">{{ userFieldErrors.nombre }}</span>
          </div>

          <div class="field">
            <label for="apellido">Apellido</label>
            <input id="apellido" v-model.trim="formUsuario.apellido" type="text" />
            <span v-if="userFieldErrors.apellido" class="error-text">{{ userFieldErrors.apellido }}</span>
          </div>

          <div class="field">
            <label for="email">Correo electrónico</label>
            <input id="email" v-model.trim="formUsuario.email" type="email" />
            <span v-if="userFieldErrors.email" class="error-text">{{ userFieldErrors.email }}</span>
          </div>

          <div v-if="esCreacion" class="field">
            <label for="password">Contraseña</label>
            <input id="password" v-model="formUsuario.password" type="password" autocomplete="new-password" />
            <span v-if="userFieldErrors.password" class="error-text">{{ userFieldErrors.password }}</span>
          </div>

          <div v-if="esCreacion" class="field">
            <label for="rol">Rol</label>
            <select id="rol" v-model="formUsuario.rol">
              <option v-for="r in roles" :key="r" :value="r">{{ roleLabel(r) }}</option>
            </select>
            <span v-if="userFieldErrors.rol" class="error-text">{{ userFieldErrors.rol }}</span>
          </div>

          <div v-else class="field field-checkbox">
            <label class="checkbox-inline">
              <input v-model="formUsuario.activo" type="checkbox" :disabled="usuarioEditaSuCuenta" />
              <span>Usuario activo</span>
            </label>
            <span v-if="usuarioEditaSuCuenta" class="muted">No puede desactivar su propia cuenta desde aquí.</span>
            <span v-if="userFieldErrors.activo" class="error-text">{{ userFieldErrors.activo }}</span>
          </div>

          <div v-if="esCreacion && rolGestionaEmpresas(formUsuario.rol)" class="field field-wide">
            <label>Empresas asignadas</label>
            <p class="muted helper-text">
              Si lo deja vacío, el sistema asignará automáticamente una empresa de demostración.
            </p>

            <div v-if="cargandoEmpresas" class="muted">Cargando empresas...</div>

            <template v-else-if="formUsuario.rol === 'auditor'">
              <div class="assignment-list">
                <label v-for="empresa in empresas" :key="empresa.id" class="option-row">
                  <input v-model="formUsuario.empresaIds" type="checkbox" :value="empresa.id" />
                  <span>{{ empresa.nombre }} <small class="muted">{{ empresa.rif }}</small></span>
                </label>
                <p v-if="!empresas.length" class="muted">No hay empresas disponibles.</p>
              </div>
            </template>
            <template v-else>
              <select v-model="empresaSeleccionadaLector">
                <option value="">Sin asignar (usar demo)</option>
                <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
                  {{ empresa.nombre }} ({{ empresa.rif }})
                </option>
              </select>
            </template>

            <span v-if="userFieldErrors.empresaIds" class="error-text">{{ userFieldErrors.empresaIds }}</span>
          </div>
        </div>
      </form>

      <template #footer>
        <button class="btn-ghost" type="button" @click="cerrarModalUsuario">Cancelar</button>
        <button class="btn-primary" type="button" :disabled="guardandoUsuario" @click="guardarUsuario">
          {{ guardandoUsuario ? 'Guardando...' : esCreacion ? 'Crear usuario' : 'Guardar cambios' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal :show="mostrarModalEmpresas" title="Empresas asignadas" @close="cerrarModalEmpresas">
      <div v-if="usuarioEmpresas" class="modal-copy">
        <p>
          <strong>{{ usuarioEmpresas.nombre }} {{ usuarioEmpresas.apellido }}</strong>
          <span class="muted"> · {{ roleLabel(usuarioEmpresas.rol) }}</span>
        </p>
        <p class="muted helper-text">
          {{ usuarioEmpresas.rol === 'lector'
            ? 'Seleccione cero o una empresa para este usuario.'
            : 'Seleccione las empresas a las que este usuario tendrá acceso.' }}
        </p>
      </div>

      <div v-if="errorModalEmpresas" class="alert alert-error">{{ errorModalEmpresas }}</div>
      <p v-if="cargandoEmpresasUsuario" class="muted">Cargando asignaciones...</p>

      <template v-else-if="usuarioEmpresas">
        <div v-if="usuarioEmpresas.rol === 'auditor'" class="assignment-list">
          <label v-for="empresa in empresas" :key="empresa.id" class="option-row">
            <input v-model="empresasSeleccionadas" type="checkbox" :value="empresa.id" />
            <span>{{ empresa.nombre }} <small class="muted">{{ empresa.rif }}</small></span>
          </label>
          <p v-if="!empresas.length" class="muted">No hay empresas disponibles.</p>
        </div>

        <div v-else class="field">
          <label for="empresa-lector">Empresa</label>
          <select id="empresa-lector" v-model="empresaAsignadaLector">
            <option value="">Sin asignar</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nombre }} ({{ empresa.rif }})
            </option>
          </select>
        </div>

        <div v-if="empresasSeleccionadas.length" class="assigned-tags">
          <span v-for="empresaId in empresasSeleccionadas" :key="empresaId" class="assigned-tag">
            {{ empresas.find((empresa) => empresa.id === empresaId)?.nombre || empresaId }}
            <button type="button" class="tag-remove" @click="quitarEmpresa(empresaId)">×</button>
          </span>
        </div>

        <span v-if="empresasFieldErrors.empresaIds" class="error-text">{{ empresasFieldErrors.empresaIds }}</span>
      </template>

      <template #footer>
        <button class="btn-ghost" type="button" @click="cerrarModalEmpresas">Cerrar</button>
        <button
          class="btn-primary"
          type="button"
          :disabled="guardandoEmpresas || cargandoEmpresasUsuario || !usuarioEmpresas"
          @click="guardarEmpresas"
        >
          {{ guardandoEmpresas ? 'Guardando...' : 'Guardar asignaciones' }}
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.actions-inline { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.4rem; }
.modal-form { margin: 0; }
.field-wide { grid-column: 1 / -1; }
.helper-text { margin-bottom: 0.5rem; }
.field-checkbox { display: flex; flex-direction: column; justify-content: flex-end; }
.checkbox-inline,
.option-row {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
}
.checkbox-inline input,
.option-row input,
.assigned-tag .tag-remove {
  width: auto;
}
.assignment-list {
  max-height: 15rem;
  overflow-y: auto;
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background-color: var(--surface-alt);
}
.modal-copy p:last-child { margin-bottom: 1rem; }
.assigned-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}
.assigned-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  color: var(--info);
  background-color: var(--info-soft);
}
.tag-remove {
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 700px) {
  .actions-inline {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
