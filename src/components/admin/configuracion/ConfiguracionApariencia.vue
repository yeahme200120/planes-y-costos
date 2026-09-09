<script setup>
import {
  computed,
  ref,
  watch,
} from 'vue'

import {
  generarPaleta,
  normalizarHex,
} from '../../../services/colorPalette'

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
    default: '#0F172A',
  },
})

const emit = defineEmits([
  'actualizar-color',
  'actualizar-paleta',
])

/* =========================================================
   COLOR BASE
   ========================================================= */

const colorBase = ref(
  props.colorBase ||
  props.configuracion?.primary ||
  props.coloresPredeterminados?.primary ||
  '#0F172A',
)

/* =========================================================
   CONFIGURACIÓN DE ARMONÍA
   ========================================================= */

const armoniaSeleccionada = ref(
  props.configuracion?.paleta?.armonia ||
  'triadica',
)

const suavidad = ref(
  Number(
    props.configuracion?.paleta?.suavidad ??
    45,
  ),
)

const contraste = ref(
  Number(
    props.configuracion?.paleta?.contraste ??
    55,
  ),
)

/* =========================================================
   ESTADO
   ========================================================= */

const coloresGenerados = ref({})

const mostrarColoresManuales = ref(false)

/* =========================================================
   PALETA GENERADA
   ========================================================= */

const paletaGenerada = computed(() => {
  try {
    const resultado = generarPaleta(
      colorBase.value,
      {
        armonia:
          armoniaSeleccionada.value,

        suavidad:
          Number(suavidad.value),

        contraste:
          Number(contraste.value),
      },
    )

    return resultado || {}
  } catch (error) {
    console.error(
      'Error al generar paleta:',
      error,
    )

    return {}
  }
})

/* =========================================================
   VALIDACIÓN
   ========================================================= */

function esHexValido(valor) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    String(valor || '').trim(),
  )
}

/* =========================================================
   GENERAR / REGENERAR
   ========================================================= */

function regenerarPaleta() {
  coloresGenerados.value = {
    ...paletaGenerada.value,
  }
}

/* =========================================================
   CAMBIAR COLOR BASE
   ========================================================= */

function cambiarColorBase(valor) {
  if (!esHexValido(valor)) {
    return
  }

  const nuevoColor = normalizarHex(valor)

  colorBase.value = nuevoColor

  emit('actualizar-color', {
    campo: 'primary',
    valor: nuevoColor,
  })

  regenerarPaleta()
}

/* =========================================================
   APLICAR PALETA GENERADA
   ========================================================= */

