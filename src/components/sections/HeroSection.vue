<script setup>
import { computed } from 'vue'

const props = defineProps({
  contenido: {
    type: Object,
    default: () => ({}),
  },
})

const activo = computed(() => {
  return props.contenido?.activo !== false
})

const eyebrow = computed(() => {
  return String(
    props.contenido?.eyebrow || ''
  ).trim()
})

const titulo = computed(() => {
  return String(
    props.contenido?.titulo || ''
  ).trim()
})

const tituloResaltado = computed(() => {
  return String(
    props.contenido?.tituloResaltado || ''
  ).trim()
})

const descripcion = computed(() => {
  return String(
    props.contenido?.descripcion || ''
  ).trim()
})

const botonTexto = computed(() => {
  return String(
    props.contenido?.botonTexto || ''
  ).trim()
})

const botonUrl = computed(() => {
  return (
    String(
      props.contenido?.botonUrl || ''
    ).trim() || '#planes'
  )
})

const botonSecundarioTexto = computed(() => {
  return String(
    props.contenido?.botonSecundarioTexto || ''
  ).trim()
})

const botonSecundarioUrl = computed(() => {
  return (
    String(
      props.contenido?.botonSecundarioUrl || ''
    ).trim() || '#contacto'
  )
})

const imagenUrl = computed(() => {
  return String(
    props.contenido?.imagenUrl ||
      props.contenido?.imagen ||
      ''
  ).trim()
})

const imagenAlt = computed(() => {
  return String(
    props.contenido?.imagenAlt ||
      titulo.value ||
      'Presentación'
  ).trim()
})

const mostrarImagen = computed(() => {
  return Boolean(imagenUrl.value)
})
</script>

<template>
  <section
    v-if="activo"
    id="inicio"
    class="hero"
    aria-labelledby="hero-title"
  >
    <!-- DECORACIÓN DE FONDO -->
    <div
      class="hero__background"
      aria-hidden="true"
    >
      <span class="hero__orb hero__orb--one"></span>
      <span class="hero__orb hero__orb--two"></span>
      <span class="hero__grid"></span>
    </div>

    <div class="container hero__container">

      <!-- CONTENIDO -->
      <div class="hero__content">

        <div
          v-if="eyebrow"
          class="hero__eyebrow-wrapper"
        >
          <span class="hero__eyebrow-dot"></span>

          <span class="hero__eyebrow">
            {{ eyebrow }}
          </span>
        </div>

        <h1
          v-if="titulo || tituloResaltado"
          id="hero-title"
          class="hero__title"
        >
          <span
            v-if="titulo"
            class="hero__title-main"
          >
            {{ titulo }}
          </span>

          <span
            v-if="tituloResaltado"
            class="hero__title-highlight"
          >
            {{ tituloResaltado }}
          </span>
        </h1>

        <p
          v-if="descripcion"
          class="hero__description"
        >
          {{ descripcion }}
        </p>

        <!-- ACCIONES -->
        <div
          v-if="
            botonTexto ||
            botonSecundarioTexto
          "
          class="hero__actions"
        >
          <a
            v-if="botonTexto"
            :href="botonUrl"
            class="hero__button hero__button--primary"
          >
            <span>
              {{ botonTexto }}
            </span>

            <span
              class="hero__button-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </a>

          <a
            v-if="botonSecundarioTexto"
            :href="botonSecundarioUrl"
            class="hero__button hero__button--secondary"
          >
            <span class="hero__secondary-icon">
              ◉
            </span>

            <span>
              {{ botonSecundarioTexto }}
            </span>
          </a>
        </div>

        <!-- BENEFICIOS -->
        <div class="hero__trust">

          <div class="hero__trust-item">
            <span
              class="hero__trust-icon"
              aria-hidden="true"
            >
              ✓
            </span>

            <span>
              Soluciones profesionales
            </span>
          </div>

          <div class="hero__trust-item">
            <span
              class="hero__trust-icon"
              aria-hidden="true"
            >
              ✓
            </span>

            <span>
              Planes transparentes
            </span>
          </div>

          <div class="hero__trust-item">
            <span
              class="hero__trust-icon"
              aria-hidden="true"
            >
              ✓
            </span>

            <span>
              Atención personalizada
            </span>
          </div>

        </div>
      </div>

      <!-- VISUAL -->
      <div
        v-if="mostrarImagen"
        class="hero__visual"
      >
        <div
          class="hero__visual-glow"
          aria-hidden="true"
        ></div>

        <div
          class="hero__visual-decoration hero__visual-decoration--one"
          aria-hidden="true"
        ></div>

        <div
          class="hero__visual-decoration hero__visual-decoration--two"
          aria-hidden="true"
        ></div>

        <div class="hero__visual-card">

          <div
            class="hero__visual-shine"
            aria-hidden="true"
          ></div>

          <img
            :src="imagenUrl"
            :alt="imagenAlt"
            class="hero__image"
            loading="eager"
            decoding="async"
          />
        </div>

        <!-- BADGE FLOTANTE -->
        <div
          class="hero__floating-badge hero__floating-badge--top"
        >
          <span class="hero__floating-icon">
            ✦
          </span>

          <span>
            <strong>Calidad</strong>
            <small>Profesional</small>
          </span>
        </div>

        <div
          class="hero__floating-badge hero__floating-badge--bottom"
        >
          <span class="hero__floating-check">
            ✓
          </span>

          <span>
            <strong>Listo para crecer</strong>
            <small>Soluciones escalables</small>
          </span>
        </div>
      </div>

    </div>

    <!-- INDICADOR DE SCROLL -->
    <a
      href="#soluciones"
      class="hero__scroll"
      aria-label="Ver soluciones"
    >
      <span class="hero__scroll-line"></span>

      <span class="hero__scroll-text">
        Descubre más
      </span>

      <span
        class="hero__scroll-arrow"
        aria-hidden="true"
      >
        ↓
      </span>
    </a>
  </section>
</template>