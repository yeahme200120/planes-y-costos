<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue'

import {
  actualizarConfiguracion,
  suscribirConfiguracionAdmin,
} from '../../services/adminService'

import ConfiguracionIdentidad from '../../components/admin/configuracion/ConfiguracionIdentidad.vue'
import ConfiguracionApariencia from '../../components/admin/configuracion/ConfiguracionApariencia.vue'
import ConfiguracionDatos from '../../components/admin/configuracion/ConfiguracionDatos.vue'

const cargando = ref(true)
const guardando = ref(false)
const error = ref('')
const mensaje = ref('')
const conectadaTiempoReal = ref(false)

const configuracion = reactive({})
const configuracionOriginal = reactive({})

let unsubscribeConfiguracion = null

const panelActivo = ref('identidad')

const paneles = [
  {
    id: 'identidad',
    titulo: 'Identidad visual',
    descripcion: 'Logo, favicon y recursos gráficos',
    icono: '◇',
  },
  {
    id: 'apariencia',
    titulo: 'Apariencia',
    descripcion: 'Colores y sistema visual',
    icono: '✦',
  },
  {
    id: 'datos',
    titulo: 'Datos generales',
    descripcion: 'Información de la empresa',
    icono: '☷',
  },
]

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
  'danger',
  'warning',
]

const coloresPredeterminados = {
  primary: '#0F172A',
  primaryLight: '#1E293B',
  primaryDark: '#020617',
  primaryText: '#FFFFFF',

  secondary: '#334155',
  secondaryLight: '#E2E8F0',
  secondaryDark: '#1E293B',
  secondaryText: '#FFFFFF',

  accent: '#2F80ED',
  accentLight: '#EFF6FF',
  accentDark: '#1D4ED8',
  accentText: '#FFFFFF',

  background: '#F8FAFC',
  backgroundAlt: '#F1F5F9',

  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',

  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  border: '#E2E8F0',

  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
}

function limpiarObjeto(objeto) {
  Object.keys(objeto).forEach((clave) => {
    delete objeto[clave]
  })
}

function copiarConfiguracion(objeto) {
  try {
    return JSON.parse(JSON.stringify(objeto || {}))
  } catch {
    return {}
  }
}

function aplicarConfiguracion(datos = {}) {
  limpiarObjeto(configuracion)
  limpiarObjeto(configuracionOriginal)

  const copia = copiarConfiguracion(datos)

  Object.assign(configuracion, copia)
  Object.assign(configuracionOriginal, copiarConfiguracion(copia))

  aplicarVariablesGlobales()
}

function esHexValido(valor) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    String(valor || '').trim(),
  )
}

function normalizarHex(valor) {
  const limpio = String(valor || '').trim()

  if (!esHexValido(limpio)) {
    return ''
  }

  if (limpio.length === 4) {
    return (
      '#' +
      limpio[1] +
      limpio[1] +
      limpio[2] +
      limpio[2] +
      limpio[3] +
      limpio[3]
    ).toUpperCase()
  }

  return limpio.toUpperCase()
}

function valorColor(campo) {
  const valor = configuracion[campo]

  if (esHexValido(valor)) {
    return normalizarHex(valor)
  }

  return coloresPredeterminados[campo]
}

function aplicarVariablesGlobales() {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  const variables = {
    '--color-primary': valorColor('primary'),
    '--color-primary-light': valorColor('primaryLight'),
    '--color-primary-dark': valorColor('primaryDark'),
    '--color-primary-text': valorColor('primaryText'),

    '--color-secondary': valorColor('secondary'),
    '--color-secondary-light': valorColor('secondaryLight'),
    '--color-secondary-dark': valorColor('secondaryDark'),
    '--color-secondary-text': valorColor('secondaryText'),

    '--color-accent': valorColor('accent'),
    '--color-accent-light': valorColor('accentLight'),
    '--color-accent-dark': valorColor('accentDark'),
    '--color-accent-text': valorColor('accentText'),

    '--color-background': valorColor('background'),
    '--color-background-alt': valorColor('backgroundAlt'),

    '--color-surface': valorColor('surface'),
    '--color-surface-alt': valorColor('surfaceAlt'),

    '--color-text': valorColor('text'),
    '--color-text-secondary': valorColor('textSecondary'),
    '--color-text-muted': valorColor('textMuted'),

    '--color-border': valorColor('border'),

    '--color-success': valorColor('success'),
    '--color-danger': valorColor('danger'),
    '--color-warning': valorColor('warning'),
  }

  Object.entries(variables).forEach(([variable, valor]) => {
    root.style.setProperty(variable, valor)
  })
}

