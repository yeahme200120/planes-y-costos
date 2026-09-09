const COLOR_BASE = '#4678EC'

export const PALETAS_PREDERMINADAS = {
  primary: '#4678EC',
  secondary: '#F28B82',
  accent: '#78C6A3',

  primaryLight: '#DCE7FF',
  primaryDark: '#2858C7',

  secondaryLight: '#FFE2DE',
  secondaryDark: '#C95C52',

  accentLight: '#DDF5EA',
  accentDark: '#42906D',

  background: '#F8FAFC',
  backgroundAlt: '#F1F5F9',

  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',

  text: '#172033',
  textSecondary: '#526078',
  textMuted: '#7B879C',

  border: '#E2E8F0',

  success: '#2E9B6F',
  warning: '#D89432',
  danger: '#D95C5C',
}

export function normalizarHex(valor) {
  if (
    typeof valor !== 'string' ||
    !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
      valor.trim()
    )
  ) {
    return COLOR_BASE
  }

  let hex = valor.trim().toUpperCase()

  if (hex.length === 4) {
    hex =
      '#' +
      hex
        .slice(1)
        .split('')
        .map((caracter) => caracter + caracter)
        .join('')
  }

  return hex
}

export function hexToRgb(hex) {
  const color = normalizarHex(hex)

  return {
    r: parseInt(color.slice(1, 3), 16),
    g: parseInt(color.slice(3, 5), 16),
    b: parseInt(color.slice(5, 7), 16),
  }
}

export function rgbToHex(r, g, b) {
  const limitar = (valor) =>
    Math.max(
      0,
      Math.min(
        255,
        Math.round(valor)
      )
    )

  return (
    '#' +
    [r, g, b]
      .map((valor) =>
        limitar(valor)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
      .toUpperCase()
  )
}

export function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  let h = 0
  let s = 0

  const l = (max + min) / 2

  if (max !== min) {
    const diferencia = max - min

    s =
      l > 0.5
        ? diferencia /
          (2 - max - min)
        : diferencia /
          (max + min)

    switch (max) {
      case r:
        h =
          (g - b) /
            diferencia +
          (g < b ? 6 : 0)
        break

      case g:
        h =
          (b - r) /
            diferencia +
          2
        break

      case b:
        h =
          (r - g) /
            diferencia +
          4
        break
    }

    h /= 6
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  }
}

export function hexToHsl(hex) {
  const { r, g, b } =
    hexToRgb(hex)

  return rgbToHsl(r, g, b)
}

export function hslToRgb(h, s, l) {
  h /= 360
  s /= 100
  l /= 100

  if (s === 0) {
    const valor = Math.round(l * 255)

    return {
      r: valor,
      g: valor,
      b: valor,
    }
  }

  const hue2rgb = (
    p,
    q,
    t
  ) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1

    if (t < 1 / 6) {
      return (
        p +
        (q - p) *
          6 *
          t
      )
    }

    if (t < 1 / 2) {
      return q
    }

    if (t < 2 / 3) {
      return (
        p +
        (q - p) *
          (2 / 3 - t) *
          6
      )
    }

    return p
  }

  const q =
    l < 0.5
      ? l * (1 + s)
      : l + s - l * s

  const p =
    2 * l - q

  return {
    r:
      hue2rgb(
        p,
        q,
        h + 1 / 3
      ) * 255,

    g:
      hue2rgb(
        p,
        q,
        h
      ) * 255,

    b:
      hue2rgb(
        p,
        q,
        h - 1 / 3
      ) * 255,
  }
}

export function hslToHex(
  h,
  s,
  l
) {
  const {
    r,
    g,
    b,
  } = hslToRgb(
    h,
    s,
    l
  )

  return rgbToHex(
    r,
    g,
    b
  )
}

export function ajustarTono(
  hex,
  grados
) {
  const hsl =
    hexToHsl(hex)

  let nuevoTono =
    hsl.h + grados

  while (
    nuevoTono < 0
  ) {
    nuevoTono += 360
  }

  while (
    nuevoTono >= 360
  ) {
    nuevoTono -= 360
  }

  return hslToHex(
    nuevoTono,
    hsl.s,
    hsl.l
  )
}

export function ajustarSaturacion(
  hex,
  saturacion
) {
  const hsl =
    hexToHsl(hex)

  return hslToHex(
    hsl.h,
    Math.max(
      0,
      Math.min(
        100,
        saturacion
      )
    ),
    hsl.l
  )
}

