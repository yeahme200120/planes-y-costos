<script setup>
import BenefitCard from './BenefitCard.vue'

defineProps({
  contenido: {
    type: Object,
    default: () => ({}),
  },
})

const ordenarItems = (items = []) => {
  return [...items]
    .filter((item) => item.activo !== false)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
}
</script>

<template>
  <section
    v-if="contenido && contenido.activo !== false"
    id="beneficios"
    class="section benefits"
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
        v-if="contenido.items?.length"
        class="benefits__grid"
      >
        <BenefitCard
          v-for="item in ordenarItems(contenido.items)"
          :key="`${item.orden}-${item.titulo}`"
          :item="item"
        />
      </div>

    </div>
  </section>
</template>