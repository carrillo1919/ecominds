<script setup>
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/stores/auth';
import { isEmail, required } from '@/utils/validators';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const form = reactive({ email: '', password: '' });
const errors = reactive({ email: '', password: '' });
const serverError = ref('');

const validar = () => {
  errors.email = isEmail(form.email) ? '' : 'Ingrese un correo valido';
  errors.password = required(form.password) ? '' : 'Ingrese su contrasena';
  return !errors.email && !errors.password;
};

const onSubmit = async () => {
  serverError.value = '';
  if (!validar()) return;

  const result = await auth.login({ email: form.email, password: form.password });

  if (!result.ok) {
    serverError.value = result.message;
    return;
  }

  toast.success(`Bienvenido, ${result.user.nombre}`);
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
  router.replace(redirect || { name: 'dashboard' });
};
</script>

<template>
  <section class="card card-narrow">
    <h1>Iniciar sesion</h1>
    <p class="muted">Acceda con las credenciales asignadas por el administrador.</p>

    <div v-if="serverError" class="alert alert-error">{{ serverError }}</div>

    <form novalidate @submit.prevent="onSubmit">
      <div class="field">
        <label for="email">Correo electronico</label>
        <input id="email" v-model.trim="form.email" type="email" autocomplete="email" />
        <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
      </div>

      <div class="field">
        <label for="password">Contrasena</label>
        <input id="password" v-model="form.password" type="password" autocomplete="current-password" />
        <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
      </div>

      <button class="btn" type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>

    <div class="form-links">
      <router-link :to="{ name: 'forgot-password' }">Olvide mi contrasena</router-link>
      <router-link :to="{ name: 'register' }">Crear una cuenta</router-link>
    </div>
  </section>
</template>
