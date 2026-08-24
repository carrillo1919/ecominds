<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAuthorization } from '@/composables/useAuthorization';
import { roleLabel } from '@/utils/validators';

const auth = useAuthStore();
const { isAdmin, canAuditar } = useAuthorization();

onMounted(() => {
  auth.fetchUser();
});
</script>

<template>
  <section>
    <div class="card hero-card">
      <h1>Hola, {{ auth.user?.nombre }}</h1>
      <p class="muted">
        Su rol actual es <strong>{{ roleLabel(auth.rol) }}</strong>. El acceso a cada modulo depende de este rol.
      </p>
      <span class="badge-rol">{{ roleLabel(auth.rol) }}</span>
    </div>

    <div class="grid-cards">
      <div class="card">
        <span class="card-icon">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 21V6l8-3 8 3v15" /><path d="M9 21v-6h6v6" />
          </svg>
        </span>
        <h3>Empresas</h3>
        <p class="muted">Registro de empresas, RIF y responsables por area.</p>
        <router-link :to="{ name: 'empresas' }">Ir a empresas &rarr;</router-link>
      </div>

      <div class="card">
        <span class="card-icon">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 11l2.5 2.5L16 8" />
          </svg>
        </span>
        <h3>Auditorias</h3>
        <p class="muted">
          {{ canAuditar ? 'Programe y ejecute auditorias de cumplimiento.' : 'Consulta de resultados de auditoria.' }}
        </p>
        <router-link :to="{ name: 'auditorias' }">Ir a auditorias &rarr;</router-link>
        <br />
        <router-link :to="{ name: 'estadisticas' }">Ver tablero de indicadores &rarr;</router-link>
      </div>

      <div class="card">
        <span class="card-icon">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
          </svg>
        </span>
        <h3>Usuarios</h3>
        <p class="muted" v-if="isAdmin">Gestione roles del personal del sistema.</p>
        <p class="muted" v-else>Solo el administrador gestiona usuarios.</p>
        <router-link v-if="isAdmin" :to="{ name: 'usuarios' }">Ir a usuarios &rarr;</router-link>
      </div>
    </div>
  </section>
</template>
