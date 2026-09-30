<script setup>
import { computed } from 'vue'
import SectionBackground from './SectionBackground.vue'
import { medioEsFondo, medioTieneContenido } from '../../services/mediaService.js'

const props = defineProps({
  contenido: { type: Object, default: () => ({}) },
})

const activo           = computed(() => props.contenido?.activo !== false)
const eyebrow          = computed(() => String(props.contenido?.eyebrow || '').trim())
const titulo           = computed(() => String(props.contenido?.titulo || '').trim())
const tituloResaltado  = computed(() => String(props.contenido?.tituloResaltado || '').trim())
const descripcion      = computed(() => String(props.contenido?.descripcion || '').trim())
const botonTexto       = computed(() => String(props.contenido?.botonTexto || '').trim())
const botonUrl         = computed(() => String(props.contenido?.botonUrl || '').trim() || '#planes')
const botonSecTexto    = computed(() => String(props.contenido?.botonSecundarioTexto || '').trim())
const botonSecUrl      = computed(() => String(props.contenido?.botonSecundarioUrl || '').trim() || '#contacto')
const imagenUrl        = computed(() => String(props.contenido?.imagenUrl || props.contenido?.imagen || '').trim())
const imagenAlt        = computed(() => String(props.contenido?.imagenAlt || titulo.value || 'Presentación').trim())
const mostrarImagen    = computed(() => Boolean(imagenUrl.value))

const medio            = computed(() => props.contenido?.medio)
const medioTiene       = computed(() => medioTieneContenido(medio.value))
const medioFondo       = computed(() => medioEsFondo(medio.value))
</script>

<template>
  <section
    v-if="activo"
    id="inicio"
    class="hero"
    style="position: relative;"
    aria-labelledby="hero-title"
  >
    <!-- Fondo dinámico (imagen/video/embed detrás de todo) -->
    <SectionBackground
      v-if="medioTiene && medioFondo"
      :medio="medio"
    />

    <!-- Decoración de fondo CSS -->
    <div class="hero__background" aria-hidden="true">
      <span class="hero__orb hero__orb--one"></span>
      <span class="hero__orb hero__orb--two"></span>
      <span class="hero__grid"></span>
    </div>

    <!-- Container principal -->
    <div
      class="container hero__container"
      :class="{
        'sb-wrap sb-wrap--right': medioTiene && !medioFondo && medio?.posicion !== 'izquierda',
        'sb-wrap sb-wrap--left':  medioTiene && !medioFondo && medio?.posicion === 'izquierda',
      }"
    >

      <!-- Contenido texto -->
      <div class="hero__content" :class="{ 'sb-wrap__content': medioTiene && !medioFondo }">

        <div v-if="eyebrow" class="hero__eyebrow-wrapper">
          <span class="hero__eyebrow-dot"></span>
          <span class="hero__eyebrow">{{ eyebrow }}</span>
        </div>

        <h1 v-if="titulo || tituloResaltado" id="hero-title" class="hero__title">
          <span v-if="titulo" class="hero__title-main">{{ titulo }}</span>
          <span v-if="tituloResaltado" class="hero__title-highlight">{{ tituloResaltado }}</span>
        </h1>

        <p v-if="descripcion" class="hero__description">{{ descripcion }}</p>

        <div v-if="botonTexto || botonSecTexto" class="hero__actions">
          <a v-if="botonTexto" :href="botonUrl" class="hero__button hero__button--primary">
            <span>{{ botonTexto }}</span>
            <span class="hero__button-arrow" aria-hidden="true">→</span>
          </a>
          <a v-if="botonSecTexto" :href="botonSecUrl" class="hero__button hero__button--secondary">
            <span class="hero__secondary-icon">◉</span>
            <span>{{ botonSecTexto }}</span>
          </a>
        </div>

        <div class="hero__trust">
          <div class="hero__trust-item">
            <span class="hero__trust-icon" aria-hidden="true">✓</span>
            <span>Soluciones profesionales</span>
          </div>
          <div class="hero__trust-item">
            <span class="hero__trust-icon" aria-hidden="true">✓</span>
            <span>Planes transparentes</span>
          </div>
          <div class="hero__trust-item">
            <span class="hero__trust-icon" aria-hidden="true">✓</span>
            <span>Atención personalizada</span>
          </div>
        </div>
      </div>

      <!-- Medio dinámico lateral -->
      <div v-if="medioTiene && !medioFondo" class="sb-wrap__media">
        <SectionBackground :medio="medio" />
      </div>

      <!-- Visual estático (imagen de campo imagenUrl) — solo si no hay medio dinámico -->
      <div v-else-if="mostrarImagen && !medioTiene" class="hero__visual">
        <div class="hero__visual-glow" aria-hidden="true"></div>
        <div class="hero__visual-decoration hero__visual-decoration--one" aria-hidden="true"></div>
        <div class="hero__visual-decoration hero__visual-decoration--two" aria-hidden="true"></div>
        <div class="hero__visual-card">
          <div class="hero__visual-shine" aria-hidden="true"></div>
          <img :src="imagenUrl" :alt="imagenAlt" class="hero__image" loading="eager" decoding="async" />
        </div>
        <div class="hero__floating-badge hero__floating-badge--top">
          <span class="hero__floating-icon">✦</span>
          <span><strong>Calidad</strong><small>Profesional</small></span>
        </div>
        <div class="hero__floating-badge hero__floating-badge--bottom">
          <span class="hero__floating-check">✓</span>
          <span><strong>Listo para crecer</strong><small>Soluciones escalables</small></span>
        </div>
      </div>

    </div>

    <a href="#soluciones" class="hero__scroll" aria-label="Ver soluciones">
      <span class="hero__scroll-line"></span>
      <span class="hero__scroll-text">Descubre más</span>
      <span class="hero__scroll-arrow" aria-hidden="true">↓</span>
    </a>
  </section>
</template>
