<script setup>
import { computed } from 'vue'
import SectionBackground from './SectionBackground.vue'
import { medioTieneContenido, medioEsFondo } from '../../services/mediaService.js'
import FaqItem from './FaqItem.vue'

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

const items = computed(() => {
  const elementos =
    props.contenido?.items

  if (!Array.isArray(elementos)) {
    return []
  }

  return [...elementos]
    .filter((item) => {
      return (
        item &&
        item.activo !== false &&
        String(
          item.pregunta || ''
        ).trim()
      )
    })
    .sort((a, b) => {
      return (
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
      )
    })
})

const tieneEncabezado = computed(() => {
  return Boolean(
    eyebrow.value ||
    titulo.value ||
    descripcion.value
  )
})

const mensajeVacio = computed(() => {
  return String(
    props.contenido?.mensajeVacio ||
      'Actualmente no hay preguntas frecuentes disponibles.'
  ).trim()
})
</script>

<template>
  <section
    v-if="activo"
    id="faq"
    class="section faq"
    style="position: relative;"
    aria-labelledby="faq-title"
  >
    <SectionBackground
      v-if="medioEsFondo(contenido?.medio)"
      :medio="contenido?.medio"
    />
    <div
      class="container"
      :class="{
        'section-with-media': medioTieneContenido(contenido?.medio) && !medioEsFondo(contenido?.medio),
        'section-with-media--right': contenido?.medio?.posicion === 'derecha',
        'section-with-media--left': contenido?.medio?.posicion === 'izquierda',
      }"
    >
      <SectionBackground
        v-if="medioTieneContenido(contenido?.medio) && !medioEsFondo(contenido?.medio)"
        :medio="contenido?.medio"
      />

      <header
        v-if="tieneEncabezado"
        class="section-header faq__header"
      >
        <span
          v-if="eyebrow"
          class="section-eyebrow"
        >
          {{ eyebrow }}
        </span>

        <h2
          v-if="titulo"
          id="faq-title"
          class="section-title"
        >
          {{ titulo }}
        </h2>

        <p
          v-if="descripcion"
          class="section-description"
        >
          {{ descripcion }}
        </p>
      </header>

      <div
        v-if="items.length"
        class="faq__list"
      >
        <FaqItem
          v-for="(item, index) in items"
          :key="
            item.id ||
            `faq-${item.orden ?? index}-${item.pregunta}`
          "
          :item="item"
          :indice="index"
        />
      </div>

      <div
        v-else
        class="faq__empty"
        aria-live="polite"
      >
        <span
          class="faq__empty-icon"
          aria-hidden="true"
        >
          ?
        </span>

        <p>
          {{ mensajeVacio }}
        </p>
      </div>

    </div>
  </section>
</template>