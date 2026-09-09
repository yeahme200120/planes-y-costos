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

const descripcion = computed(() => {
  return String(
    props.contenido?.descripcion || ''
  ).trim()
})

const textoSecundario = computed(() => {
  return String(
    props.contenido?.textoSecundario ||
      props.contenido?.descripcionSecundaria ||
      ''
  ).trim()
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
      'Conoce nuestra empresa'
  ).trim()
})

const botonTexto = computed(() => {
  return String(
    props.contenido?.botonTexto ||
      ''
  ).trim()
})

const botonUrl = computed(() => {
  return (
    String(
      props.contenido?.botonUrl ||
        props.contenido?.url ||
        ''
    ).trim() || '#contacto'
  )
})

const mostrarBoton = computed(() => {
  return Boolean(botonTexto.value)
})

const mostrarContenidoSecundario =
  computed(() => {
    return Boolean(
      textoSecundario.value
    )
  })

const mostrarImagen = computed(() => {
  return Boolean(imagenUrl.value)
})

const esEnlaceExterno = computed(() => {
  return (
    /^https?:\/\//i.test(
      botonUrl.value
    ) ||
    /^www\./i.test(
      botonUrl.value
    )
  )
})

const tieneContenido = computed(() => {
  return Boolean(
    eyebrow.value ||
    titulo.value ||
    descripcion.value ||
    textoSecundario.value ||
    botonTexto.value
  )
})
</script>

<template>
  <section
    v-if="activo"
    id="nosotros"
    class="section about"
    aria-labelledby="about-title"
  >
    <div class="container">

      <div
        class="about__layout"
        :class="{
          'about__layout--without-media':
            !mostrarImagen,
        }"
      >

        <div
          v-if="tieneContenido"
          class="about__content"
        >
          <span
            v-if="eyebrow"
            class="section-eyebrow"
          >
            {{ eyebrow }}
          </span>

          <h2
            v-if="titulo"
            id="about-title"
            class="section-title"
          >
            {{ titulo }}
          </h2>

          <p
            v-if="descripcion"
            class="about__description"
          >
            {{ descripcion }}
          </p>

          <p
            v-if="mostrarContenidoSecundario"
            class="about__secondary"
          >
            {{ textoSecundario }}
          </p>

          <a
            v-if="mostrarBoton"
            :href="botonUrl"
            class="about__button"
            :target="
              esEnlaceExterno
                ? '_blank'
                : undefined
            "
            :rel="
              esEnlaceExterno
                ? 'noopener noreferrer'
                : undefined
            "
          >
            <span>
              {{ botonTexto }}
            </span>

            <span
              class="about__button-icon"
              aria-hidden="true"
            >
              →
            </span>
          </a>
        </div>

        <div
          v-if="mostrarImagen"
          class="about__media"
        >
          <div class="about__media-frame">
            <img
              :src="imagenUrl"
              :alt="imagenAlt"
              class="about__image"
              loading="lazy"
              decoding="async"
            >
          </div>
        </div>

        <div
          v-else
          class="about__visual"
          aria-hidden="true"
        >
          <div class="about__visual-glow"></div>

          <div class="about__visual-inner">
            <span class="about__visual-mark">
              IA
            </span>

            <span class="about__visual-name">
              IAEH
            </span>

            <span class="about__visual-line"></span>
          </div>
        </div>

      </div>

    </div>
  </section>
</template>