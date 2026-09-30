const COLOR_BASE = '#4678EC'

const COLOR_BLANCO = '#FFFFFF'
const COLOR_NEGRO = '#111827'

const CONTRASTE_TEXTO_NORMAL = 4.5
const CONTRASTE_TEXTO_GRANDE = 3

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

  primaryText: '#FFFFFF',
  secondaryText: '#FFFFFF',
  accentText: '#FFFFFF',
}

/* =========================================================
   UTILIDADES INTERNAS
   ========================================================= */

function limitar(valor, minimo, maximo) {
  const numero = Number(valor)

  if (!Number.isFinite(numero)) {
    return minimo
  }

  return Math.max(minimo, Math.min(maximo, numero))
}

function limitarPorcentaje(valor) {
  return limitar(valor, 0, 100)
}

function limitarTono(valor) {
  let tono = Number(valor)

  if (!Number.isFinite(tono)) {
    return 0
  }

  tono %= 360

  if (tono < 0) {
    tono += 360
  }

  return tono
}

/* =========================================================
   NORMALIZACIÓN HEX
   ========================================================= */

export function normalizarHex(valor) {
  if (typeof valor !== 'string') {
    return COLOR_BASE
  }

  let hex = valor.trim()

  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
    return COLOR_BASE
  }

  hex = hex.toUpperCase()

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

/* =========================================================
   HEX / RGB
   ========================================================= */

export function hexToRgb(hex) {
  const color = normalizarHex(hex)

  return {
    r: parseInt(color.slice(1, 3), 16),

    g: parseInt(color.slice(3, 5), 16),

    b: parseInt(color.slice(5, 7), 16),
  }
}

