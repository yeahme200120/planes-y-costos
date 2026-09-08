<script setup>
defineProps({
  mensaje: {
    type: String,
    default: 'No hay información disponible.',
  },
})
</script>

<template>
  <div class="state state--empty">
    <p>
      {{ mensaje }}
    </p>
  </div>
</template>