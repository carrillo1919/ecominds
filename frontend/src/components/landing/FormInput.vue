<template>
  <div class="flex flex-col gap-xs">
    <label :for="name" class="font-label-md text-label-md text-on-surface-variant">{{ label }}</label>
    <input
      :id="name"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="border border-outline/20 bg-surface-container-lowest rounded-lg px-sm py-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface"
    />
  </div>
</template>

<script setup>
defineProps({
  name: String,
  label: String,
  type: {
    type: String,
    default: 'text'
  },
  placeholder: String,
  modelValue: String
})

defineEmits(['update:modelValue'])
</script>
