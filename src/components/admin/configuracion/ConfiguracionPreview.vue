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

const colores = computed(() => ({
  primary:
    props.configuracion.primary ||
    '#0F172A',

  primaryLight:
    props.configuracion.primaryLight ||
    '#1E293B',

  primaryDark:
    props.configuracion.primaryDark ||
    '#020617',

  primaryText:
    props.configuracion.primaryText ||
    '#FFFFFF',

  secondary:
    props.configuracion.secondary ||
    '#334155',

  accent:
    props.configuracion.accent ||
    '#2F80ED',

  accentLight:
    props.configuracion.accentLight ||
    '#EFF6FF',

  accentDark:
    props.configuracion.accentDark ||
    '#1D4ED8',

  background:
    props.configuracion.background ||
    '#F8FAFC',

  surface:
    props.configuracion.surface ||
    '#FFFFFF',

  text:
    props.configuracion.text ||
    '#1E293B',

  textSecondary:
    props.configuracion.textSecondary ||
    '#64748B',

  border:
    props.configuracion.border ||
    '#E2E8F0',
}))

const logo = computed(() => {
  return (
    props.configuracion.logoUrl ||
    props.configuracion.logoPngUrl ||
    '/img/logo.jpg'
  )
})

const empresa = computed(() => {
  return (
    props.configuracion.nombreEmpresa ||
    'Desarrollos IAEH'
  )
})
</script>

<template>
  <article class="admin-configuracion__preview-card">

    <div class="admin-configuracion__preview-heading">
      <div>
        <span class="admin-configuracion__section-kicker">
          PREVISUALIZACIÓN
        </span>

        <h3>Aplicación de identidad</h3>

        <p>
          Así se comportarán los colores principales
          en la interfaz.
        </p>
      </div>
    </div>

    <div
      class="admin-configuracion__preview"
      :style="{
        '--preview-primary': colores.primary,
        '--preview-primary-light': colores.primaryLight,
        '--preview-primary-dark': colores.primaryDark,
        '--preview-primary-text': colores.primaryText,
        '--preview-secondary': colores.secondary,
        '--preview-accent': colores.accent,
        '--preview-accent-light': colores.accentLight,
        '--preview-accent-dark': colores.accentDark,
        '--preview-background': colores.background,
        '--preview-surface': colores.surface,
        '--preview-text': colores.text,
        '--preview-text-secondary': colores.textSecondary,
        '--preview-border': colores.border,
      }"
    >

      <div class="admin-configuracion__preview-header">

        <div class="admin-configuracion__preview-brand">

          <div class="admin-configuracion__preview-logo">
            <img
              :src="logo"
              :alt="empresa"
            />
          </div>

          <strong>
            {{ empresa }}
          </strong>

        </div>

        <nav>
          <span>Inicio</span>
          <span>Servicios</span>
          <span>Planes</span>
        </nav>

        <button>
          Contactar
        </button>

      </div>

      <div class="admin-configuracion__preview-content">

        <div class="admin-configuracion__preview-sidebar">

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

        <div class="admin-configuracion__preview-main">

          <span class="admin-configuracion__preview-label">
            SISTEMA VISUAL
          </span>

          <h4>
            Identidad empresarial
          </h4>

          <p>
            El color principal mantiene coherencia
            entre administración y sitio público.
          </p>

          <div class="admin-configuracion__preview-cards">

            <div>
              <strong>Color principal</strong>

              <span
                :style="{
                  backgroundColor:
                    colores.primary,
                }"
              />
            </div>

            <div>
              <strong>Acento</strong>

              <span
                :style="{
                  backgroundColor:
                    colores.accent,
                }"
              />
            </div>

            <div>
              <strong>Superficie</strong>

              <span
                :style="{
                  backgroundColor:
                    colores.surface,
                }"
              />
            </div>

          </div>

          <div class="admin-configuracion__preview-actions">

            <button class="is-primary">
              Acción principal
            </button>

            <button class="is-secondary">
              Acción secundaria
            </button>

          </div>

        </div>

      </div>

      <div class="admin-configuracion__preview-footer">
        <span>{{ empresa }}</span>
        <span>Identidad visual empresarial</span>
      </div>

    </div>

  </article>
</template>