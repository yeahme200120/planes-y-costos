<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },

  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <header class="section-header">

    <span
      v-if="eyebrow"
      class="section-eyebrow"
    >
      {{ eyebrow }}
    </span>

    <h2 class="section-title">
      {{ title }}
    </h2>

    <p
      v-if="description"
      class="section-description"
    >
      {{ description }}
    </p>

  </header>
</template>