export function ajustarLuminosidad(
  hex,
  luminosidad
) {
  const hsl =
    hexToHsl(hex)

  return hslToHex(
    hsl.h,
    hsl.s,
    Math.max(
      0,
      Math.min(
        100,
        luminosidad
      )
    )
  )
}

export function mezclarColores(
  colorA,
  colorB,
  porcentaje = 50
) {
  const a =
    hexToRgb(colorA)

  const b =
    hexToRgb(colorB)

  const factor =
    porcentaje / 100

  return rgbToHex(
    a.r +
      (b.r - a.r) *
        factor,

    a.g +
      (b.g - a.g) *
        factor,

    a.b +
      (b.b - a.b) *
        factor
  )
}

function luminanciaRelativa(hex) {
  const {
    r,
    g,
    b,
  } = hexToRgb(hex)

  const convertir = (
    valor
  ) => {
    const canal =
      valor / 255

    return canal <= 0.03928
      ? canal / 12.92
      : Math.pow(
          (canal + 0.055) /
            1.055,
          2.4
        )
  }

  const R = convertir(r)
  const G = convertir(g)
  const B = convertir(b)

  return (
    0.2126 * R +
    0.7152 * G +
    0.0722 * B
  )
}

export function contrasteEntre(
  colorA,
  colorB
) {
  const luminanciaA =
    luminanciaRelativa(
      colorA
    )

  const luminanciaB =
    luminanciaRelativa(
      colorB
    )

  const claro =
    Math.max(
      luminanciaA,
      luminanciaB
    )

  const oscuro =
    Math.min(
      luminanciaA,
      luminanciaB
    )

  return (
    (claro + 0.05) /
    (oscuro + 0.05)
  )
}

export function obtenerTextoContraste(
  fondo
) {
  const contrasteBlanco =
    contrasteEntre(
      fondo,
      '#FFFFFF'
    )

  const contrasteNegro =
    contrasteEntre(
      fondo,
      '#111827'
    )

  return contrasteBlanco >=
    contrasteNegro
    ? '#FFFFFF'
    : '#111827'
}

function crearColorSuave(
  hex,
  luminosidad,
  saturacion = null
) {
  const hsl =
    hexToHsl(hex)

  return hslToHex(
    hsl.h,
    saturacion ??
      hsl.s,
    luminosidad
  )
}

function crearColorIntenso(
  hex,
  luminosidad
) {
  const hsl =
    hexToHsl(hex)

  return hslToHex(
    hsl.h,
    Math.max(
      hsl.s,
      55
    ),
    luminosidad
  )
}

/**
 * Genera una paleta triádica.
 *
 * El color seleccionado por el usuario
 * funciona como color principal.
 *
 * Los otros dos colores se obtienen
 * rotando el tono 120° y 240°.
 */
