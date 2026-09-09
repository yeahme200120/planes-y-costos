<script setup>
import {
  onMounted,
  onUnmounted,
} from 'vue'

import {
  aplicarTema,
  suscribirTemaGlobal,
} from './services/themeService'

let unsubscribeTema = null

/* =========================================================
   TEMA GLOBAL
   ========================================================= */

function iniciarTemaGlobal() {
  unsubscribeTema = suscribirTemaGlobal((error) => {
    console.error(
      'No fue posible sincronizar la configuración visual:',
      error,
    )
  })
}

/* =========================================================
   CICLO DE VIDA
   ========================================================= */

onMounted(() => {
  iniciarTemaGlobal()
})

onUnmounted(() => {
  if (typeof unsubscribeTema === 'function') {
    unsubscribeTema()
    unsubscribeTema = null
  }
})
</script>

<template>
  <RouterView />
</template>