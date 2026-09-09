<script setup>
import { computed } from 'vue'

import FeatureCard from './FeatureCard.vue'

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
  const elementos = props.contenido?.items

  if (!Array.isArray(elementos)) {
    return []
  }

  return [...elementos]
    .filter((item) => {
      return (
        item &&
        item.activo !== false &&
        (
          String(item.titulo || '').trim() ||
          String(item.descripcion || '').trim()
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
</script>

<template>
  <section
    v-if="activo"
    id="caracteristicas"
    class="section features"
    aria-labelledby="features-title"
  >
    <div class="container">

      <!-- ENCABEZADO -->
      <header
        v-if="tieneEncabezado"
        class="section-header features__header"
      >
        <span
          v-if="eyebrow"
          class="section-eyebrow"
        >
          {{ eyebrow }}
        </span>

        <h2
          v-if="titulo"
          id="features-title"
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

      <!-- CARACTERÍSTICAS -->
      <div
        v-if="items.length"
        class="features__grid"
      >
        <FeatureCard
          v-for="item in items"
          :key="
            item.id ||
            `${item.orden ?? 999}-${item.titulo || 'feature'}`
          "
          :item="item"
        />
      </div>

      <!-- ESTADO VACÍO -->
      <div
        v-else
        class="features__empty"
        aria-live="polite"
      >
        <span
          class="features__empty-icon"
          aria-hidden="true"
        >
          ✓
        </span>

        <p>
          Estamos preparando las características de nuestras soluciones.
        </p>
      </div>

    </div>
  </section>
</template>