export function rgbToHex(r, g, b) {
  const limitarCanal = (valor) => Math.max(0, Math.min(255, Math.round(Number(valor) || 0)))

  return (
    '#' +
    [r, g, b]
      .map((valor) => limitarCanal(valor).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

/* =========================================================
   RGB / HSL
   ========================================================= */

export function rgbToHsl(r, g, b) {
  r = limitar(r, 0, 255) / 255
  g = limitar(g, 0, 255) / 255
  b = limitar(b, 0, 255) / 255

  const max = Math.max(r, g, b)

  const min = Math.min(r, g, b)

  let h = 0
  let s = 0

  const l = (max + min) / 2

  if (max !== min) {
    const diferencia = max - min

    s = l > 0.5 ? diferencia / (2 - max - min) : diferencia / (max + min)

    switch (max) {
      case r:
        h = (g - b) / diferencia + (g < b ? 6 : 0)
        break

      case g:
        h = (b - r) / diferencia + 2
        break

      case b:
        h = (r - g) / diferencia + 4
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
  const { r, g, b } = hexToRgb(hex)

  return rgbToHsl(r, g, b)
}

export function hslToRgb(h, s, l) {
  h = limitarTono(h) / 360

  s = limitarPorcentaje(s) / 100

  l = limitarPorcentaje(l) / 100

  if (s === 0) {
    const valor = Math.round(l * 255)

    return {
      r: valor,
      g: valor,
      b: valor,
    }
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) {
      t += 1
    }

    if (t > 1) {
      t -= 1
    }

    if (t < 1 / 6) {
      return p + (q - p) * 6 * t
    }

    if (t < 1 / 2) {
      return q
    }

    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6
    }

    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s

  const p = 2 * l - q

  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,

    g: hue2rgb(p, q, h) * 255,

    b: hue2rgb(p, q, h - 1 / 3) * 255,
  }
}

export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l)

  return rgbToHex(r, g, b)
}

/* =========================================================
   AJUSTES DE COLOR
   ========================================================= */

export function ajustarTono(hex, grados) {
  const hsl = hexToHsl(hex)

  const nuevoTono = limitarTono(hsl.h + Number(grados || 0))

  return hslToHex(nuevoTono, hsl.s, hsl.l)
}

export function ajustarSaturacion(hex, saturacion) {
  const hsl = hexToHsl(hex)

  return hslToHex(hsl.h, limitarPorcentaje(saturacion), hsl.l)
}

export function ajustarLuminosidad(hex, luminosidad) {
  const hsl = hexToHsl(hex)

  return hslToHex(hsl.h, hsl.s, limitarPorcentaje(luminosidad))
}

/* =========================================================
   MEZCLA DE COLORES
   ========================================================= */

export function mezclarColores(colorA, colorB, porcentaje = 50) {
  const a = hexToRgb(colorA)

  const b = hexToRgb(colorB)

  const factor = limitarPorcentaje(porcentaje) / 100

  return rgbToHex(
    a.r + (b.r - a.r) * factor,

    a.g + (b.g - a.g) * factor,

    a.b + (b.b - a.b) * factor,
  )
}

/* =========================================================
   CONTRASTE WCAG
   ========================================================= */

function luminanciaRelativa(hex) {
  const { r, g, b } = hexToRgb(hex)

  const convertir = (valor) => {
    const canal = valor / 255

    return canal <= 0.04045 ? canal / 12.92 : Math.pow((canal + 0.055) / 1.055, 2.4)
  }

  const R = convertir(r)

  const G = convertir(g)

  const B = convertir(b)

  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function contrasteEntre(colorA, colorB) {
  const luminanciaA = luminanciaRelativa(colorA)

  const luminanciaB = luminanciaRelativa(colorB)

  const claro = Math.max(luminanciaA, luminanciaB)

  const oscuro = Math.min(luminanciaA, luminanciaB)

  return (claro + 0.05) / (oscuro + 0.05)
}

/* =========================================================
   TEXTO CONTRASTADO
   ========================================================= */

/**
 * Devuelve un color neutro para texto.
 *
 * IMPORTANTE:
 * El texto NO se mezcla con el color de marca.
 * Se mantiene neutro para evitar que un primary azul,
 * verde, rojo, etc. contamine toda la tipografía.
 *
 * Se busca como mínimo WCAG AA 4.5:1 para texto normal.
 */
export function obtenerTextoContraste(fondo, opciones = {}) {
  const colorFondo = normalizarHex(fondo)

  const contrasteObjetivo = Number(opciones.contrasteObjetivo ?? CONTRASTE_TEXTO_NORMAL)

  const blanco = contrasteEntre(colorFondo, COLOR_BLANCO)

  const negro = contrasteEntre(colorFondo, COLOR_NEGRO)

  if (blanco >= contrasteObjetivo && blanco >= negro) {
    return COLOR_BLANCO
  }

  if (negro >= contrasteObjetivo) {
    return COLOR_NEGRO
  }

  /*
   * En colores intermedios buscamos
   * el mejor de blanco/negro.
   */
  return blanco >= negro ? COLOR_BLANCO : COLOR_NEGRO
}

/**
 * Obtiene un gris neutro que conserve buena
 * legibilidad sobre el fondo.
 */
function obtenerTextoNeutro(fondo, opciones = {}) {
  const contrasteObjetivo = Number(opciones.contrasteObjetivo ?? CONTRASTE_TEXTO_NORMAL)

  const colorFondo = normalizarHex(fondo)

  const textoPrincipal = obtenerTextoContraste(colorFondo, {
    contrasteObjetivo,
  })

  /*
   * Si el texto principal es blanco,
   * buscamos el gris más claro posible
   * que todavía tenga contraste.
   */
  const base = textoPrincipal === COLOR_BLANCO ? '#FFFFFF' : '#111827'

  const direccion = textoPrincipal === COLOR_BLANCO ? -1 : 1

  let mejor = base

  let mejorLuminosidad = textoPrincipal === COLOR_BLANCO ? 100 : 0

  for (let luminosidad = 0; luminosidad <= 100; luminosidad += 1) {
    const candidato = hslToHex(0, 0, luminosidad)

    const contraste = contrasteEntre(colorFondo, candidato)

    if (contraste >= contrasteObjetivo) {
      if (textoPrincipal === COLOR_BLANCO) {
        if (luminosidad <= mejorLuminosidad) {
          mejor = candidato

          mejorLuminosidad = luminosidad
        }
      } else if (luminosidad >= mejorLuminosidad) {
        mejor = candidato

        mejorLuminosidad = luminosidad
      }
    }
  }

  /*
   * La búsqueda anterior puede producir un gris
   * demasiado cercano al extremo. Limitamos los
   * valores para conservar una apariencia empresarial.
   */
  if (direccion < 0) {
    return mejor
  }

  return mejor
}

/**
 * Texto secundario.
 *
 * Mantiene apariencia neutra y conserva contraste.
 */
function obtenerTextoSecundario(fondo) {
  const colorFondo = normalizarHex(fondo)

  const blanco = contrasteEntre(colorFondo, COLOR_BLANCO)

  const negro = contrasteEntre(colorFondo, COLOR_NEGRO)

  /*
   * Sobre fondos claros utilizamos un gris
   * oscuro, nunca el color de marca.
   */
  if (negro >= blanco) {
    const candidatos = ['#334155', '#475569', '#526078', '#64748B']

    for (const candidato of candidatos) {
      if (contrasteEntre(colorFondo, candidato) >= CONTRASTE_TEXTO_NORMAL) {
        return candidato
      }
    }

    return COLOR_NEGRO
  }

  /*
   * Sobre fondos oscuros utilizamos
   * grises claros.
   */
  const candidatos = ['#E5E7EB', '#E2E8F0', '#CBD5E1', '#F1F5F9']

  for (const candidato of candidatos) {
    if (contrasteEntre(colorFondo, candidato) >= CONTRASTE_TEXTO_NORMAL) {
      return candidato
    }
  }

  return COLOR_BLANCO
}

/**
 * Texto muted.
 *
 * Aunque sea secundario visualmente,
 * no se permite caer por debajo del
 * contraste mínimo definido.
 */
function obtenerTextoMuted(fondo) {
  const colorFondo = normalizarHex(fondo)

  const negro = contrasteEntre(colorFondo, '#64748B')

  if (negro >= CONTRASTE_TEXTO_NORMAL) {
    return '#64748B'
  }

  const grisOscuro = contrasteEntre(colorFondo, '#475569')

  if (grisOscuro >= CONTRASTE_TEXTO_NORMAL) {
    return '#475569'
  }

  const grisClaro = contrasteEntre(colorFondo, '#CBD5E1')

  if (grisClaro >= CONTRASTE_TEXTO_NORMAL) {
    return '#CBD5E1'
  }

  return obtenerTextoContraste(colorFondo, {
    contrasteObjetivo: CONTRASTE_TEXTO_NORMAL,
  })
}

/* =========================================================
   COLORES DERIVADOS
   ========================================================= */

function crearColorSuave(hex, luminosidad, saturacion = null) {
  const hsl = hexToHsl(hex)

  return hslToHex(hsl.h, saturacion ?? hsl.s, luminosidad)
}

function crearColorIntenso(hex, luminosidad) {
  const hsl = hexToHsl(hex)

  return hslToHex(hsl.h, Math.max(hsl.s, 55), luminosidad)
}

/* =========================================================
   TEXTO DE MARCA
   ========================================================= */

function obtenerTextosDeMarca(primary, secondary, accent) {
  return {
    primaryText: obtenerTextoContraste(primary),

    secondaryText: obtenerTextoContraste(secondary),

    accentText: obtenerTextoContraste(accent),
  }
}

/* =========================================================
   ESTRUCTURA COMÚN DE PALETA
   ========================================================= */

function completarPaleta(colores) {
  const primary = normalizarHex(colores.primary ?? PALETAS_PREDERMINADAS.primary)

  const secondary = normalizarHex(colores.secondary ?? PALETAS_PREDERMINADAS.secondary)

  const accent = normalizarHex(colores.accent ?? PALETAS_PREDERMINADAS.accent)

  /*
   * Los colores principales siempre se calculan
   * nuevamente. No reutilizamos primaryText /
   * secondaryText / accentText antiguos.
   *
   * Esto evita que una configuración vieja
   * conserve textos con contraste incorrecto.
   */
  const textosMarca = obtenerTextosDeMarca(primary, secondary, accent)

  const background = normalizarHex(colores.background ?? PALETAS_PREDERMINADAS.background)

  const backgroundAlt = normalizarHex(colores.backgroundAlt ?? PALETAS_PREDERMINADAS.backgroundAlt)

  const surface = normalizarHex(colores.surface ?? PALETAS_PREDERMINADAS.surface)

  const surfaceAlt = normalizarHex(colores.surfaceAlt ?? PALETAS_PREDERMINADAS.surfaceAlt)

  /*
   * El texto general se calcula contra el
   * background real.
   */
  const text = obtenerTextoContraste(background)

  /*
   * El texto secundario y muted son neutros.
   * No heredan el tono de primary.
   */
  const textSecondary = obtenerTextoSecundario(background)

  const textMuted = obtenerTextoMuted(background)

  return {
    ...colores,

    primary,
    secondary,
    accent,

    background,
    backgroundAlt,

    surface,
    surfaceAlt,

    text,
    textSecondary,
    textMuted,

    primaryText: textosMarca.primaryText,

    secondaryText: textosMarca.secondaryText,

    accentText: textosMarca.accentText,

    success: colores.success ?? PALETAS_PREDERMINADAS.success,

    warning: colores.warning ?? PALETAS_PREDERMINADAS.warning,

    danger: colores.danger ?? PALETAS_PREDERMINADAS.danger,
  }
}

/* =========================================================
   PALETA TRIÁDICA
   ========================================================= */

export function generarPaletaTriadica(colorBase, opciones = {}) {
  const { suavidad = 35 } = opciones

  const base = normalizarHex(colorBase)

  const hsl = hexToHsl(base)

  const saturacionBase = limitar(hsl.s, 35, 85)

  const luminosidadBase = limitar(hsl.l, 35, 62)

  const primary = hslToHex(hsl.h, saturacionBase, luminosidadBase)

  const secondary = hslToHex(hsl.h + 120, limitar(hsl.s, 38, 78), limitar(hsl.l, 42, 65))

  const accent = hslToHex(hsl.h + 240, limitar(hsl.s, 38, 78), limitar(hsl.l, 42, 65))

  const factorSuavidad = limitarPorcentaje(suavidad) / 100

  const porcentajeSuave = 70 + factorSuavidad * 20

  const primaryLight = mezclarColores(primary, COLOR_BLANCO, porcentajeSuave)

  const secondaryLight = mezclarColores(secondary, COLOR_BLANCO, porcentajeSuave)

  const accentLight = mezclarColores(accent, COLOR_BLANCO, porcentajeSuave)

  const primaryDark = mezclarColores(primary, '#000000', 25)

  const secondaryDark = mezclarColores(secondary, '#000000', 25)

  const accentDark = mezclarColores(accent, '#000000', 25)

  const background = mezclarColores(COLOR_BLANCO, primaryLight, 22)

  const backgroundAlt = mezclarColores(COLOR_BLANCO, accentLight, 30)

  const surface = COLOR_BLANCO

  const surfaceAlt = mezclarColores(COLOR_BLANCO, secondaryLight, 24)

  const border = mezclarColores('#E2E8F0', primaryLight, 35)

  return completarPaleta({
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

    border,
  })
}

/* =========================================================
   PALETA MONOCROMÁTICA
   ========================================================= */

function generarPaletaMonocromatica(colorBase, opciones = {}) {
  const base = normalizarHex(colorBase)

  const hsl = hexToHsl(base)

  const primary = hslToHex(hsl.h, limitar(hsl.s, 35, 85), limitar(hsl.l, 35, 62))

  const secondary = hslToHex(hsl.h, limitar(hsl.s - 15, 25, 70), 55)

  const accent = hslToHex(hsl.h, limitar(hsl.s + 5, 40, 90), 45)

  const primaryLight = crearColorSuave(primary, 92)

  const primaryDark = crearColorIntenso(primary, 35)

  const secondaryLight = crearColorSuave(secondary, 90)

  const secondaryDark = crearColorIntenso(secondary, 38)

  const accentLight = crearColorSuave(accent, 90)

  const accentDark = crearColorIntenso(accent, 35)

  const background = mezclarColores(COLOR_BLANCO, primaryLight, 22)

  const backgroundAlt = mezclarColores(COLOR_BLANCO, accentLight, 30)

  const surface = COLOR_BLANCO

  const surfaceAlt = mezclarColores(COLOR_BLANCO, secondaryLight, 24)

  const border = mezclarColores('#E2E8F0', primaryLight, 35)

  return completarPaleta({
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

    border,
  })
}

/* =========================================================
   PALETA COMPLEMENTARIA
   ========================================================= */

function generarPaletaComplementaria(colorBase, opciones = {}) {
  const base = normalizarHex(colorBase)

  const hsl = hexToHsl(base)

  const primary = hslToHex(hsl.h, limitar(hsl.s, 35, 85), limitar(hsl.l, 35, 62))

  const secondary = ajustarTono(primary, 180)

  const accent = ajustarTono(primary, 30)

  const primaryLight = crearColorSuave(primary, 90)

  const primaryDark = crearColorIntenso(primary, 35)

  const secondaryLight = crearColorSuave(secondary, 90)

  const secondaryDark = crearColorIntenso(secondary, 38)

  const accentLight = crearColorSuave(accent, 90)

  const accentDark = crearColorIntenso(accent, 38)

  const background = mezclarColores(COLOR_BLANCO, primaryLight, 22)

  const backgroundAlt = mezclarColores(COLOR_BLANCO, secondaryLight, 25)

  const surface = COLOR_BLANCO

  const surfaceAlt = mezclarColores(COLOR_BLANCO, accentLight, 24)

  const border = mezclarColores('#E2E8F0', primaryLight, 35)

  return completarPaleta({
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

    border,
  })
}

/* =========================================================
   PALETA ANÁLOGA
   ========================================================= */

function generarPaletaAnalogica(colorBase, opciones = {}) {
  const base = normalizarHex(colorBase)

  const hsl = hexToHsl(base)

  const primary = hslToHex(hsl.h, limitar(hsl.s, 35, 85), limitar(hsl.l, 35, 62))

  const secondary = ajustarTono(primary, 30)

  const accent = ajustarTono(primary, -30)

  const primaryLight = crearColorSuave(primary, 90)

  const primaryDark = crearColorIntenso(primary, 35)

  const secondaryLight = crearColorSuave(secondary, 90)

  const secondaryDark = crearColorIntenso(secondary, 38)

  const accentLight = crearColorSuave(accent, 90)

  const accentDark = crearColorIntenso(accent, 38)

  const background = mezclarColores(COLOR_BLANCO, primaryLight, 22)

  const backgroundAlt = mezclarColores(COLOR_BLANCO, accentLight, 30)

  const surface = COLOR_BLANCO

  const surfaceAlt = mezclarColores(COLOR_BLANCO, secondaryLight, 24)

  const border = mezclarColores('#E2E8F0', primaryLight, 35)

  return completarPaleta({
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

    border,
  })
}

/* =========================================================
   GENERADOR PRINCIPAL
   ========================================================= */

export function generarPaleta(colorBase, opciones = {}) {
  const armonia = String(opciones.armonia ?? 'triadica')
    .trim()
    .toLowerCase()

  switch (armonia) {
    case 'monocromatica':
    case 'monocromática':
      return generarPaletaMonocromatica(colorBase, opciones)

    case 'complementaria':
      return generarPaletaComplementaria(colorBase, opciones)

    case 'analogica':
    case 'analógica':
      return generarPaletaAnalogica(colorBase, opciones)

    case 'triadica':
    case 'triádica':
    default:
      return generarPaletaTriadica(colorBase, opciones)
  }
}

/* =========================================================
   RUEDA CROMÁTICA — ARMONÍAS
   =========================================================
   Funciones auxiliares para la rueda cromática interactiva
   del componente de Apariencia.
   ========================================================= */

/**
 * Devuelve los ángulos (en grados) de los colores
 * de la armonía seleccionada.
 *
 * El primer ángulo SIEMPRE es 0 (el color base).
 */
export function obtenerAngulosArmonia(armonia) {
  const normalizada = String(armonia || 'triadica')
    .trim()
    .toLowerCase()

  switch (normalizada) {
    case 'complementaria':
      return [0, 180]

    case 'analogica':
    case 'analógica':
      return [0, 30, -30]

    case 'triadica':
    case 'triádica':
      return [0, 120, 240]

    case 'monocromatica':
    case 'monocromática':
      return [0]

    default:
      return [0, 120, 240]
  }
}

/**
 * Convierte coordenadas (x, y) de la rueda cromática
 * a un color HSL y devuelve el hex correspondiente.
 *
 * @param {number} x - posición x relativa al centro (-1 a 1)
 * @param {number} y - posición y relativa al centro (-1 a 1)
 * @param {number} saturacion - saturación 0-100
 * @param {number} luminosidad - luminosidad 0-100
 * @returns {string} hex
 */
export function puntoARuedaHex(x, y, saturacion = 65, luminosidad = 50) {
  const radio = Math.min(1, Math.sqrt(x * x + y * y))

  if (radio === 0) {
    return hslToHex(0, 0, luminosidad)
  }

  // Ángulo: 0° = derecha, incrementa en sentido antihorario
  let angulo = Math.atan2(-y, x) * (180 / Math.PI)

  if (angulo < 0) {
    angulo += 360
  }

  // A mayor radio, mayor saturación
  const s = limitarPorcentaje(saturacion * radio)

  return hslToHex(angulo, s, luminosidad)
}

/**
 * Convierte un hex a coordenadas (x, y) para posicionar
 * el marcador en la rueda cromática.
 *
 * @returns {{x: number, y: number, angulo: number, radio: number}}
 */
export function hexARuedaCoordenadas(hex) {
  const hsl = hexToHsl(hex)

  const anguloRad = (hsl.h * Math.PI) / 180

  // Radio normalizado: la saturación determina la distancia
  const radio = limitarPorcentaje(hsl.s) / 100

  const x = Math.cos(anguloRad) * radio
  const y = -Math.sin(anguloRad) * radio

  return {
    x,
    y,
    angulo: hsl.h,
    radio,
  }
}

/* =========================================================
   GENERADOR COMPLETO CON PARÁMETROS DE ARMONÍA
   ========================================================= */

/**
 * Ajusta un HSL según suavidad y contraste.
 */
function ajustarColorPorParametros(hsl, suavidad, contraste) {
  const factorSuavidad = limitarPorcentaje(suavidad) / 100
  const factorContraste = limitarPorcentaje(contraste) / 100

  const nuevaS = limitar(hsl.s * (1 - factorSuavidad * 0.25), 20, 95)

  const desplazamiento = (hsl.l - 50) * factorContraste * 0.4
  const nuevaL = limitar(hsl.l + desplazamiento, 15, 88)

  return {
    h: hsl.h,
    s: nuevaS,
    l: nuevaL,
  }
}

/**
 * Genera TODA la paleta a partir del color base + armonía.
 *
 * Devuelve un objeto con las 24 variables de color listas
 * para guardar en Firestore.
 */
export function generarPaletaCompleta(colorBase, opciones = {}) {
  const base = normalizarHex(colorBase)

  const armonia = String(opciones.armonia || 'triadica')
    .trim()
    .toLowerCase()

  const suavidad = limitarPorcentaje(opciones.suavidad ?? 45)
  const contraste = limitarPorcentaje(opciones.contraste ?? 55)

  const hslBase = hexToHsl(base)

  const angulos = obtenerAngulosArmonia(armonia)

  const hslAjustado = ajustarColorPorParametros(hslBase, suavidad, contraste)

  // Colores de marca
  const coloresMarca = angulos.map((angulo) => {
    const h = limitarTono(hslAjustado.h + angulo)
    return hslToHex(h, hslAjustado.s, hslAjustado.l)
  })

  const primary = coloresMarca[0] || base
  const secondary = coloresMarca[1] || ajustarTono(primary, 180)
  const accent = coloresMarca[2] || ajustarTono(primary, 240)

  // Variantes
  const primaryLight = crearColorSuave(primary, 92)
  const primaryDark = crearColorIntenso(primary, 35)

  const secondaryLight = crearColorSuave(secondary, 90)
  const secondaryDark = crearColorIntenso(secondary, 38)

  const accentLight = crearColorSuave(accent, 90)
  const accentDark = crearColorIntenso(accent, 35)

  // Superficies y fondos
  const background = mezclarColores(COLOR_BLANCO, primaryLight, 22)
  const backgroundAlt = mezclarColores(COLOR_BLANCO, accentLight, 30)
  const surface = COLOR_BLANCO
  const surfaceAlt = mezclarColores(COLOR_BLANCO, secondaryLight, 24)
  const border = mezclarColores('#E2E8F0', primaryLight, 35)

  // Textos con contraste
  const primaryText = obtenerTextoContraste(primary)
  const secondaryText = obtenerTextoContraste(secondary)
  const accentText = obtenerTextoContraste(accent)

  const text = obtenerTextoContraste(background)
  const textSecondary = obtenerTextoSecundario(background)
  const textMuted = obtenerTextoMuted(background)

  return {
    primary,
    primaryLight,
    primaryDark,
    primaryText,

    secondary,
    secondaryLight,
    secondaryDark,
    secondaryText,

    accent,
    accentLight,
    accentDark,
    accentText,

    background,
    backgroundAlt,
    surface,
    surfaceAlt,

    text,
    textSecondary,
    textMuted,

    border,

    success: PALETAS_PREDERMINADAS.success,
    warning: PALETAS_PREDERMINADAS.warning,
    danger: PALETAS_PREDERMINADAS.danger,
  }
}

/**
 * Genera degradados coherentes con la paleta actual.
 *
 * @param {object} paleta - resultado de generarPaletaCompleta
 * @returns {object} degradados listos para Firestore
 */
export function generarDegradadosDesdePaleta(paleta) {
  if (!paleta || typeof paleta !== 'object') {
    return {}
  }

  const primary = normalizarHex(paleta.primary || COLOR_BASE)
  const accent = normalizarHex(paleta.accent || COLOR_BASE)
  const primaryLight = normalizarHex(paleta.primaryLight || primary)
  const primaryDark = normalizarHex(paleta.primaryDark || primary)
  const accentLight = normalizarHex(paleta.accentLight || accent)
  const accentDark = normalizarHex(paleta.accentDark || accent)
  const background = normalizarHex(paleta.background || COLOR_BLANCO)

  return {
    primary: {
      inicio: primaryLight,
      fin: primary,
      angulo: 135,
    },
    accent: {
      inicio: accentLight,
      fin: accent,
      angulo: 135,
    },
    dark: {
      inicio: primaryDark,
      fin: '#000000',
      angulo: 135,
    },
    soft: {
      inicio: background,
      fin: primaryLight,
      angulo: 135,
    },
  }
}

/**
 * Genera la CONFIGURACIÓN COMPLETA:
 * colores + degradados + parámetros de paleta.
 */
export function generarConfiguracionCompleta(colorBase, opciones = {}) {
  const paleta = generarPaletaCompleta(colorBase, opciones)

  const degradados = generarDegradadosDesdePaleta(paleta)

  return {
    ...paleta,

    paleta: {
      base: normalizarHex(colorBase),
      armonia: String(opciones.armonia || 'triadica'),
      suavidad: limitarPorcentaje(opciones.suavidad ?? 45),
      contraste: limitarPorcentaje(opciones.contraste ?? 55),
    },

    degradados,
  }
}

/* =========================================================
   EDITOR DE DEGRADADOS INDIVIDUALES
   ========================================================= */

/**
 * Normaliza un degradado individual.
 *
 * @param {object} degradado
 * @returns {{inicio: string, fin: string, angulo: number}}
 */
export function normalizarDegradado(degradado) {
  if (!degradado || typeof degradado !== 'object') {
    return {
      inicio: COLOR_BASE,
      fin: COLOR_BLANCO,
      angulo: 135,
    }
  }

  const inicio = normalizarHex(degradado.inicio || COLOR_BASE)
  const fin = normalizarHex(degradado.fin || COLOR_BLANCO)

  const angulo = Number(degradado.angulo ?? degradado.angulo135 ?? 135)

  return {
    inicio,
    fin,
    angulo: Number.isFinite(angulo) ? ((angulo % 360) + 360) % 360 : 135,
  }
}

/**
 * Genera el estilo CSS de un degradado.
 */
export function estiloDegradado(degradado) {
  const normalizado = normalizarDegradado(degradado)

  return `linear-gradient(${normalizado.angulo}deg, ${normalizado.inicio} 0%, ${normalizado.fin} 100%)`
}

export default generarPaleta
export function calcularTextoParaDegradado(degradado) {
  const normalizado = normalizarDegradado(degradado)

  const inicio = normalizado.inicio
  const fin = normalizado.fin

  // Contraste de blanco contra ambos extremos
  const blancoInicio = contrasteEntre(COLOR_BLANCO, inicio)
  const blancoFin = contrasteEntre(COLOR_BLANCO, fin)
  const peorBlanco = Math.min(blancoInicio, blancoFin)

  // Contraste de negro contra ambos extremos
  const negroInicio = contrasteEntre(COLOR_NEGRO, inicio)
  const negroFin = contrasteEntre(COLOR_NEGRO, fin)
  const peorNegro = Math.min(negroInicio, negroFin)

  // Elegir el color con mejor peor-caso
  const textoBase = peorBlanco >= peorNegro ? COLOR_BLANCO : COLOR_NEGRO

  // Extremo más desfavorable para ese color
  const extremoDesfavorable =
    textoBase === COLOR_BLANCO
      ? blancoInicio <= blancoFin
        ? inicio
        : fin
      : negroInicio <= negroFin
        ? inicio
        : fin

  const textSecondary = obtenerTextoSecundario(extremoDesfavorable)
  const textMuted = obtenerTextoMuted(extremoDesfavorable)

  return {
    text: textoBase,
    textSecondary,
    textMuted,
    medio: mezclarColores(inicio, fin, 50),
  }
}

/* =========================================================
   OVERRIDES MANUALES DE TEXTO SOBRE DEGRADADOS
   =========================================================
   Permite que el admin fuerce manualmente el color del
   texto sobre cada degradado, ignorando el cálculo
   automático de contraste.
   ========================================================= */

/**
 * Mapeo entre los campos de Firestore y las claves de degradado.
 *
 * Ejemplo:
 *   configuracion.primaryGradientText  → degradado 'primary'
 *   configuracion.accentGradientText   → degradado 'accent'
 *   configuracion.darkGradientText     → degradado 'dark'
 *   configuracion.softGradientText     → degradado 'soft'
 */
export const MAPA_OVERRIDES_DEGRADADOS = {
  primaryGradientText: 'primary',
  secondaryGradientText: 'secondary',
  accentGradientText: 'accent',
  darkGradientText: 'dark',
  softGradientText: 'soft',
}

/**
 * Devuelve los overrides manuales del usuario desde la
 * configuración de Firestore.
 *
 * @param {object} configuracion - documento configuracion/general
 * @returns {Object<string, string>} ej: { primary: '#FFFFFF', accent: '#111827' }
 */
export function obtenerOverridesDegradados(configuracion) {
  if (!configuracion || typeof configuracion !== 'object') {
    return {}
  }

  const overrides = {}

  Object.entries(MAPA_OVERRIDES_DEGRADADOS).forEach(([campoConfig, claveDegradado]) => {
    const valor = configuracion[campoConfig]

    if (typeof valor === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(valor.trim())) {
      overrides[claveDegradado] = valor.trim().toUpperCase()
    }
  })

  return overrides
}

/**
 * Aplica los overrides manuales a un resultado de
 * generarTextosDegradados.
 *
 * Si hay override, reemplaza el texto y todas sus variantes
 * con opacidad por versiones del color manual.
 *
 * @param {object} variables - salida de generarTextosDegradados
 * @param {object} overrides - salida de obtenerOverridesDegradados
 * @returns {object} variables modificadas
 */
/**
 * Aplica los overrides manuales a un resultado de
 * generarTextosDegradados.
 *
 * IMPORTANTE:
 * Un override SOLO se aplica si tiene contraste suficiente
 * sobre el degradado actual. Si el override no cumple con
 * el contraste mínimo (WCAG AA = 4.5), se ignora y se usa
 * el cálculo automático.
 *
 * Esto evita que el usuario fuerce un color que se vuelve
 * ilegible al cambiar el color base.
 */
export function aplicarOverridesDegradados(variables, overrides, degradados = {}) {
  if (!overrides || Object.keys(overrides).length === 0) {
    return variables
  }

  const opacidades = [76, 68, 58, 56, 50, 46, 38, 12, 10, 9, 6, 5, 4]
  const CONTRASTE_MINIMO = 4.5

  const resultado = { ...variables }

  Object.entries(overrides).forEach(([clave, color]) => {
    const colorNormalizado = normalizarHex(color)
    const rgb = hexToRgb(colorNormalizado)

    if (!rgb) return

    /*
     * Verificar contraste sobre el degradado.
     *
     * Se evalúa contra ambos extremos (inicio y fin).
     * Si el override NO tiene contraste suficiente en
     * alguno de los dos extremos, se descarta.
     */
    const degradado = degradados?.[clave]

    if (degradado && typeof degradado === 'object') {
      const inicio = normalizarHex(degradado.inicio || COLOR_BASE)
      const fin = normalizarHex(degradado.fin || COLOR_BASE)

      const contrasteInicio = contrasteEntre(colorNormalizado, inicio)
      const contrasteFin = contrasteEntre(colorNormalizado, fin)

      const peorContraste = Math.min(contrasteInicio, contrasteFin)

      if (peorContraste < CONTRASTE_MINIMO) {
        /*
         * El override es ilegible. Se ignora y se usa
         * el valor calculado automáticamente.
         */
        return
      }
    }

    /*
     * El override es válido. Se aplica.
     */

    resultado[`--gradient-${clave}-text`] = colorNormalizado

    opacidades.forEach((op) => {
      const alpha = (op / 100).toFixed(2)
      resultado[`--gradient-${clave}-text-${op}`] = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
    })
  })

  return resultado
}
export function generarTextosDegradados(degradados) {
  if (!degradados || typeof degradados !== 'object') {
    return {}
  }

  const resultado = {}

  Object.entries(degradados).forEach(([clave, deg]) => {
    if (!deg || typeof deg !== 'object') return

    const textos = calcularTextoParaDegradado(deg)
    const textoBase = textos.text

    // Convertir hex a rgb para generar rgba
    const rgb = hexToRgb(textoBase)
    const r = rgb.r
    const g = rgb.g
    const b = rgb.b

    // Opacidades estándar usadas en el footer
    const opacidades = [100, 76, 68, 58, 56, 50, 46, 38, 12, 10, 9, 6, 5, 4]

    resultado[`--gradient-${clave}-text`] = textoBase

    opacidades.forEach((op) => {
      if (op === 100) return
      resultado[`--gradient-${clave}-text-${op}`] =
        `rgba(${r}, ${g}, ${b}, ${(op / 100).toFixed(2)})`
    })
  })

  return resultado
}
