<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAuthorization } from '@/composables/useAuthorization';
import { roleLabel } from '@/utils/validators';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { canGestionarUsuarios } = useAuthorization();

const collapsed = ref(false);
const mobileOpen = ref(false);

const titulos = {
  dashboard: { titulo: 'Panel principal', desc: 'Resumen del sistema de cumplimiento' },
  usuarios: { titulo: 'Usuarios', desc: 'Gestion de cuentas y roles' },
  empresas: { titulo: 'Empresas', desc: 'Registro de empresas auditadas' },
  'entes-reguladores': { titulo: 'Entes Reguladores', desc: 'Organismos que emiten normativa' },
  'requisitos-legales': { titulo: 'Requisitos Legales', desc: 'Catalogo de obligaciones normativas' },
  'empresa-requisitos': { titulo: 'Asignacion de Requisitos', desc: 'Vinculacion empresa - obligaciones' },
  requisitos: { titulo: 'Checklist', desc: 'Checklist legal y requisitos criticos' },
  auditorias: { titulo: 'Auditorias', desc: 'Ejecucion y seguimiento de auditorias' },
  'auditoria-detalle': { titulo: 'Auditoria', desc: 'Evaluacion, matriz de riesgo e informe' },
  estadisticas: { titulo: 'Tablero', desc: 'Indicadores de cumplimiento por periodo' },
  empleados: { titulo: 'Empleados', desc: 'Gestion de empleados de la empresa' },
  'empleado-detalle': { titulo: 'Empleado', desc: 'Detalle y acceso al sistema' },
  documentos: { titulo: 'Documentos', desc: 'Documentos asignados a la empresa' },
  'documento-detalle': { titulo: 'Documento', desc: 'Detalle y archivos adjuntos' },
};

const encabezado = computed(
  () => titulos[route.name] || { titulo: 'EcoMinds', desc: 'Auditoria Ambiental' },
);

const iniciales = computed(() => {
  const n = auth.user?.nombre?.[0] || '';
  const a = auth.user?.apellido?.[0] || '';
  return (n + a).toUpperCase() || 'US';
});

watch(() => route.fullPath, () => {
  mobileOpen.value = false;
});

const handleLogout = () => {
  auth.logout();
  router.push({ name: 'login' });
};
</script>

<template>
  <!-- Shell con sidebar para usuarios autenticados -->
  <div
    v-if="auth.isAuthenticated"
    class="app-shell app-shell--auth"
    :class="{ 'is-collapsed': collapsed, 'is-open': mobileOpen }"
  >
    <aside class="sidebar">
      <router-link class="sidebar__brand" :to="{ name: 'dashboard' }">
        <span class="sidebar__logo">SR</span>
        <span class="sidebar__brand-text">
          <strong>EcoMinds</strong>
          <span>Auditoria Ambiental</span>
        </span>
      </router-link>

      <p class="sidebar__section">Principal</p>
      <nav class="sidebar__nav">
        <router-link class="sidebar__link" :to="{ name: 'dashboard' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
          </span>
          <span>Inicio</span>
        </router-link>

        <router-link v-if="canGestionarUsuarios" class="sidebar__link" :to="{ name: 'usuarios' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M17 8.5a2.8 2.8 0 1 0 0-.1M18 20c0-2.4-.8-4-2-5" /></svg>
          </span>
          <span>Usuarios</span>
        </router-link>
      </nav>

      <p class="sidebar__section">Cumplimiento</p>
      <nav class="sidebar__nav">
        <router-link class="sidebar__link" :to="{ name: 'empresas' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M4 21V6l8-3 8 3v15" /><path d="M9 21v-6h6v6" /></svg>
          </span>
          <span>Empresas</span>
        </router-link>

        <router-link class="sidebar__link" :to="{ name: 'entes-reguladores' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
          </span>
          <span>Entes Reguladores</span>
        </router-link>

        <router-link class="sidebar__link" :to="{ name: 'requisitos-legales' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 12h6M9 16h6" /></svg>
          </span>
          <span>Requisitos Legales</span>
        </router-link>

        <router-link class="sidebar__link" :to="{ name: 'empresa-requisitos' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
          </span>
          <span>Asignar Requisitos</span>
        </router-link>

        <router-link class="sidebar__link" :to="{ name: 'requisitos' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h6M9 16h4" /></svg>
          </span>
          <span>Requisitos</span>
        </router-link>

        <router-link class="sidebar__link" :to="{ name: 'auditorias' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M9 11l2.5 2.5L16 8" /><rect x="4" y="4" width="16" height="16" rx="3" /></svg>
          </span>
          <span>Auditorias</span>
        </router-link>

        <router-link class="sidebar__link" :to="{ name: 'estadisticas' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
          </span>
          <span>Tablero</span>
        </router-link>
      </nav>

      <p class="sidebar__section">Empleados y Documentos</p>
      <nav class="sidebar__nav">
        <router-link class="sidebar__link" :to="{ name: 'empleados' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.87" /></svg>
          </span>
          <span>Empleados</span>
        </router-link>

        <router-link class="sidebar__link" :to="{ name: 'documentos' }">
          <span class="sidebar__icon">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h4" /></svg>
          </span>
          <span>Documentos</span>
        </router-link>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
          <span class="avatar">{{ iniciales }}</span>
          <span class="sidebar__user-info">
            <strong>{{ auth.nombreCompleto }}</strong>
            <span>{{ roleLabel(auth.rol) }}</span>
          </span>
        </div>
        <button class="btn-ghost" type="button" style="margin-top: 0.6rem; width: 100%" @click="handleLogout">
          Salir
        </button>
      </div>
    </aside>

    <button class="sidebar-backdrop" type="button" aria-label="Cerrar menu" @click="mobileOpen = false"></button>

    <div class="main-column">
      <header class="topbar">
        <button
          class="icon-button"
          type="button"
          aria-label="Alternar menu lateral"
          @click="collapsed = !collapsed; mobileOpen = !mobileOpen"
        >
          <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <span class="topbar__title">
          <strong>{{ encabezado.titulo }}</strong>
          <span>{{ encabezado.desc }}</span>
        </span>

        <span class="topbar__spacer"></span>
        <span class="badge-rol">{{ roleLabel(auth.rol) }}</span>
      </header>

      <main class="content">
        <router-view />
      </main>

      <footer class="footer">
        EcoMinds - Sistema de Registro y Control de Auditoria Ambiental &middot; Republica Bolivariana de Venezuela
      </footer>
    </div>
  </div>

  <!-- Shell centrado para pantallas publicas (login, registro, recuperacion) -->
  <div v-else class="auth-shell">
    <router-link class="auth-shell__header" :to="{ name: 'login' }">
      <span class="sidebar__logo">SR</span>
      <span class="sidebar__brand-text">
        <strong>EcoMinds</strong>
        <span>Auditoria Ambiental</span>
      </span>
    </router-link>

    <main class="content content--centered">
      <router-view />
    </main>

    <footer class="footer">
      EcoMinds &middot; Republica Bolivariana de Venezuela
    </footer>
  </div>
</template>
