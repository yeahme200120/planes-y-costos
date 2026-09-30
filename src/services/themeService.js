import {
  generarTextosDegradados,
  obtenerOverridesDegradados,
  aplicarOverridesDegradados,
  hexToRgb,
} from './colorPalette'

import { suscribirConfiguracionAdmin } from './adminService'
/* =========================================================
   APLICAR TEXTO DE DEGRADADOS
   ========================================================= */

function aplicarTextosDegradados(configuracion) {
  if (typeof document === 'undefined') return

  const degradados = configuracion?.degradados
  if (!degradados || typeof degradados !== 'object') return

  /*
   * 1. Calcular automáticamente según el degradado
   */
  let variables = generarTextosDegradados(degradados)

  /*
   * 2. Sincronizar con los textos de marca que ya existen.
   *
   * Si Firestore tiene primaryText, secondaryText o accentText,
   * esos valores son los que el usuario guardó y deben ser la
   * fuente de verdad para el texto de los degradados relacionados.
   *
   * Esto garantiza que --gradient-primary-text === --color-primary-text
   * cuando NO hay override manual.
   */
  const textosDeMarca = [
    { clave: 'primary', campo: 'primaryText' },
    { clave: 'secondary', campo: 'secondaryText' },
    { clave: 'accent', campo: 'accentText' },
  ]

  textosDeMarca.forEach(({ clave, campo }) => {
    const valorGuardado = configuracion?.[campo]

    if (
      typeof valorGuardado === 'string' &&
      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(valorGuardado.trim())
    ) {
      const color = valorGuardado.trim().toUpperCase()
      const rgb = hexToRgb(color)

      if (!rgb) return

      variables[`--gradient-${clave}-text`] = color

      const opacidades = [76, 68, 58, 56, 50, 46, 38, 12, 10, 9, 6, 5, 4]

      opacidades.forEach((op) => {
        const alpha = (op / 100).toFixed(2)
        variables[`--gradient-${clave}-text-${op}`] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
      })
    }
  })

  /*
   * 3. Aplicar overrides manuales si existen.
   *
   * Los overrides SIEMPRE ganan (son decisión explícita del usuario).
   */
  const overrides = obtenerOverridesDegradados(configuracion)

  variables = aplicarOverridesDegradados(variables, overrides, degradados)

  /*
   * 4. Inyectar en el DOM
   */
  Object.entries(variables).forEach(([nombre, valor]) => {
    if (!valor) return
    document.documentElement.style.setProperty(nombre, valor)
  })
}

const MAPA_VARIABLES = {
  primary: '--color-primary',
  primaryLight: '--color-primary-light',
  primaryDark: '--color-primary-dark',
  primaryText: '--color-primary-text',

  secondary: '--color-secondary',
  secondaryLight: '--color-secondary-light',
  secondaryDark: '--color-secondary-dark',
  secondaryText: '--color-secondary-text',

  accent: '--color-accent',
  accentLight: '--color-accent-light',
  accentDark: '--color-accent-dark',
  accentText: '--color-accent-text',

  background: '--color-background',
  backgroundAlt: '--color-background-alt',
  surface: '--color-surface',
  surfaceAlt: '--color-surface-alt',

  text: '--color-text',
  textSecondary: '--color-text-secondary',
  textMuted: '--color-text-muted',

  border: '--color-border',

  success: '--color-success',
  danger: '--color-danger',
  warning: '--color-warning',
}

/* =========================================================
   VARIABLES DERIVADAS
   ========================================================= */

const MAPA_DERIVADAS = {
  successLight: '--color-success-light',
  dangerLight: '--color-danger-light',
  warningLight: '--color-warning-light',
  borderLight: '--color-border-light',
}

/* =========================================================
   VALORES POR DEFECTO
   ========================================================= */

const COLORES_POR_DEFECTO = {
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

  successLight: '#E5F5EF',
  dangerLight: '#FBE9E9',
  warningLight: '#FFF4DF',
  borderLight: '#F1F5F9',
}

/* =========================================================
   VALIDACIÓN DE COLORES
   ========================================================= */

/**
 * Comprueba si un valor es un color hexadecimal válido.
 *
 * Soporta:
 * #RGB
 * #RRGGBB
 * #RRGGBBAA
 */
