/**
 * mediaService.js
 *
 * Gestión de medios para secciones de la landing.
 *
 * Tipos soportados:
 *   imagen  — archivo local (base64) o URL directa
 *   gif     — igual que imagen
 *   video   — URL directa mp4/webm
 *   embed   — YouTube, TikTok, Vimeo, Facebook Video (iframe)
 */

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const MAX_DIMENSION  = 900
const JPEG_QUALITY   = 0.82
const MAX_SIZE_BYTES = 900_000

const TIPOS_IMAGEN = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'image/gif', 'image/avif',
])

const TIPOS_VIDEO = new Set([
  'video/mp4', 'video/webm', 'video/ogg',
])

/* =========================================================
   ESTRUCTURA POR DEFECTO
   ========================================================= */

export function medioVacio() {
  return {
    tipo:          '',        // 'imagen' | 'gif' | 'video' | 'embed' | ''
    url:           '',        // URL original ingresada por el usuario
    embedUrl:      '',        // URL de embed para iframe (calculada)
    embedPlataforma: '',      // 'youtube' | 'tiktok' | 'vimeo' | 'facebook' | ''
    medioBlob:     '',        // base64 de imagen local
    mimeBlob:      '',
    storagePath:   '',
    alt:           '',
    poster:        '',
    animacion:     'fade-up',
    duracion:      800,
    retraso:       0,
    loop:          false,
    autoplay:      true,
    controles:     false,
    silencio:      true,
    objectFit:     'cover',
    posicion:      'derecha',
    opacidadFondo: 0.4,
  }
}

/* =========================================================
   DETECCIÓN DE PLATAFORMA Y EMBED URL
   ========================================================= */

/**
 * Dado cualquier URL, devuelve:
 *   { tipo, embedUrl, embedPlataforma }
 *
 * Si no es una plataforma conocida, devuelve tipo inferido
 * desde la extensión o 'imagen' por defecto.
 */
export function detectarMedioDesdeUrl(url) {
  if (!url || typeof url !== 'string') {
    return { tipo: '', embedUrl: '', embedPlataforma: '' }
  }

  const u = url.trim()

  // ── YouTube ──────────────────────────────────────────────
  // Formatos:
  //   https://www.youtube.com/watch?v=ID
  //   https://youtu.be/ID
  //   https://youtube.com/shorts/ID
  //   https://www.youtube.com/embed/ID  (ya es embed)
  const ytMatch =
    u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/) ||
    u.match(/youtube\.com\/.*[?&]v=([A-Za-z0-9_-]{11})/)

  if (ytMatch) {
    return {
      tipo: 'embed',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`,
      embedPlataforma: 'youtube',
    }
  }

  // ── TikTok ───────────────────────────────────────────────
  // Formatos:
  //   https://www.tiktok.com/@user/video/ID
  //   https://vm.tiktok.com/CODE/
  const ttMatch = u.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (ttMatch) {
    return {
      tipo: 'embed',
      embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
      embedPlataforma: 'tiktok',
    }
  }
  // TikTok URL corta — no podemos resolver sin redirect, usamos oembed approach
  if (/vm\.tiktok\.com|tiktok\.com\/t\//.test(u)) {
    return {
      tipo: 'embed',
      embedUrl: u,   // el usuario tendrá que usar URL larga
      embedPlataforma: 'tiktok',
    }
  }

  // ── Vimeo ────────────────────────────────────────────────
  // Formatos:
  //   https://vimeo.com/ID
  //   https://player.vimeo.com/video/ID
  const vmMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vmMatch) {
    return {
      tipo: 'embed',
      embedUrl: `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=0`,
      embedPlataforma: 'vimeo',
    }
  }

  // ── Facebook Video ────────────────────────────────────────
  if (/facebook\.com\/.*\/videos\/|fb\.watch\//.test(u)) {
    return {
      tipo: 'embed',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false&width=560`,
      embedPlataforma: 'facebook',
    }
  }

  // ── Video directo ─────────────────────────────────────────
  if (/\.(mp4|webm|ogv|ogg)(\?|$)/i.test(u)) {
    return { tipo: 'video', embedUrl: '', embedPlataforma: '' }
  }

  // ── GIF ──────────────────────────────────────────────────
  if (/\.gif(\?|$)/i.test(u)) {
    return { tipo: 'gif', embedUrl: '', embedPlataforma: '' }
  }

  // ── Imagen ────────────────────────────────────────────────
  if (/\.(jpe?g|png|webp|avif|svg|bmp|ico)(\?|$)/i.test(u)) {
    return { tipo: 'imagen', embedUrl: '', embedPlataforma: '' }
  }

  // Default — tratar como imagen
  return { tipo: 'imagen', embedUrl: '', embedPlataforma: '' }
}

/* =========================================================
   NORMALIZACIÓN
   ========================================================= */

export function clasificarTipo(tipoMime) {
  if (!tipoMime) return ''
  if (tipoMime === 'image/gif') return 'gif'
  if (TIPOS_IMAGEN.has(tipoMime)) return 'imagen'
  if (TIPOS_VIDEO.has(tipoMime)) return 'video'
  return ''
}

