<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import {
  generarPaletaCompleta,
  generarDegradadosDesdePaleta,
  normalizarHex,
  normalizarDegradado,
  estiloDegradado,
  obtenerAngulosArmonia,
  puntoARuedaHex,
  hexARuedaCoordenadas,
} from '../../../services/colorPalette'

/* =========================================================
   PROPS
   ========================================================= */

const props = defineProps({
  configuracion: {
    type: Object,
    default: () => ({}),
  },

  coloresPredeterminados: {
    type: Object,
    default: () => ({}),
  },

  camposColores: {
    type: Array,
    default: () => [],
  },

  colorBase: {
    type: String,
    default: '',
  },
})

/* =========================================================
   EMITS
   ========================================================= */

const emit = defineEmits([
  'actualizar-color',
  'actualizar-paleta',
])

/* =========================================================
   CONSTANTES
   ========================================================= */

const COLOR_RESPALDO = '#4678EC'
const TAMANO_RUEDA = 260

const armoniasPermitidas = [
  'complementaria',
  'analogica',
  'triadica',
  'monocromatica',
]

const etiquetasArmonia = {
  complementaria: 'Complementaria',
  analogica: 'Análoga',
  triadica: 'Triádica',
  monocromatica: 'Monocromática',
}

const nombresDegradados = {
  primary: 'Principal',
  accent: 'Acento',
  dark: 'Oscuro',
  soft: 'Suave',
}

const clavesDegradados = ['primary', 'accent', 'dark', 'soft']

const camposOverrides = [
  'primaryGradientText',
  'secondaryGradientText',
  'accentGradientText',
  'darkGradientText',
  'softGradientText',
]

/* =========================================================
   UTILIDADES
   ========================================================= */

function esHexValido(valor) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    String(valor || '').trim(),
  )
}

function normalizarColor(valor) {
  if (!esHexValido(valor)) return null
  try {
    return normalizarHex(String(valor).trim())
  } catch {
    return null
  }
}

function obtenerColorValido(...valores) {
  for (const valor of valores) {
    const color = normalizarColor(valor)
    if (color) return color
  }
  return null
}

function obtenerNumero(valor, respaldo) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return respaldo
  return Math.min(100, Math.max(0, numero))
}

function obtenerArmonia(valor) {
  if (armoniasPermitidas.includes(valor)) return valor
  return 'triadica'
}

/* =========================================================
   ESTADO DEL COLOR BASE
   ========================================================= */

const colorBase = ref(
  obtenerColorValido(
    props.configuracion?.primary,
    props.configuracion?.paleta?.base,
    props.colorBase,
    props.coloresPredeterminados?.primary,
    COLOR_RESPALDO,
  ) || COLOR_RESPALDO,
)

/* =========================================================
   CONFIGURACIÓN DE ARMONÍA
   ========================================================= */

const armoniaSeleccionada = ref(
  obtenerArmonia(props.configuracion?.paleta?.armonia),
)

const suavidad = ref(
  obtenerNumero(props.configuracion?.paleta?.suavidad, 45),
)

const contraste = ref(
  obtenerNumero(props.configuracion?.paleta?.contraste, 55),
)

/* =========================================================
   ESTADO DE LA RUEDA
   ========================================================= */

const ruedaRef = ref(null)
const arrastrando = ref(false)

/* =========================================================
   PALETA GENERADA
   ========================================================= */

const paletaGenerada = computed(() => {
  try {
    const base =
      obtenerColorValido(
        colorBase.value,
        props.configuracion?.primary,
        props.coloresPredeterminados?.primary,
        COLOR_RESPALDO,
      ) || COLOR_RESPALDO

    return generarPaletaCompleta(base, {
      armonia: armoniaSeleccionada.value,
      suavidad: obtenerNumero(suavidad.value, 45),
      contraste: obtenerNumero(contraste.value, 55),
    })
  } catch (error) {
    console.error('Error generando paleta:', error)
    return {}
  }
})

/* =========================================================
   COLORES DE LA ARMONÍA
   ========================================================= */

const coloresArmonia = computed(() => {
  const paleta = paletaGenerada.value
  const angulos = obtenerAngulosArmonia(armoniaSeleccionada.value)
  const base = normalizarHex(colorBase.value)

  const colores = [
    paleta.primary || base,
    paleta.secondary,
    paleta.accent,
  ].filter(Boolean)

  return angulos.map((angulo, index) => {
    const color = colores[index] || base
    const coords = hexARuedaCoordenadas(color)

    return { angulo, color, coords }
  })
})

