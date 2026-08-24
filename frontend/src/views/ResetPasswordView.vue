<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/stores/auth';
import { minLength } from '@/utils/validators';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const token = String(route.query.token || '');
const form = reactive({ password: '', confirmPassword: '' });
const errors = reactive({ password: '', confirmPassword: '' });
const serverError = ref('');
const successMessage = ref('');

const onSubmit = async () => {
  serverError.value = '';
  successMessage.value = '';

  errors.password = minLength(form.password, 8) ? '' : 'Minimo 8 caracteres';
  errors.confirmPassword = form.password === form.confirmPassword ? '' : 'Las contrasenas no coinciden';
  if (errors.password || errors.confirmPassword) return;

  const result = await auth.resetPassword({
    token,
    password: form.password,
    confirmPassword: form.confirmPassword,
  });

  if (!result.ok) {
    serverError.value = result.message;
    return;
  }

  successMessage.value = result.message;
  toast.success('Contrasena actualizada');
  setTimeout(() => router.replace({ name: 'login' }), 3000);
};
</script>

<template>
  <section class="card card-narrow">
    <h1>Nueva contrasena</h1>

    <div v-if="!token" class="alert alert-error">
      El enlace no contiene un token valido. Solicite uno nuevo desde
      <router-link :to="{ name: 'forgot-password' }">recuperar contrasena</router-link>.
    </div>

    <template v-else>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
      <div v-if="serverError" class="alert alert-error">{{ serverError }}</div>

      <form novalidate @submit.prevent="onSubmit">
        <div class="field">
          <label for="password">Nueva contrasena</label>
          <input id="password" v-model="form.password" type="password" autocomplete="new-password" />
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>

        <div class="field">
          <label for="confirmPassword">Confirmar contrasena</label>
          <input id="confirmPassword" v-model="form.confirmPassword" type="password" autocomplete="new-password" />
          <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
        </div>

        <button class="btn" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Guardando...' : 'Guardar contrasena' }}
        </button>
      </form>
    </template>
  </section>
</template>
