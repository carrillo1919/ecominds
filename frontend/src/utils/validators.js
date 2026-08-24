export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

export const minLength = (value, length) => String(value || '').length >= length;

export const required = (value) => String(value || '').trim().length > 0;

export const roleLabel = (rol) =>
  ({ admin: 'Administrador', auditor: 'Auditor', responsable: 'Responsable de area', lector: 'Lector' }[rol] || rol);
