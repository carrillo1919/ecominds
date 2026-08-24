<script setup>
import { reactive, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/stores/auth';
import { isEmail, minLength, required } from '@/utils/validators';

const auth = useAuthStore();
const toast = useToast();

const form = reactive({ nombre: '', apellido: '', email: '', password: '', confirmPassword: '' });
const errors = reactive({ nombre: '', apellido: '', email: '', password: '', confirmPassword: '' });
const serverError = ref('');
const successMessage = ref('');

const validar = () => {
  errors.nombre = required(form.nombre) ? '' : 'El nombre es obligatorio';
  errors.apellido = required(form.apellido) ? '' : 'El apellido es obligatorio';
  errors.email = isEmail(form.email) ? '' : 'Ingrese un correo valido';
  errors.password = minLength(form.password, 8) ? '' : 'Minimo 8 caracteres';
  errors.confirmPassword = form.password === form.confirmPassword ? '' : 'Las contrasenas no coinciden';

  return Object.values(errors).every((e) => !e);
};

const onSubmit = async () => {
  serverError.value = '';
  successMessage.value = '';
  if (!validar()) return;

  const result = await auth.register({ ...form });

  if (!result.ok) {
    serverError.value = result.message;
    return;
  }

  successMessage.value = result.message;
  toast.success('Registro exitoso');
  Object.assign(form, { nombre: '', apellido: '', email: '', password: '', confirmPassword: '' });
};
</script>

<template>
  <section class="card card-narrow">
    <h1>Crear cuenta</h1>
    <p class="muted">Las cuentas nuevas se crean con rol Lector; el administrador puede elevar el rol.</p>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }} Enviamos un correo de verificacion a su bandeja de entrada; revise tambien la carpeta
      de correo no deseado.
    </div>
    <div v-if="serverError" class="alert alert-error">{{ serverError }}</div>

    <form novalidate @submit.prevent="onSubmit">
      <div class="field">
        <label for="nombre">Nombre</label>
        <input id="nombre" v-model.trim="form.nombre" type="text" />
        <span v-if="errors.nombre" class="error-text">{{ errors.nombre }}</span>
      </div>

      <div class="field">
        <label for="apellido">Apellido</label>
        <input id="apellido" v-model.trim="form.apellido" type="text" />
        <span v-if="errors.apellido" class="error-text">{{ errors.apellido }}</span>
      </div>

      <div class="field">
        <label for="email">Correo electronico</label>
        <input id="email" v-model.trim="form.email" type="email" autocomplete="email" />
        <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
      </div>

      <div class="field">
        <label for="password">Contrasena</label>
        <input id="password" v-model="form.password" type="password" autocomplete="new-password" />
        <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
      </div>

      <div class="field">
        <label for="confirmPassword">Confirmar contrasena</label>
        <input id="confirmPassword" v-model="form.confirmPassword" type="password" autocomplete="new-password" />
        <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
      </div>

      <button class="btn" type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Registrando...' : 'Registrarme' }}
      </button>
    </form>

    <div class="form-links">
      <router-link :to="{ name: 'login' }">Ya tengo cuenta</router-link>
    </div>
  </section>
</template>
