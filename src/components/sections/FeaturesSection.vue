<script setup>
import FeatureCard from './FeatureCard.vue'

defineProps({
  contenido: {
    type: Object,
    default: () => ({}),
  },
})

const ordenarItems = (items = []) => {
  if (!Array.isArray(items)) {
    return []
  }

  return [...items]
    .filter((item) => item && item.activo !== false)
    .sort((a, b) => {
      return Number(a.orden ?? 999) - Number(b.orden ?? 999)
    })
}
</script>

<template>
  <section
    v-if="contenido && contenido.activo !== false"
    id="caracteristicas"
    class="section features"
  >
    <div class="container">

      <div class="section-header">

        <span
          v-if="contenido.eyebrow"
          class="section-eyebrow"
        >
          {{ contenido.eyebrow }}
        </span>

        <h2
          v-if="contenido.titulo"
          class="section-title"
        >
          {{ contenido.titulo }}
        </h2>

        <p
          v-if="contenido.descripcion"
          class="section-description"
        >
          {{ contenido.descripcion }}
        </p>

      </div>

      <div
        v-if="ordenarItems(contenido.items).length"
        class="features__grid"
      >
        <FeatureCard
          v-for="item in ordenarItems(contenido.items)"
          :key="item.id || `${item.orden}-${item.titulo}`"
          :item="item"
        />
      </div>

    </div>
  </section>
</template>