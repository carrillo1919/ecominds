<!-- filepath: c:\Users\tf carrillo\Documents\proyectos\ecoMinds\frontend\src\views\LandingView.vue -->
<template>
  <div class="min-h-screen bg-background text-on-background font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
    <!-- TopNavBar -->
    <header class="bg-surface w-full top-0 sticky border-b border-outline/10 z-50">
      <div class="flex justify-between items-center px-gutter py-sm max-w-container-max mx-auto">
        <div class="flex items-center gap-base">
          <EcoMindsLogo size="32" class="text-primary" />
          <span class="font-headline-md text-headline-md font-bold text-primary">{{ config.brand.name }}</span>
        </div>

        <nav class="hidden md:flex items-center gap-gutter">
          <a
            v-for="link in config.nav"
            :key="link.href"
            :href="link.href"
            class="text-on-surface-variant hover:text-primary transition-colors duration-200 active:scale-95"
          >
            {{ link.label }}
          </a>
        </nav>

        <a
          :href="config.hero.primaryCta.href"
          class="bg-primary text-on-primary font-label-md text-label-md px-gutter py-sm rounded-lg hover:bg-primary-container transition-colors hidden md:block text-center"
        >
          {{ config.hero.primaryCta.label }}
        </a>

        <button class="md:hidden text-primary" aria-label="Menú">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>
    </header>

    <main>
      <!-- Hero Section -->
      <section class="relative bg-surface-bright overflow-hidden">
        <div class="absolute inset-0 z-0">
          <img
            alt="Edificio de oficinas sostenible"
            class="w-full h-full object-cover opacity-20"
            :src="config.hero.background"
          />
        </div>
        <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div class="max-w-container-max mx-auto px-gutter py-xl md:py-[120px] flex flex-col items-center text-center relative z-10">
          <div class="flex flex-col gap-lg max-w-3xl">
            <div class="flex flex-col gap-base items-center">
              <span class="text-secondary font-label-md text-label-md uppercase tracking-widest">{{ config.hero.eyebrow }}</span>
              <h1 class="font-display-lg text-display-lg text-on-surface md:text-[56px] md:leading-[64px]">
                {{ config.hero.title }}
              </h1>
              <p class="font-body-lg text-body-lg text-on-surface-variant mt-sm">
                {{ config.hero.description }}
              </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-md justify-center">
              <a
                :href="config.hero.primaryCta.href"
                class="bg-primary text-on-primary font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-primary-container transition-colors shadow-sm"
              >
                {{ config.hero.primaryCta.label }}
              </a>
              <a
                :href="config.hero.secondaryCta.href"
                class="border border-outline bg-transparent text-on-surface font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-surface-variant transition-colors"
              >
                {{ config.hero.secondaryCta.label }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Services Section -->
      <section id="services" class="py-xl bg-surface">
        <div class="max-w-container-max mx-auto px-gutter">
          <div class="text-center mb-xl max-w-2xl mx-auto flex flex-col gap-base">
            <h2 class="font-headline-lg text-headline-lg text-on-surface">{{ config.services.title }}</h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              {{ config.services.description }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
            <ServiceCard
              v-for="service in config.services.items"
              :key="service.title"
              v-bind="service"
            />
          </div>
        </div>
      </section>

      <!-- Who We Are Section -->
      <section class="py-xl relative border-y border-outline/5 overflow-hidden">
        <div class="absolute inset-0 z-0">
          <img
            alt="Naturaleza y tecnología"
            class="w-full h-full object-cover opacity-80"
            :src="config.whoWeAre.background"
          />
        </div>
        <div class="absolute inset-0 z-0 bg-surface/60" />
        <div class="max-w-container-max mx-auto px-gutter relative z-10">
          <div class="text-center mb-xl">
            <h2 class="font-headline-lg text-headline-lg text-on-surface">{{ config.whoWeAre.title }}</h2>
          </div>
          <div class="flex flex-col gap-lg">
            <ValueCard
              v-for="value in config.whoWeAre.values"
              :key="value.title"
              v-bind="value"
              :align="value.align"
            />
          </div>
        </div>
      </section>

      <!-- Benefits Section -->
      <section id="beneficios" class="py-xl bg-surface-container-lowest bg-gradient-to-t from-surface-container-low">
        <div class="max-w-container-max mx-auto px-gutter">
          <div class="grid md:grid-cols-12 gap-xl items-center">
            <!-- Image Column -->
            <div class="md:col-span-5 relative group">
              <div class="absolute -inset-4 bg-primary/5 rounded-xl blur-2xl group-hover:bg-primary/10 transition-colors duration-300" />
              <div class="relative rounded-xl overflow-hidden aspect-[4/5] border border-outline/10 shadow-sm">
                <img
                  alt="Arquitectura sostenible moderna"
                  class="w-full h-full object-cover"
                  :src="config.benefits.featureImage"
                />
                <div class="absolute bottom-md left-md right-md">
                  <div class="bg-surface-container-lowest/90 backdrop-blur-md p-md rounded-lg border border-primary/20 shadow-lg flex items-center gap-md">
                    <div class="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined">{{ config.benefits.badge.icon }}</span>
                    </div>
                    <div>
                      <p class="font-label-md text-label-md text-primary uppercase tracking-wider">{{ config.benefits.badge.label }}</p>
                      <p class="font-headline-sm text-headline-sm font-bold text-on-surface">{{ config.benefits.badge.value }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Content Column -->
            <div class="md:col-span-7 flex flex-col gap-lg">
              <div class="flex flex-col gap-base">
                <span class="text-secondary font-label-md text-label-md uppercase tracking-widest">{{ config.benefits.eyebrow }}</span>
                <h2 class="font-display-lg text-display-lg text-on-surface">{{ config.benefits.title }}</h2>
                <p class="font-body-lg text-body-lg text-on-surface-variant">
                  {{ config.benefits.description }}
                </p>
              </div>
              <div class="grid gap-md">
                <BenefitCard
                  v-for="benefit in config.benefits.items"
                  :key="benefit.title"
                  v-bind="benefit"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials Section -->
      <section id="testimonials" class="py-xl bg-surface-container-low border-y border-outline/5">
        <div class="max-w-container-max mx-auto px-gutter">
          <h2 class="font-headline-lg text-headline-lg text-on-surface text-center mb-xl">{{ config.testimonials.title }}</h2>
          <div class="grid md:grid-cols-2 gap-lg">
            <TestimonialCard
              v-for="testimonial in config.testimonials.items"
              :key="testimonial.name"
              v-bind="testimonial"
              :quote-icon="config.testimonials.quoteIcon"
            />
          </div>
        </div>
      </section>

      <!-- Contact Form Section -->
      <section
        id="contacto"
        class="py-xl bg-surface bg-cover bg-center relative"
        :style="{ backgroundImage: `url('${config.contact.background}')` }"
      >
        <div class="absolute inset-0 bg-surface/60 z-0" />
        <div class="max-w-container-max mx-auto px-gutter">
          <div class="bg-surface-container-lowest rounded-xl border border-outline/10 p-lg shadow-eco-glow max-w-md mx-auto w-full relative bg-surface/95 z-10">
            <div class="absolute -top-4 -right-4 w-24 h-24 bg-secondary-container/20 rounded-full blur-2xl" />
            <h3 class="font-headline-md text-headline-md text-on-surface mb-sm">{{ config.contact.title }}</h3>
            <p class="font-body-md text-body-md text-on-surface-variant mb-lg">
              {{ config.contact.description }}
            </p>
            <form class="flex flex-col gap-md" @submit.prevent="handleSubmit">
              <FormInput
                v-for="field in config.contact.fields"
                :key="field.name"
                v-bind="field"
                v-model="form[field.name]"
              />
              <button
                type="submit"
                class="bg-primary text-on-primary font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-primary-container transition-colors mt-sm w-full"
              >
                {{ config.contact.submitLabel }}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-surface-container-highest text-primary font-caption text-caption w-full border-t border-outline/10">
      <div class="flex flex-col md:flex-row justify-between items-center px-gutter py-lg max-w-container-max mx-auto gap-md">
        <div class="flex items-center gap-xs opacity-80 hover:opacity-100 transition-opacity">
          <EcoMindsLogo size="24" class="text-primary" />
          <span class="font-headline-sm text-headline-sm font-bold text-primary">{{ config.brand.name }}</span>
        </div>
        <p class="text-on-surface-variant text-center md:text-left">
          © {{ currentYear }} {{ config.brand.name }}. {{ config.footer.tagline }}
        </p>
        <div class="flex flex-wrap justify-center gap-md">
          <a v-for="link in config.footer.links" :key="link.label" :href="link.href" class="text-on-surface-variant hover:text-primary hover:underline transition-all opacity-80 hover:opacity-100">
            {{ link.label }}
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import EcoMindsLogo from '@/components/EcoMindsLogo.vue'
import ServiceCard from '@/components/landing/ServiceCard.vue'
import ValueCard from '@/components/landing/ValueCard.vue'
import BenefitCard from '@/components/landing/BenefitCard.vue'
import TestimonialCard from '@/components/landing/TestimonialCard.vue'
import FormInput from '@/components/landing/FormInput.vue'
import landingConfig from '@/config/landing.json'

const config = landingConfig

const currentYear = computed(() => new Date().getFullYear())

const form = reactive(
  config.contact.fields.reduce((acc, field) => {
    acc[field.name] = ''
    return acc
  }, {})
)

const handleSubmit = () => {
  // TODO: conectar con endpoint de leads
  console.log('Lead landing:', form)
}
</script>