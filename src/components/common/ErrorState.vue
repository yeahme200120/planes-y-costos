<script setup>
defineProps({
  mensaje: {
    type: String,
    default: 'No fue posible cargar la información.',
  },
})
</script>

<template>
  <div class="state state--error">
    <div class="state__icon">
      !
    </div>

    <p>
      {{ mensaje }}
    </p>
  </div>
</template>