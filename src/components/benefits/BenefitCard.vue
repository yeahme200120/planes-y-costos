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
    class="benefit-card"
  >
    <div
      v-if="item.icono"
      class="benefit-card__icon"
      aria-hidden="true"
    >
      {{ item.icono }}
    </div>

    <h3 v-if="item.titulo">
      {{ item.titulo }}
    </h3>

    <p v-if="item.descripcion">
      {{ item.descripcion }}
    </p>
  </article>
</template>