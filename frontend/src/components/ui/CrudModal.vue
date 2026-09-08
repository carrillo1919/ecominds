<script setup>
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';

defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  saveLabel: { type: String, default: 'Guardar' },
  saving: { type: Boolean, default: false },
  saveDisabled: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'save']);

const close = () => emit('close');
const save = () => emit('save');
</script>

<template>
  <BaseModal :show="show" :title="title" @close="close">
    <div class="crud-modal__body">
      <slot />
    </div>
    <template #footer>
      <BaseButton variant="ghost" :disabled="saving" @click="close">
        Cancelar
      </BaseButton>
      <BaseButton
        variant="primary"
        :loading="saving"
        :disabled="saveDisabled || saving"
        @click="save"
      >
        {{ saving ? 'Guardando...' : saveLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.crud-modal__body { display: grid; gap: 1rem; }
.crud-modal__body :deep(.form-grid) { margin: 0; }
</style>
