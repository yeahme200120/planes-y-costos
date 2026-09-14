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

/*
|--------------------------------------------------------------------------
| Estado
|--------------------------------------------------------------------------
*/

const activo = computed(() => {
  return props.item?.activo !== false
})

/*
|--------------------------------------------------------------------------
| Contenido
|--------------------------------------------------------------------------
*/

const titulo = computed(() => {
  return typeof props.item?.titulo === 'string'
    ? props.item.titulo.trim()
    : ''
})

const descripcion = computed(() => {
  return typeof props.item?.descripcion === 'string'
    ? props.item.descripcion.trim()
    : ''
})

const icono = computed(() => {
  return typeof props.item?.icono === 'string' &&
    props.item.icono.trim()
    ? props.item.icono.trim()
    : '✦'
})

/*
|--------------------------------------------------------------------------
| Enlace
|--------------------------------------------------------------------------
*/

const enlace = computed(() => {
  const valor =
    props.item?.url ??
    props.item?.enlace ??
    ''

  return typeof valor === 'string'
    ? valor.trim()
    : ''
})

const textoEnlace = computed(() => {
  const valor =
    props.item?.textoEnlace ??
    props.item?.botonTexto ??
    'Conocer más'

  return typeof valor === 'string'
    ? valor.trim()
    : 'Conocer más'
})

/*
|--------------------------------------------------------------------------
| Estado del contenido
|--------------------------------------------------------------------------
*/

const tieneContenido = computed(() => {
  return Boolean(
    titulo.value ||
    descripcion.value,
  )
})

/*
|--------------------------------------------------------------------------
| Enlace externo
|--------------------------------------------------------------------------
*/

const esEnlaceExterno = computed(() => {
  const url = enlace.value

  if (!url) {
    return false
  }

  return (
    /^https?:\/\//i.test(url) ||
    /^www\./i.test(url)
  )
})

/*
|--------------------------------------------------------------------------
| URL final
|--------------------------------------------------------------------------
*/

const urlEnlace = computed(() => {
  const url = enlace.value

  if (!url) {
    return ''
  }

  if (/^www\./i.test(url)) {
    return `https://${url}`
  }

  return url
})

/*
|--------------------------------------------------------------------------
| Número de orden
|--------------------------------------------------------------------------
*/

const numeroOrden = computed(() => {
  const orden = Number(props.item?.orden)

  if (!Number.isFinite(orden)) {
    return ''
  }

  return String(orden).padStart(2, '0')
})
</script>

<template>
  <article
    v-if="activo && tieneContenido"
    class="solution-card"
  >
    <!-- =========================================================
         PARTE SUPERIOR
         ========================================================= -->

    <div class="solution-card__top">

      <div
        class="solution-card__icon"
        aria-hidden="true"
      >
        {{ icono }}
      </div>

      <span
        v-if="numeroOrden"
        class="solution-card__number"
        aria-hidden="true"
      >
        {{ numeroOrden }}
      </span>

    </div>

    <!-- =========================================================
         CONTENIDO
         ========================================================= -->

    <div class="solution-card__content">

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

    <!-- =========================================================
         ENLACE
         ========================================================= -->

    <a
      v-if="enlace"
      :href="urlEnlace"
      class="solution-card__link"
      :target="esEnlaceExterno ? '_blank' : undefined"
      :rel="
        esEnlaceExterno
          ? 'noopener noreferrer'
          : undefined
      "
    >
      <span class="solution-card__link-text">
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
