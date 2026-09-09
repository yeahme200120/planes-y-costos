import { suscribirConfiguracionAdmin } from './adminService'

/* =========================================================
   MAPA DE VARIABLES DE COLOR
   ========================================================= */

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
   VALIDACIÓN DE COLORES
   ========================================================= */

function esColorHex(valor) {
  return (
    typeof valor === 'string' &&
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(
      valor.trim(),
    )
  )
}

/* =========================================================
   OBTENER VALOR DE CONFIGURACIÓN
   ========================================================= */

function obtenerValor(configuracion, clave) {
  if (!configuracion) {
    return null
  }

  const valorPrincipal =
    configuracion[clave]

  if (esColorHex(valorPrincipal)) {
    return valorPrincipal.trim()
  }

  const paleta =
    configuracion.paleta

  if (
    paleta &&
    esColorHex(paleta[clave])
  ) {
    return paleta[clave].trim()
  }

  return null
}

/* =========================================================
   APLICAR VARIABLE CSS
   ========================================================= */

function aplicarVariable(variable, valor) {
  if (
    !variable ||
    !esColorHex(valor)
  ) {
    return
  }

  document.documentElement.style.setProperty(
    variable,
    valor.trim(),
  )
}

/* =========================================================
   FAVICON
   ========================================================= */

function aplicarFavicon(configuracion) {
  if (!configuracion) {
    return
  }

  const faviconUrl =
    configuracion?.logo?.faviconUrl ||
    configuracion?.faviconUrl ||
    configuracion?.logo?.iconUrl ||
    configuracion?.logo?.pngUrl ||
    configuracion?.logoUrl ||
    '/img/logo.jpg'

  if (!faviconUrl) {
    return
  }

  let favicon =
    document.querySelector(
      'link[rel="icon"]',
    )

  if (!favicon) {
    favicon =
      document.createElement('link')

    favicon.rel = 'icon'

    document.head.appendChild(
      favicon,
    )
  }

  favicon.href = faviconUrl
}

/* =========================================================
   APLICAR TEMA GLOBAL
   ========================================================= */

export function aplicarTema(
  configuracion,
) {
  if (!configuracion) {
    return
  }

  /* -------------------------------------------------------
     COLORES PRINCIPALES
     ------------------------------------------------------- */

  Object.entries(
    MAPA_VARIABLES,
  ).forEach(
    ([clave, variable]) => {
      const valor =
        obtenerValor(
          configuracion,
          clave,
        )

      if (valor) {
        aplicarVariable(
          variable,
          valor,
        )
      }
    },
  )

  /* -------------------------------------------------------
     COLORES DERIVADOS
     ------------------------------------------------------- */

  Object.entries(
    MAPA_DERIVADAS,
  ).forEach(
    ([clave, variable]) => {
      const valor =
        obtenerValor(
          configuracion,
          clave,
        )

      if (valor) {
        aplicarVariable(
          variable,
          valor,
        )
      }
    },
  )

  /* -------------------------------------------------------
     COLOR BLANCO
     ------------------------------------------------------- */

  const primaryText =
    obtenerValor(
      configuracion,
      'primaryText',
    )

  if (primaryText) {
    aplicarVariable(
      '--color-white',
      primaryText,
    )
  }

  /* -------------------------------------------------------
     FAVICON
     ------------------------------------------------------- */

  aplicarFavicon(
    configuracion,
  )
}

/* =========================================================
   BRANDING / LOGO
   ========================================================= */

export function obtenerLogoConfiguracion(
  configuracion,
) {
  const logo =
    configuracion?.logo || {}

  const logoUrl =
    configuracion?.logoUrl ||
    '/img/logo.jpg'

  const pngUrl =
    logo?.pngUrl ||
    logoUrl

  return {
    activo:
      logo?.activo ??
      true,

    originalUrl:
      logo?.originalUrl ||
      logoUrl,

    pngUrl,

    svgUrl:
      logo?.svgUrl ||
      '',

    png2xUrl:
      logo?.png2xUrl ||
      '',

    png3xUrl:
      logo?.png3xUrl ||
      '',

    lightUrl:
      logo?.lightUrl ||
      pngUrl,

    darkUrl:
      logo?.darkUrl ||
      pngUrl,

    iconUrl:
      logo?.iconUrl ||
      pngUrl,

    faviconUrl:
      logo?.faviconUrl ||
      configuracion?.faviconUrl ||
      logo?.iconUrl ||
      pngUrl,

    appleTouchIconUrl:
      logo?.appleTouchIconUrl ||
      '',

    icon192Url:
      logo?.icon192Url ||
      '',

    icon512Url:
      logo?.icon512Url ||
      '',

    manifestIconUrl:
      logo?.manifestIconUrl ||
      '',

    ancho:
      logo?.ancho ||
      0,

    alto:
      logo?.alto ||
      0,

    formatoOriginal:
      logo?.formatoOriginal ||
      '',

    vectorizado:
      logo?.vectorizado ??
      false,

    fondoTransparente:
      logo?.fondoTransparente ??
      false,

    actualizadoEn:
      logo?.actualizadoEn ||
      null,
  }
}

/* =========================================================
   SUSCRIPCIÓN GLOBAL AL TEMA
   ========================================================= */

export function suscribirTemaGlobal(
  onError,
) {
  return suscribirConfiguracionAdmin(
    'general',

    (configuracion) => {
      if (!configuracion) {
        return
      }

      aplicarTema(
        configuracion,
      )
    },

    (error) => {
      console.error(
        'Error al sincronizar el tema global:',
        error,
      )

      if (typeof onError === 'function') {
        onError(error)
      }
    },
  )
}