function cambiarPanel(panel) {
  panelActivo.value = panel
  error.value = ''
  mensaje.value = ''
}

function actualizarConfiguracionLocal(datos = {}) {
  Object.entries(datos).forEach(([clave, valor]) => {
    configuracion[clave] = valor
  })

  aplicarVariablesGlobales()
}

function actualizarColor({ campo, valor }) {
  if (!camposColor.includes(campo)) return

  const color = normalizarHex(valor)

  if (!color) return

  configuracion[campo] = color

  aplicarVariablesGlobales()
}

function actualizarLogo(datos = {}) {
  Object.entries(datos).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      configuracion[clave] = valor
    }
  })
}

function actualizarPaleta(datos = {}) {
  Object.entries(datos).forEach(([clave, valor]) => {
    if (camposColor.includes(clave) && esHexValido(valor)) {
      configuracion[clave] = normalizarHex(valor)
    }
  })

  if (datos.paleta) {
    configuracion.paleta = copiarConfiguracion(datos.paleta)
  }

  aplicarVariablesGlobales()
}

function restaurarCambios() {
  if (guardando.value) return

  try {
    const restaurada =
      copiarConfiguracion(configuracionOriginal)

    limpiarObjeto(configuracion)

    Object.assign(
      configuracion,
      restaurada,
    )

    aplicarVariablesGlobales()

    mensaje.value =
      'Cambios descartados correctamente.'

    error.value = ''
  } catch (err) {
    console.error(
      'Error al descartar cambios:',
      err,
    )

    error.value =
      err?.message ||
      'No fue posible descartar los cambios.'

    mensaje.value = ''
  }
}

async function guardarConfiguracion() {
  if (guardando.value) return

  try {
    guardando.value = true
    error.value = ''
    mensaje.value = ''

    const datos = copiarConfiguracion(configuracion)

    delete datos.id

    datos.paleta = {
      ...(datos.paleta && typeof datos.paleta === 'object'
        ? datos.paleta
        : {}),
    }

    await actualizarConfiguracion('general', datos)

    limpiarObjeto(configuracionOriginal)

    Object.assign(
      configuracionOriginal,
      copiarConfiguracion(datos),
    )

    aplicarVariablesGlobales()

    mensaje.value =
      'Configuración actualizada correctamente.'
  } catch (err) {
    console.error(err)

    error.value =
      err?.message ||
      'No fue posible guardar la configuración.'
  } finally {
    guardando.value = false
  }
}

function iniciarSuscripcion() {
  if (unsubscribeConfiguracion) {
    unsubscribeConfiguracion()
    unsubscribeConfiguracion = null
  }

  cargando.value = true
  error.value = ''

  try {
    unsubscribeConfiguracion =
      suscribirConfiguracionAdmin(
        'general',
        (datos) => {
          cargando.value = false
          conectadaTiempoReal.value = true

          if (!datos) {
            limpiarObjeto(configuracion)
            limpiarObjeto(configuracionOriginal)

            Object.assign(
              configuracion,
              copiarConfiguracion(coloresPredeterminados),
            )

            aplicarVariablesGlobales()

            return
          }

          aplicarConfiguracion(datos)
        },
        (err) => {
          cargando.value = false
          conectadaTiempoReal.value = false

          error.value =
            err?.message ||
            'No fue posible conectar con Firebase.'
        },
      )
  } catch (err) {
    cargando.value = false
    conectadaTiempoReal.value = false

    error.value =
      err?.message ||
      'No fue posible iniciar la configuración.'
  }
}

