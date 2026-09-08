<script setup>
defineProps({
  label: {
    type: String,
    default: 'Conocer más',
  },

  href: {
    type: String,
    default: '',
  },

  type: {
    type: String,
    default: 'button',
  },

  variant: {
    type: String,
    default: 'primary',
  },

  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <a
    v-if="href"
    :href="href"
    class="base-button"
    :class="`base-button--${variant}`"
  >
    {{ label }}
  </a>

  <button
    v-else
    :type="type"
    class="base-button"
    :class="`base-button--${variant}`"
    :disabled="disabled"
  >
    {{ label }}
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 22px;
  border: 0;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.base-button:hover {
  transform: translateY(-2px);
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-button--primary {
  background: #2563eb;
  color: #ffffff;
}

.base-button--primary:hover {
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
}

.base-button--secondary {
  background: #f3f4f6;
  color: #111827;
}

.base-button--outline {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #111827;
}
</style>