<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'

import {
  actualizarConfiguracion,
  suscribirConfiguracionAdmin,
} from '../../services/adminService'

import ConfiguracionIdentidad from '../../components/admin/configuracion/ConfiguracionIdentidad.vue'
import ConfiguracionApariencia from '../../components/admin/configuracion/ConfiguracionApariencia.vue'
import ConfiguracionDatos from '../../components/admin/configuracion/ConfiguracionDatos.vue'

const cargando =
  ref(true)

const guardando =
  ref(false)

const error =
  ref('')

const mensaje =
  ref('')

const conectadaTiempoReal =
  ref(false)

const configuracion =
  reactive({})

const configuracionOriginal =
  reactive({})

let unsubscribeConfiguracion =
  null

const panelActivo =
  ref('identidad')

const paneles = [
  {
    id: 'identidad',
    titulo: 'Identidad visual',
    descripcion:
      'Logo, favicon y recursos gráficos',
    icono: '◇',
  },
  {
    id: 'apariencia',
    titulo: 'Apariencia',
    descripcion:
      'Colores y sistema visual',
    icono: '✦',
  },
  {
    id: 'datos',
    titulo: 'Datos generales',
    descripcion:
      'Información de la empresa',
    icono: '☷',
  },
]

/* =========================================================
   CAMPOS DE COLOR
   ========================================================= */

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

/* =========================================================
   PALETA PREDETERMINADA
   ========================================================= */

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
  danger: '#D95C5C',
  warning: '#D89432',
}

/* =========================================================
   UTILIDADES
   ========================================================= */

/*
 * El estado configuracion es reactivo.
 * Firestore NO debe recibir objetos Proxy de Vue.
 *
 * Esta función realiza una copia profunda y,
 * especialmente, conserva Uint8Array como bytes nativos.
 */
function copiarConfiguracion(objeto) {
  if (
    objeto === null ||
    objeto === undefined
  ) {
    return objeto
  }

  /*
   * Sacar cualquier Proxy de Vue antes de trabajar
   * con el objeto binario.
   */
  let valorRaw = objeto

  try {
    valorRaw =
      toRaw(objeto)
  } catch {
    valorRaw =
      objeto
  }

  /*
   * Firestore acepta bytes nativos.
   *
   * IMPORTANTE:
   * Nunca devolver un Uint8Array reactivo.
   */
  if (
    valorRaw instanceof Uint8Array
  ) {
    return new Uint8Array(
      valorRaw,
    )
  }

  if (
    valorRaw instanceof ArrayBuffer
  ) {
    return valorRaw.slice(0)
  }

  if (
    ArrayBuffer.isView(
      valorRaw,
    )
  ) {
    return new Uint8Array(
      valorRaw.buffer.slice(
        valorRaw.byteOffset,
        valorRaw.byteOffset +
          valorRaw.byteLength,
      ),
    )
  }

  if (
    Array.isArray(
      valorRaw,
    )
  ) {
    return valorRaw.map(
      (valor) =>
        copiarConfiguracion(
          valor,
        ),
    )
  }

  if (
    typeof valorRaw ===
      'object'
  ) {
    const copia = {}

    Object.entries(
      valorRaw,
    ).forEach(
      ([clave, valor]) => {
        copia[clave] =
          copiarConfiguracion(
            valor,
          )
      },
    )

    return copia
  }

  return valorRaw
}

function limpiarObjeto(
  objeto,
) {
  Object.keys(
    objeto,
  ).forEach(
    (clave) => {
      delete objeto[clave]
    },
  )
}

/* =========================================================
   VALIDACIÓN DE COLORES
   ========================================================= */

function esHexValido(
  valor,
) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(
    String(
      valor || '',
    ).trim(),
  )
}

