<script setup>
import {
  computed,
} from 'vue'

import SolutionCard from './SolutionCard.vue'

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
        (
          String(
            item.titulo || ''
          ).trim() ||
          String(
            item.descripcion || ''
          ).trim()
        )
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

const tieneSoluciones = computed(() => {
  return items.value.length > 0
})
</script>

<template>
  <section
    v-if="activo"
    id="soluciones"
    class="section solutions"
    aria-labelledby="solutions-title"
  >
    <div class="container solutions__container">

      <header
        v-if="tieneEncabezado"
        class="section-header solutions__header"
      >
        <span
          v-if="eyebrow"
          class="section-eyebrow solutions__eyebrow"
        >
          {{ eyebrow }}
        </span>

        <h2
          v-if="titulo"
          id="solutions-title"
          class="section-title solutions__title"
        >
          {{ titulo }}
        </h2>

        <p
          v-if="descripcion"
          class="section-description solutions__description"
        >
          {{ descripcion }}
        </p>
      </header>

      <div
        v-if="tieneSoluciones"
        class="solutions__grid"
      >
        <SolutionCard
          v-for="item in items"
          :key="
            item.id ||
            `${item.orden ?? 999}-${item.titulo || 'solution'}`
          "
          :item="item"
        />
      </div>

      <div
        v-else
        class="solutions__empty"
        aria-live="polite"
      >
        <span
          class="solutions__empty-icon"
          aria-hidden="true"
        >
          ✦
        </span>

        <p class="solutions__empty-text">
          Actualmente estamos preparando
          nuestras soluciones.
        </p>
      </div>

    </div>
  </section>
</template>