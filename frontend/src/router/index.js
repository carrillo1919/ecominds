import { createRouter, createWebHistory } from 'vue-router';
import { setUnauthorizedHandler } from '@/api/axios';
import { useAuthStore } from '@/stores/auth';
import EntesReguladoresView from '@/views/EntesReguladoresView.vue';
import RequisitosLegalesView from '@/views/RequisitosLegalesView.vue';
import EmpresaRequisitosView from '@/views/EmpresaRequisitosView.vue';

const routes = [
  { path: '/', redirect: { name: 'dashboard' } },

  // Rutas públicas (sin layout)
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
  { path: '/verify-email', name: 'verify-email', component: () => import('@/views/VerifyEmailView.vue'), meta: { public: true } },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('@/views/ForgotPasswordView.vue'), meta: { public: true } },
  { path: '/reset-password', name: 'reset-password', component: () => import('@/views/ResetPasswordView.vue'), meta: { public: true } },

  // Layout principal para todas las rutas autenticadas
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { requiresAuth: true } },
      { path: 'usuarios', name: 'usuarios', component: () => import('@/views/UsuariosView.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'empresas', name: 'empresas', component: () => import('@/views/EmpresasView.vue'), meta: { requiresAuth: true } },
      { path: 'entes-reguladores', name: 'entes-reguladores', component: EntesReguladoresView, meta: { requiresAuth: true } },
      { path: 'requisitos-legales', name: 'requisitos-legales', component: RequisitosLegalesView, meta: { requiresAuth: true } },
      { path: 'empresa-requisitos', name: 'empresa-requisitos', component: EmpresaRequisitosView, meta: { requiresAuth: true } },
      { path: 'requisitos', name: 'requisitos', component: () => import('@/views/RequisitosView.vue'), meta: { requiresAuth: true } },
      { path: 'auditorias', name: 'auditorias', component: () => import('@/views/AuditoriasView.vue'), meta: { requiresAuth: true } },
      { path: 'auditorias/:id', name: 'auditoria-detalle', component: () => import('@/views/AuditoriaDetalleView.vue'), meta: { requiresAuth: true } },
      { path: 'estadisticas', name: 'estadisticas', component: () => import('@/views/EstadisticasView.vue'), meta: { requiresAuth: true } },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { public: true } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.token) auth.restore();

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);

  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (auth.isAuthenticated && ['login', 'register'].includes(to.name)) {
    return { name: 'dashboard' };
  }

  const roles = to.matched.find((r) => r.meta.roles)?.meta.roles;
  if (requiresAuth && Array.isArray(roles) && roles.length && !roles.includes(auth.rol)) {
    return { name: 'dashboard' };
  }

  return true;
});

setUnauthorizedHandler(() => {
  const auth = useAuthStore();
  auth.logout();
  router.push({ name: 'login' });
});

export default router;
