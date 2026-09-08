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

  centered: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <div
    class="section-title"
    :class="{ 'section-title--centered': centered }"
  >
    <span
      v-if="eyebrow"
      class="section-title__eyebrow"
    >
      {{ eyebrow }}
    </span>

    <h2 class="section-title__title">
      {{ title }}
    </h2>

    <p
      v-if="description"
      class="section-title__description"
    >
      {{ description }}
    </p>
  </div>
</template>

<style scoped>
.section-title {
  width: 100%;
  max-width: 760px;
  margin-bottom: 48px;
}

.section-title--centered {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.section-title__eyebrow {
  display: inline-block;
  margin-bottom: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-title__title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  font-weight: 800;
}

.section-title__description {
  margin: 18px 0 0;
  font-size: 1.05rem;
  line-height: 1.7;
  color: #6b7280;
}
</style>