export function esArchivoImagen(tipoMime) { return TIPOS_IMAGEN.has(tipoMime) }
export function esArchivoVideo(tipoMime)  { return TIPOS_VIDEO.has(tipoMime) }

export function normalizarMedio(datos) {
  const defaults = medioVacio()
  if (!datos || typeof datos !== 'object') return defaults

  return {
    ...defaults,
    ...datos,
    duracion:      Number.isFinite(Number(datos.duracion))      ? Number(datos.duracion)      : defaults.duracion,
    retraso:       Number.isFinite(Number(datos.retraso))       ? Number(datos.retraso)       : defaults.retraso,
    opacidadFondo: Number.isFinite(Number(datos.opacidadFondo)) ? Number(datos.opacidadFondo) : defaults.opacidadFondo,
    loop:          typeof datos.loop      === 'boolean' ? datos.loop      : defaults.loop,
    autoplay:      typeof datos.autoplay  === 'boolean' ? datos.autoplay  : defaults.autoplay,
    controles:     typeof datos.controles === 'boolean' ? datos.controles : defaults.controles,
    silencio:      typeof datos.silencio  === 'boolean' ? datos.silencio  : defaults.silencio,
  }
}

/**
 * Devuelve la URL de visualización:
 * prioriza blob base64, luego URL externa.
 */
export function obtenerUrlMedio(medio) {
  if (!medio) return ''
  if (medio.medioBlob && medio.mimeBlob) {
    return `data:${medio.mimeBlob};base64,${medio.medioBlob}`
  }
  return medio.url || ''
}

/* =========================================================
   COMPRESIÓN DE IMAGEN (Canvas API)
   ========================================================= */

export function comprimirImagen(archivo, opciones = {}) {
  return new Promise((resolve, reject) => {
    if (!archivo || !(archivo instanceof File)) {
      reject(new Error('Archivo inválido.')); return
    }

    const mime = archivo.type

    if (mime === 'image/gif') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1]
        resolve({ base64, mime, tamanoOriginal: archivo.size, tamanoFinal: archivo.size })
      }
      reader.onerror = () => reject(new Error('No se pudo leer el GIF.'))
      reader.readAsDataURL(archivo)
      return
    }

    const maxDim  = opciones.maxDimension || MAX_DIMENSION
    const quality = opciones.quality      || JPEG_QUALITY
    const img     = new Image()
    const url     = URL.createObjectURL(archivo)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { naturalWidth: w, naturalHeight: h } = img

      if (w > maxDim || h > maxDim) {
        if (w >= h) { h = Math.round((h / w) * maxDim); w = maxDim }
        else        { w = Math.round((w / h) * maxDim); h = maxDim }
      }

      const canvas  = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)

      const dataUrl = canvas.toDataURL('image/webp', quality)
      const realMime = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'
      const base64   = dataUrl.split(',')[1]
      const tamanoFinal = Math.round(base64.length * 0.75)

      resolve({ base64, mime: realMime, tamanoOriginal: archivo.size, tamanoFinal })
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo cargar la imagen.')) }
    img.src = url
  })
}

/* =========================================================
   PROCESAR ARCHIVO LOCAL
   ========================================================= */

export async function procesarArchivoLocal(archivo) {
  if (!archivo || !(archivo instanceof File)) throw new Error('Archivo inválido.')
  if (TIPOS_VIDEO.has(archivo.type)) throw new Error('Los videos son demasiado grandes para Firestore. Usa una URL directa.')
  if (!TIPOS_IMAGEN.has(archivo.type)) throw new Error(`Formato no soportado: ${archivo.type}.`)

  const resultado = await comprimirImagen(archivo)

  if (resultado.tamanoFinal > MAX_SIZE_BYTES) {
    throw new Error(`La imagen comprimida (${Math.round(resultado.tamanoFinal / 1024)} KB) supera el límite de Firestore. Usa una imagen más pequeña.`)
  }

  return {
    tipo:      clasificarTipo(archivo.type),
    medioBlob: resultado.base64,
    mimeBlob:  resultado.mime,
    url:       '',
    embedUrl:  '',
    embedPlataforma: '',
  }
}

/**
 * Devuelve true si el medio tiene contenido renderizable.
 */
export function medioTieneContenido(medio) {
  if (!medio) return false
  return Boolean(medio.url || medio.medioBlob || medio.embedUrl)
}

/**
 * Devuelve true si el medio se posiciona como fondo absoluto.
 */
export function medioEsFondo(medio) {
  return medio?.posicion === 'fondo'
}

/**
 * Devuelve true si el medio es lateral (derecha/izquierda/flotante).
 */
export function medioEsLateral(medio) {
  if (!medioTieneContenido(medio)) return false
  return medio?.posicion !== 'fondo'
}

/* =========================================================
   STUBS
   ========================================================= */

/** @deprecated — Firebase Storage requiere plan Blaze */
export async function subirMedio() {
  throw new Error('Firebase Storage requiere plan Blaze. Usa procesarArchivoLocal().')
}

export async function eliminarMedioStorage() { /* no-op */ }


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */