<script setup>
/**
 * SectionMediaWrapper.vue
 *
 * Envuelve el contenido de una sección junto con su medio.
 *
 * - posicion === 'fondo'     → medio absolute detrás, contenido encima
 * - posicion === 'derecha'   → flex row, media a la derecha
 * - posicion === 'izquierda' → flex row-reverse, media a la izquierda
 * - posicion === 'flotante'  → flex con media limitada en ancho
 * - sin medio                → slot directo sin wrapper extra
 *
 * Slots:
 *   default  — contenido principal de la sección
 *
 * Props:
 *   medio — objeto medio normalizado del doc de sección
 */
import { computed } from 'vue'
import SectionBackground from './SectionBackground.vue'
import { normalizarMedio, medioTieneContenido, medioEsFondo } from '../../services/mediaService.js'

const props = defineProps({
  medio: { type: Object, default: null },
  containerClass: { type: String, default: '' },
})

const datos    = computed(() => normalizarMedio(props.medio))
const tieneMedia = computed(() => medioTieneContenido(datos.value))
const esFondo  = computed(() => medioEsFondo(datos.value))
const esLateral = computed(() => tieneMedia.value && !esFondo.value)

const wrapClase = computed(() => {
  if (!esLateral.value) return ''
  const pos = datos.value.posicion
  if (pos === 'derecha')   return 'sb-wrap sb-wrap--right'
  if (pos === 'izquierda') return 'sb-wrap sb-wrap--left'
  return 'sb-wrap sb-wrap--right' // flotante también va a la derecha
})
</script>

<template>
  <!-- Fondo absoluto — se coloca antes del container -->
  <SectionBackground
    v-if="esFondo"
    :medio="medio"
  />

  <!-- Con layout lateral -->
  <div
    v-if="esLateral"
    class="container"
    :class="[wrapClase, containerClass]"
  >
    <!-- Media columna -->
    <div class="sb-wrap__media">
      <SectionBackground :medio="medio" />
    </div>

    <!-- Contenido columna -->
    <div class="sb-wrap__content">
      <slot />
    </div>
  </div>

  <!-- Sin media o fondo — container simple -->
  <div
    v-else
    class="container"
    :class="containerClass"
  >
    <slot />
  </div>
</template>
