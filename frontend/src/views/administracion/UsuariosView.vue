<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { format } from 'date-fns';
import api, { apiMessage } from '@/api/axios';
import { roleLabel } from '@/utils/validators';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const toast = useToast();

const usuarios = ref([]);
const cargando = ref(false);
const error = ref('');
const roles = ['admin', 'auditor', 'responsable', 'lector'];

const cargar = async () => {
  cargando.value = true;
  error.value = '';

  try {
    const { data } = await api.get('/users');
    usuarios.value = data.users;
  } catch (e) {
    error.value = apiMessage(e, 'No se pudieron cargar los usuarios');
  } finally {
    cargando.value = false;
  }
};

const cambiarRol = async (usuario, nuevoRol) => {
  try {
    const { data } = await api.patch(`/users/${usuario.id}/rol`, { rol: nuevoRol });
    usuario.rol = data.user.rol;
    toast.success('Rol actualizado');
  } catch (e) {
    toast.error(apiMessage(e, 'No se pudo actualizar el rol'));
    cargar();
  }
};

const fecha = (valor) => (valor ? format(new Date(valor), 'dd/MM/yyyy') : '-');

onMounted(cargar);
</script>

<template>
  <section>
    <div class="card">
      <h1>Usuarios del sistema</h1>
      <p class="muted">Solo el administrador puede consultar y modificar los roles.</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <p v-if="cargando" class="muted">Cargando usuarios...</p>

      <div v-else class="table-scroll">
      <table class="data">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Verificado</th>
            <th>Registro</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>{{ u.nombre }} {{ u.apellido }}</td>
            <td>{{ u.email }}</td>
            <td>
              <select
                :value="u.rol"
                :disabled="u.id === auth.user?.id"
                @change="cambiarRol(u, $event.target.value)"
              >
                <option v-for="r in roles" :key="r" :value="r">{{ roleLabel(r) }}</option>
              </select>
            </td>
            <td>{{ u.verified ? 'Si' : 'No' }}</td>
            <td>{{ fecha(u.createdAt) }}</td>
          </tr>
          <tr v-if="!usuarios.length">
            <td colspan="5" class="muted">No hay usuarios registrados.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </section>
</template>
