<!-- filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\frontend\src\components\landing\ValueCard.vue -->
<template>
  <div class="flex" :class="alignClass">
    <div
      class="bg-surface-container-lowest/90 backdrop-blur-md p-lg rounded-xl border border-outline/10 flex flex-col sm:flex-row items-center gap-md eco-glow transition-all duration-300 max-w-2xl w-full shadow-sm"
      :class="reverseClass"
    >
      <div class="w-24 h-24 shrink-0 rounded-lg flex items-center justify-center overflow-hidden bg-secondary-container/10">
        <img :src="image" :alt="title" class="w-full h-full object-cover" />
      </div>
      <div :class="textAlignClass">
        <h3 class="font-headline-md text-headline-md text-on-surface mb-xs">{{ title }}</h3>
        <p class="font-body-md text-body-md text-on-surface-variant">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  description: String,
  image: String,
  align: {
    type: String,
    default: 'left'
  }
})

const alignClass = computed(() => {
  switch (props.align) {
    case 'right': return 'justify-end'
    case 'center': return 'justify-center mt-md'
    default: return 'justify-start'
  }
})

const reverseClass = computed(() => props.align === 'right' ? 'sm:flex-row-reverse' : '')
const textAlignClass = computed(() => {
  if (props.align === 'center') return 'text-center'
  if (props.align === 'right') return 'text-left sm:text-right'
  return 'text-left'
})
</script>