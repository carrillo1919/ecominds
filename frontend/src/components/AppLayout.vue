<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAuthorization } from '@/composables/useAuthorization';
import { roleLabel } from '@/utils/validators';
import EcoMindsLogo from '@/components/EcoMindsLogo.vue';
import menuConfig from '@/config/menu.json';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { canGestionarUsuarios } = useAuthorization();

const collapsed = ref(false);
const mobileOpen = ref(false);

const titulos = menuConfig.titles;

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

const hasPermission = (permission) => {
  if (!permission) return true;
  const permissions = { canGestionarUsuarios };
  return !!permissions[permission];
};

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
        <span class="sidebar__logo">
          <EcoMindsLogo size="35" />
        </span>
        <span class="sidebar__brand-text">
          <strong>EcoMinds</strong>
          <span>Auditoria Ambiental</span>
        </span>
      </router-link>

      <div
        v-for="section in menuConfig.sections"
        :key="section.title"
        class="sidebar__section-group"
      >
        <p v-if="!collapsed" class="sidebar__section">{{ section.title }}</p>
        <nav class="sidebar__nav">
          <template v-for="item in section.items">
            <router-link
              v-if="hasPermission(item.permission)"
              :key="item.name"
              class="sidebar__link"
              :to="{ name: item.name }"
              :aria-label="item.label"
            >
              <span class="sidebar__icon">
                <svg viewBox="0 0 24 24" v-html="item.icon"></svg>
              </span>
              <span class="sidebar__label">{{ item.label }}</span>
              <span v-if="collapsed" class="sidebar__tooltip">{{ item.label }}</span>
            </router-link>
          </template>
        </nav>
      </div>

      <div
        v-for="section in menuConfig.footerItems"
        :key="section.title"
        class="sidebar__section-group"
      >
        <p v-if="!collapsed" class="sidebar__section">{{ section.title }}</p>
        <nav class="sidebar__nav">
          <template v-for="item in section.items">
            <router-link
              v-if="hasPermission(item.permission)"
              :key="item.name"
              class="sidebar__link"
              :to="{ name: item.name }"
              :aria-label="item.label"
            >
              <span class="sidebar__icon">
                <svg viewBox="0 0 24 24" v-html="item.icon"></svg>
              </span>
              <span class="sidebar__label">{{ item.label }}</span>
              <span v-if="collapsed" class="sidebar__tooltip">{{ item.label }}</span>
            </router-link>
          </template>
        </nav>
      </div>

      <nav class="sidebar__nav">
        <template v-for="item in menuConfig.footerItems">
          <router-link
            v-if="hasPermission(item.permission)"
            :key="item.name"
            class="sidebar__link"
            :to="{ name: item.name }"
          >
            <span class="sidebar__icon">
              <svg viewBox="0 0 24 24" v-html="item.icon"></svg>
            </span>
            <span>{{ item.label }}</span>
          </router-link>
        </template>
      </nav>
    </aside>

    <button class="sidebar-backdrop" type="button" aria-label="Cerrar menu" @click="mobileOpen = false"></button>

    <div class="main-column">
      <header class="topbar">
        <button
          class="icon-button menu-toggle"
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

        <div class="topbar__actions">
          <div class="user-chip">
            <span class="avatar">{{ iniciales }}</span>
            <div class="user-chip__info">
              <strong>{{ auth.nombreCompleto }}</strong>
              <span class="user-chip__role">{{ roleLabel(auth.rol) }}</span>
            </div>
          </div>
          <button class="btn-logout" type="button" @click="handleLogout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Salir</span>
          </button>
        </div>
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
      <span class="sidebar__logo">
        <EcoMindsLogo size="35" />
      </span>
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

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  min-height: 64px;
}

.topbar__title {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.topbar__title strong {
  font-size: 1.1rem;
  font-weight: 700;
}

.topbar__title span {
  font-size: 0.75rem;
  color: var(--on-surface-variant, #666);
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.75rem 0.35rem 0.35rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.user-chip .avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary, #4caf50);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
}

.user-chip__info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.user-chip__info strong {
  font-size: 0.82rem;
  font-weight: 600;
}

.user-chip__role {
  font-size: 0.72rem;
  color: var(--on-surface-variant, #9e9e9e);
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-logout:hover {
  background: rgba(244, 67, 54, 0.15);
  border-color: rgba(244, 67, 54, 0.4);
  color: #f44336;
}

.btn-logout svg {
  width: 18px;
  height: 18px;
}

.sidebar {
  transition: width 0.25s ease;
}

.app-shell--auth.is-collapsed .sidebar {
  width: 64px;
}

.sidebar__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  border-radius: 0.5rem;
}

.sidebar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.sidebar__icon svg {
  width: 100%;
  height: 100%;
}

.app-shell--auth.is-collapsed .sidebar__label,
.app-shell--auth.is-collapsed .sidebar__section {
  display: none;
}

.sidebar__tooltip {
  position: absolute;
  left: calc(100% + 0.6rem);
  top: 50%;
  transform: translateY(-50%);
  background: var(--surface, #1e293b);
  color: var(--on-surface, #fff);
  padding: 0.35rem 0.7rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
  transition: opacity 0.15s ease, visibility 0.15s ease;
}

.sidebar__tooltip::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent var(--surface, #1e293b) transparent transparent;
}

.sidebar__link:hover .sidebar__tooltip {
  opacity: 1;
  visibility: visible;
}

@media (max-width: 640px) {
  .topbar__title span {
    display: none;
  }

  .user-chip__info {
    display: none;
  }

  .user-chip {
    padding: 0.25rem;
  }

  .btn-logout span {
    display: none;
  }
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  text-decoration: none;
}

.sidebar__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #ffffff;
  border-radius: 0.5rem;
  padding: 0.35rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.sidebar__logo svg {
  width: 100%;
  height: 100%;
}
</style>