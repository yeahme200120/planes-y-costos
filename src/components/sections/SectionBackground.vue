<script setup>
import { computed } from 'vue'
import { normalizarMedio, obtenerUrlMedio } from '../../services/mediaService.js'

const props = defineProps({
  medio: { type: Object, default: null },
})

const datos    = computed(() => normalizarMedio(props.medio))
const srcMedio = computed(() => obtenerUrlMedio(datos.value))

const esEmbed  = computed(() => datos.value.tipo === 'embed')
const esVideo  = computed(() => datos.value.tipo === 'video')
const esImagen = computed(() => datos.value.tipo === 'imagen' || datos.value.tipo === 'gif')
const esFondo  = computed(() => datos.value.posicion === 'fondo')

/*
 * TikTok bloquea iframes en dominos no autorizados.
 * En su lugar mostramos un enlace de reproducción.
 */
const esTikTok = computed(() =>
  datos.value.embedPlataforma === 'tiktok'
)

const mostrar = computed(() => {
  if (esEmbed.value) return Boolean(datos.value.embedUrl || datos.value.url)
  return Boolean(srcMedio.value && datos.value.tipo)
})

const animClases = computed(() => {
  const anim = datos.value.animacion
  if (!anim || anim === 'none' || esFondo.value) return []
  return [`sb-anim-${anim}`]
})

const estilo = computed(() => {
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
  <!-- Nada que mostrar -->
  <template v-if="!mostrar"></template>

  <!-- ── POSICIÓN FONDO ── absolute, z-index 0, detrás del contenido -->
  <div
    v-else-if="esFondo"
    class="sb sb--fondo"
    :style="estilo"
    aria-hidden="true"
  >
    <div v-if="esEmbed && !esTikTok" class="sb__embed-wrap">
      <iframe
        :src="datos.embedUrl"
        class="sb__embed"
        frameborder="0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        loading="lazy"
        :title="datos.alt || 'Video de fondo'"
      ></iframe>
    </div>
    <video
      v-else-if="esVideo"
      class="sb__media"
      :src="srcMedio"
      :poster="datos.poster || undefined"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
      :style="estiloMedia"
    ></video>
    <img
      v-else-if="esImagen"
      class="sb__media"
      :src="srcMedio"
      :alt="datos.alt || ''"
      loading="lazy"
      decoding="async"
      :style="estiloMedia"
    />
    <div class="sb__overlay"></div>
  </div>

  <!-- ── POSICIÓN LATERAL (derecha / izquierda / flotante) ──
       Se comporta como flex item dentro del container.
       El padre debe tener display:flex para que funcione. -->
  <div
    v-else
    class="sb sb--lateral"
    :class="[
      `sb--${datos.posicion}`,
      ...animClases,
    ]"
  >
    <!-- TikTok: no embebible, mostrar enlace -->
    <a
      v-if="esEmbed && esTikTok"
      :href="datos.url || datos.embedUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="sb__tiktok-link"
      :aria-label="datos.alt || 'Ver en TikTok'"
    >
      <span class="sb__tiktok-icon" aria-hidden="true">♪</span>
      <span>Ver en TikTok</span>
    </a>

    <!-- Embed iframe (YouTube, Vimeo, Facebook) -->
    <div v-else-if="esEmbed" class="sb__embed-wrap">
      <iframe
        :src="datos.embedUrl"
        class="sb__embed"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
        :title="datos.alt || 'Video'"
      ></iframe>
    </div>

    <!-- Video directo -->
    <video
      v-else-if="esVideo"
      class="sb__media"
      :src="srcMedio"
      :poster="datos.poster || undefined"
      :loop="datos.loop"
      :autoplay="datos.autoplay"
      :muted="datos.silencio"
      :controls="datos.controles"
      playsinline
      preload="metadata"
      :style="estiloMedia"
    ></video>

    <!-- Imagen / GIF -->
    <img
      v-else-if="esImagen"
      class="sb__media"
      :src="srcMedio"
      :alt="datos.alt || ''"
      loading="lazy"
      decoding="async"
      :style="estiloMedia"
    />
  </div>
</template>

<style scoped>
/* =========================================================
   BASE
   ========================================================= */
.sb {
  --sb-opacity:  0.4;
  --sb-duration: 800ms;
  --sb-delay:    0ms;
  --sb-radius:   var(--radius-xl, 20px);
}

/* =========================================================
   FONDO ABSOLUTO
   ========================================================= */
.sb--fondo {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.sb--fondo .sb__media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sb--fondo .sb__embed-wrap {
  width: 100%;
  height: 100%;
}

.sb--fondo .sb__embed {
  width: 100%;
  height: 100%;
  border: none;
}

.sb__overlay {
  position: absolute;
  inset: 0;
  background: var(--color-background);
  opacity: calc(1 - var(--sb-opacity));
  z-index: 1;
}

/* =========================================================
   LATERAL — flex item
   =========================================================
   El padre (.sb-wrap) controla el layout flex.
   .sb--lateral se comporta como columna de contenido.
   ========================================================= */
.sb--lateral {
  flex-shrink: 0;
  border-radius: var(--sb-radius);
  overflow: hidden;
  min-width: 0;
}

.sb--lateral .sb__media {
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
  border-radius: var(--sb-radius);
}

/* Embed 16:9 */
.sb--lateral .sb__embed-wrap {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: var(--sb-radius);
  overflow: hidden;
}

.sb--lateral .sb__embed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* TikTok link */
.sb__tiktok-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 200px;
  padding: 2rem;
  background: #010101;
  border-radius: var(--sb-radius);
  color: #fff;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  transition: opacity 0.2s;
}
.sb__tiktok-link:hover { opacity: 0.85; }
.sb__tiktok-icon { font-size: 2.5rem; }

/* Derecha: z-index para que quede encima del contenido en overlap */
.sb--derecha  { order: 2; }
.sb--izquierda { order: 0; }
.sb--flotante {
  max-width: 360px;
  box-shadow: var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.14));
}