function normalizarHex(
  valor,
) {
  const limpio =
    String(
      valor || '',
    ).trim()

  if (
    !esHexValido(
      limpio,
    )
  ) {
    return ''
  }

  if (
    limpio.length ===
    4
  ) {
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

/* =========================================================
   OBTENER COLOR
   ========================================================= */

function valorColor(
  campo,
) {
  const valor =
    configuracion[
      campo
    ]

  if (
    esHexValido(
      valor,
    )
  ) {
    return normalizarHex(
      valor,
    )
  }

  return (
    coloresPredeterminados[
      campo
    ] ||
    '#FFFFFF'
  )
}

/* =========================================================
   RGB
   ========================================================= */

function hexToRgb(
  hex,
) {
  const color =
    normalizarHex(
      hex,
    )

  if (
    !color
  ) {
    return null
  }

  const valor =
    color.substring(
      1,
    )

  return {
    r: parseInt(
      valor.substring(
        0,
        2,
      ),
      16,
    ),

    g: parseInt(
      valor.substring(
        2,
        4,
      ),
      16,
    ),

    b: parseInt(
      valor.substring(
        4,
        6,
      ),
      16,
    ),
  }
}

/* =========================================================
   LUMINANCIA
   ========================================================= */

function obtenerLuminancia(
  color,
) {
  const rgb =
    hexToRgb(
      color,
    )

  if (!rgb) {
    return 0
  }

  const canales = [
    rgb.r,
    rgb.g,
    rgb.b,
  ].map(
    (canal) => {
      const valor =
        canal / 255

      return valor <=
        0.03928
        ? valor /
          12.92
        : Math.pow(
            (
              valor +
              0.055
            ) /
              1.055,
            2.4,
          )
    },
  )

  return (
    0.2126 *
      canales[0] +
    0.7152 *
      canales[1] +
    0.0722 *
      canales[2]
  )
}

/* =========================================================
   TEXTO CONTRASTANTE
   ========================================================= */

function obtenerTextoContraste(
  color,
) {
  const luminancia =
    obtenerLuminancia(
      color,
    )

  return luminancia >
    0.179
    ? '#172033'
    : '#FFFFFF'
}

/* =========================================================
   CONTRASTE WCAG
   ========================================================= */

function contrasteEntre(
  colorA,
  colorB,
) {
  const luminanciaA =
    obtenerLuminancia(
      colorA,
    )

  const luminanciaB =
    obtenerLuminancia(
      colorB,
    )

  const mayor =
    Math.max(
      luminanciaA,
      luminanciaB,
    )

  const menor =
    Math.min(
      luminanciaA,
      luminanciaB,
    )

  return Number(
    (
      (
        mayor +
        0.05
      ) /
      (
        menor +
        0.05
      )
    ).toFixed(2),
  )
}

/* =========================================================
   NIVEL DE CONTRASTE
   ========================================================= */

function obtenerNivelContraste(
  colorFondo,
  colorTexto,
) {
  const ratio =
    contrasteEntre(
      colorFondo,
      colorTexto,
    )

  if (
    ratio >= 7
  ) {
    return 'AAA'
  }

  if (
    ratio >= 4.5
  ) {
    return 'AA'
  }

  if (
    ratio >= 3
  ) {
    return 'AA grande'
  }

  return 'Bajo'
}

/* =========================================================
   DEGRADADO
   ========================================================= */

function obtenerDegradado(
  campo,
) {
  const base =
    valorColor(
      campo,
    )

  const desde =
    valorColor(
      `${campo}Dark`,
    )

  const hasta =
    valorColor(
      `${campo}Light`,
    )

  return `linear-gradient(
    90deg,
    ${desde} 0%,
    ${base} 50%,
    ${hasta} 100%
  )`
}

/* =========================================================
   INFORMACIÓN DE FAMILIA
   ========================================================= */

function obtenerFamiliaColor(
  campo,
) {
  const base =
    valorColor(
      campo,
    )

  const desde =
    valorColor(
      `${campo}Dark`,
    )

  const hasta =
    valorColor(
      `${campo}Light`,
    )

  const textoBase =
    valorColor(
      `${campo}Text`,
    )

  const texto =
    textoBase ||
    obtenerTextoContraste(
      base,
    )

  return {
    base,
    desde,
    hasta,
    texto,

    contraste:
      contrasteEntre(
        base,
        texto,
      ),

    nivel:
      obtenerNivelContraste(
        base,
        texto,
      ),

    degradado:
      obtenerDegradado(
        campo,
      ),
  }
}

/* =========================================================
   APLICAR VARIABLES GLOBALES
   ========================================================= */

function aplicarVariablesGlobales() {
  if (
    typeof document ===
    'undefined'
  ) {
    return
  }

  const root =
    document.documentElement

  const variables = {
    '--color-primary':
      valorColor(
        'primary',
      ),

    '--color-primary-light':
      valorColor(
        'primaryLight',
      ),

    '--color-primary-dark':
      valorColor(
        'primaryDark',
      ),

    '--color-primary-text':
      valorColor(
        'primaryText',
      ),

    '--color-secondary':
      valorColor(
        'secondary',
      ),

    '--color-secondary-light':
      valorColor(
        'secondaryLight',
      ),

    '--color-secondary-dark':
      valorColor(
        'secondaryDark',
      ),

    '--color-secondary-text':
      valorColor(
        'secondaryText',
      ),

    '--color-accent':
      valorColor(
        'accent',
      ),

    '--color-accent-light':
      valorColor(
        'accentLight',
      ),

    '--color-accent-dark':
      valorColor(
        'accentDark',
      ),

    '--color-accent-text':
      valorColor(
        'accentText',
      ),

    '--color-background':
      valorColor(
        'background',
      ),

    '--color-background-alt':
      valorColor(
        'backgroundAlt',
      ),

    '--color-surface':
      valorColor(
        'surface',
      ),

    '--color-surface-alt':
      valorColor(
        'surfaceAlt',
      ),

    '--color-text':
      valorColor(
        'text',
      ),

    '--color-text-secondary':
      valorColor(
        'textSecondary',
      ),

    '--color-text-muted':
      valorColor(
        'textMuted',
      ),

    '--color-border':
      valorColor(
        'border',
      ),

    '--color-success':
      valorColor(
        'success',
      ),

    '--color-danger':
      valorColor(
        'danger',
      ),

    '--color-warning':
      valorColor(
        'warning',
      ),

    '--color-success-text':
      obtenerTextoContraste(
        valorColor(
          'success',
        ),
      ),

    '--color-danger-text':
      obtenerTextoContraste(
        valorColor(
          'danger',
        ),
      ),

    '--color-warning-text':
      obtenerTextoContraste(
        valorColor(
          'warning',
        ),
      ),

    '--color-white':
      '#FFFFFF',
  }

  Object.entries(
    variables,
  ).forEach(
    ([
      variable,
      valor,
    ]) => {
      if (!valor) {
        return
      }

      root.style.setProperty(
        variable,
        valor,
      )
    },
  )
}

/* =========================================================
   APLICAR CONFIGURACIÓN RECIBIDA DE FIREBASE
   ========================================================= */

function aplicarConfiguracion(
  datos = {},
) {
  limpiarObjeto(
    configuracion,
  )

  limpiarObjeto(
    configuracionOriginal,
  )

  const copia =
    copiarConfiguracion(
      datos,
    )

  Object.assign(
    configuracion,
    copia,
  )

  Object.assign(
    configuracionOriginal,
    copiarConfiguracion(
      copia,
    ),
  )

  aplicarVariablesGlobales()
}

/* =========================================================
   CAMBIO DE PANEL
   ========================================================= */

function cambiarPanel(
  panel,
) {
  panelActivo.value =
    panel

  error.value = ''

  mensaje.value = ''
}

/* =========================================================
   ACTUALIZACIÓN GENERAL
   ========================================================= */

function actualizarConfiguracionLocal(
  datos = {},
) {
  Object.entries(
    datos,
  ).forEach(
    ([
      clave,
      valor,
    ]) => {
      if (
        valor ===
          undefined ||
        valor === null
      ) {
        return
      }

      /*
       * Si el dato es binario,
       * lo conservamos como una copia
       * nativa para el estado local.
       */
      if (
        valor instanceof Uint8Array
      ) {
        const bytes =
          toRaw(
            valor,
          )

        configuracion[
          clave
        ] =
          new Uint8Array(
            bytes,
          )

        return
      }

      configuracion[
        clave
      ] =
        valor
    },
  )

  aplicarVariablesGlobales()
}

/* =========================================================
   ACTUALIZAR COLOR INDIVIDUAL
   ========================================================= */

function actualizarColor({
  campo,
  valor,
}) {
  if (
    !camposColor.includes(
      campo,
    )
  ) {
    return
  }

  const color =
    normalizarHex(
      valor,
    )

  if (!color) {
    return
  }

  configuracion[
    campo
  ] =
    color

  aplicarVariablesGlobales()
}

/* =========================================================
   ACTUALIZAR LOGO
   ========================================================= */

async function actualizarLogo(
  datos = {},
) {
  if (
    guardando.value
  ) {
    return
  }

  try {
    guardando.value =
      true

    error.value = ''

    mensaje.value = ''

    /*
     * ======================================================
     * PREPARAR DATOS SIN PASAR EL BLOB POR EL REACTIVO
     * ======================================================
     */

    const datosLogo = {}

    Object.entries(
      datos,
    ).forEach(
      ([
        clave,
        valor,
      ]) => {
        if (
          valor ===
            undefined ||
          valor === null
        ) {
          return
        }

        if (
          valor instanceof Uint8Array
        ) {
          /*
           * toRaw elimina el Proxy de Vue.
           */
          const bytes =
            toRaw(
              valor,
            )

          datosLogo[
            clave
          ] =
            new Uint8Array(
              bytes,
            )

          return
        }

        if (
          valor instanceof ArrayBuffer
        ) {
          datosLogo[
            clave
          ] =
            new Uint8Array(
              valor,
            )

          return
        }

        datosLogo[
          clave
        ] =
          copiarConfiguracion(
            valor,
          )
      },
    )

    /*
     * ======================================================
     * GUARDAR DIRECTAMENTE EN FIRESTORE
     * ======================================================
     */

    await actualizarConfiguracion(
      'general',
      datosLogo,
    )

    /*
     * ======================================================
     * ACTUALIZAR ESTADO LOCAL
     * ======================================================
     */

    Object.entries(
      datosLogo,
    ).forEach(
      ([
        clave,
        valor,
      ]) => {
        if (
          valor instanceof Uint8Array
        ) {
          /*
           * El estado de Vue puede tener su propia copia.
           * Firestore ya recibió el objeto nativo anterior.
           */
          configuracion[
            clave
          ] =
            new Uint8Array(
              valor,
            )

          return
        }

        configuracion[
          clave
        ] =
          copiarConfiguracion(
            valor,
          )
      },
    )

    /*
     * ======================================================
     * ACTUALIZAR SNAPSHOT ORIGINAL
     * ======================================================
     */

    limpiarObjeto(
      configuracionOriginal,
    )

    Object.assign(
      configuracionOriginal,
      copiarConfiguracion(
        configuracion,
      ),
    )

    aplicarVariablesGlobales()

    mensaje.value =
      'Logo actualizado correctamente.'
  } catch (
    err
  ) {
    console.error(
      'Error al guardar el logo:',
      err,
    )

    error.value =
      err?.message ||
      'No fue posible actualizar el logo.'

    mensaje.value = ''
  } finally {
    guardando.value =
      false
  }
}

/* =========================================================
   ACTUALIZAR PALETA
   ========================================================= */

function actualizarPaleta(
  datos = {},
) {
  Object.entries(
    datos,
  ).forEach(
    ([
      clave,
      valor,
    ]) => {
      if (
        camposColor.includes(
          clave,
        ) &&
        esHexValido(
          valor,
        )
      ) {
        configuracion[
          clave
        ] =
          normalizarHex(
            valor,
          )
      }
    },
  )

  /*
   * La paleta completa se conserva internamente.
   */
  if (
    datos.paleta &&
    typeof datos.paleta ===
      'object'
  ) {
    configuracion.paleta =
      copiarConfiguracion(
        datos.paleta,
      )
  }

  aplicarVariablesGlobales()
}

/* =========================================================
   RESTAURAR CAMBIOS
   ========================================================= */

function restaurarCambios() {
  if (
    guardando.value
  ) {
    return
  }

  try {
    const restaurada =
      copiarConfiguracion(
        configuracionOriginal,
      )

    limpiarObjeto(
      configuracion,
    )

    Object.assign(
      configuracion,
      restaurada,
    )

    aplicarVariablesGlobales()

    mensaje.value =
      'Cambios descartados correctamente.'

    error.value = ''
  } catch (
    err
  ) {
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

/* =========================================================
   GUARDAR CONFIGURACIÓN
   ========================================================= */

async function guardarConfiguracion() {
  if (
    guardando.value
  ) {
    return
  }

  try {
    guardando.value =
      true

    error.value = ''

    mensaje.value = ''

    /*
     * Crear una copia sin Proxies de Vue.
     * Esto también conserva logoBlob como Uint8Array nativo.
     */
    const datos =
      copiarConfiguracion(
        configuracion,
      )

    delete datos.id

    /*
     * Conservamos paleta como estructura interna.
     */
    datos.paleta = {
      ...(
        datos.paleta &&
        typeof datos.paleta ===
          'object'
          ? datos.paleta
          : {}
      ),
    }

    await actualizarConfiguracion(
      'general',
      datos,
    )

    limpiarObjeto(
      configuracionOriginal,
    )

    Object.assign(
      configuracionOriginal,
      copiarConfiguracion(
        datos,
      ),
    )

    aplicarVariablesGlobales()

    mensaje.value =
      'Configuración actualizada correctamente.'
  } catch (
    err
  ) {
    console.error(
      'Error al guardar configuración:',
      err,
    )

    error.value =
      err?.message ||
      'No fue posible guardar la configuración.'
  } finally {
    guardando.value =
      false
  }
}

/* =========================================================
   SUSCRIPCIÓN FIREBASE
   ========================================================= */

function iniciarSuscripcion() {
  if (
    unsubscribeConfiguracion
  ) {
    unsubscribeConfiguracion()

    unsubscribeConfiguracion =
      null
  }

  cargando.value =
    true

  error.value = ''

  try {
    unsubscribeConfiguracion =
      suscribirConfiguracionAdmin(
        'general',

        (datos) => {
          cargando.value =
            false

          conectadaTiempoReal.value =
            true

          if (!datos) {
            limpiarObjeto(
              configuracion,
            )

            limpiarObjeto(
              configuracionOriginal,
            )

            Object.assign(
              configuracion,
              copiarConfiguracion(
                coloresPredeterminados,
              ),
            )

            aplicarVariablesGlobales()

            return
          }

          aplicarConfiguracion(
            datos,
          )
        },

        (err) => {
          cargando.value =
            false

          conectadaTiempoReal.value =
            false

          error.value =
            err?.message ||
            'No fue posible conectar con Firebase.'
        },
      )
  } catch (
    err
  ) {
    cargando.value =
      false

    conectadaTiempoReal.value =
      false

    error.value =
      err?.message ||
      'No fue posible iniciar la configuración.'
  }
}

/* =========================================================
   WATCHERS DE COLOR
   ========================================================= */

watch(
  () =>
    configuracion.primary,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.primaryLight,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.primaryDark,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.secondary,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.secondaryLight,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.secondaryDark,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.accent,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.accentLight,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.accentDark,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.success,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.warning,
  aplicarVariablesGlobales,
)

watch(
  () =>
    configuracion.danger,
  aplicarVariablesGlobales,
)

/* =========================================================
   CONFIGURACIÓN EXISTENTE
   ========================================================= */

const existeConfiguracion =
  computed(
    () =>
      Object.keys(
        configuracion,
      ).length > 0,
  )

/* =========================================================
   CICLO DE VIDA
   ========================================================= */

onMounted(() => {
  iniciarSuscripcion()
})

onUnmounted(() => {
  if (
    unsubscribeConfiguracion
  ) {
    unsubscribeConfiguracion()

    unsubscribeConfiguracion =
      null
  }
})
</script>

<template>
  <section
    class="admin-configuracion"
  >

    <!-- ===================================================
         ENCABEZADO
         =================================================== -->

    <header
      class="admin-configuracion__header"
    >

      <div>

        <span
          class="admin-configuracion__eyebrow"
        >
          SISTEMA
        </span>

        <h1>
          Configuración
        </h1>

        <p>
          Administra la identidad visual y los datos generales
          de tu empresa.
        </p>

      </div>

      <div
        class="admin-configuracion__realtime"
      >

        <span
          class="admin-configuracion__realtime-dot"
          :class="{
            'is-online':
              conectadaTiempoReal,
          }"
        ></span>

        <span>
          {{
            conectadaTiempoReal
              ? 'Sincronización en tiempo real'
              : 'Conectando...'
          }}
        </span>

      </div>

    </header>

    <!-- ===================================================
         ESTADO DE CARGA
         =================================================== -->

    <div
      v-if="cargando"
      class="admin-configuracion__state"
    >

      <div
        class="admin-configuracion__spinner"
      >

        <strong>
          Cargando configuración
        </strong>

        <span>
          Conectando con Firebase...
        </span>

      </div>

    </div>

    <!-- ===================================================
         ERROR
         =================================================== -->

    <div
      v-else-if="error"
      class="admin-configuracion__alert admin-configuracion__alert--error"
    >

      <div>

        <strong>
          No fue posible cargar la configuración
        </strong>

        <p>
          {{ error }}
        </p>

      </div>

      <button
        type="button"
        class="admin-configuracion__alert-action"
        @click="
          iniciarSuscripcion
        "
      >
        Reintentar
      </button>

    </div>

    <template
      v-else
    >

      <!-- =================================================
           NAVEGACIÓN
           ================================================= -->

      <nav
        class="admin-configuracion__tabs"
      >

        <button
          v-for="
            panel in paneles
          "
          :key="
            panel.id
          "
          type="button"
          class="admin-configuracion__tab"
          :class="{
            'is-active':
              panelActivo ===
              panel.id,
          }"
          @click="
            cambiarPanel(
              panel.id,
            )
          "
        >

          <span
            class="admin-configuracion__tab-icon"
          >
            {{ panel.icono }}
          </span>

          <span
            class="admin-configuracion__tab-content"
          >

            <strong>
              {{ panel.titulo }}
            </strong>

            <small>
              {{ panel.descripcion }}
            </small>

          </span>

        </button>

      </nav>

      <!-- =================================================
           MENSAJE
           ================================================= -->

      <div
        v-if="mensaje"
        class="admin-configuracion__alert admin-configuracion__alert--success"
      >
        {{ mensaje }}
      </div>

      <!-- =================================================
           CONTENIDO
           ================================================= -->

      <main
        v-if="existeConfiguracion"
        class="admin-configuracion__workspace"
      >

        <!-- ===============================================
             IDENTIDAD
             =============================================== -->

        <ConfiguracionIdentidad
          v-if="
            panelActivo ===
            'identidad'
          "
          :configuracion="
            configuracion
          "
          :guardando="
            guardando
          "
          @actualizar-logo="
            actualizarLogo
          "
          @actualizar="
            actualizarConfiguracionLocal
          "
        />

        <!-- ===============================================
             APARIENCIA
             =============================================== -->

        <ConfiguracionApariencia
          v-else-if="
            panelActivo ===
            'apariencia'
          "
          :configuracion="
            configuracion
          "
          :colores-predeterminados="
            coloresPredeterminados
          "
          :obtener-texto-contraste="
            obtenerTextoContraste
          "
          :contraste-entre="
            contrasteEntre
          "
          :obtener-nivel-contraste="
            obtenerNivelContraste
          "
          :obtener-degradado="
            obtenerDegradado
          "
          :obtener-familia-color="
            obtenerFamiliaColor
          "
          @actualizar-color="
            actualizarColor
          "
          @actualizar-paleta="
            actualizarPaleta
          "
        />

        <!-- ===============================================
             DATOS GENERALES
             =============================================== -->

        <ConfiguracionDatos
          v-else-if="
            panelActivo ===
            'datos'
          "
          :configuracion="
            configuracion
          "
          :campos-color="
            camposColor
          "
          @actualizar="
            actualizarConfiguracionLocal
          "
        />

      </main>

      <!-- =================================================
           ACCIONES
           ================================================= -->

      <footer
        class="admin-configuracion__actions"
      >

        <button
          type="button"
          class="admin-configuracion__button admin-configuracion__button--secondary"
          :disabled="
            guardando
          "
          @click="
            restaurarCambios
          "
        >
          Descartar cambios
        </button>

        <button
          type="button"
          class="admin-configuracion__button admin-configuracion__button--primary"
          :disabled="
            guardando
          "
          @click="
            guardarConfiguracion
          "
        >

          <span
            v-if="
              guardando
            "
          >
            Guardando...
          </span>

          <span
            v-else
          >
            Guardar configuración
          </span>

        </button>

      </footer>

    </template>

  </section>
</template>
