<script setup>
import {
  computed,
} from 'vue'

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
    props.item?.icono || '✦'
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

const tieneContenido = computed(() => {
  return Boolean(
    titulo.value ||
    descripcion.value
  )
})

const esEnlaceExterno = computed(() => {
  const url = enlace.value

  return (
    /^https?:\/\//i.test(url) ||
    /^www\./i.test(url)
  )
})
</script>

<template>
  <article
    v-if="activo && tieneContenido"
    class="solution-card"
  >

    <div
      class="solution-card__top"
    >
      <div
        class="solution-card__icon"
        aria-hidden="true"
      >
        {{ icono }}
      </div>

      <span
        v-if="item.orden !== undefined"
        class="solution-card__number"
        aria-hidden="true"
      >
        {{ String(item.orden).padStart(2, '0') }}
      </span>
    </div>

    <div
      class="solution-card__content"
    >
      <h3
        v-if="titulo"
        class="solution-card__title"
      >
        {{ titulo }}
      </h3>

      <p
        v-if="descripcion"
        class="solution-card__description"
      >
        {{ descripcion }}
      </p>
    </div>

    <a
      v-if="enlace"
      :href="enlace"
      class="solution-card__link"
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
        class="solution-card__link-icon"
        aria-hidden="true"
      >
        →
      </span>
    </a>

  </article>
</template>