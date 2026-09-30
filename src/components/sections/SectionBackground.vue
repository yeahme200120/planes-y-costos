<script setup>
/**
 * SectionBackground.vue
 *
 * Renderiza el medio de una sección en la landing page.
 *
 * Tipos soportados:
 *   imagen / gif  → <img>
 *   video         → <video>
 *   embed         → <iframe> (YouTube, TikTok, Vimeo, Facebook)
 *
 * Posiciones:
 *   fondo     → absolute inset-0, detrás del contenido
 *   derecha   → flex item a la derecha del contenido
 *   izquierda → flex item a la izquierda
 *   flotante  → card flotante con sombra
 */
import { computed } from 'vue'
import { normalizarMedio, obtenerUrlMedio } from '../../services/mediaService.js'

const props = defineProps({
  medio: { type: Object, default: null },
})

/* =========================================================
   ESTADO DERIVADO
   ========================================================= */

const datos     = computed(() => normalizarMedio(props.medio))
const srcMedio  = computed(() => obtenerUrlMedio(datos.value))

const esEmbed   = computed(() => datos.value.tipo === 'embed')
const esVideo   = computed(() => datos.value.tipo === 'video')
const esImagen  = computed(() => datos.value.tipo === 'imagen' || datos.value.tipo === 'gif')
const esFondo   = computed(() => datos.value.posicion === 'fondo')

// Mostrar si tiene contenido renderizable
const mostrar   = computed(() => {
  if (esEmbed.value)  return Boolean(datos.value.embedUrl)
  return Boolean(srcMedio.value && datos.value.tipo)
})

/* =========================================================
   ANIMACIÓN
   ========================================================= */

const clasesAnimacion = computed(() => {
  const anim = datos.value.animacion
  if (!anim || anim === 'none' || esFondo.value) return []
  return [`section-bg--anim-${anim}`]
})

/* =========================================================
   ESTILOS
   ========================================================= */

const estiloContenedor = computed(() => {
  if (!esFondo.value) return {}
  return {
    '--sb-opacity':  datos.value.opacidadFondo ?? 0.4,
    '--sb-duration': `${datos.value.duracion}ms`,
    '--sb-delay':    `${datos.value.retraso}ms`,
  }
})

const estiloMedia = computed(() => ({
  objectFit: datos.value.objectFit || 'cover',
}))
</script>

<template>
  <div
    v-if="mostrar"
    class="section-bg"
    :class="[
      `section-bg--${datos.posicion}`,
      ...clasesAnimacion,
      { 'section-bg--fondo': esFondo },
    ]"
    :style="estiloContenedor"
    :aria-hidden="esFondo ? 'true' : undefined"
  >

    <!-- ── EMBED (YouTube / TikTok / Vimeo / Facebook) ── -->
    <div v-if="esEmbed" class="section-bg__embed-wrap">
      <iframe
        :src="datos.embedUrl"
        class="section-bg__embed"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        loading="lazy"
        :title="datos.alt || 'Video'"
      ></iframe>
    </div>

    <!-- ── VIDEO DIRECTO ── -->
    <video
      v-else-if="esVideo"
      class="section-bg__media"
      :src="srcMedio"
      :poster="datos.poster || undefined"
      :loop="datos.loop"
      :autoplay="datos.autoplay"
      :muted="datos.silencio"
      :controls="datos.controles"
      playsinline
      preload="auto"
      :style="estiloMedia"
    ></video>

    <!-- ── IMAGEN / GIF ── -->
    <img
      v-else-if="esImagen"
      class="section-bg__media"
      :src="srcMedio"
      :alt="datos.alt || ''"
      loading="lazy"
      decoding="async"
      :style="estiloMedia"
    />

    <!-- Overlay de contraste (solo en posición fondo) -->
    <div v-if="esFondo" class="section-bg__overlay"></div>

  </div>
</template>

<style scoped>
.section-bg {
  --sb-opacity:  0.4;
  --sb-duration: 800ms;
  --sb-delay:    0ms;
  --sb-radius:   var(--radius-lg, 16px);
}

