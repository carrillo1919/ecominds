<template>
  <div class="min-h-screen bg-background text-on-background font-sans antialiased selection:bg-primary-container selection:text-on-primary-container">
    <!-- TopNavBar -->
    <header class="bg-surface w-full top-0 sticky border-b border-outline/10 z-50">
      <div class="flex justify-between items-center px-gutter py-sm max-w-container-max mx-auto">
        <div class="flex items-center gap-base">
          <EcoMindsLogo size="32" class="text-primary" />
          <span class="font-headline-md text-headline-md font-bold text-primary">ecominds</span>
        </div>

        <nav class="hidden md:flex items-center gap-gutter">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="text-on-surface-variant hover:text-primary transition-colors duration-200 active:scale-95"
          >
            {{ link.label }}
          </a>
        </nav>

        <RouterLink
          to="/contacto"
          class="bg-primary text-on-primary font-label-md text-label-md px-gutter py-sm rounded-lg hover:bg-primary-container transition-colors hidden md:block text-center"
        >
          Solicitar Auditoría
        </RouterLink>

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
            src="/images/hero-sustainable-office.jpg"
            alt="Edificio de oficinas sostenible"
            class="w-full h-full object-cover opacity-20"
          />
        </div>
        <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div class="max-w-container-max mx-auto px-gutter py-xl md:py-[120px] flex flex-col items-center text-center relative z-10">
          <div class="flex flex-col gap-lg max-w-3xl">
            <div class="flex flex-col gap-base items-center">
              <span class="text-secondary font-label-md text-label-md uppercase tracking-widest">Precisión Ambiental</span>
              <h1 class="font-display-lg text-display-lg text-on-surface md:text-[56px] md:leading-[64px]">
                Precisión Ambiental para un Futuro Sostenible
              </h1>
              <p class="font-body-lg text-body-lg text-on-surface-variant mt-sm">
                Auditorías ambientales rigurosas y basadas en datos para líderes corporativos. Asegure el cumplimiento, optimice recursos y lidere en sostenibilidad con métricas exactas.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-md justify-center">
              <RouterLink
                to="/contacto"
                class="bg-primary text-on-primary font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-primary-container transition-colors shadow-sm"
              >
                Solicita tu Auditoría
              </RouterLink>
              <a
                href="#services"
                class="border border-outline bg-transparent text-on-surface font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-surface-variant transition-colors"
              >
                Conoce Más
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Services Section -->
      <section id="services" class="py-xl bg-surface">
        <div class="max-w-container-max mx-auto px-gutter">
          <div class="text-center mb-xl max-w-2xl mx-auto flex flex-col gap-base">
            <h2 class="font-headline-lg text-headline-lg text-on-surface">Servicios de Auditoría Especializada</h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Metodologías comprobadas para evaluar y mejorar el desempeño ambiental de su organización con precisión científica.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
            <ServiceCard
              v-for="service in services"
              :key="service.title"
              v-bind="service"
              :large="service.large"
              :medium="service.medium"
            />
          </div>
        </div>
      </section>

      <!-- Who We Are Section -->
      <section class="py-xl relative border-y border-outline/5 overflow-hidden">
        <div class="absolute inset-0 z-0">
          <img
            src="/images/who-we-are-bg.jpg"
            alt="Naturaleza y tecnología"
            class="w-full h-full object-cover opacity-80"
          />
        </div>
        <div class="absolute inset-0 z-0 bg-surface/60" />
        <div class="max-w-container-max mx-auto px-gutter relative z-10">
          <div class="text-center mb-xl">
            <h2 class="font-headline-lg text-headline-lg text-on-surface">Comprometidos con la Excelencia Ambiental</h2>
          </div>
          <div class="flex flex-col gap-lg">
            <ValueCard
              v-for="value in values"
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
                  src="/images/sustainable-architecture.jpg"
                  alt="Arquitectura sostenible moderna"
                  class="w-full h-full object-cover"
                />
                <div class="absolute bottom-md left-md right-md">
                  <div class="bg-surface-container-lowest/90 backdrop-blur-md p-md rounded-lg border border-primary/20 shadow-lg flex items-center gap-md">
                    <div class="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined">monitoring</span>
                    </div>
                    <div>
                      <p class="font-label-md text-label-md text-primary uppercase tracking-wider">Precisión de Datos</p>
                      <p class="font-headline-sm text-headline-sm font-bold text-on-surface">99.9% Verificable</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Content Column -->
            <div class="md:col-span-7 flex flex-col gap-lg">
              <div class="flex flex-col gap-base">
                <span class="text-secondary font-label-md text-label-md uppercase tracking-widest">El Valor de ecominds</span>
                <h2 class="font-display-lg text-display-lg text-on-surface">Resultados Estratégicos para su Organización</h2>
                <p class="font-body-lg text-body-lg text-on-surface-variant">
                  Nuestras auditorías no son solo un checklist; son herramientas de inteligencia de negocios diseñadas para impulsar el crecimiento sostenible.
                </p>
              </div>
              <div class="grid gap-md">
                <BenefitCard
                  v-for="benefit in benefits"
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
          <h2 class="font-headline-lg text-headline-lg text-on-surface text-center mb-xl">Líderes que Confían en la Precisión</h2>
          <div class="grid md:grid-cols-2 gap-lg">
            <TestimonialCard
              v-for="testimonial in testimonials"
              :key="testimonial.name"
              v-bind="testimonial"
            />
          </div>
        </div>
      </section>

      <!-- Contact Form Section -->
      <section
        id="contacto"
        class="py-xl bg-surface bg-cover bg-center relative"
        style="background-image: url('/images/contact-bg.jpg');"
      >
        <div class="absolute inset-0 bg-surface/60 z-0" />
        <div class="max-w-container-max mx-auto px-gutter">
          <div class="bg-surface-container-lowest rounded-xl border border-outline/10 p-lg shadow-eco-glow max-w-md mx-auto w-full relative bg-surface/95 z-10">
            <div class="absolute -top-4 -right-4 w-24 h-24 bg-secondary-container/20 rounded-full blur-2xl" />
            <h3 class="font-headline-md text-headline-md text-on-surface mb-sm">Comience su evaluación</h3>
            <p class="font-body-md text-body-md text-on-surface-variant mb-lg">
              Complete el formulario para recibir un análisis preliminar sin compromiso.
            </p>
            <form class="flex flex-col gap-md" @submit.prevent="handleSubmit">
              <FormInput
                v-for="field in formFields"
                :key="field.name"
                v-bind="field"
                v-model="form[field.name]"
              />
              <button
                type="submit"
                class="bg-primary text-on-primary font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-primary-container transition-colors mt-sm w-full"
              >
                Solicitar Análisis
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
          <span class="font-headline-sm text-headline-sm font-bold text-primary">ecominds</span>
        </div>
        <p class="text-on-surface-variant text-center md:text-left">
          © {{ currentYear }} ecominds. Precisión Ambiental para Líderes Globales.
        </p>
        <div class="flex flex-wrap justify-center gap-md">
          <a v-for="link in footerLinks" :key="link.label" :href="link.href" class="text-on-surface-variant hover:text-primary hover:underline transition-all opacity-80 hover:opacity-100">
            {{ link.label }}
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import EcoMindsLogo from '@/components/EcoMindsLogo.vue'
import ServiceCard from '@/components/landing/ServiceCard.vue'
import ValueCard from '@/components/landing/ValueCard.vue'
import BenefitCard from '@/components/landing/BenefitCard.vue'
import TestimonialCard from '@/components/landing/TestimonialCard.vue'
import FormInput from '@/components/landing/FormInput.vue'

