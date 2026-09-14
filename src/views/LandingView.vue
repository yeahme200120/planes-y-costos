<script setup>
import {
  computed,
  watch,
} from 'vue'

import AppFooter from '../components/sections/AppFooter.vue'
import AppHeader from '../components/sections/AppHeader.vue'
import AboutSection from '../components/sections/AboutSection.vue'
import ContactSection from '../components/sections/ContactSection.vue'
import FaqSection from '../components/sections/FaqSection.vue'
import FeaturesSection from '../components/sections/FeaturesSection.vue'
import HeroSection from '../components/sections/HeroSection.vue'
import PlansSection from '../components/sections/PlansSection.vue'
import SolutionsSection from '../components/sections/SolutionsSection.vue'

import { useLandingContent } from '../services/useLandingContent'

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

/*
|--------------------------------------------------------------------------
| Valores por defecto
|--------------------------------------------------------------------------
|
| Estos valores solamente funcionan como respaldo mientras Firebase
| todavía no ha entregado la configuración o cuando algún campo no
| existe en la configuración.
|
*/

const COLORES_POR_DEFECTO = {
  primary: '#4678EC',
  primaryLight: '#DCE7FF',
  primaryDark: '#2858C7',

  secondary: '#F28B82',
  secondaryLight: '#FFE2DE',
  secondaryDark: '#C95C52',

  accent: '#78C6A3',
  accentLight: '#DDF5EA',
  accentDark: '#42906D',

  background: '#F8FAFC',
  backgroundAlt: '#F1F5F9',

  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',

  text: '#172033',
  textSecondary: '#526078',
  textMuted: '#7B879C',

  border: '#E2E8F0',

  success: '#2E9B6F',
  warning: '#D89432',
  danger: '#D95C5C',

  white: '#FFFFFF',

  primaryText: '#FFFFFF',
  secondaryText: '#FFFFFF',
  accentText: '#FFFFFF',
}

/*
|--------------------------------------------------------------------------
| Validar color
|--------------------------------------------------------------------------
*/

function esColorValido(valor) {
  return (
    typeof valor === 'string' &&
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
      valor.trim()
    )
  )
}

/*
|--------------------------------------------------------------------------
| Obtener color
|--------------------------------------------------------------------------
|
| Si el valor existe y es válido se utiliza Firebase.
| Si no existe, se utiliza el valor de respaldo.
|
*/

function obtenerColor(
  config,
  campo,
  respaldo = COLORES_POR_DEFECTO[campo]
) {
  const valor = config?.[campo]

  if (esColorValido(valor)) {
    return valor.trim().toUpperCase()
  }

  return respaldo
}

/*
|--------------------------------------------------------------------------
| Obtener color con prioridad
|--------------------------------------------------------------------------
|
| Orden:
|
| 1. paleta
| 2. configuración general
| 3. valor por defecto
|
*/

function obtenerColorConfigurado(
  paleta,
  config,
  campo
) {
  const valorPaleta =
    paleta?.[campo]

  if (esColorValido(valorPaleta)) {
    return valorPaleta
      .trim()
      .toUpperCase()
  }

  const valorConfig =
    config?.[campo]

  if (esColorValido(valorConfig)) {
    return valorConfig
      .trim()
      .toUpperCase()
  }

  return COLORES_POR_DEFECTO[campo]
}

/*
|--------------------------------------------------------------------------
| Variables CSS dinámicas
|--------------------------------------------------------------------------
|
| Toda la landing recibe la paleta desde Firebase.
|
| Los componentes individuales NO necesitan conocer Firebase.
| Únicamente utilizan variables CSS.
|
| Ejemplo:
|
| --color-primary
| --color-secondary
| --color-accent
| --color-background
| --color-surface
| --color-text
|
*/