/* =========================================================
   DEGRADADOS EDITABLES
   ========================================================= */

const degradadosLocales = ref({})

function inicializarDegradados() {
  const originales = props.configuracion?.degradados || {}
  const resultado = {}

  clavesDegradados.forEach((clave) => {
    resultado[clave] = normalizarDegradado(originales[clave])
  })

  degradadosLocales.value = resultado
}

function actualizarDegradado(clave, campo, valor) {
  if (!degradadosLocales.value[clave]) {
    degradadosLocales.value[clave] = normalizarDegradado(null)
  }

  if (campo === 'angulo') {
    const numero = Number(valor)
    degradadosLocales.value[clave].angulo = Number.isFinite(numero)
      ? ((numero % 360) + 360) % 360
      : 135
    return
  }

  const color = normalizarColor(valor)
  if (color) {
    degradadosLocales.value[clave][campo] = color
  }
}

/* =========================================================
   RUEDA CROMÁTICA — INTERACCIÓN
   ========================================================= */

function obtenerCoordenadasRelativas(event) {
  const rect = ruedaRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }

  const centroX = rect.left + rect.width / 2
  const centroY = rect.top + rect.height / 2

  const x = (event.clientX - centroX) / (rect.width / 2)
  const y = (event.clientY - centroY) / (rect.height / 2)

  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
  }
}

function actualizarColorDesdeRueda(event) {
  if (!ruedaRef.value) return

  const { x, y } = obtenerCoordenadasRelativas(event)
  const nuevoColor = puntoARuedaHex(x, y, 75, 50)
  const colorNormalizado = normalizarColor(nuevoColor)

  if (colorNormalizado) {
    colorBase.value = colorNormalizado
  }
}

function iniciarArrastre(event) {
  event.preventDefault()
  arrastrando.value = true
  actualizarColorDesdeRueda(event)

  window.addEventListener('mousemove', manejarArrastre)
  window.addEventListener('mouseup', detenerArrastre)
  window.addEventListener('touchmove', manejarArrastre, { passive: false })
  window.addEventListener('touchend', detenerArrastre)
}

function manejarArrastre(event) {
  if (!arrastrando.value) return
  if (event.cancelable) event.preventDefault()
  actualizarColorDesdeRueda(event)
}

function detenerArrastre() {
  arrastrando.value = false
  window.removeEventListener('mousemove', manejarArrastre)
  window.removeEventListener('mouseup', detenerArrastre)
  window.removeEventListener('touchmove', manejarArrastre)
  window.removeEventListener('touchend', detenerArrastre)
}

onBeforeUnmount(() => {
  detenerArrastre()
})

/* =========================================================
   MARCADORES
   ========================================================= */

const marcadorPrincipal = computed(() => {
  const coords = hexARuedaCoordenadas(colorBase.value)
  return {
    left: `${50 + coords.x * 50}%`,
    top: `${50 + coords.y * 50}%`,
  }
})

function posicionMarcador(color) {
  const coords = hexARuedaCoordenadas(color)
  return {
    left: `${50 + coords.x * 50}%`,
    top: `${50 + coords.y * 50}%`,
  }
}

/* =========================================================
   APLICAR PALETA COMPLETA
   ========================================================= */

function aplicarPaletaCompleta() {
  const paleta = paletaGenerada.value

  if (!paleta || Object.keys(paleta).length === 0) return

  const cambios = { ...paleta }

  cambios.degradados = JSON.parse(
    JSON.stringify(degradadosLocales.value),
  )

  cambios.paleta = {
    ...(props.configuracion?.paleta || {}),
    base: normalizarHex(colorBase.value),
    armonia: armoniaSeleccionada.value,
    suavidad: obtenerNumero(suavidad.value, 45),
    contraste: obtenerNumero(contraste.value, 55),
  }

  /*
   * Incluir overrides manuales si el modo está activo.
   */
  if (modoManualActivo.value) {
    camposOverrides.forEach((campo) => {
      const valor = props.configuracion?.[campo]
      if (valor) cambios[campo] = valor
    })
  }

  emit('actualizar-paleta', cambios)
}

/* =========================================================
   REGENERAR DEGRADADOS DESDE LA PALETA
   ========================================================= */

function regenerarDegradadosDesdePaleta() {
  const paleta = paletaGenerada.value

  if (!paleta || Object.keys(paleta).length === 0) return

  const nuevos = generarDegradadosDesdePaleta(paleta)

  Object.entries(nuevos).forEach(([clave, degradado]) => {
    degradadosLocales.value[clave] = normalizarDegradado(degradado)
  })
}

