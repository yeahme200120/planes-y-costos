<script setup>
defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <article
    v-if="item && item.activo !== false"
    class="solution-card"
  >
    <div
      v-if="item.icono"
      class="solution-card__icon"
      aria-hidden="true"
    >
      {{ item.icono }}
    </div>

    <div class="solution-card__content">

      <h3 v-if="item.titulo">
        {{ item.titulo }}
      </h3>

      <p v-if="item.descripcion">
        {{ item.descripcion }}
      </p>

    </div>
  </article>
</template>