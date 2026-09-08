<script setup>
import { computed } from 'vue'

import AppFooter from './components/sections/AppFooter.vue'
import AppHeader from './components/sections/AppHeader.vue'
import AboutSection from './components/sections/AboutSection.vue'
import ContactSection from './components/sections/ContactSection.vue'
import FaqSection from './components/sections/FaqSection.vue'
import FeaturesSection from './components/sections/FeaturesSection.vue'
import HeroSection from './components/sections/HeroSection.vue'
import PlansSection from './components/sections/PlansSection.vue'
import SolutionsSection from './components/sections/SolutionsSection.vue'

import { useLandingContent } from './services/useLandingContent'

const {
  header,
  hero,
  soluciones,
  caracteristicas,
  planesContenido,
  nosotros,
  faq,
  contacto,
  footer,
  planes,
  configuracion,
  cargando,
  error,
} = useLandingContent()

const estilosConfiguracion = computed(() => {
  const config = configuracion.value || {}

  return {
    '--color-primary':
      config.primary || '#0F172A',

    '--color-secondary':
      config.secondary || '#334155',

    '--color-accent':
      config.accent || '#2F80ED',

    '--color-background':
      config.background || '#F8FAFC',

    '--color-text':
      config.text || '#1E293B',
  }
})
</script>

<template>
  <div
    id="app"
    :style="estilosConfiguracion"
  >
    <AppHeader
      :contenido="header"
      :configuracion="configuracion"
    />

    <main>
      <HeroSection
        :contenido="hero"
      />

      <SolutionsSection
        :contenido="soluciones"
      />

      <FeaturesSection
        :contenido="caracteristicas"
      />

      <PlansSection
        :contenido="planesContenido"
        :planes="planes"
        :cargando="cargando"
        :error="error"
      />

      <AboutSection
        :contenido="nosotros"
      />

      <FaqSection
        :contenido="faq"
      />

      <ContactSection
        :contenido="contacto"
      />
    </main>

    <AppFooter
      :contenido="footer"
      :configuracion="configuracion"
    />
  </div>
</template>