<script setup>
const props = defineProps({
  id: { type: String, default: '' },
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
  help: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const onInput = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<template>
  <div class="base-input">
    <label v-if="label" :for="id" class="base-input__label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="base-input__field"
      :class="{ 'base-input__field--error': error }"
      @input="onInput"
    />
    <span v-if="error" class="base-input__error">{{ error }}</span>
    <span v-else-if="help" class="base-input__help">{{ help }}</span>
  </div>
</template>

<style scoped>
.base-input { display: flex; flex-direction: column; gap: 0.25rem; }
.base-input__label { font-weight: 500; font-size: 0.875rem; }
.required { color: #b91c1c; }
.base-input__field {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;
  font-size: 0.9375rem;
  background: #fff;
}
.base-input__field:disabled { background: #f3f4f6; }
.base-input__field--error { border-color: #b91c1c; }
.base-input__error { color: #b91c1c; font-size: 0.8125rem; }
.base-input__help { color: #6b7280; font-size: 0.8125rem; }
</style>