/* =========================================================
   COLORES MANUALES
   ========================================================= */

const camposColoresVisibles = computed(() => {
  if (
    Array.isArray(props.camposColores) &&
    props.camposColores.length > 0
  ) {
    return props.camposColores
  }

  return [
    {
      grupo: 'Principal',
      campos: [
        ['primary', 'Principal'],
        ['primaryLight', 'Principal claro'],
        ['primaryDark', 'Principal oscuro'],
        ['primaryText', 'Texto principal'],
      ],
    },
    {
      grupo: 'Secundario',
      campos: [
        ['secondary', 'Secundario'],
        ['secondaryLight', 'Secundario claro'],
        ['secondaryDark', 'Secundario oscuro'],
        ['secondaryText', 'Texto secundario'],
      ],
    },
    {
      grupo: 'Acento',
      campos: [
        ['accent', 'Acento'],
        ['accentLight', 'Acento claro'],
        ['accentDark', 'Acento oscuro'],
        ['accentText', 'Texto de acento'],
      ],
    },
    {
      grupo: 'Superficies',
      campos: [
        ['background', 'Fondo'],
        ['backgroundAlt', 'Fondo alternativo'],
        ['surface', 'Superficie'],
        ['surfaceAlt', 'Superficie alternativa'],
      ],
    },
    {
      grupo: 'Texto',
      campos: [
        ['text', 'Texto'],
        ['textSecondary', 'Texto secundario'],
        ['textMuted', 'Texto atenuado'],
      ],
    },
    {
      grupo: 'Estados',
      campos: [
        ['border', 'Borde'],
        ['success', 'Éxito'],
        ['danger', 'Peligro'],
        ['warning', 'Advertencia'],
      ],
    },
    {
      grupo: 'Texto sobre degradados',
      campos: [
        ['primaryGradientText', 'Texto sobre primary'],
        ['secondaryGradientText', 'Texto sobre secondary'],
        ['accentGradientText', 'Texto sobre accent'],
        ['darkGradientText', 'Texto sobre dark'],
        ['softGradientText', 'Texto sobre soft'],
      ],
    },
  ]
})

const mostrarColoresManuales = ref(false)
const modoManualActivo = ref(false)

function toggleModoManual() {
  modoManualActivo.value = !modoManualActivo.value
  mostrarColoresManuales.value = modoManualActivo.value
}

function restablecerAutomatico() {
  camposOverrides.forEach((campo) => {
    emit('actualizar-paleta', { [campo]: '' })
  })

  regenerarDegradadosDesdePaleta()

  modoManualActivo.value = false
  mostrarColoresManuales.value = false
}

function obtenerValorCampo(campo) {
  const directo = props.configuracion?.[campo]
  const paleta = props.configuracion?.paleta?.[campo]
  const generado = paletaGenerada.value?.[campo]

  return (
    obtenerColorValido(directo, paleta, generado) || '#FFFFFF'
  )
}

function actualizarCampoColor(campo, valor) {
  const color = normalizarColor(valor)
  if (!color) return

  emit('actualizar-color', { campo, valor: color })

  if (campo === 'primary') {
    colorBase.value = color
  }
}

/* =========================================================
   SINCRONIZACIÓN CON FIREBASE
   ========================================================= */

let actualizandoDesdePadre = false

watch(
  () => props.configuracion?.primary,
  (nuevoValor) => {
    if (actualizandoDesdePadre) return

    const nuevoColor = normalizarColor(nuevoValor)
    if (!nuevoColor) return

    if (nuevoColor !== colorBase.value) {
      colorBase.value = nuevoColor
    }
  },
  { immediate: true },
)

watch(
  () => props.configuracion?.paleta,
  (nuevaPaleta) => {
    if (actualizandoDesdePadre) return
    if (!nuevaPaleta || typeof nuevaPaleta !== 'object') return

    actualizandoDesdePadre = true

    armoniaSeleccionada.value = obtenerArmonia(nuevaPaleta.armonia)
    suavidad.value = obtenerNumero(nuevaPaleta.suavidad, 45)
    contraste.value = obtenerNumero(nuevaPaleta.contraste, 55)

    const nuevaBase = obtenerColorValido(
      nuevaPaleta.base,
      props.configuracion?.primary,
      props.coloresPredeterminados?.primary,
      COLOR_RESPALDO,
    )

    if (nuevaBase && nuevaBase !== colorBase.value) {
      colorBase.value = nuevaBase
    }

    nextTick(() => {
      actualizandoDesdePadre = false
    })
  },
  { deep: true, immediate: true },
)

watch(
  () => props.configuracion?.degradados,
  (nuevosDegradados) => {
    if (actualizandoDesdePadre) return
    if (!nuevosDegradados || typeof nuevosDegradados !== 'object') return

    clavesDegradados.forEach((clave) => {
      degradadosLocales.value[clave] = normalizarDegradado(
        nuevosDegradados[clave],
      )
    })
  },
  { deep: true },
)

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

onMounted(() => {
  inicializarDegradados()
})

const previewPaleta = computed(() => paletaGenerada.value || {})
</script>

<template>
  <div class="admin-configuracion__palette-layout">

    <!-- =====================================================
         RUEDA CROMÁTICA
         ===================================================== -->

    <article class="admin-configuracion__card">
      <div class="admin-configuracion__card-heading">
        <div>
          <h3>Rueda cromática</h3>
          <p>
            Arrastra el punto para elegir el color base.
            El triángulo muestra las armonías de la paleta.
          </p>
        </div>

        <div
          class="admin-configuracion__color-swatch"
          :style="{ backgroundColor: colorBase }"
          aria-hidden="true"
        ></div>
      </div>

      <div class="admin-configuracion__wheel-wrapper">
        <div
          ref="ruedaRef"
          class="admin-configuracion__wheel"
          :style="{
            width: `${TAMANO_RUEDA}px`,
            height: `${TAMANO_RUEDA}px`,
          }"
          @mousedown="iniciarArrastre"
          @touchstart.prevent="iniciarArrastre"
        >
          <svg
            class="admin-configuracion__wheel-svg"
            :viewBox="`0 0 ${TAMANO_RUEDA} ${TAMANO_RUEDA}`"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="rueda-saturacion">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
                <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
              </radialGradient>
            </defs>

            <foreignObject
              x="0"
              y="0"
              :width="TAMANO_RUEDA"
              :height="TAMANO_RUEDA"
            >
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                class="admin-configuracion__wheel-conic"
              ></div>
            </foreignObject>

            <circle
              :cx="TAMANO_RUEDA / 2"
              :cy="TAMANO_RUEDA / 2"
              :r="TAMANO_RUEDA / 2 - 2"
              fill="url(#rueda-saturacion)"
            />

            <circle
              :cx="TAMANO_RUEDA / 2"
              :cy="TAMANO_RUEDA / 2"
              :r="TAMANO_RUEDA / 2 - 2"
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              stroke-width="2"
            />

            <polygon
              v-if="coloresArmonia.length >= 3"
              :points="
                coloresArmonia
                  .map((c) => {
                    const cx = TAMANO_RUEDA / 2 + c.coords.x * (TAMANO_RUEDA / 2 - 30)
                    const cy = TAMANO_RUEDA / 2 + c.coords.y * (TAMANO_RUEDA / 2 - 30)
                    return `${cx},${cy}`
                  })
                  .join(' ')
              "
              fill="rgba(0,0,0,0.15)"
              stroke="rgba(0,0,0,0.4)"
              stroke-width="1.5"
            />

            <line
              v-else-if="coloresArmonia.length === 2"
              :x1="TAMANO_RUEDA / 2 + coloresArmonia[0].coords.x * (TAMANO_RUEDA / 2 - 30)"
              :y1="TAMANO_RUEDA / 2 + coloresArmonia[0].coords.y * (TAMANO_RUEDA / 2 - 30)"
              :x2="TAMANO_RUEDA / 2 + coloresArmonia[1].coords.x * (TAMANO_RUEDA / 2 - 30)"
              :y2="TAMANO_RUEDA / 2 + coloresArmonia[1].coords.y * (TAMANO_RUEDA / 2 - 30)"
              stroke="rgba(0,0,0,0.4)"
              stroke-width="1.5"
            />
          </svg>

          <span
            v-for="(c, i) in coloresArmonia"
            :key="`armonia-${i}`"
            class="admin-configuracion__wheel-marker admin-configuracion__wheel-marker--armonia"
            :style="{
              ...posicionMarcador(c.color),
              backgroundColor: c.color,
            }"
            aria-hidden="true"
          ></span>

          <span
            class="admin-configuracion__wheel-marker admin-configuracion__wheel-marker--principal"
            :class="{ 'is-dragging': arrastrando }"
            :style="{
              ...marcadorPrincipal,
              backgroundColor: colorBase,
            }"
            aria-hidden="true"
          ></span>
        </div>
      </div>

      <div class="admin-configuracion__primary-color">
        <input
          :value="colorBase"
          type="color"
          aria-label="Seleccionar color base"
          @input="colorBase = $event.target.value"
        />

        <div>
          <strong>{{ colorBase }}</strong>
          <span>Color base</span>
        </div>

        <input
          :value="colorBase"
          type="text"
          maxlength="7"
          placeholder="#4678EC"
          aria-label="Código hexadecimal"
          @change="
            ($event) => {
              const c = normalizarColor($event.target.value)
              if (c) colorBase = c
            }
          "
        />
      </div>

      <div class="admin-configuracion__palette-options">
        <label>
          <span>Armonía</span>
          <select v-model="armoniaSeleccionada">
            <option
              v-for="(etiqueta, valor) in etiquetasArmonia"
              :key="valor"
              :value="valor"
            >
              {{ etiqueta }}
            </option>
          </select>
        </label>

        <label>
          <span>
            Suavidad
            <strong>{{ suavidad }}%</strong>
          </span>
          <input
            v-model.number="suavidad"
            type="range"
            min="0"
            max="100"
          />
        </label>

        <label>
          <span>
            Contraste
            <strong>{{ contraste }}%</strong>
          </span>
          <input
            v-model.number="contraste"
            type="range"
            min="0"
            max="100"
          />
        </label>
      </div>

      <div class="admin-configuracion__palette-actions">
        <button
          type="button"
          class="admin-configuracion__button admin-configuracion__button--secondary"
          @click="regenerarDegradadosDesdePaleta"
        >
          Regenerar degradados
        </button>

        <button
          type="button"
          class="admin-configuracion__button admin-configuracion__button--primary"
          @click="aplicarPaletaCompleta"
        >
          Aplicar paleta completa
        </button>
      </div>
    </article>

    <!-- =====================================================
         PALETA GENERADA
         ===================================================== -->

    <article class="admin-configuracion__card">
      <div class="admin-configuracion__card-heading">
        <div>
          <h3>Paleta generada</h3>
          <p>Previsualización de todos los colores calculados.</p>
        </div>

        <span class="admin-configuracion__palette-badge">
          {{ armoniaSeleccionada }}
        </span>
      </div>

      <div
        v-if="Object.keys(previewPaleta).length > 0"
        class="admin-configuracion__generated-palette"
      >
        <div
          v-for="(color, nombre) in previewPaleta"
          :key="nombre"
          class="admin-configuracion__generated-color"
        >
          <div
            class="admin-configuracion__generated-color-swatch"
            :style="{ backgroundColor: color }"
            :title="color"
            aria-hidden="true"
          ></div>

          <div>
            <strong>{{ nombre }}</strong>
            <span>{{ color }}</span>
          </div>
        </div>
      </div>

      <div v-else class="admin-configuracion__empty-palette">
        No se pudo generar una paleta válida. Revisa el color base.
      </div>
    </article>

    <!-- =====================================================
         DEGRADADOS EDITABLES
         ===================================================== -->

    <article class="admin-configuracion__card admin-configuracion__gradients-card">
      <div class="admin-configuracion__card-heading">
        <div>
          <h3>Degradados editables</h3>
          <p>
            Ajusta el inicio, fin y ángulo de cada degradado.
            La previsualización se actualiza en vivo.
          </p>
        </div>
      </div>

      <div class="admin-configuracion__gradients-grid">
        <div
          v-for="(degradado, clave) in degradadosLocales"
          :key="clave"
          class="admin-configuracion__gradient-item"
        >
          <div
            class="admin-configuracion__gradient-preview"
            :style="{ background: estiloDegradado(degradado) }"
            :title="`${degradado.inicio} → ${degradado.fin} (${degradado.angulo}°)`"
            aria-hidden="true"
          ></div>

          <div class="admin-configuracion__gradient-info">
            <strong>{{ nombresDegradados[clave] || clave }}</strong>
            <span>{{ clave }}</span>

            <div class="admin-configuracion__gradient-editor">
              <label>
                <span>Inicio</span>
                <input
                  :value="degradado.inicio"
                  type="color"
                  @input="actualizarDegradado(clave, 'inicio', $event.target.value)"
                />
                <input
                  :value="degradado.inicio"
                  type="text"
                  maxlength="7"
                  @change="actualizarDegradado(clave, 'inicio', $event.target.value)"
                />
              </label>

              <label>
                <span>Fin</span>
                <input
                  :value="degradado.fin"
                  type="color"
                  @input="actualizarDegradado(clave, 'fin', $event.target.value)"
                />
                <input
                  :value="degradado.fin"
                  type="text"
                  maxlength="7"
                  @change="actualizarDegradado(clave, 'fin', $event.target.value)"
                />
              </label>

              <label>
                <span>Ángulo: {{ degradado.angulo }}°</span>
                <input
                  :value="degradado.angulo"
                  type="range"
                  min="0"
                  max="360"
                  @input="actualizarDegradado(clave, 'angulo', $event.target.value)"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </article>

    <!-- =====================================================
         COLORES MANUALES
         ===================================================== -->

    <article class="admin-configuracion__card admin-configuracion__manual-colors">
      <div class="admin-configuracion__card-heading">
        <div>
          <h3>Colores del sistema</h3>
          <p>
            Personalización avanzada de cada variable.
            Activa el modo manual para editar cada color individualmente.
          </p>
        </div>

        <div class="admin-configuracion__manual-actions">
          <button
            type="button"
            class="admin-configuracion__text-button"
            @click="toggleModoManual"
          >
            {{
              modoManualActivo
                ? '✓ Modo manual activo (clic para desactivar)'
                : 'Editar paleta manualmente'
            }}
          </button>

          <button
            v-if="modoManualActivo"
            type="button"
            class="admin-configuracion__text-button admin-configuracion__text-button--danger"
            @click="restablecerAutomatico"
          >
            Restablecer automático
          </button>
        </div>
      </div>

      <div
        v-if="mostrarColoresManuales"
        class="admin-configuracion__manual-colors-content"
      >
        <div
          v-for="grupo in camposColoresVisibles"
          :key="grupo.grupo"
          class="admin-configuracion__color-group"
        >
          <div class="admin-configuracion__color-group-title">
            {{ grupo.grupo }}
          </div>

          <div class="admin-configuracion__color-grid">
            <label
              v-for="[campo, etiqueta] in grupo.campos"
              :key="campo"
              class="admin-configuracion__color-field"
            >
              <span>{{ etiqueta }}</span>

              <div>
                <input
                  :value="obtenerValorCampo(campo)"
                  type="color"
                  :aria-label="`Seleccionar ${etiqueta}`"
                  @input="actualizarCampoColor(campo, $event.target.value)"
                />

                <input
                  :value="obtenerValorCampo(campo)"
                  type="text"
                  maxlength="7"
                  :aria-label="`Código hexadecimal de ${etiqueta}`"
                  @change="actualizarCampoColor(campo, $event.target.value)"
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.admin-configuracion__wheel-wrapper {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.admin-configuracion__wheel {
  position: relative;
  border-radius: 50%;
  cursor: crosshair;
  user-select: none;
  touch-action: none;
}

.admin-configuracion__wheel-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.admin-configuracion__wheel-conic {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    from 90deg,
    #FF0000,
    #FFFF00,
    #00FF00,
    #00FFFF,
    #0000FF,
    #FF00FF,
    #FF0000
  );
}

.admin-configuracion__wheel-marker {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  border: 2px solid #FFFFFF;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  z-index: 2;
}

.admin-configuracion__wheel-marker--principal {
  width: 22px;
  height: 22px;
  z-index: 3;
  cursor: grab;
  pointer-events: auto;
}

.admin-configuracion__wheel-marker--principal.is-dragging {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.15);
}

.admin-configuracion__wheel-marker--armonia {
  width: 14px;
  height: 14px;
  border-width: 1.5px;
  z-index: 1;
  pointer-events: none;
}

.admin-configuracion__gradient-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.admin-configuracion__gradient-editor label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-configuracion__gradient-editor label > span {
  font-size: 0.75rem;
  min-width: 82px;
  color: #64748B;
}

.admin-configuracion__gradient-editor input[type='color'] {
  width: 36px;
  height: 32px;
  padding: 2px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  cursor: pointer;
  background: white;
}

.admin-configuracion__gradient-editor input[type='text'] {
  width: 90px;
  padding: 6px 8px;
  font-family: monospace;
  font-size: 0.8rem;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
}

.admin-configuracion__gradient-editor input[type='range'] {
  flex: 1;
}

/* =========================================================
   MODO MANUAL — ACCIONES
   ========================================================= */

.admin-configuracion__manual-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>