<script setup>
import { computed } from 'vue'

import PlanCard from './PlanCard.vue'

const props = defineProps({
  contenido: {
    type: Object,
    default: () => ({}),
  },

  planes: {
    type: Array,
    default: () => [],
  },

  cargando: {
    type: Boolean,
    default: false,
  },

  error: {
    type: String,
    default: '',
  },
})

const planesOrdenados = computed(() => {
  if (!Array.isArray(props.planes)) {
    return []
  }

  return [...props.planes]
    .filter((plan) => plan && plan.activo !== false)
    .sort((a, b) => {
      return Number(a.orden ?? 999) - Number(b.orden ?? 999)
    })
})
</script>

<template>
  <section
    v-if="contenido && contenido.activo !== false"
    id="planes"
    class="section plans"
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
        v-if="cargando"
        class="plans__status"
      >
        Cargando planes...
      </div>

      <div
        v-else-if="error"
        class="plans__status plans__status--error"
      >
        {{ error }}
      </div>

      <div
        v-else-if="!planesOrdenados.length"
        class="plans__status"
      >
        No hay planes disponibles actualmente.
      </div>

      <div
        v-else
        class="plans__grid"
      >
        <PlanCard
          v-for="plan in planesOrdenados"
          :key="plan.id"
          :plan="plan"
        />
      </div>

    </div>
  </section>
</template>