const estilosConfiguracion = computed(() => {
  const config =
    configuracion.value || {}

  const paleta =
    config.paleta &&
    typeof config.paleta === 'object'
      ? config.paleta
      : {}

  return {
    /*
    |----------------------------------------------------------------------
    | Primary
    |----------------------------------------------------------------------
    */

    '--color-primary':
      obtenerColor(
        config,
        'primary'
      ),

    '--color-primary-light':
      obtenerColorConfigurado(
        paleta,
        config,
        'primaryLight'
      ),

    '--color-primary-dark':
      obtenerColorConfigurado(
        paleta,
        config,
        'primaryDark'
      ),

    /*
    |----------------------------------------------------------------------
    | Secondary
    |----------------------------------------------------------------------
    */

    '--color-secondary':
      obtenerColor(
        config,
        'secondary'
      ),

    '--color-secondary-light':
      obtenerColorConfigurado(
        paleta,
        config,
        'secondaryLight'
      ),

    '--color-secondary-dark':
      obtenerColorConfigurado(
        paleta,
        config,
        'secondaryDark'
      ),

    /*
    |----------------------------------------------------------------------
    | Accent
    |----------------------------------------------------------------------
    */

    '--color-accent':
      obtenerColor(
        config,
        'accent'
      ),

    '--color-accent-light':
      obtenerColorConfigurado(
        paleta,
        config,
        'accentLight'
      ),

    '--color-accent-dark':
      obtenerColorConfigurado(
        paleta,
        config,
        'accentDark'
      ),

    /*
    |----------------------------------------------------------------------
    | Background
    |----------------------------------------------------------------------
    */

    '--color-background':
      obtenerColor(
        config,
        'background'
      ),

    '--color-background-alt':
      obtenerColorConfigurado(
        paleta,
        config,
        'backgroundAlt'
      ),

    /*
    |----------------------------------------------------------------------
    | Surface
    |----------------------------------------------------------------------
    */

    '--color-surface':
      obtenerColorConfigurado(
        paleta,
        config,
        'surface'
      ),

    '--color-surface-alt':
      obtenerColorConfigurado(
        paleta,
        config,
        'surfaceAlt'
      ),

    /*
    |----------------------------------------------------------------------
    | Texto
    |----------------------------------------------------------------------
    */

    '--color-text':
      obtenerColor(
        config,
        'text'
      ),

    '--color-text-secondary':
      obtenerColorConfigurado(
        paleta,
        config,
        'textSecondary'
      ),

    '--color-text-muted':
      obtenerColorConfigurado(
        paleta,
        config,
        'textMuted'
      ),

    /*
    |----------------------------------------------------------------------
    | Bordes
    |----------------------------------------------------------------------
    */

    '--color-border':
      obtenerColorConfigurado(
        paleta,
        config,
        'border'
      ),

    /*
    |----------------------------------------------------------------------
    | Estados
    |----------------------------------------------------------------------
    */

    '--color-success':
      obtenerColorConfigurado(
        paleta,
        config,
        'success'
      ),

    '--color-warning':
      obtenerColorConfigurado(
        paleta,
        config,
        'warning'
      ),

    '--color-danger':
      obtenerColorConfigurado(
        paleta,
        config,
        'danger'
      ),

    /*
    |----------------------------------------------------------------------
    | Colores auxiliares
    |----------------------------------------------------------------------
    */

    '--color-white':
      obtenerColorConfigurado(
        paleta,
        config,
        'white'
      ),

    /*
    |----------------------------------------------------------------------
    | Texto sobre colores principales
    |----------------------------------------------------------------------
    */

    '--color-primary-text':
      obtenerColorConfigurado(
        paleta,
        config,
        'primaryText'
      ),

    '--color-secondary-text':
      obtenerColorConfigurado(
        paleta,
        config,
        'secondaryText'
      ),

    '--color-accent-text':
      obtenerColorConfigurado(
        paleta,
        config,
        'accentText'
      ),
  }
})

/*
|--------------------------------------------------------------------------
| Favicon
|--------------------------------------------------------------------------
*/