/* ── POSICIÓN: fondo ── */
.section-bg--fondo {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.section-bg--fondo .section-bg__media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.section-bg--fondo .section-bg__embed-wrap {
  width: 100%;
  height: 100%;
}

.section-bg--fondo .section-bg__embed {
  width: 100%;
  height: 100%;
  border: none;
}

.section-bg__overlay {
  position: absolute;
  inset: 0;
  background: var(--color-background);
  opacity: calc(1 - var(--sb-opacity));
  z-index: 1;
}

/* ── POSICIÓN: derecha / izquierda ── */
.section-bg--derecha,
.section-bg--izquierda {
  flex-shrink: 0;
  border-radius: var(--sb-radius);
  overflow: hidden;
  max-width: 480px;
  width: 100%;
}

.section-bg--derecha .section-bg__media,
.section-bg--izquierda .section-bg__media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: var(--sb-radius);
}

/* Embed en posición lateral — ratio 16:9 */
.section-bg--derecha .section-bg__embed-wrap,
.section-bg--izquierda .section-bg__embed-wrap {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: var(--sb-radius);
  overflow: hidden;
}

.section-bg--derecha .section-bg__embed,
.section-bg--izquierda .section-bg__embed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* ── POSICIÓN: flotante ── */
.section-bg--flotante {
  position: relative;
  border-radius: var(--sb-radius);
  overflow: hidden;
  max-width: 360px;
  box-shadow: var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.14));
}

.section-bg--flotante .section-bg__media {
  width: 100%;
  object-fit: cover;
  display: block;
}

.section-bg--flotante .section-bg__embed-wrap {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
}

.section-bg--flotante .section-bg__embed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* ── ANIMACIONES ── */
.section-bg--anim-fade-up    { animation: sbFadeUp    var(--sb-duration) var(--sb-delay) both ease-out; }
.section-bg--anim-fade-in    { animation: sbFadeIn    var(--sb-duration) var(--sb-delay) both ease-out; }
.section-bg--anim-slide-left { animation: sbSlideLeft var(--sb-duration) var(--sb-delay) both ease-out; }
.section-bg--anim-slide-right{ animation: sbSlideRight var(--sb-duration) var(--sb-delay) both ease-out; }
.section-bg--anim-zoom-in    { animation: sbZoomIn    var(--sb-duration) var(--sb-delay) both ease-out; }
.section-bg--anim-zoom-out   { animation: sbZoomOut   var(--sb-duration) var(--sb-delay) both ease-out; }
.section-bg--anim-float      { animation: sbFloat 4s ease-in-out infinite; }
.section-bg--anim-pulse      { animation: sbPulse 3s ease-in-out infinite; }

@keyframes sbFadeUp    { from { opacity:0; transform: translateY(32px); } to { opacity:1; transform: translateY(0); } }
@keyframes sbFadeIn    { from { opacity:0; } to { opacity:1; } }
@keyframes sbSlideLeft { from { opacity:0; transform: translateX(40px); }  to { opacity:1; transform: translateX(0); } }
@keyframes sbSlideRight{ from { opacity:0; transform: translateX(-40px); } to { opacity:1; transform: translateX(0); } }
@keyframes sbZoomIn    { from { opacity:0; transform: scale(0.88); } to { opacity:1; transform: scale(1); } }
@keyframes sbZoomOut   { from { opacity:0; transform: scale(1.12); } to { opacity:1; transform: scale(1); } }
@keyframes sbFloat     { 0%,100% { transform: translateY(0); }    50% { transform: translateY(-12px); } }
@keyframes sbPulse     { 0%,100% { transform: scale(1); }         50% { transform: scale(1.03); } }

/* ── RESPONSIVE ── */
@media (max-width: 700px) {
  .section-bg--derecha,
  .section-bg--izquierda,
  .section-bg--flotante {
    max-width: 100%;
    border-radius: var(--radius-md);
  }
}
</style>
