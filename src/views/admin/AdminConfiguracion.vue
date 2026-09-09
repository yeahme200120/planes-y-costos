<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from 'vue'

import {
  actualizarConfiguracion,
  suscribirConfiguracionAdmin,
} from '../../services/adminService'

import {
  generarPaleta,
  normalizarHex,
} from '../../services/colorPalette'

const cargando = ref(true)
const guardando = ref(false)

const error = ref('')
const mensaje = ref('')

const conectadaTiempoReal = ref(false)

const configuracion = reactive({})
const configuracionOriginal = reactive({})

let unsubscribeConfiguracion = null

/* =========================================================
   UTILIDADES
   ========================================================= */

function limpiarObjeto(objeto) {
  Object.keys(objeto).forEach((key) => {
    delete objeto[key]
  })
}

function copiarConfiguracion(objeto) {
  return JSON.parse(
    JSON.stringify(objeto ?? {})
  )
}

function aplicarConfiguracion(datos) {
  limpiarObjeto(configuracion)
  limpiarObjeto(configuracionOriginal)

  if (!datos) {
    return
  }

  const copia = copiarConfiguracion(datos)

  delete copia.id

  Object.assign(
    configuracion,
    copia
  )

  Object.assign(
    configuracionOriginal,
    copiarConfiguracion(copia)
  )

  cargarPaletaDesdeConfiguracion(
    copia
  )
}

/* =========================================================
   COLORES
   ========================================================= */

const camposColor = [
  'primary',
  'secondary',
  'accent',
  'background',
  'text',
]

const coloresPredeterminados = {
  primary: '#4678EC',
  secondary: '#EC8A46',
  accent: '#46ECA8',
  background: '#F8FAFC',
  text: '#172033',
}

const nombresColor = {
  primary: 'Color primario',
  secondary: 'Color secundario',
  accent: 'Color de acento',
  background: 'Color de fondo',
  text: 'Color de texto',
}

const descripcionesColor = {
  primary:
    'Botones principales, acciones y elementos destacados de la landing.',

  secondary:
    'Elementos secundarios, superficies y componentes complementarios.',

  accent:
    'Acentos visuales, indicadores y elementos de énfasis.',

  background:
    'Fondo principal de las secciones y superficies de la landing.',

  text:
    'Color utilizado para el texto principal sobre los fondos.',
}

/* =========================================================
   GENERADOR DE PALETA
   ========================================================= */

const colorBase = ref(
  coloresPredeterminados.primary
)

const armoniaSeleccionada =
  ref('triadica')

const suavidad = ref(45)

const contraste = ref(55)

const paletaGenerada = ref(
  generarPaleta(
    colorBase.value,
    {
      armonia:
        armoniaSeleccionada.value,

      suavidad:
        suavidad.value,

      contraste:
        contraste.value,
    }
  )
)

function regenerarPaleta() {
  paletaGenerada.value =
    generarPaleta(
      colorBase.value,
      {
        armonia:
          armoniaSeleccionada.value,

        suavidad:
          suavidad.value,

        contraste:
          contraste.value,
      }
    )
}

function cambiarColorBase(valor) {
  if (
    typeof valor !== 'string'
  ) {
    return
  }

  const valorLimpio =
    valor.trim()

  if (
    !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
      valorLimpio
    )
  ) {
    return
  }

  colorBase.value =
    normalizarHex(
      valorLimpio
    )

  regenerarPaleta()
}

function cargarPaletaDesdeConfiguracion(
  datos
) {
  if (!datos) {
    return
  }

  const base =
    datos?.paleta?.base ||
    datos.primary ||
    coloresPredeterminados.primary

  colorBase.value =
    normalizarHex(base)

  armoniaSeleccionada.value =
    datos?.paleta?.armonia ||
    'triadica'

  suavidad.value =
    Number(
      datos?.paleta?.suavidad ??
        45
    )

  contraste.value =
    Number(
      datos?.paleta?.contraste ??
        55
    )

  regenerarPaleta()
}

function aplicarPaletaGenerada() {
  const paleta =
    paletaGenerada.value

  if (!paleta) {
    return
  }

  Object.entries(
    paleta
  ).forEach(
    ([campo, valor]) => {
      if (
        typeof valor !==
        'string'
      ) {
        return
      }

      configuracion[campo] =
        valor
    }
  )

  configuracion.paleta = {
    base:
      colorBase.value,

    armonia:
      armoniaSeleccionada.value,

    suavidad:
      suavidad.value,

    contraste:
      contraste.value,

    ...paleta,
  }

  mensaje.value =
    'Paleta aplicada. Guarda la configuración para publicar los cambios.'

  error.value = ''
}

