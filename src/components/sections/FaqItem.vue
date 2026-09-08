<script setup>
import { ref } from 'vue'

defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const abierto = ref(false)
</script>

<template>
  <article
    v-if="item && item.activo !== false"
    class="faq-item"
    :class="{ 'faq-item--open': abierto }"
  >
    <button
      type="button"
      class="faq-item__question"
      :aria-expanded="abierto"
      @click="abierto = !abierto"
    >
      <span>
        {{ item.pregunta || 'Pregunta' }}
      </span>

      <span
        class="faq-item__icon"
        aria-hidden="true"
      >
        <span></span>
        <span></span>
      </span>
    </button>

    <div
      v-show="abierto"
      class="faq-item__answer"
    >
      <p>
        {{ item.respuesta || '' }}
      </p>
    </div>
  </article>
</template>