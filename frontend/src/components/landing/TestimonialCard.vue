<template>
  <div class="bg-surface-container-lowest p-lg rounded-xl border border-outline/10 flex flex-col gap-md relative">
    <span class="material-symbols-outlined text-surface-variant absolute top-lg right-lg text-[48px] opacity-20">{{ quoteIcon }}</span>
    <p class="font-body-lg text-body-lg text-on-surface italic relative z-10">"{{ quote }}"</p>
    <div class="flex items-center gap-md mt-auto pt-md border-t border-outline/5">
      <div class="w-12 h-12 rounded-full bg-surface-variant overflow-hidden">
        <img :src="image" :alt="name" class="w-full h-full object-cover" />
      </div>
      <div>
        <h4 class="font-label-md text-label-md text-on-surface">{{ name }}</h4>
        <p class="font-caption text-caption text-on-surface-variant">{{ role }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  quote: String,
  name: String,
  role: String,
  image: String,
  quoteIcon: {
    type: String,
    default: 'format_quote'
  }
})
</script>