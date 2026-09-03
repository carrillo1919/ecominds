import { createRouter, createWebHistory } from 'vue-router';
import { setUnauthorizedHandler } from '@/api/axios';
import { useAuthStore } from '@/stores/auth';

const routes = [
  { path: '/', name: 'landing', component: () => import('@/views/landing/LandingView.vue'), meta: { public: true } },

  // Rutas públicas del sistema
  { path: '/app/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { public: true } },
  { path: '/app/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { public: true } },
  { path: '/app/verify-email', name: 'verify-email', component: () => import('@/views/auth/VerifyEmailView.vue'), meta: { public: true } },
  { path: '/app/forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { public: true } },
  { path: '/app/reset-password', name: 'reset-password', component: () => import('@/views/auth/ResetPasswordView.vue'), meta: { public: true } },

  // Layout principal
  {
    path: '/app',
    component: () => import('@/components/AppLayout.vue'),
    redirect: { name: 'dashboard' },
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/sistema/DashboardView.vue'), meta: { requiresAuth: true } },
      { path: 'usuarios', name: 'usuarios', component: () => import('@/views/administracion/UsuariosView.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'empresas', name: 'empresas', component: () => import('@/views/administracion/EmpresasView.vue'), meta: { requiresAuth: true } },
      { path: 'entes-reguladores', name: 'entes-reguladores', component: () => import('@/views/cumplimiento/EntesReguladoresView.vue'), meta: { requiresAuth: true } },
      { path: 'requisitos-legales', name: 'requisitos-legales', component: () => import('@/views/cumplimiento/RequisitosLegalesView.vue'), meta: { requiresAuth: true } },
      { path: 'empresa-requisitos', name: 'empresa-requisitos', component: () => import('@/views/cumplimiento/EmpresaRequisitosView.vue'), meta: { requiresAuth: true } },
      { path: 'checklist', name: 'checklist', component: () => import('@/views/cumplimiento/ChecklistView.vue'), meta: { requiresAuth: true } },
      { path: 'auditorias', name: 'auditorias', component: () => import('@/views/auditoria/AuditoriasView.vue'), meta: { requiresAuth: true } },
      { path: 'auditorias/:id', name: 'auditoria-detalle', component: () => import('@/views/auditoria/AuditoriaDetalleView.vue'), meta: { requiresAuth: true } },
      { path: 'estadisticas', name: 'estadisticas', component: () => import('@/views/auditoria/EstadisticasView.vue'), meta: { requiresAuth: true } },
      { path: 'empleados', name: 'empleados', component: () => import('@/views/empleados/EmpleadosView.vue'), meta: { requiresAuth: true } },
      { path: 'empleados/:id', name: 'empleado-detalle', component: () => import('@/views/empleados/EmpleadoDetalleView.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'documentos', name: 'documentos', component: () => import('@/views/documentos/DocumentosView.vue'), meta: { requiresAuth: true } },
      { path: 'documentos/:id', name: 'documento-detalle', component: () => import('@/views/documentos/DocumentoDetalleView.vue'), meta: { requiresAuth: true } },
      {
        path: '/calendario',
        name: 'calendario',
        component: () => import('@/views/calendario/CalendarioView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/notificaciones',
        name: 'NotificacionesConfig',
        component: () => import('@/views/administracion/NotificacionesConfigView.vue'),
        meta: { requiresAuth: true, roles: ['admin'] },
      },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/sistema/NotFoundView.vue'), meta: { public: true } },
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