function actualizarFavicon(url) {
  const valor = String(
    url || ''
  ).trim()

  if (!valor) {
    return
  }

  let favicon =
    document.querySelector(
      'link[rel="icon"]'
    )

  if (!favicon) {
    favicon =
      document.createElement(
        'link'
      )

    favicon.rel = 'icon'

    document.head.appendChild(
      favicon
    )
  }

  favicon.href = valor
}

/*
|--------------------------------------------------------------------------
| Título de página
|--------------------------------------------------------------------------
*/

function actualizarTitulo(config) {
  if (!config) {
    return
  }

  const titulo = String(
    config.tituloPagina ||
      config.metaTitle ||
      config.nombreEmpresa ||
      'Inicio'
  ).trim()

  if (titulo) {
    document.title = titulo
  }
}

/*
|--------------------------------------------------------------------------
| Meta description
|--------------------------------------------------------------------------
*/

function actualizarMetaDescription(
  config
) {
  if (!config) {
    return
  }

  const descripcion = String(
    config.metaDescription ||
      config.descripcion ||
      ''
  ).trim()

  if (!descripcion) {
    return
  }

  let meta =
    document.querySelector(
      'meta[name="description"]'
    )

  if (!meta) {
    meta =
      document.createElement(
        'meta'
      )

    meta.name =
      'description'

    document.head.appendChild(
      meta
    )
  }

  meta.content =
    descripcion
}

/*
|--------------------------------------------------------------------------
| Configuración dinámica del documento
|--------------------------------------------------------------------------
*/

watch(
  configuracion,
  (config) => {
    if (!config) {
      return
    }

    actualizarFavicon(
      config.faviconUrl
    )

    actualizarTitulo(
      config
    )

    actualizarMetaDescription(
      config
    )
  },
  {
    immediate: true,
    deep: true,
  }
)
</script>

<template>
  <div
    id="app"
    class="landing-page"
    :style="estilosConfiguracion"
  >

    <!-- =========================================================
         HEADER
         ========================================================= -->

    <AppHeader
      v-if="header"
      :contenido="header"
      :configuracion="configuracion"
    />

    <!-- =========================================================
         CONTENIDO PRINCIPAL
         ========================================================= -->

    <main class="landing-main">

      <!-- Hero -->

      <HeroSection
        v-if="hero"
        :contenido="hero"
      />

      <!-- Soluciones -->

      <SolutionsSection
        v-if="soluciones"
        :contenido="soluciones"
      />

      <!-- Características -->

      <FeaturesSection
        v-if="caracteristicas"
        :contenido="caracteristicas"
      />

      <!-- Planes -->

      <PlansSection
        v-if="planesContenido"
        :contenido="planesContenido"
        :planes="planes"
        :cargando="cargando"
        :error="error"
      />

      <!-- Nosotros -->

      <AboutSection
        v-if="nosotros"
        :contenido="nosotros"
      />

      <!-- Preguntas frecuentes -->

      <FaqSection
        v-if="faq"
        :contenido="faq"
      />

      <!-- Contacto -->

      <ContactSection
        v-if="contacto"
        :contenido="contacto"
        :configuracion="configuracion"
      />

    </main>

    <!-- =========================================================
         FOOTER
         ========================================================= -->

    <AppFooter
      v-if="footer"
      :contenido="footer"
      :configuracion="configuracion"
    />

    <!-- =========================================================
         ESTADO INICIAL DE CARGA
         ========================================================= -->

    <div
      v-if="cargando && !hero"
      class="landing-loading"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="landing-loading__content">

        <div
          class="landing-loading__spinner"
          aria-hidden="true"
        ></div>

        <span>
          Cargando contenido...
        </span>

      </div>
    </div>

    <!-- =========================================================
         ERROR DE CARGA
         ========================================================= -->

    <div
      v-if="error && !hero"
      class="landing-error"
      role="alert"
    >
      <div class="landing-error__content">

        <strong>
          No fue posible cargar el contenido.
        </strong>

        <span>
          Verifica la conexión con Firebase e inténtalo nuevamente.
        </span>

      </div>
    </div>

  </div>
</template>