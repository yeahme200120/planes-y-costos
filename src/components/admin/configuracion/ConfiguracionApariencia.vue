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

  /*
   * Este prop se conserva para mantener
   * compatibilidad con el componente padre.
   */
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

/*
 * Ya no utilizamos un color visual fijo como respaldo
 * principal de la interfaz.
 *
 * Este valor solamente sirve como último recurso técnico
 * para el generador de paletas cuando no existe ningún
 * color configurado.
 */
const COLOR_RESPALDO = '#4678EC'

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

/*
 * Respaldo interno para los grupos de colores.
 *
 * Si el componente padre envía camposColores,
 * se utilizarán esos valores.
 *
 * Si no los envía, el componente seguirá mostrando
 * correctamente todos los campos conocidos.
 */
const camposColoresPredeterminados = [
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
]

/*
 * Nombres amigables para los degradados almacenados
 * dentro de configuracion.degradados.
 */
const nombresDegradados = {
  primary: 'Principal',
  accent: 'Acento',
  dark: 'Oscuro',
  soft: 'Suave',
}

/* =========================================================
   UTILIDADES
   ========================================================= */

function esHexValido(valor) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    String(valor || '').trim(),
  )
}

function normalizarColor(valor) {
  if (!esHexValido(valor)) {
    return null
  }

  try {
    const color = normalizarHex(
      String(valor).trim(),
    )

    return esHexValido(color)
      ? color
      : null
  } catch (error) {
    console.error(
      'Error normalizando color:',
      error,
    )

    return null
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

function obtenerNumero(valor, respaldo) {
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

/*
 * Normaliza el ángulo del degradado.
 *
 * Firebase puede almacenar angulo135,
 * o eventualmente angulo / angle / direccion.
 */
function obtenerAnguloDegradado(datos) {
  if (
    !datos ||
    typeof datos !== 'object'
  ) {
    return 135
  }

  const candidatos = [
    datos.angulo135,
    datos.angulo,
    datos.angle,
    datos.direccion,
  ]

  for (const valor of candidatos) {
    const numero = Number(valor)

    if (Number.isFinite(numero)) {
      return numero
    }
  }

  return 135
}

/* =========================================================
   OBTENER CAMPOS DE COLORES
   ========================================================= */

const camposColoresVisibles = computed(() => {
  if (
    Array.isArray(props.camposColores) &&
    props.camposColores.length > 0
  ) {
    return props.camposColores
  }

  return camposColoresPredeterminados
})

/* =========================================================
   OBTENER VALOR PREDETERMINADO
   ========================================================= */

function obtenerValorPredeterminado(campo) {
  return obtenerColorValido(
    props.coloresPredeterminados?.[campo],
  )
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
 * Ya no utilizamos un color azul de respaldo para todos
 * los campos. Eso provocaba que background, text, border,
 * surface, etc. pudieran terminar mostrando el mismo color.
 */

function obtenerValorCampo(campo) {
  const valorConfiguracion =
    props.configuracion?.[campo]

  const valorPaleta =
    props.configuracion?.paleta?.[campo]

  const valorPredeterminado =
    obtenerValorPredeterminado(campo)

  return (
    obtenerColorValido(
      valorConfiguracion,
      valorPaleta,
      valorPredeterminado,
    ) ||
    ''
  )
}

/* =========================================================
   COLOR BASE
   ========================================================= */

/*
 * Prioridad:
 *
 * 1. primary guardado en configuración
 * 2. paleta.base guardado en Firebase
 * 3. colorBase recibido por prop
 * 4. primary predeterminado
 * 5. respaldo técnico
 *
 * La configuración guardada debe tener prioridad sobre
 * un prop que solamente se utiliza como compatibilidad.
 */

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
   ESTADO DE LA VISTA
   ========================================================= */

const coloresGenerados = ref({})

const mostrarColoresManuales =
  ref(false)

/* =========================================================
   PALETA GENERADA
   ========================================================= */

const paletaGenerada = computed(() => {
  const base =
    obtenerColorValido(
      colorBase.value,
      props.configuracion?.primary,
      props.coloresPredeterminados?.primary,
      COLOR_RESPALDO,
    ) || COLOR_RESPALDO

  try {
    const resultado =
      generarPaleta(
        base,
        {
          armonia:
            armoniaSeleccionada.value,

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

    const paletaValida = {}

    Object.entries(resultado).forEach(
      ([campo, valor]) => {
        /*
         * Solo aceptamos campos reconocidos.
         * Así evitamos introducir propiedades
         * desconocidas en la configuración.
         */

        if (
          !camposPaleta.includes(campo)
        ) {
          return
        }

        const color =
          normalizarColor(valor)

        if (color) {
          paletaValida[campo] =
            color
        }
      },
    )

    return paletaValida
  } catch (error) {
    console.error(
      'Error al generar paleta:',
      error,
    )

    return {}
  }
})

/* =========================================================
   DEGRADADOS CONFIGURADOS EN FIREBASE
   ========================================================= */

/*
 * Firebase mantiene la estructura original:
 *
 * degradados: {
 *   primary: {
 *     inicio: '#DAFBFB',
 *     fin: '#7AF5F5',
 *     angulo135: 135
 *   },
 *   ...
 * }
 *
 * Aquí solamente transformamos esos datos para
 * mostrarlos visualmente.
 *
 * NO modificamos el objeto original.
 * NO convertimos el objeto a JSON.
 */

const degradadosConfigurados = computed(() => {
  const degradados =
    props.configuracion?.degradados

  if (
    !degradados ||
    typeof degradados !== 'object' ||
    Array.isArray(degradados)
  ) {
    return []
  }

  return Object.entries(degradados)
    .map(([clave, datos]) => {
      if (
        !datos ||
        typeof datos !== 'object' ||
        Array.isArray(datos)
      ) {
        return null
      }

      const inicio =
        obtenerColorValido(
          datos.inicio,
          datos.start,
          datos.desde,
          datos.colorInicio,
        )

      const fin =
        obtenerColorValido(
          datos.fin,
          datos.end,
          datos.hasta,
          datos.colorFin,
        )

      /*
       * Si alguno de los dos colores no existe,
       * intentamos mantener el degradado visualmente
       * sin inventar valores a partir de JSON.
       */
      if (!inicio && !fin) {
        return null
      }

      const colorInicio =
        inicio ||
        fin ||
        obtenerValorCampo('primary') ||
        COLOR_RESPALDO

      const colorFin =
        fin ||
        inicio ||
        obtenerValorCampo('primaryLight') ||
        COLOR_RESPALDO

      const angulo =
        obtenerAnguloDegradado(datos)

      return {
        clave,

        nombre:
          nombresDegradados[clave] ||
          clave,

        inicio:
          colorInicio,

        fin:
          colorFin,

        angulo,

        estilo:
          `linear-gradient(${angulo}deg, ${colorInicio} 0%, ${colorFin} 100%)`,
      }
    })
    .filter(Boolean)
})

/* =========================================================
   GENERAR / REGENERAR PALETA
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
  const paleta = {
    ...paletaGenerada.value,
  }

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

  const base =
    normalizarColor(
      colorBase.value,
    ) ||
    obtenerColorValido(
      props.configuracion?.primary,
      props.coloresPredeterminados?.primary,
      COLOR_RESPALDO,
    ) ||
    COLOR_RESPALDO

  /*
   * PRIMARY siempre representa
   * el color base de la marca.
   */

  cambios.primary =
    base

  /*
   * Si el generador no devuelve textos
   * de contraste, conservamos los existentes
   * o los predeterminados.
   *
   * No forzamos #FFFFFF porque el texto debe
   * poder configurarse globalmente.
   */

  const textosContraste = [
    'primaryText',
    'secondaryText',
    'accentText',
  ]

  textosContraste.forEach(
    (campo) => {
      if (
        normalizarColor(
          cambios[campo],
        )
      ) {
        return
      }

      const existente =
        obtenerColorValido(
          props.configuracion?.[campo],
          props.configuracion?.paleta?.[campo],
          props.coloresPredeterminados?.[campo],
        )

      if (existente) {
        cambios[campo] =
          existente
      }
    },
  )

  /*
   * Guardar también los parámetros
   * utilizados para generar la paleta.
   */

  cambios.paleta = {
    ...(
      props.configuracion?.paleta &&
      typeof props.configuracion.paleta === 'object'
        ? props.configuracion.paleta
        : {}
    ),

    base,

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
   * Si se modifica PRIMARY,
   * también se modifica el color base
   * utilizado para generar la paleta.
   */

  if (campo === 'primary') {
    colorBase.value =
      nuevoColor

    regenerarPaleta()
  }
}

/* =========================================================
   RESTABLECER COLORES
   ========================================================= */

function restablecerColores() {
  const defaults = {
    ...props.coloresPredeterminados,
  }

  const coloresRestaurados = {}

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
      COLOR_RESPALDO,
    ) || COLOR_RESPALDO

  colorBase.value =
    primary

  armoniaSeleccionada.value =
    'triadica'

  suavidad.value = 45
  contraste.value = 55

  const cambios = {
    ...coloresRestaurados,

    primary,

    paleta: {
      ...(
        props.configuracion?.paleta &&
        typeof props.configuracion.paleta === 'object'
          ? props.configuracion.paleta
          : {}
      ),

      base: primary,
      armonia: 'triadica',
      suavidad: 45,
      contraste: 55,
    },
  }

  emit(
    'actualizar-paleta',
    cambios,
  )

  regenerarPaleta()
}

/* =========================================================
   SINCRONIZACIÓN DEL COLOR BASE DESDE EL PADRE
   ========================================================= */

watch(
  () => props.colorBase,
  (nuevoValor) => {
    const nuevoColor =
      normalizarColor(nuevoValor)

    if (!nuevoColor) {
      return
    }

    /*
     * Si existe una configuración real en Firebase,
     * ésta tiene prioridad.
     */

    const primaryConfigurado =
      normalizarColor(
        props.configuracion?.primary,
      )

    const baseConfigurada =
      normalizarColor(
        props.configuracion?.paleta?.base,
      )

    if (
      primaryConfigurado ||
      baseConfigurada
    ) {
      return
    }

    if (
      nuevoColor !== colorBase.value
    ) {
      colorBase.value =
        nuevoColor

      regenerarPaleta()
    }
  },
)

/* =========================================================
   SINCRONIZACIÓN DE CONFIGURACIÓN DE PALETA
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

    armoniaSeleccionada.value =
      obtenerArmonia(
        nuevaPaleta.armonia,
      )

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

    const nuevaBase =
      obtenerColorValido(
        nuevaPaleta.base,
        props.configuracion?.primary,
        props.colorBase,
        props.coloresPredeterminados?.primary,
        COLOR_RESPALDO,
      )

    if (
      nuevaBase &&
      nuevaBase !== colorBase.value
    ) {
      colorBase.value =
        nuevaBase
    }

    regenerarPaleta()
  },
  {
    deep: true,
  },
)

/* =========================================================
   SINCRONIZACIÓN DE PRIMARY DESDE FIREBASE
   ========================================================= */

watch(
  () => props.configuracion?.primary,
  (nuevoValor) => {
    const nuevoColor =
      normalizarColor(nuevoValor)

    if (!nuevoColor) {
      return
    }

    /*
     * Si existe una base explícita dentro de paleta,
     * esa base mantiene la configuración del generador.
     */

    const baseConfigurada =
      normalizarColor(
        props.configuracion?.paleta?.base,
      )

    if (
      baseConfigurada &&
      baseConfigurada === nuevoColor
    ) {
      if (
        colorBase.value !== nuevoColor
      ) {
        colorBase.value =
          nuevoColor

        regenerarPaleta()
      }

      return
    }

    /*
     * Si no existe base explícita,
     * primary se convierte en el color base.
     */

    if (!baseConfigurada) {
      if (
        nuevoColor !== colorBase.value
      ) {
        colorBase.value =
          nuevoColor

        regenerarPaleta()
      }
    }
  },
)

/* =========================================================
   SINCRONIZACIÓN DE COLORES PREDETERMINADOS
   ========================================================= */

watch(
  () => props.coloresPredeterminados?.primary,
  (nuevoValor) => {
    const existeColorConfigurado =
      normalizarColor(
        props.configuracion?.primary,
      ) ||
      normalizarColor(
        props.configuracion?.paleta?.base,
      )

    if (existeColorConfigurado) {
      return
    }

    const nuevoColor =
      normalizarColor(nuevoValor)

    if (!nuevoColor) {
      return
    }

    if (
      nuevoColor !== colorBase.value
    ) {
      colorBase.value =
        nuevoColor

      regenerarPaleta()
    }
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
   SINCRONIZACIÓN GENERAL
   ========================================================= */

/*
 * La configuración puede actualizarse desde Firebase
 * mientras el administrador está viendo esta pantalla.
 *
 * Este watcher garantiza que cualquier cambio externo
 * de la configuración actualice la vista de la paleta.
 */

watch(
  () => [
    props.configuracion?.primary,
    props.configuracion?.paleta?.base,
    props.configuracion?.paleta?.armonia,
    props.configuracion?.paleta?.suavidad,
    props.configuracion?.paleta?.contraste,
    props.configuracion?.degradados,
  ],
  () => {
    const nuevoBase =
      obtenerColorValido(
        props.configuracion?.primary,
        props.configuracion?.paleta?.base,
        props.colorBase,
        props.coloresPredeterminados?.primary,
        COLOR_RESPALDO,
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
    immediate: true,
    deep: true,
  },
)

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

regenerarPaleta()
</script>

<template>
  <div
    class="admin-configuracion__palette-layout"
  >
    <!-- ===================================================
         COLOR BASE + ARMONÍA
         =================================================== -->


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
        Define el color base. A partir de él
        se generan automáticamente las
        armonías de la identidad visual.
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

  <!-- COLOR BASE -->

  <div
    class="admin-configuracion__primary-color"
  >
    <input
      :value="colorBase"
      type="color"
      aria-label="Seleccionar color base"
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
      placeholder="#4678EC"
      aria-label="Código hexadecimal del color base"
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
     PALETA GENERADA
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
    v-if="
      Object.keys(coloresGenerados).length > 0
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
        aria-hidden="true"
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

<!-- ===================================================
     DEGRADADOS DE FIREBASE
     =================================================== -->

<article
  class="admin-configuracion__card admin-configuracion__gradients-card"
>
  <div
    class="admin-configuracion__card-heading"
  >
    <div>
      <h3>
        Degradados
      </h3>

      <p>
        Degradados configurados en Firebase.
        Se muestran visualmente sin convertir
        la configuración almacenada en JSON.
      </p>
    </div>
  </div>

  <div
    v-if="
      degradadosConfigurados.length > 0
    "
    class="admin-configuracion__gradients-grid"
  >
    <div
      v-for="degradado in degradadosConfigurados"
      :key="degradado.clave"
      class="admin-configuracion__gradient-item"
    >
      <!-- PREVISUALIZACIÓN -->

      <div
        class="admin-configuracion__gradient-preview"
        :style="{
          background: degradado.estilo,
        }"
        :title="
          `${degradado.inicio} → ${degradado.fin}`
        "
        aria-hidden="true"
      ></div>

      <!-- INFORMACIÓN -->

      <div
        class="admin-configuracion__gradient-info"
      >
        <strong>
          {{ degradado.nombre }}
        </strong>

        <span>
          {{ degradado.clave }}
        </span>

        <div
          class="admin-configuracion__gradient-colors"
        >
          <i
            :style="{
              backgroundColor:
                degradado.inicio,
            }"
            :title="
              `Inicio: ${degradado.inicio}`
            "
            aria-hidden="true"
          ></i>

          <i
            :style="{
              backgroundColor:
                degradado.fin,
            }"
            :title="
              `Fin: ${degradado.fin}`
            "
            aria-hidden="true"
          ></i>

          <small>
            {{ degradado.angulo }}°
          </small>
        </div>

        <div
          class="admin-configuracion__gradient-values"
        >
          <span>
            {{ degradado.inicio }}
          </span>

          <span>
            {{ degradado.fin }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="admin-configuracion__gradient-empty"
  >
    <strong>
      No hay degradados configurados
    </strong>

    <span>
      Cuando Firebase contenga degradados
      con inicio, fin y ángulo,
      aparecerán aquí automáticamente.
    </span>
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
      v-for="grupo in camposColoresVisibles"
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
  </div>
</article>


  </div>
</template>