function esColorHex(valor) {
  return (
    typeof valor === 'string' &&
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(valor.trim())
  )
}

/**
 * Devuelve un color hexadecimal normalizado.
 */
function normalizarColor(valor, valorDefecto = null) {
  if (esColorHex(valor)) {
    return valor.trim()
  }

  return valorDefecto
}

/* =========================================================
   OBTENER VALOR DE CONFIGURACIÓN
   ========================================================= */

/**
 * Busca primero directamente en configuracion
 * y después dentro de configuracion.paleta.
 */
function obtenerValor(configuracion, clave) {
  if (!configuracion) {
    return null
  }

  const valorPrincipal = normalizarColor(configuracion[clave])

  if (valorPrincipal) {
    return valorPrincipal
  }

  const paleta = configuracion.paleta

  if (paleta && typeof paleta === 'object') {
    const valorPaleta = normalizarColor(paleta[clave])

    if (valorPaleta) {
      return valorPaleta
    }
  }

  return null
}

/**
 * Obtiene el color configurado.
 * Si no existe, utiliza el valor
 * centralizado por defecto.
 */
function obtenerColor(configuracion, clave) {
  return obtenerValor(configuracion, clave) || COLORES_POR_DEFECTO[clave] || null
}

/* =========================================================
   APLICAR VARIABLE CSS
   ========================================================= */

function aplicarVariable(variable, valor) {
  if (!variable || !esColorHex(valor)) {
    return
  }

  document.documentElement.style.setProperty(variable, valor.trim())
}

/* =========================================================
   APLICAR VARIABLES DE COLOR
   ========================================================= */

function aplicarVariablesPrincipales(configuracion) {
  Object.entries(MAPA_VARIABLES).forEach(([clave, variable]) => {
    const valor = obtenerColor(configuracion, clave)

    if (valor) {
      aplicarVariable(variable, valor)
    }
  })
}

function aplicarVariablesDerivadas(configuracion) {
  Object.entries(MAPA_DERIVADAS).forEach(([clave, variable]) => {
    const valor = obtenerColor(configuracion, clave)

    if (valor) {
      aplicarVariable(variable, valor)
    }
  })
}

/* =========================================================
   FAVICON
   ========================================================= */

function obtenerFaviconUrl(configuracion) {
  if (!configuracion) {
    return ''
  }

  const logo = configuracion.logo || {}

  return (
    logo.faviconUrl ||
    configuracion.faviconUrl ||
    logo.iconUrl ||
    logo.pngUrl ||
    configuracion.logoUrl ||
    '/img/logo.jpg'
  )
}

function aplicarFavicon(configuracion) {
  const faviconUrl = obtenerFaviconUrl(configuracion)

  if (!faviconUrl) {
    return
  }

  let favicon = document.querySelector('link[rel="icon"]')

  if (!favicon) {
    favicon = document.createElement('link')

    favicon.rel = 'icon'

    document.head.appendChild(favicon)
  }

  favicon.href = faviconUrl

  /*
   * PNG es válido para favicon.
   * No asumimos que la URL sea un ICO.
   */
  const esPng = /\.png(?:\?|$)/i.test(faviconUrl)

  if (esPng) {
    favicon.type = 'image/png'
  }
}

/* =========================================================
   TEMA GLOBAL
   ========================================================= */

/**
 * Aplica toda la identidad visual
 * almacenada en configuracion/general.
 */
export function aplicarTema(configuracion) {
  if (!configuracion) {
    return
  }

  /* -------------------------------------------------------
     COLORES PRINCIPALES
     ------------------------------------------------------- */

  aplicarVariablesPrincipales(configuracion)

  /* -------------------------------------------------------
     COLORES DERIVADOS
     ------------------------------------------------------- */

  aplicarVariablesDerivadas(configuracion)
  aplicarTextosDegradados(configuracion)
  /* -------------------------------------------------------
     COLOR BLANCO
     ------------------------------------------------------- */

  const primaryText = obtenerColor(configuracion, 'primaryText')

  aplicarVariable('--color-white', primaryText || '#FFFFFF')

  /* -------------------------------------------------------
     FAVICON
     ------------------------------------------------------- */

  aplicarFavicon(configuracion)
}

/* =========================================================
   BRANDING / LOGO
   ========================================================= */

