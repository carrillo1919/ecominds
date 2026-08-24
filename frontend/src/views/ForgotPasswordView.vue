<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { isEmail } from '@/utils/validators';

const auth = useAuthStore();

const email = ref('');
const error = ref('');
const serverError = ref('');
const successMessage = ref('');

const onSubmit = async () => {
  error.value = '';
  serverError.value = '';
  successMessage.value = '';

  if (!isEmail(email.value)) {
    error.value = 'Ingrese un correo valido';
    return;
  }

  const result = await auth.forgotPassword(email.value);

  if (!result.ok) {
    serverError.value = result.message;
    return;
  }

  successMessage.value = result.message;
  email.value = '';
};
</script>

<template>
  <section class="card card-narrow">
    <h1>Recuperar contrasena</h1>
    <p class="muted">Le enviaremos un enlace valido por una hora para definir una nueva contrasena.</p>

    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
    <div v-if="serverError" class="alert alert-error">{{ serverError }}</div>

    <form novalidate @submit.prevent="onSubmit">
      <div class="field">
        <label for="email">Correo electronico</label>
        <input id="email" v-model.trim="email" type="email" autocomplete="email" />
        <span v-if="error" class="error-text">{{ error }}</span>
      </div>

      <button class="btn" type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Enviando...' : 'Enviar enlace' }}
      </button>
    </form>

    <div class="form-links">
      <router-link :to="{ name: 'login' }">Volver al inicio de sesion</router-link>
    </div>
  </section>
</template>
