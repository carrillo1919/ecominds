<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const estado = ref('cargando');
const mensaje = ref('Verificando su cuenta...');

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    estado.value = 'error';
    mensaje.value = 'El enlace no contiene un token de verificacion.';
    return;
  }

  const result = await auth.verifyEmail(token);
  estado.value = result.ok ? 'ok' : 'error';
  mensaje.value = result.message;

  if (result.ok) {
    setTimeout(() => router.replace({ name: 'login' }), 4000);
  }
});
</script>

<template>
  <section class="card card-narrow">
    <h1>Verificacion de correo</h1>

    <div v-if="estado === 'cargando'" class="alert alert-info">{{ mensaje }}</div>
    <div v-else-if="estado === 'ok'" class="alert alert-success">
      {{ mensaje }} Sera redirigido al inicio de sesion en unos segundos.
    </div>
    <div v-else class="alert alert-error">{{ mensaje }}</div>

    <router-link :to="{ name: 'login' }">Ir al inicio de sesion</router-link>
  </section>
</template>