/* =========================================================
   PALETA VISUAL
   ========================================================= */

const coloresGenerados = computed(() => {
  const paleta =
    paletaGenerada.value || {}

  return [
    {
      key: 'primary',
      nombre: 'Primario',
      color: paleta.primary,
    },

    {
      key: 'secondary',
      nombre: 'Secundario',
      color: paleta.secondary,
    },

    {
      key: 'accent',
      nombre: 'Acento',
      color: paleta.accent,
    },

    {
      key: 'primaryLight',
      nombre: 'Primario suave',
      color: paleta.primaryLight,
    },

    {
      key: 'secondaryLight',
      nombre: 'Secundario suave',
      color: paleta.secondaryLight,
    },

    {
      key: 'accentLight',
      nombre: 'Acento suave',
      color: paleta.accentLight,
    },

    {
      key: 'background',
      nombre: 'Fondo',
      color: paleta.background,
    },

    {
      key: 'backgroundAlt',
      nombre: 'Fondo alternativo',
      color: paleta.backgroundAlt,
    },

    {
      key: 'surface',
      nombre: 'Superficie',
      color: paleta.surface,
    },

    {
      key: 'text',
      nombre: 'Texto',
      color: paleta.text,
    },

    {
      key: 'textSecondary',
      nombre: 'Texto secundario',
      color: paleta.textSecondary,
    },

    {
      key: 'border',
      nombre: 'Bordes',
      color: paleta.border,
    },
  ].filter(
    (color) =>
      typeof color.color ===
      'string'
  )
})

function esColorConfiguracion(campo) {
  return camposColor.includes(campo)
}

function normalizarColor(valor) {
  if (
    typeof valor !== 'string' ||
    !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
      valor.trim()
    )
  ) {
    return '#000000'
  }

  return valor.trim().toUpperCase()
}

function actualizarColor(
  campo,
  valor
) {
  if (
    typeof valor !== 'string'
  ) {
    return
  }

  const valorLimpio =
    valor.trim()

  if (
    !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
      valorLimpio
    )
  ) {
    return
  }

  configuracion[campo] =
    valorLimpio.toUpperCase()
}

/* =========================================================
   CAMPOS GENERALES
   ========================================================= */

const camposGenerales = computed(() => {
  return Object.entries(
    configuracion
  ).filter(
    ([campo]) =>
      !esColorConfiguracion(
        campo
      ) &&
      campo !== 'paleta'
  )
})

const camposColores = computed(() => {
  return camposColor
    .filter(
      (campo) =>
        Object.prototype.hasOwnProperty.call(
          configuracion,
          campo
        )
    )
    .map(
      (campo) => [
        campo,
        configuracion[campo],
      ]
    )
})

const existeConfiguracion = computed(() => {
  return (
    Object.keys(configuracion)
      .length > 0
  )
})

/* =========================================================
   PREVISUALIZACIÓN
   ========================================================= */

const previewStyle = computed(() => {
  const paleta =
    paletaGenerada.value || {}

  return {
    '--preview-primary':
      normalizarColor(
        paleta.primary ||
          configuracion.primary
      ),

    '--preview-primary-light':
      normalizarColor(
        paleta.primaryLight ||
          configuracion.primary
      ),

    '--preview-primary-dark':
      normalizarColor(
        paleta.primaryDark ||
          configuracion.primary
      ),

    '--preview-secondary':
      normalizarColor(
        paleta.secondary ||
          configuracion.secondary
      ),

    '--preview-secondary-light':
      normalizarColor(
        paleta.secondaryLight ||
          configuracion.secondary
      ),

    '--preview-accent':
      normalizarColor(
        paleta.accent ||
          configuracion.accent
      ),

    '--preview-accent-light':
      normalizarColor(
        paleta.accentLight ||
          configuracion.accent
      ),

    '--preview-background':
      normalizarColor(
        paleta.background ||
          configuracion.background
      ),

    '--preview-background-alt':
      normalizarColor(
        paleta.backgroundAlt ||
          configuracion.background
      ),

    '--preview-surface':
      normalizarColor(
        paleta.surface ||
          '#FFFFFF'
      ),

    '--preview-surface-alt':
      normalizarColor(
        paleta.surfaceAlt ||
          '#F8FAFC'
      ),

    '--preview-text':
      normalizarColor(
        paleta.text ||
          configuracion.text
      ),

    '--preview-text-secondary':
      normalizarColor(
        paleta.textSecondary ||
          configuracion.text
      ),

    '--preview-border':
      normalizarColor(
        paleta.border ||
          '#E2E8F0'
      ),
  }
})

