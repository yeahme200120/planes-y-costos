<script setup>
import { computed } from 'vue'
import SectionBackground from '../sections/SectionBackground.vue'
import { medioTieneContenido, medioEsFondo } from '../../services/mediaService.js'
import BenefitCard from './BenefitCard.vue'

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
  const valor = props.contenido?.eyebrow
  return typeof valor === 'string' ? valor.trim() : ''
})

const titulo = computed(() => {
  const valor = props.contenido?.titulo
  return typeof valor === 'string' ? valor.trim() : ''
})

const descripcion = computed(() => {
  const valor = props.contenido?.descripcion
  return typeof valor === 'string' ? valor.trim() : ''
})

const items = computed(() => {
  const elementos = props.contenido?.items

  if (!Array.isArray(elementos)) {
    return []
  }

  return [...elementos]
    .filter((item) => {
      return (
        item &&
        typeof item === 'object' &&
        item.activo !== false
      )
    })
    .map((item, index) => {
      const orden = Number(item.orden)

      return {
        ...item,
        orden: Number.isFinite(orden)
          ? orden
          : index + 1,
      }
    })
    .sort((a, b) => a.orden - b.orden)
})

const tieneEncabezado = computed(() => {
  return Boolean(
    eyebrow.value ||
    titulo.value ||
    descripcion.value,
  )
})
</script>

<template>
  <section
    v-if="activo"
    id="beneficios"
    class="section benefits"
    style="position: relative;"
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

      <div
        v-if="tieneEncabezado"
        class="section-header"
      >
        <span
          v-if="eyebrow"
          class="section-eyebrow"
        >
          {{ eyebrow }}
        </span>

        <h2
          v-if="titulo"
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
      </div>

      <div
        v-if="items.length"
        class="benefits__grid"
      >
        <BenefitCard
          v-for="(item, index) in items"
          :key="
            item.id ||
            `${item.orden}-${index}-${item.titulo || ''}`
          "
          :item="item"
        />
      </div>

    </div>
  </section>
</template>