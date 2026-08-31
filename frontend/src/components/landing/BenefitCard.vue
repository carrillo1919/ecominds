<template>
  <div class="bg-surface-container-low p-md rounded-xl border border-outline/5 hover:border-primary/20 hover:shadow-md transition-all duration-300 flex gap-md group">
    <div class="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
      <span class="material-symbols-outlined">{{ icon }}</span>
    </div>
    <div>
      <h4 class="font-headline-md text-headline-md text-on-surface">{{ title }}</h4>
      <p class="font-body-md text-body-md text-on-surface-variant mt-xs">{{ description }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  icon: String
})
</script>