/* =========================================================
   JSON
   ========================================================= */

function obtenerJson(valor) {
  try {
    return JSON.stringify(
      valor,
      null,
      2
    )
  } catch {
    return ''
  }
}

function actualizarObjeto(
  campo,
  evento
) {
  const texto =
    evento.target.value

  try {
    configuracion[campo] =
      JSON.parse(texto)

    error.value = ''
  } catch {
    // No modificar mientras
    // el JSON sea inválido.
  }
}

/* =========================================================
   ARRAYS
   ========================================================= */

function obtenerArrayTexto(valor) {
  if (!Array.isArray(valor)) {
    return ''
  }

  return valor.join('\n')
}

function actualizarArray(
  campo,
  evento
) {
  configuracion[campo] =
    evento.target.value
      .split('\n')
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean)
}

/* =========================================================
   FIRESTORE
   ========================================================= */

function iniciarSuscripcion() {
  if (unsubscribeConfiguracion) {
    unsubscribeConfiguracion()
    unsubscribeConfiguracion = null
  }

  cargando.value = true
  error.value = ''
  mensaje.value = ''
  conectadaTiempoReal.value = false

  unsubscribeConfiguracion =
    suscribirConfiguracionAdmin(
      'general',
      (datos) => {
        cargando.value = false

        if (!datos) {
          limpiarObjeto(
            configuracion
          )

          limpiarObjeto(
            configuracionOriginal
          )

          conectadaTiempoReal.value =
            true

          return
        }

        aplicarConfiguracion(
          datos
        )

        conectadaTiempoReal.value =
          true

        error.value = ''
      },
      (err) => {
        console.error(
          'Error en configuración en tiempo real:',
          err
        )

        cargando.value = false

        conectadaTiempoReal.value =
          false

        error.value =
          'No fue posible sincronizar la configuración en tiempo real.'
      }
    )
}

/* =========================================================
   RESTAURAR
   ========================================================= */

function restaurarCambios() {
  limpiarObjeto(
    configuracion
  )

  Object.assign(
    configuracion,
    copiarConfiguracion(
      configuracionOriginal
    )
  )

  cargarPaletaDesdeConfiguracion(
    configuracionOriginal
  )

  mensaje.value =
    'Cambios descartados.'

  error.value = ''
}

/* =========================================================
   GUARDAR
   ========================================================= */

async function guardarConfiguracion() {
  try {
    guardando.value = true

    error.value = ''
    mensaje.value = ''

    const datos =
      copiarConfiguracion(
        configuracion
      )

    delete datos.id

    await actualizarConfiguracion(
      'general',
      datos
    )

    Object.assign(
      configuracionOriginal,
      copiarConfiguracion(
        datos
      )
    )

    mensaje.value =
      'Configuración actualizada correctamente.'
  } catch (err) {
    console.error(
      'Error guardando configuración:',
      err
    )

    error.value =
      err?.message ??
      'No fue posible guardar la configuración.'
  } finally {
    guardando.value = false
  }
}

/* =========================================================
   CAMPOS
   ========================================================= */

function tipoCampo(valor) {
  if (
    typeof valor ===
    'boolean'
  ) {
    return 'boolean'
  }

  if (
    typeof valor ===
    'number'
  ) {
    return 'number'
  }

  if (
    Array.isArray(valor)
  ) {
    return 'array'
  }

  if (
    typeof valor ===
    'object' &&
    valor !== null
  ) {
    return 'object'
  }

  if (
    typeof valor ===
    'string' &&
    valor.length > 150
  ) {
    return 'textarea'
  }

  return 'text'
}

