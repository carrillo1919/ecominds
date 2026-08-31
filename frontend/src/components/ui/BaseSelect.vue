<script setup>
defineProps({
  id: { type: String, default: '' },
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  optionValue: { type: String, default: 'value' },
  optionLabel: { type: String, default: 'label' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  error: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'change']);

const onChange = (event) => {
  emit('update:modelValue', event.target.value);
  emit('change', event.target.value);
};
</script>

<template>
  <div class="base-select">
    <label v-if="label" :for="id" class="base-select__label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      class="base-select__field"
      :class="{ 'base-select__field--error': error }"
      @change="onChange"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt[optionValue]"
        :value="opt[optionValue]"
      >
        {{ opt[optionLabel] }}
      </option>
    </select>
    <span v-if="error" class="base-select__error">{{ error }}</span>
  </div>
</template>

<style scoped>
.base-select { display: flex; flex-direction: column; gap: 0.25rem; }
.base-select__label { font-weight: 500; font-size: 0.875rem; }
.required { color: #b91c1c; }
.base-select__field {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;
  font-size: 0.9375rem;
  background: #fff;
}
.base-select__field--error { border-color: #b91c1c; }
.base-select__error { color: #b91c1c; font-size: 0.8125rem; }
</style>
