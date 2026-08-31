<script setup>
const props = defineProps({
  role: { type: String, default: '' },
});

const labels = {
  admin: 'Administrador',
  auditor: 'Auditor',
  responsable: 'Responsable',
  lector: 'Lector',
};

const classes = {
  admin: 'role--admin',
  auditor: 'role--auditor',
  responsable: 'role--responsable',
  lector: 'role--lector',
};
</script>

<template>
  <span class="user-role-badge" :class="classes[role] || 'role--default'">
    {{ labels[role] || role }}
  </span>
</template>

<style scoped>
.user-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.role--admin { background: #dbeafe; color: #1e40af; }
.role--auditor { background: #e0e7ff; color: #3730a3; }
.role--responsable { background: #d1fae5; color: #065f46; }
.role--lector { background: #f3f4f6; color: #4b5563; }
.role--default { background: #f3f4f6; color: #4b5563; }
</style>
