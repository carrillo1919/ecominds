<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useEmpleadosStore } from '@/stores/empleados';
import { getEmpleado } from '@/api/empleados';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useEmpleadosStore();

const empleado = ref(null);
const cargando = ref(true);
const guardando = ref(false);

const form = reactive({
  passwordUsuario: '',
  rolUsuario: 'responsable',
});

const cargar = async () => {
  cargando.value = true;
  try {
    const { data } = await getEmpleado(route.params.id);
    empleado.value = data.empleado;
  } catch {
    toast.error('No se pudo cargar el empleado');
    router.push({ name: 'empleados' });
  } finally {
    cargando.value = false;
  }
};

const crearUsuario = async () => {
  if (!form.passwordUsuario.trim()) {
    toast.error('La contraseña es obligatoria');
    return;
  }
  guardando.value = true;
  const result = await store.asignarUsuario(route.params.id, {
    passwordUsuario: form.passwordUsuario,
    rolUsuario: form.rolUsuario,
  });
  guardando.value = false;
  if (result.ok) {
    toast.success(result.message);
    router.push({ name: 'empleados' });
  } else {
    toast.error(result.message);
  }
};

onMounted(cargar);
</script>

<template>
  <section>
    <button class="btn-ghost" type="button" @click="router.push({ name: 'empleados' })">← Volver</button>

    <div v-if="cargando" class="muted" style="margin-top:1rem">Cargando...</div>

    <div v-else-if="empleado" class="card" style="margin-top:1rem; max-width:480px">
      <h2>Crear acceso al sistema</h2>
      <p class="muted">
        Empleado: <strong>{{ empleado.nombre }} {{ empleado.apellido }}</strong><br />
        Correo: {{ empleado.email }}
      </p>

      <div v-if="empleado.usuario" class="alert alert-info">
        Este empleado ya tiene un usuario asociado con el rol
        <strong>{{ empleado.usuario.rol }}</strong>.
      </div>

      <template v-else>
        <div class="form-grid">
          <label>
            Contraseña inicial *
            <input v-model="form.passwordUsuario" type="password" autocomplete="new-password" />
          </label>
          <label>
            Rol
            <select v-model="form.rolUsuario">
              <option value="responsable">Responsable de área</option>
              <option value="auditor">Auditor</option>
              <option value="lector">Lector</option>
            </select>
          </label>
        </div>
        <div class="actions-row">
          <button class="btn-primary" type="button" :disabled="guardando" @click="crearUsuario">
            {{ guardando ? 'Creando...' : 'Crear usuario' }}
          </button>
        </div>
      </template>
    </div>
  </section>
</template>
