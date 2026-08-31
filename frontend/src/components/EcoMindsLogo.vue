<template>
  <img
    :src="src"
    :width="size"
    :height="size"
    alt="EcoMinds logo"
    class="object-contain"
  />
</template>

<script setup>
defineProps({
  src: {
    type: String,
    default: '/icons/icono_hoja.png'
  },
  size: {
    type: [String, Number],
    default: 40
  }
})
</script>