watch(
  () => configuracion.primary,
  () => {
    aplicarVariablesGlobales()
  },
)

watch(
  () => configuracion.primaryLight,
  aplicarVariablesGlobales,
)

watch(
  () => configuracion.primaryDark,
  aplicarVariablesGlobales,
)

watch(
  () => configuracion.accent,
  aplicarVariablesGlobales,
)

const existeConfiguracion = computed(
  () => Object.keys(configuracion).length > 0,
)

onMounted(() => {
  iniciarSuscripcion()
})

onUnmounted(() => {
  if (unsubscribeConfiguracion) {
    unsubscribeConfiguracion()
    unsubscribeConfiguracion = null
  }
})
</script>

<template>
  <section class="admin-configuracion">

    <!-- ENCABEZADO -->
    <header class="admin-configuracion__header">
      <div>
        <span class="admin-configuracion__eyebrow">
          SISTEMA
        </span>

        <h1>Configuración</h1>

        <p>
          Administra la identidad visual y los datos generales
          de tu empresa.
        </p>
      </div>

      <div class="admin-configuracion__realtime">
        <span class="admin-configuracion__realtime-dot" :class="{
          'is-online': conectadaTiempoReal,
        }" />

        <span>
          {{
            conectadaTiempoReal
              ? 'Sincronización en tiempo real'
              : 'Conectando...'
          }}
        </span>
      </div>
    </header>

    <!-- ESTADO DE CARGA -->
    <div v-if="cargando" class="admin-configuracion__state">
      <div class="admin-configuracion__spinner" />
      <strong>Cargando configuración</strong>
      <span>
        Conectando con Firebase...
      </span>
    </div>

    <!-- ERROR -->
    <div v-else-if="error" class="admin-configuracion__alert admin-configuracion__alert--error">
      <div>
        <strong>No fue posible cargar la configuración</strong>
        <p>{{ error }}</p>
      </div>

      <button type="button" class="admin-configuracion__alert-action" @click="iniciarSuscripcion">
        Reintentar
      </button>
    </div>

    <template v-else>

      <!-- NAVEGACIÓN -->
      <nav class="admin-configuracion__tabs">
        <button v-for="panel in paneles" :key="panel.id" type="button" class="admin-configuracion__tab" :class="{
          'is-active': panelActivo === panel.id,
        }" @click="cambiarPanel(panel.id)">
          <span class="admin-configuracion__tab-icon">
            {{ panel.icono }}
          </span>

          <span class="admin-configuracion__tab-content">
            <strong>{{ panel.titulo }}</strong>
            <small>{{ panel.descripcion }}</small>
          </span>
        </button>
      </nav>

      <!-- MENSAJE -->
      <div v-if="mensaje" class="admin-configuracion__alert admin-configuracion__alert--success">
        {{ mensaje }}
      </div>

      <!-- CONTENIDO -->
      <main v-if="existeConfiguracion" class="admin-configuracion__workspace">

        <ConfiguracionIdentidad v-if="panelActivo === 'identidad'" :configuracion="configuracion"
          @actualizar-logo="actualizarLogo" />

        <ConfiguracionApariencia v-else-if="panelActivo === 'apariencia'" :configuracion="configuracion"
          :colores-predeterminados="coloresPredeterminados" @actualizar-color="actualizarColor"
          @actualizar-paleta="actualizarPaleta" />

        <ConfiguracionDatos v-else-if="panelActivo === 'datos'" :configuracion="configuracion"
          :campos-color="camposColor" @actualizar="actualizarConfiguracionLocal" />

      </main>

      <!-- ACCIONES -->
      <footer class="admin-configuracion__actions">
        <button type="button" class="admin-configuracion__button admin-configuracion__button--secondary"
          :disabled="guardando" @click="restaurarCambios">
          Descartar cambios
        </button>

        <button type="button" class="admin-configuracion__button admin-configuracion__button--primary"
          :disabled="guardando" @click="guardarConfiguracion">
          <span v-if="guardando">
            Guardando...
          </span>

          <span v-else>
            Guardar configuración
          </span>
        </button>
      </footer>

    </template>
  </section>
</template>