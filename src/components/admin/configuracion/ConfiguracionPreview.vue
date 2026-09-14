<script setup>
import {
  computed,
} from 'vue'

const props = defineProps({
  configuracion: {
    type: Object,
    default: () => ({}),
  },
})

const coloresPredeterminados = {
  primary: '#4678EC',
  primaryLight: '#DCE7FF',
  primaryDark: '#2858C7',
  primaryText: '#FFFFFF',

  secondary: '#F28B82',
  secondaryLight: '#FFE2DE',
  secondaryDark: '#C95C52',
  secondaryText: '#FFFFFF',

  accent: '#78C6A3',
  accentLight: '#DDF5EA',
  accentDark: '#42906D',
  accentText: '#FFFFFF',

  background: '#F8FAFC',
  backgroundAlt: '#F1F5F9',

  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',

  text: '#172033',
  textSecondary: '#526078',
  textMuted: '#7B879C',

  border: '#E2E8F0',

  success: '#2E9B6F',
  warning: '#D89432',
  danger: '#D95C5C',

  white: '#FFFFFF',
}

const camposColor = [
  'primary',
  'primaryLight',
  'primaryDark',
  'primaryText',

  'secondary',
  'secondaryLight',
  'secondaryDark',
  'secondaryText',

  'accent',
  'accentLight',
  'accentDark',
  'accentText',

  'background',
  'backgroundAlt',

  'surface',
  'surfaceAlt',

  'text',
  'textSecondary',
  'textMuted',

  'border',

  'success',
  'warning',
  'danger',

  'white',
]

function esHexValido(valor) {
  return (
    typeof valor === 'string' &&
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
      valor.trim(),
    )
  )
}

function normalizarHex(valor) {
  if (!esHexValido(valor)) {
    return ''
  }

  const hex = valor.trim()

  if (hex.length === 4) {
    return (
      '#' +
      hex
        .slice(1)
        .split('')
        .map((caracter) => caracter + caracter)
        .join('')
    ).toUpperCase()
  }

  return hex.toUpperCase()
}

function obtenerColor(campo) {
  const configuracionDirecta =
    props.configuracion?.[campo]

  const configuracionPaleta =
    props.configuracion?.paleta?.[campo]

  const respaldo =
    coloresPredeterminados[campo]

  const candidatos = [
    configuracionDirecta,
    configuracionPaleta,
    respaldo,
  ]

  for (const candidato of candidatos) {
    const color = normalizarHex(candidato)

    if (color) {
      return color
    }
  }

  return '#FFFFFF'
}

const colores = computed(() => {
  const resultado = {}

  for (const campo of camposColor) {
    resultado[campo] = obtenerColor(campo)
  }

  return resultado
})

const logo = computed(() => {
  return (
    props.configuracion?.logoUrl ||
    props.configuracion?.logoPngUrl ||
    '/img/logo.jpg'
  )
})

const empresa = computed(() => {
  return (
    props.configuracion?.nombreEmpresa ||
    'Desarrollos IAEH'
  )
})

const estilosPreview = computed(() => ({
  '--preview-primary':
    colores.value.primary,

  '--preview-primary-light':
    colores.value.primaryLight,

  '--preview-primary-dark':
    colores.value.primaryDark,

  '--preview-primary-text':
    colores.value.primaryText,

  '--preview-secondary':
    colores.value.secondary,

  '--preview-secondary-light':
    colores.value.secondaryLight,

  '--preview-secondary-dark':
    colores.value.secondaryDark,

  '--preview-secondary-text':
    colores.value.secondaryText,

  '--preview-accent':
    colores.value.accent,

  '--preview-accent-light':
    colores.value.accentLight,

  '--preview-accent-dark':
    colores.value.accentDark,

  '--preview-accent-text':
    colores.value.accentText,

  '--preview-background':
    colores.value.background,

  '--preview-background-alt':
    colores.value.backgroundAlt,

  '--preview-surface':
    colores.value.surface,

  '--preview-surface-alt':
    colores.value.surfaceAlt,

  '--preview-text':
    colores.value.text,

  '--preview-text-secondary':
    colores.value.textSecondary,

  '--preview-text-muted':
    colores.value.textMuted,

  '--preview-border':
    colores.value.border,

  '--preview-success':
    colores.value.success,

  '--preview-warning':
    colores.value.warning,

  '--preview-danger':
    colores.value.danger,

  '--preview-white':
    colores.value.white,
}))
</script>

<template>
  <article
    class="admin-configuracion__preview-card"
  >
    <div
      class="admin-configuracion__preview-heading"
    >
      <div>
        <span
          class="admin-configuracion__section-kicker"
        >
          PREVISUALIZACIÓN
        </span>

        <h3>
          Aplicación de identidad
        </h3>

        <p>
          Así se comportarán los colores principales
          en la interfaz.
        </p>
      </div>
    </div>

    <div
      class="admin-configuracion__preview"
      :style="estilosPreview"
    >
      <div
        class="admin-configuracion__preview-header"
      >
        <div
          class="admin-configuracion__preview-brand"
        >
          <div
            class="admin-configuracion__preview-logo"
          >
            <img
              :src="logo"
              :alt="empresa"
              loading="lazy"
            />
          </div>

          <strong>
            {{ empresa }}
          </strong>
        </div>

        <nav aria-label="Previsualización">
          <span>
            Inicio
          </span>

          <span>
            Servicios
          </span>

          <span>
            Planes
          </span>
        </nav>

        <button
          type="button"
        >
          Contactar
        </button>
      </div>

      <div
        class="admin-configuracion__preview-content"
      >
        <div
          class="admin-configuracion__preview-sidebar"
        >
          <span class="is-active">
            Dashboard
          </span>

          <span>
            Configuración
          </span>

          <span>
            Usuarios
          </span>

          <span>
            Contenido
          </span>
        </div>

        <div
          class="admin-configuracion__preview-main"
        >
          <span
            class="admin-configuracion__preview-label"
          >
            SISTEMA VISUAL
          </span>

          <h4>
            Identidad empresarial
          </h4>

          <p>
            El color principal mantiene coherencia
            entre administración y sitio público.
          </p>

          <div
            class="admin-configuracion__preview-cards"
          >
            <div>
              <strong>
                Color principal
              </strong>

              <span
                :style="{
                  backgroundColor:
                    colores.primary,
                }"
                aria-hidden="true"
              ></span>
            </div>

            <div>
              <strong>
                Acento
              </strong>

              <span
                :style="{
                  backgroundColor:
                    colores.accent,
                }"
                aria-hidden="true"
              ></span>
            </div>

            <div>
              <strong>
                Superficie
              </strong>

              <span
                :style="{
                  backgroundColor:
                    colores.surface,
                }"
                aria-hidden="true"
              ></span>
            </div>
          </div>

          <div
            class="admin-configuracion__preview-actions"
          >
            <button
              type="button"
              class="is-primary"
            >
              Acción principal
            </button>

            <button
              type="button"
              class="is-secondary"
            >
              Acción secundaria
            </button>
          </div>
        </div>
      </div>

      <div
        class="admin-configuracion__preview-footer"
      >
        <span>
          {{ empresa }}
        </span>

        <span>
          Identidad visual empresarial
        </span>
      </div>
    </div>
  </article>
</template>