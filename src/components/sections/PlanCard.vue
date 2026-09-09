<script setup>
import { computed } from 'vue'

const props = defineProps({
  plan: {
    type: Object,
    default: () => ({}),
  },
})

const nombre = computed(() => {
  return String(
    props.plan?.nombre || 'Plan'
  ).trim()
})

const descripcion = computed(() => {
  return String(
    props.plan?.descripcion || ''
  ).trim()
})

const destacado = computed(() => {
  return props.plan?.destacado === true
})

const periodo = computed(() => {
  return String(
    props.plan?.periodo || ''
  ).trim()
})

const precio = computed(() => {
  const valor = Number(
    props.plan?.precio ?? 0
  )

  if (!Number.isFinite(valor)) {
    return '0'
  }

  return valor.toLocaleString(
    'es-MX',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )
})

const caracteristicas = computed(() => {
  const valor =
    props.plan?.caracteristicas

  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return []
  }

  if (Array.isArray(valor)) {
    return valor
      .map((item) => {
        if (
          item &&
          typeof item === 'object'
        ) {
          return (
            item.texto ||
            item.nombre ||
            item.descripcion ||
            ''
          )
        }

        return String(item || '')
      })
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor)

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (
              item &&
              typeof item === 'object'
            ) {
              return (
                item.texto ||
                item.nombre ||
                item.descripcion ||
                ''
              )
            }

            return String(item || '')
          })
          .map((item) => String(item).trim())
          .filter(Boolean)
      }

      if (
        parsed &&
        typeof parsed === 'object'
      ) {
        return Object.values(parsed)
          .map((item) => {
            if (
              item &&
              typeof item === 'object'
            ) {
              return (
                item.texto ||
                item.nombre ||
                item.descripcion ||
                ''
              )
            }

            return String(item || '')
          })
          .map((item) => String(item).trim())
          .filter(Boolean)
      }
    } catch {
      return [valor.trim()].filter(Boolean)
    }

    return [valor.trim()].filter(Boolean)
  }

  if (
    typeof valor === 'object'
  ) {
    return Object.values(valor)
      .map((item) => {
        if (
          item &&
          typeof item === 'object'
        ) {
          return (
            item.texto ||
            item.nombre ||
            item.descripcion ||
            ''
          )
        }

        return String(item || '')
      })
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  return [String(valor).trim()].filter(Boolean)
})

const tieneCaracteristicas =
  computed(() => {
    return caracteristicas.value.length > 0
  })

const textoBoton = computed(() => {
  return String(
    props.plan?.botonTexto ||
      props.plan?.ctaTexto ||
      `Elegir ${nombre.value}`
  ).trim()
})

const enlace = computed(() => {
  return String(
    props.plan?.url ||
      props.plan?.enlace ||
      ''
  ).trim()
})

const esEnlaceExterno = computed(() => {
  return (
    /^https?:\/\//i.test(
      enlace.value
    ) ||
    /^www\./i.test(
      enlace.value
    )
  )
})

const usarEnlace = computed(() => {
  return Boolean(enlace.value)
})
</script>

<template>
  <article
    class="plan-card"
    :class="{
      'plan-card--featured': destacado,
    }"
  >
    <div
      v-if="destacado"
      class="plan-card__badge"
      aria-label="Plan recomendado"
    >
      <span
        class="plan-card__badge-icon"
        aria-hidden="true"
      >
        ★
      </span>

      <span>
        Más popular
      </span>
    </div>

    <div class="plan-card__content">

      <header class="plan-card__header">
        <div class="plan-card__title-row">
          <h3 class="plan-card__name">
            {{ nombre }}
          </h3>

          <span
            v-if="destacado"
            class="plan-card__recommended"
          >
            Recomendado
          </span>
        </div>

        <p
          v-if="descripcion"
          class="plan-card__description"
        >
          {{ descripcion }}
        </p>
      </header>

      <div class="plan-card__price">
        <span
          class="plan-card__currency"
          aria-hidden="true"
        >
          $
        </span>

        <span
          class="plan-card__amount"
          :aria-label="`Precio ${precio} pesos`"
        >
          {{ precio }}
        </span>

        <span
          v-if="periodo"
          class="plan-card__period"
        >
          / {{ periodo }}
        </span>
      </div>

      <div
        class="plan-card__divider"
        aria-hidden="true"
      ></div>

      <div class="plan-card__features">
        <p class="plan-card__features-title">
          Todo lo que incluye:
        </p>

        <ul
          v-if="tieneCaracteristicas"
          class="plan-card__features-list"
        >
          <li
            v-for="(
              caracteristica,
              index
            ) in caracteristicas"
            :key="
              `${plan.id || nombre}-feature-${index}`
            "
            class="plan-card__feature"
          >
            <span
              class="plan-card__check"
              aria-hidden="true"
            >
              ✓
            </span>

            <span
              class="plan-card__feature-text"
            >
              {{ caracteristica }}
            </span>
          </li>
        </ul>

        <p
          v-else
          class="plan-card__no-features"
        >
          Consulta las características
          disponibles para este plan.
        </p>
      </div>

      <a
        v-if="usarEnlace"
        :href="enlace"
        class="plan-card__button"
        :class="{
          'plan-card__button--featured':
            destacado,
        }"
        :target="
          esEnlaceExterno
            ? '_blank'
            : undefined
        "
        :rel="
          esEnlaceExterno
            ? 'noopener noreferrer'
            : undefined
        "
      >
        <span>
          {{ textoBoton }}
        </span>

        <span
          class="plan-card__button-icon"
          aria-hidden="true"
        >
          →
        </span>
      </a>

      <a
        v-else
        href="#contacto"
        class="plan-card__button"
        :class="{
          'plan-card__button--featured':
            destacado,
        }"
      >
        <span>
          {{ textoBoton }}
        </span>

        <span
          class="plan-card__button-icon"
          aria-hidden="true"
        >
          →
        </span>
      </a>

    </div>
  </article>
</template>