export function generarPaletaTriadica(
  colorBase,
  opciones = {}
) {
  const {
    suavidad = 35,
    contraste = 50,
  } = opciones

  const base =
    normalizarHex(
      colorBase
    )

  const hsl =
    hexToHsl(base)

  /*
   * Triada:
   *
   * Base
   * Base + 120°
   * Base + 240°
   */
  const primary =
    hslToHex(
      hsl.h,
      Math.max(
        35,
        Math.min(
          85,
          hsl.s
        )
      ),
      Math.max(
        35,
        Math.min(
          62,
          hsl.l
        )
      )
    )

  const secondary =
    hslToHex(
      (hsl.h + 120) % 360,
      Math.max(
        38,
        Math.min(
          78,
          hsl.s
        )
      ),
      Math.max(
        42,
        Math.min(
          65,
          hsl.l
        )
      )
    )

  const accent =
    hslToHex(
      (hsl.h + 240) % 360,
      Math.max(
        38,
        Math.min(
          78,
          hsl.s
        )
      ),
      Math.max(
        42,
        Math.min(
          65,
          hsl.l
        )
      )
    )

  /*
   * Suavidad:
   *
   * 0   = colores más intensos
   * 100 = colores más suaves
   */
  const factorSuavidad =
    Math.max(
      0,
      Math.min(
        100,
        suavidad
      )
    ) / 100

  const primaryLight =
    mezclarColores(
      primary,
      '#FFFFFF',
      70 +
        factorSuavidad *
          20
    )

  const secondaryLight =
    mezclarColores(
      secondary,
      '#FFFFFF',
      70 +
        factorSuavidad *
          20
    )

  const accentLight =
    mezclarColores(
      accent,
      '#FFFFFF',
      70 +
        factorSuavidad *
          20
    )

  const primaryDark =
    mezclarColores(
      primary,
      '#000000',
      25
    )

  const secondaryDark =
    mezclarColores(
      secondary,
      '#000000',
      25
    )

  const accentDark =
    mezclarColores(
      accent,
      '#000000',
      25
    )

  /*
   * Los fondos no utilizan directamente
   * los colores triádicos.
   *
   * Se crean superficies neutras para
   * evitar que toda la landing tenga
   * bloques saturados.
   */
  const background =
    mezclarColores(
      '#FFFFFF',
      primaryLight,
      22
    )

  const backgroundAlt =
    mezclarColores(
      '#FFFFFF',
      accentLight,
      30
    )

  const surface =
    '#FFFFFF'

  const surfaceAlt =
    mezclarColores(
      '#FFFFFF',
      secondaryLight,
      24
    )

  /*
   * El contraste controla cuánto se
   * separan los tonos de texto.
   */
  const factorContraste =
    Math.max(
      0,
      Math.min(
        100,
        contraste
      )
    ) / 100

  const text =
    mezclarColores(
      '#111827',
      primaryDark,
      35 +
        factorContraste *
          20
    )

  const textSecondary =
    mezclarColores(
      '#475569',
      primaryDark,
      20
    )

  const textMuted =
    '#7B879C'

  const border =
    mezclarColores(
      '#E2E8F0',
      primaryLight,
      35
    )

  return {
    primary,
    secondary,
    accent,

    primaryLight,
    primaryDark,

    secondaryLight,
    secondaryDark,

    accentLight,
    accentDark,

    background,
    backgroundAlt,

    surface,
    surfaceAlt,

    text,
    textSecondary,
    textMuted,

    border,

    success: '#2E9B6F',
    warning: '#D89432',
    danger: '#D95C5C',

    primaryText:
      obtenerTextoContraste(
        primary
      ),

    secondaryText:
      obtenerTextoContraste(
        secondary
      ),

    accentText:
      obtenerTextoContraste(
        accent
      ),
  }
}

export function generarPaleta(
  colorBase,
  opciones = {}
) {
  const armonia =
    opciones.armonia ??
    'triadica'

  if (
    armonia ===
    'monocromatica'
  ) {
    const base =
      normalizarHex(
        colorBase
      )

    const hsl =
      hexToHsl(base)

    const primary =
      hslToHex(
        hsl.h,
        hsl.s,
        Math.max(
          35,
          Math.min(
            62,
            hsl.l
          )
        )
      )

    const secondary =
      hslToHex(
        hsl.h,
        Math.max(
          25,
          hsl.s - 15
        ),
        55
      )

    const accent =
      hslToHex(
        hsl.h,
        Math.min(
          90,
          hsl.s + 5
        ),
        45
      )

    return generarPaletaTriadica(
      primary,
      opciones
    )
  }

  if (
    armonia ===
    'complementaria'
  ) {
    const base =
      normalizarHex(
        colorBase
      )

    const complemento =
      ajustarTono(
        base,
        180
      )

    const triadica =
      generarPaletaTriadica(
        base,
        opciones
      )

    return {
      ...triadica,
      secondary:
        complemento,
      secondaryLight:
        crearColorSuave(
          complemento,
          90
        ),
      secondaryDark:
        crearColorIntenso(
          complemento,
          38
        ),
    }
  }

  if (
    armonia ===
    'analogica'
  ) {
    const base =
      normalizarHex(
        colorBase
      )

    const secundario =
      ajustarTono(
        base,
        30
      )

    const acento =
      ajustarTono(
        base,
        -30
      )

    const triadica =
      generarPaletaTriadica(
        base,
        opciones
      )

    return {
      ...triadica,

      secondary:
        secundario,

      accent:
        acento,

      secondaryLight:
        crearColorSuave(
          secundario,
          90
        ),

      accentLight:
        crearColorSuave(
          acento,
          90
        ),
    }
  }

  return generarPaletaTriadica(
    colorBase,
    opciones
  )
}

export default generarPaleta