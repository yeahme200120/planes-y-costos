<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },

  indice: {
    type: Number,
    default: 0,
  },
})

const abierto = ref(false)

const activo = computed(() => {
  return props.item?.activo !== false
})

const pregunta = computed(() => {
  return String(
    props.item?.pregunta ||
      'Pregunta'
  ).trim()
})

const respuesta = computed(() => {
  return String(
    props.item?.respuesta || ''
  ).trim()
})

const tieneRespuesta = computed(() => {
  return Boolean(respuesta.value)
})

const identificador = computed(() => {
  const id =
    props.item?.id ||
    `faq-${props.indice}`

  return String(id)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
})

const respuestaId = computed(() => {
  return `faq-answer-${identificador.value}`
})

const preguntaId = computed(() => {
  return `faq-question-${identificador.value}`
})

function alternar() {
  if (!tieneRespuesta.value) {
    return
  }

  abierto.value = !abierto.value
}
</script>

<template>
  <article
    v-if="activo"
    class="faq-item"
    :class="{
      'faq-item--open': abierto,
      'faq-item--disabled': !tieneRespuesta,
    }"
  >
    <h3 class="faq-item__heading">
      <button
        :id="preguntaId"
        type="button"
        class="faq-item__question"
        :aria-expanded="abierto"
        :aria-controls="respuestaId"
        :aria-disabled="!tieneRespuesta"
        :disabled="!tieneRespuesta"
        @click="alternar"
      >
        <span class="faq-item__question-text">
          {{ pregunta }}
        </span>

        <span
          class="faq-item__icon"
          aria-hidden="true"
        >
          <span></span>
          <span></span>
        </span>
      </button>
    </h3>

    <div
      v-if="tieneRespuesta"
      :id="respuestaId"
      class="faq-item__answer-wrapper"
      role="region"
      :aria-labelledby="preguntaId"
    >
      <div class="faq-item__answer">
        <p>
          {{ respuesta }}
        </p>
      </div>
    </div>
  </article>
</template>