/**
 * Devuelve la configuración normalizada
 * del logo.
 *
 * La estructura soporta tanto:
 *
 * configuracion.logo.*
 *
 * como:
 *
 * configuracion.logoUrl
 */
export function obtenerLogoConfiguracion(configuracion) {
  const logo = configuracion?.logo || {}

  const logoUrl =
    configuracion?.logoUrl || logo?.pngUrl || logo?.iconUrl || logo?.faviconUrl || '/img/logo.jpg'

  const pngUrl = logo?.pngUrl || logoUrl

  return {
    activo: logo?.activo ?? true,

    originalUrl: logo?.originalUrl || logoUrl,

    pngUrl,

    svgUrl: logo?.svgUrl || '',

    png2xUrl: logo?.png2xUrl || '',

    png3xUrl: logo?.png3xUrl || '',

    lightUrl: logo?.lightUrl || pngUrl,

    darkUrl: logo?.darkUrl || pngUrl,

    iconUrl: logo?.iconUrl || pngUrl,

    faviconUrl: logo?.faviconUrl || configuracion?.faviconUrl || logo?.iconUrl || pngUrl,

    appleTouchIconUrl: logo?.appleTouchIconUrl || '',

    icon192Url: logo?.icon192Url || '',

    icon512Url: logo?.icon512Url || '',

    manifestIconUrl: logo?.manifestIconUrl || '',

    ancho: Number(logo?.ancho || 0),

    alto: Number(logo?.alto || 0),

    formatoOriginal: logo?.formatoOriginal || '',

    vectorizado: logo?.vectorizado ?? false,

    fondoTransparente: logo?.fondoTransparente ?? false,

    actualizadoEn: logo?.actualizadoEn || null,

    /*
     * Información generada por
     * el editor nativo de logo.
     */
    editor: logo?.editor || configuracion?.logoEditor || null,

    storagePath: logo?.storagePath || configuracion?.logoStoragePath || '',
  }
}

/* =========================================================
   SUSCRIPCIÓN GLOBAL AL TEMA
   =========================================================
   Mantiene el tema sincronizado en tiempo real con
   configuracion/general.

   También aplica favicon, título y emite el evento
   configuracion-global-actualizada para que AdminLayout
   y otros componentes lo consuman.

   Retorna la función unsubscribe de Firestore.
   ========================================================= */

export function suscribirTemaGlobal(onError) {
  return suscribirConfiguracionAdmin(
    'general',

    (configuracion) => {
      if (!configuracion) {
        return
      }

      // 1. Aplicar variables CSS en :root
      aplicarTema(configuracion)

      // 2. Favicon dinámico
      _aplicarFaviconGlobal(configuracion)

      // 3. Título del documento
      _aplicarTituloGlobal(configuracion)

      // 4. Notificar a componentes (AdminLayout, etc.)
      _emitirConfiguracionGlobal(configuracion)
    },

    (error) => {
      console.error('Error al sincronizar el tema global:', error)

      if (typeof onError === 'function') {
        onError(error)
      }
    },
  )
}

/* =========================================================
   HELPERS INTERNOS DE suscribirTemaGlobal
   ========================================================= */

function _aplicarFaviconGlobal(configuracion) {
  if (typeof document === 'undefined') return

  const faviconUrl =
    configuracion.faviconUrl ||
    configuracion.logoIcoUrl ||
    configuracion.logoPngUrl ||
    configuracion.logoUrl ||
    ''

  if (!faviconUrl) return

  const version = configuracion.logoVersion || Date.now()
  const separador = faviconUrl.includes('?') ? '&' : '?'
  const urlFinal = `${faviconUrl}${separador}v=${version}`

  let favicon = document.querySelector('link[rel="icon"]')

  if (!favicon) {
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    document.head.appendChild(favicon)
  }

  favicon.href = urlFinal
}

function _aplicarTituloGlobal(configuracion) {
  if (typeof document === 'undefined') return

  const nombre = String(
    configuracion.nombreEmpresa || ''
  ).trim()

  if (nombre) {
    document.title = nombre
  }
}

function _emitirConfiguracionGlobal(configuracion) {
  if (typeof window === 'undefined') return

  try {
    window.dispatchEvent(
      new CustomEvent('configuracion-global-actualizada', {
        detail: configuracion,
      }),
    )
  } catch {
    // noop
  }
}