const currentYear = computed(() => new Date().getFullYear())

const navLinks = [
  { label: 'Servicios', href: '#services' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Testimonios', href: '#testimonials' },
  { label: 'Contacto', href: '#contacto' }
]

const services = [
  {
    title: 'Cumplimiento Normativo',
    description: 'Análisis exhaustivo de regulaciones locales e internacionales para asegurar que su empresa opere dentro del marco legal, evitando sanciones y mitigando riesgos legales.',
    icon: 'gavel',
    image: '/images/service-cumplimiento.jpg',
    large: true
  },
  {
    title: 'Huella de Carbono',
    description: 'Medición precisa de emisiones GHG Scope 1, 2 y 3, con estrategias de reducción concretas.',
    icon: 'cloud',
    image: '/images/service-carbono.jpg'
  },
  {
    title: 'Gestión Hídrica',
    description: 'Evaluación del uso de agua y calidad de efluentes para optimizar el consumo.',
    icon: 'water_drop',
    image: '/images/service-hidrica.jpg'
  },
  {
    title: 'Auditoría de Residuos',
    description: 'Mapeo del ciclo de vida de los materiales en su operación. Identificamos ineficiencias y diseñamos planes de economía circular para minimizar el impacto en vertederos.',
    icon: 'recycling',
    image: '/images/service-residuos.jpg',
    medium: true
  }
]

const values = [
  {
    title: 'Misión',
    description: 'Impulsar la sostenibilidad corporativa mediante auditorías ambientales precisas y basadas en datos.',
    image: '/images/mision.jpg',
    align: 'left'
  },
  {
    title: 'Visión',
    description: 'Ser el referente global en consultoría ambiental para líderes comprometidos con el futuro del planeta.',
    image: '/images/vision.jpg',
    align: 'right'
  },
  {
    title: 'Objetivos',
    description: 'Garantizar el cumplimiento normativo, optimizar el uso de recursos y fortalecer la reputación de marca de nuestros clientes.',
    image: '/images/objetivos.jpg',
    align: 'center'
  }
]

const benefits = [
  {
    title: 'Mitigación de Riesgos',
    description: 'Identifique proactivamente vulnerabilidades regulatorias y operativas antes de que se conviertan en pasivos financieros.',
    icon: 'verified'
  },
  {
    title: 'Eficiencia Operativa',
    description: 'Descubra ineficiencias ocultas en el uso de recursos que, al optimizarse, reducen costos operativos significativamente.',
    icon: 'speed'
  },
  {
    title: 'Prestigio de Marca',
    description: 'Respalde sus afirmaciones de sostenibilidad con datos auditados y rigurosos, generando confianza en inversores y clientes.',
    icon: 'workspace_premium'
  }
]

const testimonials = [
  {
    quote: 'La profundidad del análisis de ecominds transformó nuestra estrategia ESG. Sus datos sobre gestión hídrica nos permitieron reducir el consumo en un 22% en el primer año.',
    name: 'Elena Rojas',
    role: 'Directora de Sostenibilidad, Industrias Apex',
    image: '/images/testimonial-elena.jpg'
  },
  {
    quote: 'Necesitábamos una auditoría de emisiones Scope 3 que resistiera el escrutinio de nuestros inversores. ecominds entregó un informe de nivel forense, claro y accionable.',
    name: 'Carlos Mendoza',
    role: 'VP de Operaciones, Logistics Global',
    image: '/images/testimonial-carlos.jpg'
  }
]

const formFields = [
  { name: 'nombre', label: 'Nombre Completo', type: 'text', placeholder: 'Ej. Ana Martínez' },
  { name: 'email', label: 'Correo Corporativo', type: 'email', placeholder: 'ana@empresa.com' },
  { name: 'telefono', label: 'Número de Teléfono', type: 'tel', placeholder: '+52 ...' },
  { name: 'empresa', label: 'Empresa', type: 'text', placeholder: 'Su Empresa S.A.' }
]

const form = ref({
  nombre: '',
  email: '',
  telefono: '',
  empresa: ''
})

const footerLinks = [
  { label: 'Privacidad', href: '#' },
  { label: 'Términos', href: '#' },
  { label: 'Contacto', href: '#contacto' }
]

const handleSubmit = () => {
  console.log('Formulario enviado:', form.value)
  // TODO: integrar con API de leads
}
</script>
