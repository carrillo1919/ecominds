<template>
  <div
    :class="[
      'relative rounded-xl overflow-hidden border border-outline/10 p-lg shadow-eco-glow transition-all duration-300 flex flex-col justify-between group hover:shadow-eco-glow-lg min-h-[320px]',
      large ? 'md:col-span-2' : '',
      medium ? 'md:col-span-2 flex-col sm:flex-row gap-lg items-center' : ''
    ]"
  >
    <div class="absolute inset-0 z-0">
      <img :src="image" :alt="title" class="w-full h-full object-cover group-hover:opacity-10 transition-opacity duration-300 opacity-20" />
    </div>
    <div class="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/40 to-transparent z-10" />
    <div class="relative z-20" :class="medium ? 'flex flex-col sm:flex-row gap-lg items-center' : ''">
      <div class="w-16 h-16 shrink-0 bg-primary/5 rounded-lg flex items-center justify-center mb-lg" :class="medium ? 'mb-0' : ''">
        <span class="material-symbols-outlined text-primary text-[32px]">{{ icon }}</span>
      </div>
      <div>
        <h3 class="font-headline-md text-headline-md text-on-surface mb-sm">{{ title }}</h3>
        <p class="font-body-md text-body-md text-on-surface-variant max-w-md">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  icon: String,
  image: String,
  large: Boolean,
  medium: Boolean
})
</script>
