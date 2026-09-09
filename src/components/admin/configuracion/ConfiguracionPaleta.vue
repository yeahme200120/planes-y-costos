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

watch(
  () => props.configuracion?.primary,
  (nuevoValor) => {
    if (!esHexValido(nuevoValor)) {
      return
    }

    const nuevoColor =
      normalizarHex(nuevoValor)

    if (
      nuevoColor !== colorBase.value
    ) {
      colorBase.value =
        nuevoColor

      regenerarPaleta()
    }
  },
)
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

const colorBase = ref(
    props.configuracion.primary ||
    props.coloresPredeterminados.primary ||
    '#0F172A',
)

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

const coloresGenerados = ref({})

const paletaGenerada = computed(() => {
    try {
        return generarPaleta(
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
    } catch {
        return {}
    }
})

function esHexValido(valor) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
        String(valor || '').trim(),
    )
}

function regenerarPaleta() {
    coloresGenerados.value = {
        ...paletaGenerada.value,
    }
}

function cambiarColorBase(valor) {
    if (!esHexValido(valor)) return

    colorBase.value =
        normalizarHex(valor)

    emit('actualizar-color', {
        campo: 'primary',
        valor: colorBase.value,
    })

    regenerarPaleta()
}

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

    cambios.primary =
        colorBase.value

    cambios.paleta = {
        base: colorBase.value,
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

function actualizarCampoColor(campo, valor) {
    if (!esHexValido(valor)) return

    emit('actualizar-color', {
        campo,
        valor: normalizarHex(valor),
    })

    if (campo === 'primary') {
        colorBase.value =
            normalizarHex(valor)

        regenerarPaleta()
    }
}

function restablecerColores() {
  const defaults =
    props.coloresPredeterminados || {}

  const coloresRestaurados = {}

  /*
   * Restaurar EXACTAMENTE los colores
   * predeterminados definidos por AdminConfiguracion.
   */
  Object.entries(defaults).forEach(
    ([campo, valor]) => {
      if (!esHexValido(valor)) {
        return
      }

      coloresRestaurados[campo] =
        normalizarHex(valor)
    },
  )

  /*
   * El color primario predeterminado
   * vuelve a ser el color base.
   */
  const primary =
    normalizarHex(
      defaults.primary ||
      '#0F172A',
    )

  colorBase.value = primary

  /*
   * Restaurar los parámetros originales
   * de la paleta.
   */
  armoniaSeleccionada.value =
    'triadica'

  suavidad.value = 45

  contraste.value = 55

  /*
   * Actualizar la representación visual
   * de las armonías usando nuevamente
   * el color base predeterminado.
   */
  regenerarPaleta()

  /*
   * IMPORTANTE:
   *
   * NO usamos la paleta generada para
   * reemplazar los colores predeterminados.
   *
   * Enviamos directamente los defaults.
   */
  emit(
    'actualizar-paleta',
    {
      ...coloresRestaurados,

      paleta: {
        base: primary,
        armonia: 'triadica',
        suavidad: 45,
        contraste: 55,
      },
    },
  )
}

regenerarPaleta()
</script>

<template>
    <div class="admin-configuracion__palette-layout">

        <!-- CONFIGURACIÓN -->
        <article class="admin-configuracion__card">

            <div class="admin-configuracion__card-heading">
                <div>
                    <h3>Color principal de la marca</h3>

                    <p>
                        Este color controla la identidad principal
                        del sistema: Header, Sidebar, Footer,
                        botones y elementos activos.
                    </p>
                </div>

                <div class="admin-configuracion__color-swatch" :style="{
                    backgroundColor: colorBase,
                }" />
            </div>

            <div class="admin-configuracion__primary-color">

                <input :value="colorBase" type="color" @input="
                    cambiarColorBase($event.target.value)
                    " />

                <div>
                    <strong>
                        {{ colorBase }}
                    </strong>

                    <span>
                        Identidad principal
                    </span>
                </div>

                <input :value="colorBase" type="text" maxlength="7" placeholder="#0F172A" @change="
                    cambiarColorBase($event.target.value)
                    " />

            </div>

            <div class="admin-configuracion__primary-explanation">

                <span class="admin-configuracion__primary-line" />

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

            <div class="admin-configuracion__palette-options">

                <label>
                    <span>Armonía</span>

                    <select v-model="armoniaSeleccionada">
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
                        <strong>{{ suavidad }}%</strong>
                    </span>

                    <input v-model.number="suavidad" type="range" min="0" max="100" />
                </label>

                <label>
                    <span>
                        Contraste
                        <strong>{{ contraste }}%</strong>
                    </span>

                    <input v-model.number="contraste" type="range" min="0" max="100" />
                </label>

            </div>

            <div class="admin-configuracion__palette-actions">

                <button type="button" class="admin-configuracion__button admin-configuracion__button--secondary"
                    @click="regenerarPaleta">
                    Generar paleta
                </button>

                <button type="button" class="admin-configuracion__button admin-configuracion__button--primary"
                    @click="aplicarPaletaGenerada">
                    Aplicar paleta
                </button>

            </div>

        </article>

        <!-- PALETA GENERADA -->
        <article class="admin-configuracion__card">

            <div class="admin-configuracion__card-heading">
                <div>
                    <h3>Paleta generada</h3>

                    <p>
                        Valores calculados a partir del color
                        principal de la marca.
                    </p>
                </div>
            </div>

            <div class="admin-configuracion__generated-palette">

                <div v-for="(color, nombre) in coloresGenerados" :key="nombre"
                    class="admin-configuracion__generated-color">
                    <div class="admin-configuracion__generated-color-swatch" :style="{
                        backgroundColor: color,
                    }" />

                    <div>
                        <strong>{{ nombre }}</strong>
                        <span>{{ color }}</span>
                    </div>
                </div>

            </div>

        </article>

        <!-- COLORES MANUALES -->
        <article class="admin-configuracion__card admin-configuracion__manual-colors">

            <div class="admin-configuracion__card-heading">
                <div>
                    <h3>Colores del sistema</h3>

                    <p>
                        Puedes ajustar cada variable individualmente.
                    </p>
                </div>

                <button type="button" class="admin-configuracion__text-button" @click="restablecerColores">
                    Restaurar identidad
                </button>
            </div>

            <div v-for="grupo in camposColores" :key="grupo.grupo" class="admin-configuracion__color-group">

                <div class="admin-configuracion__color-group-title">
                    {{ grupo.grupo }}
                </div>

                <div class="admin-configuracion__color-grid">

                    <label v-for="[campo, etiqueta] in grupo.campos" :key="campo"
                        class="admin-configuracion__color-field">

                        <span>
                            {{ etiqueta }}
                        </span>

                        <div>
                            <input :value="configuracion[campo] ||
                                coloresPredeterminados[campo]
                                " type="color" @input="
                    actualizarCampoColor(
                        campo,
                        $event.target.value,
                    )
                    " />

                            <input :value="configuracion[campo] ||
                                coloresPredeterminados[campo]
                                " type="text" maxlength="7" @change="
                    actualizarCampoColor(
                        campo,
                        $event.target.value,
                    )
                    " />
                        </div>

                    </label>

                </div>

            </div>

        </article>

    </div>
</template>