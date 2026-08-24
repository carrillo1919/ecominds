import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export function useAuthorization() {
  const auth = useAuthStore();

  const rol = computed(() => auth.rol);
  const hasRole = (...roles) => roles.flat().includes(auth.rol);

  return {
    rol,
    hasRole,
    isAdmin: computed(() => auth.rol === 'admin'),
    isAuditor: computed(() => auth.rol === 'auditor'),
    isResponsable: computed(() => auth.rol === 'responsable'),
    isLector: computed(() => auth.rol === 'lector'),
    canGestionarUsuarios: computed(() => auth.rol === 'admin'),
    canAuditar: computed(() => ['admin', 'auditor'].includes(auth.rol)),
  };
}

export default useAuthorization;
