<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const activo = computed(
  () => props.item?.activo !== false,
)

const icono = computed(() => {
  const valor = props.item?.icono
  return typeof valor === 'string' ? valor.trim() : ''
})

const titulo = computed(() => {
  const valor = props.item?.titulo
  return typeof valor === 'string' ? valor.trim() : ''
})

const descripcion = computed(() => {
  const valor = props.item?.descripcion
  return typeof valor === 'string' ? valor.trim() : ''
})

const tieneContenido = computed(() => {
  return Boolean(titulo.value || descripcion.value)
})
</script>

<template>
  <article
    v-if="activo && tieneContenido"
    class="benefit-card"
  >
    <div
      v-if="icono"
      class="benefit-card__icon"
      aria-hidden="true"
    >
      {{ icono }}
    </div>

    <h3 v-if="titulo">
      {{ titulo }}
    </h3>

    <p v-if="descripcion">
      {{ descripcion }}
    </p>
  </article>
</template>