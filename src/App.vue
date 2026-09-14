<script setup>
import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import {
  suscribirTemaGlobal,
  aplicarTema,
} from './services/themeService'

import {
  suscribirConfiguracionAdmin,
} from './services/adminService'

/* =========================================================
   ESTADO GLOBAL
   ========================================================= */

const configuracionGlobal =
  ref({})

let unsubscribeTema = null
let unsubscribeConfiguracion = null

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

function actualizarFavicon(
  configuracion = {},
) {
  const version =
    configuracion.logoVersion ||
    Date.now()

  const favicon =
    configuracion.faviconUrl ||
    configuracion.logoIcoUrl ||
    configuracion.logoPngUrl ||
    configuracion.logoUrl ||
    ''

  if (!favicon) {
    return
  }

  const url =
    agregarVersion(
      favicon,
      version,
    )

  /*
   * Actualizar todos los favicons existentes.
   */
  const enlaces =
    document.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"]',
    )

  if (enlaces.length) {
    enlaces.forEach(
      (enlace) => {
        enlace.href = url
      },
    )
  } else {
    /*
     * Si index.html no tiene favicon,
     * crear uno dinámicamente.
     */
    const enlace =
      document.createElement('link')

    enlace.rel = 'icon'
    enlace.href = url

    document.head.appendChild(
      enlace,
    )
  }

  /*
   * También mantenemos shortcut icon.
   */
  let shortcut =
    document.querySelector(
      'link[rel="shortcut icon"]',
    )

  if (!shortcut) {
    shortcut =
      document.createElement('link')

    shortcut.rel =
      'shortcut icon'

    document.head.appendChild(
      shortcut,
    )
  }

  shortcut.href = url
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
   ========================================================= */

function iniciarConfiguracionGlobal() {
  if (
    typeof unsubscribeConfiguracion ===
    'function'
  ) {
    unsubscribeConfiguracion()

    unsubscribeConfiguracion =
      null
  }

  try {
    unsubscribeConfiguracion =
      suscribirConfiguracionAdmin(
        'general',

        (datos) => {
          const configuracion =
            datos || {}

          /*
           * Actualizar el estado reactivo global.
           */
          configuracionGlobal.value =
            configuracion

          /*
           * Aplicar favicon inmediatamente.
           */
          actualizarFavicon(
            configuracion,
          )

          /*
           * Actualizar título inmediatamente.
           */
          actualizarTitulo(
            configuracion,
          )

          /*
           * Permitir que otros componentes
           * reaccionen al mismo cambio.
           */
          emitirConfiguracionGlobal(
            configuracion,
          )
        },

        (error) => {
          console.error(
            'No fue posible sincronizar la configuración global:',
            error,
          )
        },
      )
  } catch (error) {
    console.error(
      'Error iniciando configuración global:',
      error,
    )
  }
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

    /*
     * Aplicar inmediatamente el tema disponible.
     * La suscripción continúa encargándose
     * de los cambios realtime.
     */
    aplicarTema?.(
      configuracionGlobal.value,
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
  /*
   * Primero iniciar configuración para que
   * favicon/título tengan datos cuanto antes.
   */
  iniciarConfiguracionGlobal()

  /*
   * Mantener el sistema de colores existente.
   */
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

  if (
    typeof unsubscribeConfiguracion ===
    'function'
  ) {
    unsubscribeConfiguracion()

    unsubscribeConfiguracion =
      null
  }
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>
