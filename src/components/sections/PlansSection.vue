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

const planesOrdenados = computed(() => {
  if (!Array.isArray(props.planes)) {
    return []
  }

  return [...props.planes]
    .filter((plan) => {
      return (
        plan &&
        plan.activo !== false
      )
    })
    .sort((a, b) => {
      return (
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
      )
    })
})

const cantidadPlanes = computed(() => {
  return planesOrdenados.value.length
})

const tieneEncabezado = computed(() => {
  return Boolean(
    eyebrow.value ||
    titulo.value ||
    descripcion.value
  )
})

const tienePlanes = computed(() => {
  return cantidadPlanes.value > 0
})

const mensajeVacio = computed(() => {
  return String(
    props.contenido?.mensajeVacio ||
      'No hay planes disponibles actualmente.'
  ).trim()
})

const mensajeCarga = computed(() => {
  return String(
    props.contenido?.mensajeCarga ||
      'Cargando nuestros planes...'
  ).trim()
})

const mensajeError = computed(() => {
  return (
    props.error ||
    'No fue posible cargar los planes.'
  )
})
</script>

<template>
  <section
    v-if="activo"
    id="planes"
    class="section plans"
    aria-labelledby="plans-title"
  >
    <div class="container">

      <header
        v-if="tieneEncabezado"
        class="section-header plans__header"
      >
        <span
          v-if="eyebrow"
          class="section-eyebrow"
        >
          {{ eyebrow }}
        </span>

        <h2
          v-if="titulo"
          id="plans-title"
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
        v-if="
          !cargando &&
          !error &&
          tienePlanes
        "
        class="plans__intro"
      >
        <div
          class="plans__intro-line"
          aria-hidden="true"
        ></div>

        <span>
          {{ cantidadPlanes }}
          {{
            cantidadPlanes === 1
              ? 'plan disponible'
              : 'planes disponibles'
          }}
        </span>

        <div
          class="plans__intro-line"
          aria-hidden="true"
        ></div>
      </div>

      <div
        v-if="cargando"
        class="plans__status"
        aria-live="polite"
        aria-busy="true"
      >
        <span
          class="plans__status-spinner"
          aria-hidden="true"
        ></span>

        <span>
          {{ mensajeCarga }}
        </span>
      </div>

      <div
        v-else-if="error"
        class="plans__status plans__status--error"
        role="alert"
      >
        <span
          class="plans__status-icon"
          aria-hidden="true"
        >
          !
        </span>

        <div>
          <strong>
            No fue posible cargar los planes.
          </strong>

          <span>
            {{ mensajeError }}
          </span>
        </div>
      </div>

      <div
        v-else-if="!tienePlanes"
        class="plans__status plans__status--empty"
        aria-live="polite"
      >
        <span
          class="plans__status-icon"
          aria-hidden="true"
        >
          ◌
        </span>

        <span>
          {{ mensajeVacio }}
        </span>
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