function restablecerConfiguracion() {
  const paleta =
    generarPaleta(
      coloresPredeterminados.primary,
      {
        armonia:
          'triadica',

        suavidad:
          45,

        contraste:
          55,
      }
    )

  colorBase.value =
    coloresPredeterminados.primary

  armoniaSeleccionada.value =
    'triadica'

  suavidad.value = 45

  contraste.value = 55

  paletaGenerada.value =
    paleta

  Object.entries(
    coloresPredeterminados
  ).forEach(
    ([campo, valor]) => {
      if (
        Object.prototype.hasOwnProperty.call(
          configuracion,
          campo
        )
      ) {
        configuracion[campo] =
          valor
      }
    }
  )

  mensaje.value =
    'Colores restablecidos a sus valores predeterminados.'

  error.value = ''
}

/* =========================================================
   LIFECYCLE
   ========================================================= */

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

    <!-- HEADER -->

    <header class="admin-configuracion__header">
      <div>
        <h1 class="admin-configuracion__title">
          Configuración
        </h1>

        <p class="admin-configuracion__subtitle">
          Administra los valores generales
          de la plataforma y personaliza
          la apariencia de la landing page.
        </p>
      </div>

      <div
        class="admin-configuracion__realtime"
        :class="{
          'admin-configuracion__realtime--online':
            conectadaTiempoReal
        }"
      >
        <span
          class="admin-configuracion__realtime-dot"
          aria-hidden="true"
        ></span>

        <span>
          {{
            conectadaTiempoReal
              ? 'Tiempo real conectado'
              : 'Sin conexión'
          }}
        </span>
      </div>
    </header>

    <!-- LOADING -->

    <div
      v-if="cargando"
      class="admin-configuracion__loading"
    >
      <span
        class="admin-configuracion__spinner"
        aria-hidden="true"
      ></span>

      <span>
        Cargando configuración...
      </span>
    </div>

    <!-- ERROR -->

    <div
      v-else-if="error"
      class="admin-configuracion__message admin-configuracion__message--error"
      role="alert"
    >
      <span aria-hidden="true">
        ⚠
      </span>

      <span>
        {{ error }}
      </span>
    </div>

    <!-- EMPTY -->

    <div
      v-else-if="!existeConfiguracion"
      class="admin-configuracion__empty"
    >
      <div
        class="admin-configuracion__empty-icon"
        aria-hidden="true"
      >
        ⚙
      </div>

      <h2
        class="admin-configuracion__empty-title"
      >
        No existe configuración
      </h2>

      <p
        class="admin-configuracion__empty-text"
      >
        No se encontró el documento
        <strong>
          configuracion/general
        </strong>
        en Firestore.
      </p>
    </div>

    <!-- FORM -->

    <form
      v-else
      class="admin-configuracion__form"
      @submit.prevent="
        guardarConfiguracion
      "
    >

      <!-- SUCCESS -->

      <div
        v-if="mensaje"
        class="admin-configuracion__message admin-configuracion__message--success"
        role="status"
      >
        <span aria-hidden="true">
          ✓
        </span>

        <span>
          {{ mensaje }}
        </span>
      </div>

      <!-- =================================================
           APARIENCIA
           ================================================= -->

      <section
        v-if="camposColores.length"
        class="admin-configuracion__section admin-configuracion__section--appearance"
      >
        <div
          class="admin-configuracion__section-header"
        >
          <div>
            <span
              class="admin-configuracion__section-eyebrow"
            >
              PERSONALIZACIÓN
            </span>

            <h2
              class="admin-configuracion__section-title"
            >
              Colores y apariencia
            </h2>

            <p
              class="admin-configuracion__section-description"
            >
              Selecciona un color base y genera
              automáticamente una paleta
              armonizada para toda la landing.
            </p>
          </div>
        </div>

        <!-- PALETTE BUILDER -->

        <div
          class="admin-configuracion__palette-builder"
        >

          <!-- CONTROLS -->

          <div
            class="admin-configuracion__palette-controls"
          >

            <!-- BASE -->

            <div
              class="admin-configuracion__palette-control"
            >
              <label
                class="admin-configuracion__label"
                for="color-base"
              >
                Color base
              </label>

              <p
                class="admin-configuracion__color-description"
              >
                Define el color principal de
                la identidad visual.
              </p>

              <div
                class="admin-configuracion__palette-base"
              >
                <input
                  id="color-base"
                  v-model="colorBase"
                  type="color"
                  class="admin-configuracion__color-picker"
                  aria-label="Seleccionar color base"
                  @input="
                    cambiarColorBase(
                      $event.target.value
                    )
                  "
                />

                <input
                  v-model="colorBase"
                  type="text"
                  class="admin-configuracion__input admin-configuracion__color-input-text"
                  maxlength="7"
                  placeholder="#4678EC"
                  @input="
                    cambiarColorBase(
                      $event.target.value
                    )
                  "
                />
              </div>
            </div>

            <!-- HARMONY -->

            <div
              class="admin-configuracion__palette-control"
            >
              <label
                class="admin-configuracion__label"
                for="armonia"
              >
                Armonía de color
              </label>

              <p
                class="admin-configuracion__color-description"
              >
                Determina cómo se relacionan
                los colores principales.
              </p>

              <select
                id="armonia"
                v-model="armoniaSeleccionada"
                class="admin-configuracion__input"
                @change="
                  regenerarPaleta
                "
              >
                <option value="triadica">
                  Triádica
                </option>

                <option value="analogica">
                  Análoga
                </option>

                <option value="complementaria">
                  Complementaria
                </option>

                <option value="monocromatica">
                  Monocromática
                </option>
              </select>
            </div>

            <!-- SOFTNESS -->

            <div
              class="admin-configuracion__palette-control"
            >
              <div
                class="admin-configuracion__range-header"
              >
                <label
                  class="admin-configuracion__label"
                  for="suavidad"
                >
                  Suavidad
                </label>

                <strong>
                  {{ suavidad }}%
                </strong>
              </div>

              <input
                id="suavidad"
                v-model.number="suavidad"
                type="range"
                min="0"
                max="100"
                step="1"
                class="admin-configuracion__range"
                @input="
                  regenerarPaleta
                "
              />

              <p
                class="admin-configuracion__color-description"
              >
                Aumenta este valor para
                obtener colores más suaves
                y pastel.
              </p>
            </div>

            <!-- CONTRAST -->

            <div
              class="admin-configuracion__palette-control"
            >
              <div
                class="admin-configuracion__range-header"
              >
                <label
                  class="admin-configuracion__label"
                  for="contraste"
                >
                  Contraste
                </label>

                <strong>
                  {{ contraste }}%
                </strong>
              </div>

              <input
                id="contraste"
                v-model.number="contraste"
                type="range"
                min="0"
                max="100"
                step="1"
                class="admin-configuracion__range"
                @input="
                  regenerarPaleta
                "
              />

              <p
                class="admin-configuracion__color-description"
              >
                Controla la profundidad de
                textos, fondos y variantes.
              </p>
            </div>

          </div>

          <!-- GENERATED PALETTE -->

          <div
            class="admin-configuracion__palette-preview"
          >

            <div
              class="admin-configuracion__palette-preview-header"
            >
              <div>
                <span
                  class="admin-configuracion__section-eyebrow"
                >
                  VISTA PREVIA
                </span>

                <h3>
                  Paleta generada
                </h3>
              </div>

              <span
                class="admin-configuracion__palette-harmony"
              >
                {{
                  armoniaSeleccionada
                }}
              </span>
            </div>

            <div
              class="admin-configuracion__palette-colors"
            >
              <div
                v-for="color in coloresGenerados"
                :key="color.key"
                class="admin-configuracion__palette-color"
              >
                <div
                  class="admin-configuracion__palette-color-swatch"
                  :style="{
                    backgroundColor:
                      color.color
                  }"
                ></div>

                <div
                  class="admin-configuracion__palette-color-info"
                >
                  <strong>
                    {{ color.nombre }}
                  </strong>

                  <span>
                    {{ color.color }}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="admin-configuracion__button admin-configuracion__button--primary"
              @click="
                aplicarPaletaGenerada
              "
            >
              <span aria-hidden="true">
                ✦
              </span>

              Aplicar paleta generada
            </button>

          </div>
        </div>

        <!-- MANUAL COLORS -->

        <div
          class="admin-configuracion__manual-colors"
        >
          <div
            class="admin-configuracion__section-header"
          >
            <div>
              <span
                class="admin-configuracion__section-eyebrow"
              >
                AVANZADO
              </span>

              <h3
                class="admin-configuracion__section-title"
              >
                Personalización manual
              </h3>

              <p
                class="admin-configuracion__section-description"
              >
                Puedes modificar individualmente
                cualquier color después de generar
                la paleta.
              </p>
            </div>
          </div>

          <div
            class="admin-configuracion__colors"
          >
            <article
              v-for="[
                campo,
                valor
              ] in camposColores"
              :key="campo"
              class="admin-configuracion__color-field"
            >
              <div
                class="admin-configuracion__color-field-header"
              >
                <div>
                  <label
                    class="admin-configuracion__label"
                    :for="`config-${campo}`"
                  >
                    {{
                      nombresColor[campo] ??
                      campo
                    }}
                  </label>

                  <p
                    class="admin-configuracion__color-description"
                  >
                    {{
                      descripcionesColor[campo] ??
                      'Color de la interfaz.'
                    }}
                  </p>
                </div>

                <span
                  class="admin-configuracion__color-key"
                >
                  {{ campo }}
                </span>
              </div>

              <div
                class="admin-configuracion__color-control"
              >
                <input
                  :id="`color-picker-${campo}`"
                  type="color"
                  class="admin-configuracion__color-picker"
                  :value="
                    normalizarColor(
                      configuracion[campo]
                    )
                  "
                  :aria-label="`Seleccionar ${
                    nombresColor[campo] ??
                    campo
                  }`"
                  @input="
                    actualizarColor(
                      campo,
                      $event.target.value
                    )
                  "
                />

                <input
                  :id="`config-${campo}`"
                  type="text"
                  class="admin-configuracion__input admin-configuracion__color-input-text"
                  :value="
                    configuracion[campo]
                  "
                  maxlength="7"
                  placeholder="#000000"
                  @input="
                    actualizarColor(
                      campo,
                      $event.target.value
                    )
                  "
                />

                <span
                  class="admin-configuracion__color-swatch"
                  :style="{
                    backgroundColor:
                      normalizarColor(
                        configuracion[
                          campo
                        ]
                      ),
                  }"
                  aria-hidden="true"
                ></span>
              </div>
            </article>
          </div>
        </div>

        <!-- LANDING PREVIEW -->

        <div
          class="admin-configuracion__preview"
          :style="previewStyle"
        >

          <div
            class="admin-configuracion__preview-header"
          >
            <div
              class="admin-configuracion__preview-brand"
            >
              <span
                class="admin-configuracion__preview-logo"
              >
                {{
                  configuracion.logoTexto ??
                  'IA'
                }}
              </span>

              <span>
                {{
                  configuracion.nombreEmpresa ??
                  'Empresa'
                }}
              </span>
            </div>

            <span
              class="admin-configuracion__preview-label"
            >
              PREVISUALIZACIÓN
            </span>
          </div>

          <div
            class="admin-configuracion__preview-content"
          >
            <span
              class="admin-configuracion__preview-eyebrow"
            >
              SOLUCIONES TECNOLÓGICAS
            </span>

            <h3
              class="admin-configuracion__preview-title"
            >
              Tu empresa,
              <strong>
                más eficiente.
              </strong>
            </h3>

            <p
              class="admin-configuracion__preview-text"
            >
              {{
                configuracion.descripcion ??
                'Soluciones tecnológicas para empresas.'
              }}
            </p>

            <div
              class="admin-configuracion__preview-actions"
            >
              <button
                type="button"
                class="admin-configuracion__preview-button admin-configuracion__preview-button--primary"
              >
                Comenzar ahora
              </button>

              <button
                type="button"
                class="admin-configuracion__preview-button admin-configuracion__preview-button--secondary"
              >
                Conocer más
              </button>
            </div>

            <div
              class="admin-configuracion__preview-card"
            >
              <div
                class="admin-configuracion__preview-card-icon"
              >
                ✓
              </div>

              <div>
                <strong>
                  Plataforma empresarial
                </strong>

                <span>
                  Todo lo que necesitas en
                  un solo lugar.
                </span>
              </div>
            </div>
          </div>

          <div
            class="admin-configuracion__preview-footer"
          >
            <span>
              {{
                configuracion.nombreEmpresa
              }}
            </span>

            <span>
              Vista previa de colores
            </span>
          </div>
        </div>
      </section>

      <!-- =================================================
           CONFIGURACIÓN GENERAL
           ================================================= -->

      <section
        v-if="camposGenerales.length"
        class="admin-configuracion__section"
      >
        <div
          class="admin-configuracion__section-header"
        >
          <div>
            <span
              class="admin-configuracion__section-eyebrow"
            >
              CONFIGURACIÓN
            </span>

            <h2
              class="admin-configuracion__section-title"
            >
              Datos generales
            </h2>

            <p
              class="admin-configuracion__section-description"
            >
              Información general utilizada
              por la plataforma.
            </p>
          </div>
        </div>

        <div
          class="admin-configuracion__grid"
        >
          <div
            v-for="[
              campo,
              valor
            ] in camposGenerales"
            :key="campo"
            class="admin-configuracion__field"
          >

            <label
              class="admin-configuracion__label"
              :for="`config-${campo}`"
            >
              {{ campo }}
            </label>

            <!-- BOOLEAN -->

            <label
              v-if="
                tipoCampo(valor) ===
                'boolean'
              "
              class="admin-configuracion__toggle"
            >
              <input
                :id="`config-${campo}`"
                v-model="
                  configuracion[campo]
                "
                type="checkbox"
              />

              <span
                class="admin-configuracion__toggle-track"
                aria-hidden="true"
              >
                <span
                  class="admin-configuracion__toggle-thumb"
                ></span>
              </span>

              <span
                class="admin-configuracion__toggle-text"
              >
                {{
                  configuracion[campo]
                    ? 'Activado'
                    : 'Desactivado'
                }}
              </span>
            </label>

            <!-- NUMBER -->

            <input
              v-else-if="
                tipoCampo(valor) ===
                'number'
              "
              :id="`config-${campo}`"
              v-model.number="
                configuracion[campo]
              "
              type="number"
              class="admin-configuracion__input"
            />

            <!-- ARRAY -->

            <template
              v-else-if="
                tipoCampo(valor) ===
                'array'
              "
            >
              <textarea
                :id="`config-${campo}`"
                class="admin-configuracion__textarea"
                :value="
                  obtenerArrayTexto(
                    valor
                  )
                "
                rows="6"
                @input="
                  actualizarArray(
                    campo,
                    $event
                  )
                "
              ></textarea>

              <p
                class="admin-configuracion__help"
              >
                Un elemento por línea.
              </p>
            </template>

            <!-- OBJECT -->

            <template
              v-else-if="
                tipoCampo(valor) ===
                'object'
              "
            >
              <textarea
                :id="`config-${campo}`"
                class="admin-configuracion__textarea admin-configuracion__textarea--code"
                :value="
                  obtenerJson(
                    valor
                  )
                "
                rows="8"
                spellcheck="false"
                @input="
                  actualizarObjeto(
                    campo,
                    $event
                  )
                "
              ></textarea>

              <p
                class="admin-configuracion__help"
              >
                Introduce un objeto JSON válido.
              </p>
            </template>

            <!-- TEXTAREA -->

            <textarea
              v-else-if="
                tipoCampo(valor) ===
                'textarea'
              "
              :id="`config-${campo}`"
              v-model="
                configuracion[campo]
              "
              class="admin-configuracion__textarea"
              rows="6"
            ></textarea>

            <!-- TEXT -->

            <input
              v-else
              :id="`config-${campo}`"
              v-model="
                configuracion[campo]
              "
              type="text"
              class="admin-configuracion__input"
            />

          </div>
        </div>
      </section>

      <!-- ACTIONS -->

      <div
        class="admin-configuracion__actions"
      >
        <button
          type="button"
          class="admin-configuracion__button admin-configuracion__button--secondary"
          :disabled="guardando"
          @click="
            restaurarCambios
          "
        >
          <span aria-hidden="true">
            ↶
          </span>

          Descartar cambios
        </button>

        <button
          type="button"
          class="admin-configuracion__button admin-configuracion__button--secondary"
          :disabled="guardando"
          @click="
            restablecerConfiguracion
          "
        >
          <span aria-hidden="true">
            ↺
          </span>

          Restablecer colores
        </button>

        <button
          type="submit"
          class="admin-configuracion__button admin-configuracion__button--primary"
          :disabled="guardando"
        >
          <span
            v-if="guardando"
            class="admin-configuracion__button-spinner"
            aria-hidden="true"
          ></span>

          <span
            v-else
            aria-hidden="true"
          >
            ✓
          </span>

          {{
            guardando
              ? 'Guardando...'
              : 'Guardar configuración'
          }}
        </button>
      </div>
    </form>
  </section>
</template>