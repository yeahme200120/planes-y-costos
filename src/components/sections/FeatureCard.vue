<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const activo = computed(() => {
  return props.item?.activo !== false
})

const titulo = computed(() => {
  return String(
    props.item?.titulo || ''
  ).trim()
})

const descripcion = computed(() => {
  return String(
    props.item?.descripcion || ''
  ).trim()
})

const icono = computed(() => {
  return String(
    props.item?.icono || '✓'
  ).trim()
})

const enlace = computed(() => {
  return String(
    props.item?.url ||
      props.item?.enlace ||
      ''
  ).trim()
})

const textoEnlace = computed(() => {
  return String(
    props.item?.textoEnlace ||
      props.item?.botonTexto ||
      'Conocer más'
  ).trim()
})

const esEnlaceExterno = computed(() => {
  return (
    /^https?:\/\//i.test(enlace.value) ||
    /^www\./i.test(enlace.value)
  )
})

const tieneContenido = computed(() => {
  return Boolean(
    titulo.value ||
    descripcion.value
  )
})
</script>

<template>
  <article
    v-if="activo && tieneContenido"
    class="feature-card"
  >
    <!-- ICONO -->
    <div
      class="feature-card__icon"
      aria-hidden="true"
    >
      {{ icono }}
    </div>

    <!-- CONTENIDO -->
    <div class="feature-card__content">

      <h3
        v-if="titulo"
        class="feature-card__title"
      >
        {{ titulo }}
      </h3>

      <p
        v-if="descripcion"
        class="feature-card__description"
      >
        {{ descripcion }}
      </p>

      <!-- ENLACE OPCIONAL -->
      <a
        v-if="enlace"
        :href="enlace"
        class="feature-card__link"
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
          {{ textoEnlace }}
        </span>

        <span
          class="feature-card__link-icon"
          aria-hidden="true"
        >
          →
        </span>
      </a>

    </div>
  </article>
</template>