/* =========================================================
   ANIMACIONES
   ========================================================= */
.sb-anim-fade-up    { animation: sbFadeUp    var(--sb-duration) var(--sb-delay) both ease-out; }
.sb-anim-fade-in    { animation: sbFadeIn    var(--sb-duration) var(--sb-delay) both ease-out; }
.sb-anim-slide-left { animation: sbSlideLeft var(--sb-duration) var(--sb-delay) both ease-out; }
.sb-anim-slide-right{ animation: sbSlideRight var(--sb-duration) var(--sb-delay) both ease-out; }
.sb-anim-zoom-in    { animation: sbZoomIn    var(--sb-duration) var(--sb-delay) both ease-out; }
.sb-anim-zoom-out   { animation: sbZoomOut   var(--sb-duration) var(--sb-delay) both ease-out; }
.sb-anim-float      { animation: sbFloat 4s ease-in-out infinite; }
.sb-anim-pulse      { animation: sbPulse 3s ease-in-out infinite; }

@keyframes sbFadeUp     { from { opacity:0; transform:translateY(28px); }  to { opacity:1; transform:translateY(0); } }
@keyframes sbFadeIn     { from { opacity:0; }                              to { opacity:1; } }
@keyframes sbSlideLeft  { from { opacity:0; transform:translateX(36px); }  to { opacity:1; transform:translateX(0); } }
@keyframes sbSlideRight { from { opacity:0; transform:translateX(-36px); } to { opacity:1; transform:translateX(0); } }
@keyframes sbZoomIn     { from { opacity:0; transform:scale(0.9); }        to { opacity:1; transform:scale(1); } }
@keyframes sbZoomOut    { from { opacity:0; transform:scale(1.1); }        to { opacity:1; transform:scale(1); } }
@keyframes sbFloat      { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
@keyframes sbPulse      { 0%,100%{transform:scale(1);}      50%{transform:scale(1.03);} }

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 700px) {
  .sb--lateral {
    max-width: 100% !important;
    border-radius: var(--radius-md);
    order: 0 !important;
  }

  .sb--lateral .sb__media {
    max-height: 280px;
  }
}
</style>
