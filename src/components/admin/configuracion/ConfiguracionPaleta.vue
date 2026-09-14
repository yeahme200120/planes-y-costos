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
})

const emit = defineEmits([
  'actualizar-color',
  'actualizar-paleta',
])

/* =========================================================
   CONSTANTES
   ========================================================= */

/*
 * Este color solamente se utiliza como respaldo técnico
 * del generador cuando absolutamente no existe ningún
 * color configurado.
 *
 * No se utiliza para pintar campos individuales.
 */
const COLOR_RESPALDO_GENERADOR = '#4678EC'

const camposPaleta = [
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

const armoniasPermitidas = [
  'complementaria',
  'analogica',
  'triadica',
  'monocromatica',
]

/* =========================================================
   VALIDACIÓN Y NORMALIZACIÓN
   ========================================================= */

function esHexValido(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return false
  }

  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    String(valor).trim(),
  )
}

function normalizarColor(
  valor,
  respaldo = null,
) {
  if (!esHexValido(valor)) {
    return respaldo
  }

  try {
    const color =
      normalizarHex(
        String(valor).trim(),
      )

    return esHexValido(color)
      ? color
      : respaldo
  } catch (error) {
    console.error(
      'Error normalizando color:',
      error,
    )

    return respaldo
  }
}

function obtenerColorValido(...valores) {
  for (const valor of valores) {
    const color =
      normalizarColor(valor)

    if (color) {
      return color
    }
  }

  return null
}

function obtenerNumero(
  valor,
  respaldo,
) {
  const numero = Number(valor)

  if (!Number.isFinite(numero)) {
    return respaldo
  }

  return Math.min(
    100,
    Math.max(0, numero),
  )
}

function obtenerArmonia(valor) {
  if (
    armoniasPermitidas.includes(valor)
  ) {
    return valor
  }

  return 'triadica'
}

/* =========================================================
   OBTENER VALOR DE COLOR
   ========================================================= */

/*
 * Prioridad:
 *
 * 1. configuración directa
 * 2. configuración.paleta
 * 3. color predeterminado
 *
 * IMPORTANTE:
 *
 * No se utiliza un color de respaldo genérico.
 * Cada variable debe conservar su propio valor.
 */

function obtenerValorCampo(campo) {
  const valorConfiguracion =
    props.configuracion?.[campo]

  const valorPaleta =
    props.configuracion?.paleta?.[campo]

  const valorPredeterminado =
    props.coloresPredeterminados?.[campo]

  return (
    obtenerColorValido(
      valorConfiguracion,
      valorPaleta,
      valorPredeterminado,
    ) || ''
  )
}

/* =========================================================
   COLOR BASE
   ========================================================= */

/*
 * Prioridad:
 *
 * 1. configuracion.primary
 * 2. configuracion.paleta.base
 * 3. coloresPredeterminados.primary
 * 4. respaldo técnico del generador
 *
 * Firebase representa la configuración real.
 */

const colorBase = ref(
  obtenerColorValido(
    props.configuracion?.primary,
    props.configuracion?.paleta?.base,
    props.coloresPredeterminados?.primary,
    COLOR_RESPALDO_GENERADOR,
  ) ||
    COLOR_RESPALDO_GENERADOR,
)

/* =========================================================
   CONFIGURACIÓN DE PALETA
   ========================================================= */

const armoniaSeleccionada = ref(
  obtenerArmonia(
    props.configuracion?.paleta?.armonia,
  ),
)

const suavidad = ref(
  obtenerNumero(
    props.configuracion?.paleta?.suavidad,
    45,
  ),
)

const contraste = ref(
  obtenerNumero(
    props.configuracion?.paleta?.contraste,
    55,
  ),
)

/* =========================================================
   ESTADO
   ========================================================= */

const coloresGenerados = ref({})

/* =========================================================
   PALETA GENERADA
   ========================================================= */

const paletaGenerada = computed(() => {
  const base =
    obtenerColorValido(
      colorBase.value,
      props.configuracion?.primary,
      props.configuracion?.paleta?.base,
      props.coloresPredeterminados?.primary,
      COLOR_RESPALDO_GENERADOR,
    ) ||
    COLOR_RESPALDO_GENERADOR

  try {
    const resultado =
      generarPaleta(
        base,
        {
          armonia:
            obtenerArmonia(
              armoniaSeleccionada.value,
            ),

          suavidad:
            obtenerNumero(
              suavidad.value,
              45,
            ),

          contraste:
            obtenerNumero(
              contraste.value,
              55,
            ),
        },
      )

    if (
      !resultado ||
      typeof resultado !== 'object'
    ) {
      return {}
    }

    const paleta = {}

    Object.entries(resultado).forEach(
      ([campo, valor]) => {
        /*
         * No permitir propiedades que no
         * pertenecen al sistema de colores.
         */

        if (
          !camposPaleta.includes(campo)
        ) {
          return
        }

        const color =
          normalizarColor(valor)

        if (color) {
          paleta[campo] =
            color
        }
      },
    )

    return paleta
  } catch (error) {
    console.error(
      'Error generando paleta:',
      error,
    )

    return {}
  }
})

/* =========================================================
   ACTUALIZAR VISTA PREVIA
   ========================================================= */

function regenerarPaleta() {
  coloresGenerados.value = {
    ...paletaGenerada.value,
  }
}

/* =========================================================
   CAMBIAR COLOR PRINCIPAL
   ========================================================= */

function cambiarColorBase(valor) {
  const nuevoColor =
    normalizarColor(valor)

  if (!nuevoColor) {
    return
  }

  colorBase.value =
    nuevoColor

  emit(
    'actualizar-color',
    {
      campo: 'primary',
      valor: nuevoColor,
    },
  )

  regenerarPaleta()
}

/* =========================================================
   APLICAR PALETA GENERADA
   ========================================================= */

function aplicarPaletaGenerada() {
  const paleta =
    paletaGenerada.value || {}

  const cambios = {}

  camposPaleta.forEach(
    (campo) => {
      const color =
        normalizarColor(
          paleta[campo],
        )

      if (!color) {
        return
      }

      cambios[campo] =
        color
    },
  )

  /*
   * PRIMARY siempre representa
   * el color maestro seleccionado.
   */

  const primary =
    normalizarColor(
      colorBase.value,
    ) ||
    obtenerColorValido(
      props.configuracion?.primary,
      props.coloresPredeterminados?.primary,
      COLOR_RESPALDO_GENERADOR,
    ) ||
    COLOR_RESPALDO_GENERADOR

  cambios.primary =
    primary

  /*
   * Conservamos cualquier información
   * adicional existente dentro de paleta.
   *
   * No reemplazamos arbitrariamente la
   * estructura almacenada en Firebase.
   */

  const paletaAnterior =
    props.configuracion?.paleta

  cambios.paleta = {
    ...(
      paletaAnterior &&
      typeof paletaAnterior === 'object'
        ? paletaAnterior
        : {}
    ),

    base:
      primary,

    armonia:
      obtenerArmonia(
        armoniaSeleccionada.value,
      ),

    suavidad:
      obtenerNumero(
        suavidad.value,
        45,
      ),

    contraste:
      obtenerNumero(
        contraste.value,
        55,
      ),
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
  if (
    !camposPaleta.includes(campo)
  ) {
    return
  }

  const nuevoColor =
    normalizarColor(valor)

  if (!nuevoColor) {
    return
  }

  emit(
    'actualizar-color',
    {
      campo,
      valor: nuevoColor,
    },
  )

  /*
   * PRIMARY también representa
   * el color base del generador.
   */

  if (campo === 'primary') {
    colorBase.value =
      nuevoColor

    /*
     * Si existía una paleta con una
     * base anterior, la vista previa
     * debe actualizarse inmediatamente.
     */

    regenerarPaleta()
  }
}

/* =========================================================
   RESTABLECER COLORES
   ========================================================= */

function restablecerColores() {
  const defaults =
    props.coloresPredeterminados || {}

  const coloresRestaurados = {}

  /*
   * Solo restauramos las variables
   * que realmente pertenecen al sistema.
   */

  camposPaleta.forEach(
    (campo) => {
      const color =
        normalizarColor(
          defaults[campo],
        )

      if (!color) {
        return
      }

      coloresRestaurados[campo] =
        color
    },
  )

  const primary =
    obtenerColorValido(
      defaults.primary,
      COLOR_RESPALDO_GENERADOR,
    ) ||
    COLOR_RESPALDO_GENERADOR

  colorBase.value =
    primary

  armoniaSeleccionada.value =
    'triadica'

  suavidad.value = 45
  contraste.value = 55

  const paletaAnterior =
    props.configuracion?.paleta

  const paleta =
    {
      ...(
        paletaAnterior &&
        typeof paletaAnterior === 'object'
          ? paletaAnterior
          : {}
      ),

      base:
        primary,

      armonia:
        'triadica',

      suavidad:
        45,

      contraste:
        55,
    }

  emit(
    'actualizar-paleta',
    {
      ...coloresRestaurados,

      primary,

      paleta,
    },
  )

  regenerarPaleta()
}

/* =========================================================
   SINCRONIZACIÓN CON FIREBASE
   ========================================================= */

/*
 * Cuando cambia primary en Firebase, actualizar
 * inmediatamente el color base de la interfaz.
 */

watch(
  () => props.configuracion?.primary,
  (nuevoValor) => {
    const nuevoColor =
      normalizarColor(nuevoValor)

    if (!nuevoColor) {
      return
    }

    if (
      nuevoColor !==
      colorBase.value
    ) {
      colorBase.value =
        nuevoColor

      regenerarPaleta()
    }
  },
  {
    immediate: true,
  },
)

/* =========================================================
   SINCRONIZAR PALETA
   ========================================================= */

watch(
  () => props.configuracion?.paleta,
  (nuevaPaleta) => {
    if (
      !nuevaPaleta ||
      typeof nuevaPaleta !== 'object'
    ) {
      return
    }

    if (
      typeof nuevaPaleta.armonia ===
      'string'
    ) {
      armoniaSeleccionada.value =
        obtenerArmonia(
          nuevaPaleta.armonia,
        )
    }

    suavidad.value =
      obtenerNumero(
        nuevaPaleta.suavidad,
        45,
      )

    contraste.value =
      obtenerNumero(
        nuevaPaleta.contraste,
        55,
      )

    const nuevoBase =
      obtenerColorValido(
        props.configuracion?.primary,
        nuevaPaleta.base,
        props.coloresPredeterminados?.primary,
        COLOR_RESPALDO_GENERADOR,
      )

    if (
      nuevoBase &&
      nuevoBase !== colorBase.value
    ) {
      colorBase.value =
        nuevoBase
    }

    regenerarPaleta()
  },
  {
    deep: true,
    immediate: true,
  },
)

/* =========================================================
   SINCRONIZAR PREDETERMINADO
   ========================================================= */

watch(
  () =>
    props.coloresPredeterminados?.primary,
  (nuevoValor) => {
    /*
     * Si ya existe configuración de Firebase,
     * jamás sustituirla con un predeterminado.
     */

    if (
      props.configuracion?.primary ||
      props.configuracion?.paleta?.base
    ) {
      return
    }

    const nuevoColor =
      normalizarColor(nuevoValor)

    if (!nuevoColor) {
      return
    }

    if (
      nuevoColor !==
      colorBase.value
    ) {
      colorBase.value =
        nuevoColor

      regenerarPaleta()
    }
  },
  {
    immediate: true,
  },
)

/* =========================================================
   ACTUALIZAR PREVIEW AUTOMÁTICAMENTE
   ========================================================= */

watch(
  [
    colorBase,
    armoniaSeleccionada,
    suavidad,
    contraste,
  ],
  () => {
    regenerarPaleta()
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div
    class="admin-configuracion__palette-layout"
  >
    <!-- =====================================================
         CONFIGURACIÓN
         ===================================================== -->

    <article
      class="admin-configuracion__card"
    >
      <div
        class="admin-configuracion__card-heading"
      >
        <div>
          <h3>
            Color principal de la marca
          </h3>

          <p>
            Este color controla la identidad principal
            del sistema: Header, Sidebar, Footer,
            botones y elementos activos.
          </p>
        </div>

        <div
          class="admin-configuracion__color-swatch"
          :style="{
            backgroundColor: colorBase,
          }"
          aria-hidden="true"
        ></div>
      </div>

      <div
        class="admin-configuracion__primary-color"
      >
        <input
          :value="colorBase"
          type="color"
          aria-label="Seleccionar color principal"
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
            Identidad principal
          </span>
        </div>

        <input
          :value="colorBase"
          type="text"
          maxlength="7"
          placeholder="#4678EC"
          aria-label="Código hexadecimal del color principal"
          @change="
            cambiarColorBase(
              $event.target.value,
            )
          "
        />
      </div>

      <div
        class="admin-configuracion__primary-explanation"
      >
        <span
          class="admin-configuracion__primary-line"
          aria-hidden="true"
        ></span>

        <div>
          <strong>
            Color maestro de la interfaz
          </strong>

          <p>
            Cuando cambies este color, la interfaz
            administrativa lo aplica inmediatamente
            mediante las variables CSS globales.
          </p>
        </div>
      </div>

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
            step="1"
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
            step="1"
          />
        </label>
      </div>

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

    <!-- =====================================================
         PALETA GENERADA
         ===================================================== -->

    <article
      class="admin-configuracion__card"
    >
      <div
        class="admin-configuracion__card-heading"
      >
        <div>
          <h3>
            Paleta generada
          </h3>

          <p>
            Valores calculados a partir del color
            principal de la marca.
          </p>
        </div>
      </div>

      <div
        v-if="
          Object.keys(coloresGenerados).length
        "
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
            :title="color"
            :aria-label="
              `${nombre}: ${color}`
            "
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

      <div
        v-else
        class="admin-configuracion__empty-palette"
      >
        No se pudo generar una paleta válida.
        Revisa el color principal.
      </div>
    </article>

    <!-- =====================================================
         COLORES MANUALES
         ===================================================== -->

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
            Puedes ajustar cada variable individualmente.
          </p>
        </div>

        <button
          type="button"
          class="admin-configuracion__text-button"
          @click="restablecerColores"
        >
          Restaurar identidad
        </button>
      </div>

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
                  obtenerValorCampo(
                    campo,
                  )
                "
                type="color"
                :aria-label="
                  `Seleccionar ${etiqueta}`
                "
                @input="
                  actualizarCampoColor(
                    campo,
                    $event.target.value,
                  )
                "
              />

              <input
                :value="
                  obtenerValorCampo(
                    campo,
                  )
                "
                type="text"
                maxlength="7"
                placeholder="#000000"
                :aria-label="
                  `Código hexadecimal de ${etiqueta}`
                "
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
    </article>
  </div>
</template>