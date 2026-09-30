<script setup>
import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import {
  suscribirTemaGlobal,
} from './services/themeService'

/* =========================================================
   ESTADO GLOBAL
   =========================================================
   Una sola suscripción a Firestore.
   suscribirTemaGlobal aplica el tema Y permite que
   otros listeners reaccionen al mismo snapshot.
   ========================================================= */

const configuracionGlobal =
  ref({})

let unsubscribeTema = null

/* =========================================================
   UTILIDADES
   ========================================================= */

function agregarVersion(
  url,
  version,
) {
  if (!url) {
    return ''
  }

  /*
   * Evita conservar una versión anterior.
   */
  const separador =
    url.includes('?')
      ? '&'
      : '?'

  return `${url}${separador}v=${version || Date.now()}`
}

/* =========================================================
   FAVICON
   ========================================================= */

/*
 * Convierte logoBlob (Firestore Bytes) a Uint8Array.
 *
 * Firestore entrega el blob como un objeto Bytes con
 * el método toUint8Array(), pero también soportamos
 * Uint8Array nativo, ArrayBuffer y arrays de bytes.
 */
function convertirLogoBlobABytes(valor) {
  if (!valor) {
    return null
  }

  if (valor instanceof Uint8Array) {
    return valor
  }

  if (valor instanceof ArrayBuffer) {
    return new Uint8Array(valor)
  }

  if (typeof valor.toUint8Array === 'function') {
    try {
      return valor.toUint8Array()
    } catch {
      return null
    }
  }

  if (Array.isArray(valor)) {
    try {
      return new Uint8Array(valor)
    } catch {
      return null
    }
  }

  if (Array.isArray(valor._values)) {
    try {
      return new Uint8Array(valor._values)
    } catch {
      return null
    }
  }

  return null
}

function actualizarFavicon(
  configuracion = {},
) {
  if (typeof document === 'undefined') {
    return
  }

  /* -------------------------------------------------------
     PRIORIDAD 1: logoBlob (Firestore Bytes)
     ------------------------------------------------------- */

  const bytes =
    convertirLogoBlobABytes(
      configuracion.logoBlob,
    )

  let urlFavicon = ''

  if (bytes && bytes.byteLength > 0) {
    const mime =
      typeof configuracion.logoMimeType === 'string' &&
      configuracion.logoMimeType.trim()
        ? configuracion.logoMimeType.trim()
        : 'image/jpeg'

    try {
      urlFavicon = URL.createObjectURL(
        new Blob([bytes], { type: mime }),
      )
    } catch (error) {
      console.error(
        'Error generando favicon desde logoBlob:',
        error,
      )
    }
  }

  /* -------------------------------------------------------
     PRIORIDAD 2: URLs antiguas con versión
     ------------------------------------------------------- */

  if (!urlFavicon) {
    const version =
      configuracion.logoVersion ||
      Date.now()

    const faviconUrl =
      configuracion.faviconUrl ||
      configuracion.logoIcoUrl ||
      configuracion.logoPngUrl ||
      configuracion.logoUrl ||
      ''

    if (faviconUrl) {
      urlFavicon = agregarVersion(
        faviconUrl,
        version,
      )
    }
  }

  if (!urlFavicon) {
    return
  }

  /* -------------------------------------------------------
     ELIMINAR TODOS los shortcut icon viejos
     -------------------------------------------------------
     Esto es CRÍTICO: Windows/Chrome priorizan
     shortcut icon sobre icon. Si dejamos uno viejo,
     gana el viejo.
     ------------------------------------------------------- */

  document
    .querySelectorAll('link[rel="shortcut icon"]')
    .forEach((el) => el.remove())

  /* -------------------------------------------------------
     ACTUALIZAR (o crear) el link rel="icon"
     ------------------------------------------------------- */

  let icon =
    document.querySelector('link[rel="icon"]')

  if (!icon) {
    icon = document.createElement('link')
    icon.rel = 'icon'
    document.head.appendChild(icon)
  }

  icon.type =
    typeof configuracion.logoMimeType === 'string' &&
    configuracion.logoMimeType.trim()
      ? configuracion.logoMimeType.trim()
      : ''

  icon.href = urlFavicon

  /* -------------------------------------------------------
     FORZAR RELECTURA DEL FAVICON
     -------------------------------------------------------
     Clonar y reemplazar el <link> hace que el navegador
     relea el favicon sin recargar la página.
     ------------------------------------------------------- */

  const clon = icon.cloneNode(true)
  icon.parentNode?.replaceChild(clon, icon)
}

/* =========================================================
   TÍTULO DEL DOCUMENTO
   ========================================================= */

function actualizarTitulo(
  configuracion = {},
) {
  const nombre =
    configuracion.nombreEmpresa ||
    ''

  if (nombre) {
    document.title =
      nombre
  }
}

/* =========================================================
   EVENTO GLOBAL DE CONFIGURACIÓN
   ========================================================= */

function emitirConfiguracionGlobal(
  configuracion = {},
) {
  window.dispatchEvent(
    new CustomEvent(
      'configuracion-global-actualizada',
      {
        detail:
          configuracion,
      },
    ),
  )
}

/* =========================================================
   CONFIGURACIÓN GLOBAL FIREBASE
   =========================================================
   Integrado dentro de suscribirTemaGlobal:
   el tema se aplica y se emite el evento global
   en cada snapshot.
   ========================================================= */

function iniciarConfiguracionGlobal() {
  // La configuración llega via suscribirTemaGlobal.
  // Este método queda como hook por compatibilidad.
}

/* =========================================================
   TEMA GLOBAL
   ========================================================= */

function iniciarTemaGlobal() {
  if (
    typeof unsubscribeTema ===
    'function'
  ) {
    unsubscribeTema()

    unsubscribeTema =
      null
  }

  try {
    unsubscribeTema =
      suscribirTemaGlobal(
        (error) => {
          console.error(
            'No fue posible sincronizar la configuración visual:',
            error,
          )
        },
      )
  } catch (error) {
    console.error(
      'Error iniciando tema global:',
      error,
    )
  }
}

/* =========================================================
   CICLO DE VIDA
   ========================================================= */

onMounted(() => {
  iniciarConfiguracionGlobal()
  iniciarTemaGlobal()
})

onUnmounted(() => {
  if (
    typeof unsubscribeTema ===
    'function'
  ) {
    unsubscribeTema()

    unsubscribeTema =
      null
  }
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>