function aplicarPaletaGenerada() {
  const paleta = {
    ...paletaGenerada.value,
  }

  const campos = [
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

  const cambios = {}

  campos.forEach((campo) => {
    if (esHexValido(paleta[campo])) {
      cambios[campo] =
        normalizarHex(paleta[campo])
    }
  })

  /*
   * El color base siempre tiene prioridad
   * sobre cualquier valor generado.
   */
  cambios.primary =
    normalizarHex(colorBase.value)

  /*
   * Guardamos también la configuración
   * utilizada para generar la paleta.
   */
  cambios.paleta = {
    base:
      normalizarHex(colorBase.value),

    armonia:
      armoniaSeleccionada.value,

    suavidad:
      Number(suavidad.value),

    contraste:
      Number(contraste.value),
  }

  emit(
    'actualizar-paleta',
    cambios,
  )
}

/* =========================================================
   ACTUALIZAR COLOR MANUAL
   ========================================================= */

function actualizarCampoColor(
  campo,
  valor,
) {
  if (!esHexValido(valor)) {
    return
  }

  const color = normalizarHex(valor)

  emit('actualizar-color', {
    campo,
    valor: color,
  })

  /*
   * Si se modifica PRIMARY manualmente,
   * también se actualiza el color base.
   */
  if (campo === 'primary') {
    colorBase.value = color

    regenerarPaleta()
  }
}

/* =========================================================
   RESTABLECER COLORES PREDETERMINADOS
   ========================================================= */

function restablecerColores() {
  /*
   * IMPORTANTE:
   *
   * Restaurar identidad NO utiliza la paleta
   * generada ni los valores actuales.
   *
   * Siempre vuelve a coloresPredeterminados.
   */
  const valores = {
    ...props.coloresPredeterminados,
  }

  Object.entries(valores).forEach(
    ([campo, valor]) => {
      if (!esHexValido(valor)) {
        return
      }

      emit('actualizar-color', {
        campo,
        valor: normalizarHex(valor),
      })
    },
  )

  /*
   * Restaurar también el color base.
   */
  const primaryPredeterminado =
    valores.primary ||
    '#0F172A'

  colorBase.value =
    normalizarHex(primaryPredeterminado)

  /*
   * Recuperar la configuración inicial
   * de armonía si existe.
   */
  armoniaSeleccionada.value =
    props.configuracion?.paleta?.armonia ||
    'triadica'

  suavidad.value =
    Number(
      props.configuracion?.paleta?.suavidad ??
      45,
    )

  contraste.value =
    Number(
      props.configuracion?.paleta?.contraste ??
      55,
    )

  regenerarPaleta()
}

/* =========================================================
   SINCRONIZACIÓN CON EL PADRE
   ========================================================= */

watch(
  () => props.colorBase,
  (nuevoValor) => {
    if (!esHexValido(nuevoValor)) {
      return
    }

    const color =
      normalizarHex(nuevoValor)

    if (
      color !== colorBase.value
    ) {
      colorBase.value = color
      regenerarPaleta()
    }
  },
)

/* =========================================================
   SINCRONIZAR CONFIGURACIÓN DE PALETA
   ========================================================= */

watch(
  () => props.configuracion?.paleta,
  (paleta) => {
    if (!paleta) {
      return
    }

    if (
      paleta.armonia
    ) {
      armoniaSeleccionada.value =
        paleta.armonia
    }

    if (
      paleta.suavidad !== undefined
    ) {
      suavidad.value =
        Number(paleta.suavidad)
    }

    if (
      paleta.contraste !== undefined
    ) {
      contraste.value =
        Number(paleta.contraste)
    }

    if (
      paleta.base &&
      esHexValido(paleta.base)
    ) {
      colorBase.value =
        normalizarHex(paleta.base)
    }

    regenerarPaleta()
  },
  {
    deep: true,
  },
)

/* =========================================================
   REGENERACIÓN AUTOMÁTICA
   ========================================================= */

watch(
  [
    armoniaSeleccionada,
    suavidad,
    contraste,
  ],
  () => {
    regenerarPaleta()
  },
)

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

regenerarPaleta()
</script>

<template>
  <div class="admin-configuracion__palette-layout">

    <!-- ===================================================
         COLOR BASE + ARMONÍA
         =================================================== -->

    <article class="admin-configuracion__card">

      <div
        class="admin-configuracion__card-heading"
      >
        <div>
          <h3>
            Color principal de la marca
          </h3>

          <p>
            Define el color base. A partir de él
            se generan automáticamente las
            armonías de la identidad visual.
          </p>
        </div>
      </div>

      <!-- COLOR BASE -->

      <div
        class="admin-configuracion__primary-color"
      >

        <input
          :value="colorBase"
          type="color"
          @input="
            cambiarColorBase(
              $event.target.value,
            )
          "
        />

        <div>
          <strong>
            {{ colorBase }}
          </strong>

          <span>
            Color base
          </span>
        </div>

        <input
          :value="colorBase"
          type="text"
          maxlength="7"
          placeholder="#0F172A"
          @change="
            cambiarColorBase(
              $event.target.value,
            )
          "
        />

      </div>

      <!-- EXPLICACIÓN -->

      <div
        class="admin-configuracion__primary-explanation"
      >
        <div>
          <strong>
            Color maestro de la interfaz
          </strong>

          <p>
            Este color controla la identidad
            principal del sistema y sirve como
            punto de partida para generar la
            paleta.
          </p>
        </div>
      </div>

      <!-- CONTROLES DE ARMONÍA -->

      <div
        class="admin-configuracion__palette-options"
      >

        <label>
          <span>
            Armonía
          </span>

          <select
            v-model="armoniaSeleccionada"
          >
            <option value="complementaria">
              Complementaria
            </option>

            <option value="analogica">
              Análoga
            </option>

            <option value="triadica">
              Triádica
            </option>

            <option value="monocromatica">
              Monocromática
            </option>
          </select>
        </label>

        <label>
          <span>
            Suavidad

            <strong>
              {{ suavidad }}%
            </strong>
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

            <strong>
              {{ contraste }}%
            </strong>
          </span>

          <input
            v-model.number="contraste"
            type="range"
            min="0"
            max="100"
          />
        </label>

      </div>

      <!-- ACCIONES -->

      <div
        class="admin-configuracion__palette-actions"
      >

        <button
          type="button"
          class="admin-configuracion__button admin-configuracion__button--secondary"
          @click="regenerarPaleta"
        >
          Generar paleta
        </button>

        <button
          type="button"
          class="admin-configuracion__button admin-configuracion__button--primary"
          @click="aplicarPaletaGenerada"
        >
          Aplicar paleta
        </button>

      </div>

    </article>

    <!-- ===================================================
         PALETA GENERADA / ARMONÍAS
         =================================================== -->

    <article
      class="admin-configuracion__card"
    >

      <div
        class="admin-configuracion__card-heading"
      >
        <div>
          <h3>
            Armonía generada
          </h3>

          <p>
            Colores calculados a partir del
            color base y los parámetros
            seleccionados.
          </p>
        </div>

        <span
          class="admin-configuracion__palette-badge"
        >
          {{ armoniaSeleccionada }}
        </span>
      </div>

      <div
        class="admin-configuracion__generated-palette"
      >

        <div
          v-for="(
            color,
            nombre
          ) in coloresGenerados"
          :key="nombre"
          class="admin-configuracion__generated-color"
        >

          <div
            class="admin-configuracion__generated-color-swatch"
            :style="{
              backgroundColor: color,
            }"
          ></div>

          <div>
            <strong>
              {{ nombre }}
            </strong>

            <span>
              {{ color }}
            </span>
          </div>

        </div>

      </div>

    </article>

    <!-- ===================================================
         COLORES MANUALES
         =================================================== -->

    <article
      class="admin-configuracion__card admin-configuracion__manual-colors"
    >

      <div
        class="admin-configuracion__card-heading"
      >

        <div>
          <h3>
            Colores del sistema
          </h3>

          <p>
            Personalización avanzada de cada
            variable de color.
          </p>
        </div>

        <div
          class="admin-configuracion__manual-actions"
        >

          <button
            type="button"
            class="admin-configuracion__text-button"
            @click="
              mostrarColoresManuales =
                !mostrarColoresManuales
            "
          >
            {{
              mostrarColoresManuales
                ? 'Ocultar colores'
                : 'Personalizar colores'
            }}
          </button>

          <button
            type="button"
            class="admin-configuracion__text-button admin-configuracion__text-button--danger"
            @click="restablecerColores"
          >
            Restaurar identidad
          </button>

        </div>

      </div>

      <div
        v-if="mostrarColoresManuales"
        class="admin-configuracion__manual-colors-content"
      >

        <div
          v-for="grupo in camposColores"
          :key="grupo.grupo"
          class="admin-configuracion__color-group"
        >

          <div
            class="admin-configuracion__color-group-title"
          >
            {{ grupo.grupo }}
          </div>

          <div
            class="admin-configuracion__color-grid"
          >

            <label
              v-for="[
                campo,
                etiqueta,
              ] in grupo.campos"
              :key="campo"
              class="admin-configuracion__color-field"
            >

              <span>
                {{ etiqueta }}
              </span>

              <div>

                <input
                  :value="
                    configuracion[campo] ||
                    coloresPredeterminados[campo]
                  "
                  type="color"
                  @input="
                    actualizarCampoColor(
                      campo,
                      $event.target.value,
                    )
                  "
                />

                <input
                  :value="
                    configuracion[campo] ||
                    coloresPredeterminados[campo]
                  "
                  type="text"
                  maxlength="7"
                  @change="
                    actualizarCampoColor(
                      campo,
                      $event.target.value,
                    )
                  "
                />

              </div>

            </label>

          </div>

        </div>

      </div>

    </article>

  </div>
</template>
