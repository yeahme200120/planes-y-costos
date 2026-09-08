<script setup>
import { computed } from 'vue'

const props = defineProps({
  plan: {
    type: Object,
    required: true,
  },
})

const caracteristicas = computed(() => {
  const valor = props.plan?.caracteristicas

  // Ya es un arreglo
  if (Array.isArray(valor)) {
    return valor.filter(Boolean)
  }

  // No existe
  if (valor === null || valor === undefined || valor === '') {
    return []
  }

  // Si Firebase guarda JSON como string
  if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor)

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean)
      }

      // Si es un objeto
      if (parsed && typeof parsed === 'object') {
        return Object.values(parsed).filter(Boolean)
      }
    } catch {
      // Si no es JSON, lo tratamos como una característica individual
      return [valor]
    }
  }

  // Si llega como objeto
  if (typeof valor === 'object') {
    return Object.values(valor).filter(Boolean)
  }

  return [String(valor)]
})

const precio = computed(() => {
  const valor = Number(props.plan?.precio ?? 0)

  return Number.isFinite(valor)
    ? valor.toLocaleString('es-MX')
    : '0'
})
</script>

<template>
  <article
    class="plan-card"
    :class="{ 'plan-card--featured': plan.destacado }"
  >
    <div
      v-if="plan.destacado"
      class="plan-card__badge"
    >
      <span>★</span>
      <span>Más popular</span>
    </div>

    <div class="plan-card__content">

      <div class="plan-card__header">
        <h3 class="plan-card__name">
          {{ plan.nombre }}
        </h3>

        <p
          v-if="plan.descripcion"
          class="plan-card__description"
        >
          {{ plan.descripcion }}
        </p>
      </div>

      <div class="plan-card__price">
        <span class="plan-card__currency">
          $
        </span>

        <span class="plan-card__amount">
          {{ precio }}
        </span>

        <span
          v-if="plan.periodo"
          class="plan-card__period"
        >
          / {{ plan.periodo }}
        </span>
      </div>

      <div class="plan-card__divider"></div>

      <div class="plan-card__features">
        <p class="plan-card__features-title">
          Incluye:
        </p>

        <ul v-if="caracteristicas.length">
          <li
            v-for="(caracteristica, index) in caracteristicas"
            :key="`${plan.id}-feature-${index}`"
          >
            <span class="plan-card__check">
              ✓
            </span>

            <span class="plan-card__feature-text">
              {{ caracteristica }}
            </span>
          </li>
        </ul>

        <p
          v-else
          class="plan-card__no-features"
        >
          Consulta las características del plan.
        </p>
      </div>

      <button
        type="button"
        class="plan-card__button"
        :class="{
          'plan-card__button--featured': plan.destacado
        }"
      >
        Elegir {{ plan.nombre }}
      </button>

    </div>
  </article>
</template>