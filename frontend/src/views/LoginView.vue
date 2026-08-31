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
const showPassword = ref(false);

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
  <div class="login-page">
    <section class="card card-narrow login-card">
      <img src="/icons/icono.png" alt="Icono empresa" class="login-logo" />
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
          <div class="password-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
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
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-image: url('/img/login.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-card {
  width: 100%;
  max-width: 420px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.95);
}

.login-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin: 0 auto 1rem;
}

.login-card form {
  text-align: left;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding-right: 2.5rem;
}

.toggle-password {
  position: absolute;
  right: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  color: #333;
}

.toggle-password svg {
  width: 20px;
  height: 20px;
}
</style>
