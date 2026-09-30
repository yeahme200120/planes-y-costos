<script setup>
import { computed, ref } from 'vue'
import {
  normalizarMedio,
  medioVacio,
  obtenerUrlMedio,
  procesarArchivoLocal,
  detectarMedioDesdeUrl,
} from '../../../services/mediaService.js'

const props = defineProps({
  seccionId: { type: String, required: true },
  modelValue: { type: Object, default: () => medioVacio() },
  disabled:   { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

/* =========================================================
   ESTADO
   ========================================================= */

const procesando      = ref(false)
const progreso        = ref(0)
const errorLocal      = ref('')
const urlBorrador     = ref('')
const mostrarOpciones = ref(false)
const arrastrandoDrop = ref(false)
const inputRef        = ref(null)

const medio      = computed(() => normalizarMedio(props.modelValue))
const urlMedio   = computed(() => obtenerUrlMedio(medio.value))
const tieneMedia = computed(() => Boolean(urlMedio.value || medio.value.embedUrl))
const esEmbed    = computed(() => medio.value.tipo === 'embed')
const esVideo    = computed(() => medio.value.tipo === 'video')
const esImagen   = computed(() => medio.value.tipo === 'imagen' || medio.value.tipo === 'gif')

/* =========================================================
   ICONOS DE PLATAFORMA
   ========================================================= */

const ICONOS_PLATAFORMA = {
  youtube:  '▶',
  tiktok:   '♪',
  vimeo:    '◎',
  facebook: 'f',
}

const iconoPlataforma = computed(() =>
  ICONOS_PLATAFORMA[medio.value.embedPlataforma] || '▶'
)

const labelTipo = computed(() => {
  if (esEmbed.value) {
    const p = medio.value.embedPlataforma
    if (p === 'youtube')  return 'YouTube'
    if (p === 'tiktok')   return 'TikTok'
    if (p === 'vimeo')    return 'Vimeo'
    if (p === 'facebook') return 'Facebook'
    return 'Video embed'
  }
  if (esVideo.value)  return 'Video'
  if (medio.value.tipo === 'gif') return 'GIF'
  if (esImagen.value) return 'Imagen'
  return ''
})

/* =========================================================
   OPCIONES
   ========================================================= */

const TIPOS_MANUAL = [
  { valor: 'imagen', label: 'Imagen'      },
  { valor: 'gif',    label: 'GIF animado' },
  { valor: 'video',  label: 'Video'       },
  { valor: 'embed',  label: 'Video embed (YouTube / TikTok / Vimeo)' },
]

const ANIMACIONES = [
  { valor: 'fade-up',    label: 'Fade Up'     },
  { valor: 'fade-in',    label: 'Fade In'     },
  { valor: 'slide-left', label: 'Slide Izq.'  },
  { valor: 'slide-right',label: 'Slide Der.'  },
  { valor: 'zoom-in',    label: 'Zoom In'     },
  { valor: 'zoom-out',   label: 'Zoom Out'    },
  { valor: 'float',      label: 'Float'       },
  { valor: 'pulse',      label: 'Pulse'       },
  { valor: 'none',       label: 'Sin animación' },
]

const POSICIONES = [
  { valor: 'derecha',   label: 'Derecha del contenido' },
  { valor: 'izquierda', label: 'Izquierda del contenido' },
  { valor: 'fondo',     label: 'Fondo de sección' },
  { valor: 'flotante',  label: 'Flotante decorativo' },
]

/* =========================================================
   EMIT HELPERS
   ========================================================= */

function actualizar(campo, valor) {
  emit('update:modelValue', { ...normalizarMedio(props.modelValue), [campo]: valor })
}

function actualizarMultiple(cambios) {
  emit('update:modelValue', { ...normalizarMedio(props.modelValue), ...cambios })
}

/* =========================================================
   ARCHIVO LOCAL
   ========================================================= */

async function procesarArchivo(archivo) {
  if (!archivo) return
  errorLocal.value = ''
  procesando.value = true
  progreso.value = 10

  const timer = setInterval(() => {
    if (progreso.value < 85) progreso.value += 15
  }, 200)

  try {
    const cambios = await procesarArchivoLocal(archivo)
    progreso.value = 100
    actualizarMultiple({
      ...cambios,
      alt: medio.value.alt || archivo.name.replace(/\.[^.]+$/, ''),
    })
    mostrarOpciones.value = true
  } catch (err) {
    errorLocal.value = err?.message || 'No se pudo procesar el archivo.'
  } finally {
    clearInterval(timer)
    setTimeout(() => { procesando.value = false; progreso.value = 0 }, 400)
  }
}

function abrirSelector() {
  if (!props.disabled && !procesando.value) inputRef.value?.click()
}

function onFileChange(e) {
  const archivo = e.target.files?.[0]
  if (archivo) procesarArchivo(archivo)
  if (inputRef.value) inputRef.value.value = ''
}

/* =========================================================
   DRAG & DROP
   ========================================================= */

function onDragOver(e) {
  e.preventDefault()
  if (!props.disabled && !procesando.value) arrastrandoDrop.value = true
}
function onDragLeave() { arrastrandoDrop.value = false }
function onDrop(e) {
  e.preventDefault()
  arrastrandoDrop.value = false
  if (props.disabled || procesando.value) return
  const archivo = e.dataTransfer?.files?.[0]
  if (archivo) procesarArchivo(archivo)
}

/* =========================================================
   URL / EMBED
   ========================================================= */

function aplicarUrl() {
  errorLocal.value = ''
  const url = urlBorrador.value.trim()
  if (!url) { errorLocal.value = 'Ingresa una URL.'; return }
  if (!/^https?:\/\/.+/.test(url)) { errorLocal.value = 'La URL debe comenzar con https://'; return }

  // Detectar automáticamente plataforma y tipo
  const deteccion = detectarMedioDesdeUrl(url)

  actualizarMultiple({
    url,
    tipo:            deteccion.tipo,
    embedUrl:        deteccion.embedUrl,
    embedPlataforma: deteccion.embedPlataforma,
    medioBlob:       '',
    mimeBlob:        '',
  })

  urlBorrador.value = ''
  mostrarOpciones.value = true
}

/* =========================================================
   CAMBIO MANUAL DE TIPO
   ========================================================= */

function cambiarTipo(nuevoTipo) {
  // Al cambiar tipo manualmente re-calculamos embedUrl si aplica
  const url = medio.value.url || ''
  if (nuevoTipo === 'embed') {
    const det = detectarMedioDesdeUrl(url)
    actualizarMultiple({
      tipo: 'embed',
      embedUrl: det.embedUrl || url,
      embedPlataforma: det.embedPlataforma,
    })
  } else {
    actualizarMultiple({
      tipo: nuevoTipo,
      embedUrl: '',
      embedPlataforma: '',
    })
  }
}

/* =========================================================
   ELIMINAR
   ========================================================= */

function eliminarMedio() {
  errorLocal.value = ''
  urlBorrador.value = ''
  mostrarOpciones.value = false
  emit('update:modelValue', medioVacio())
}
</script>

<template>
  <div class="mf">

    <!-- ── PREVIEW ── -->
    <div v-if="tieneMedia" class="mf__preview">

      <!-- Embed (YouTube / TikTok / Vimeo / Facebook) -->
      <div v-if="esEmbed && medio.embedUrl" class="mf__embed-wrap">
        <iframe
          :src="medio.embedUrl"
          class="mf__embed-frame"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
          :title="medio.alt || 'Video embed'"
        ></iframe>
      </div>

      <!-- Video directo -->
      <video
        v-else-if="esVideo"
        :src="urlMedio"
        class="mf__preview-media"
        muted playsinline preload="metadata"
        controls
      ></video>

      <!-- Imagen / GIF -->
      <img
        v-else-if="esImagen"
        :src="urlMedio"
        :alt="medio.alt || 'Preview'"
        class="mf__preview-media"
      />

      <div class="mf__preview-bar">
        <span class="mf__preview-tipo">
          <span v-if="esEmbed" class="mf__plat-icon">{{ iconoPlataforma }}</span>
          {{ labelTipo }}
          <span v-if="medio.medioBlob"> · Local</span>
        </span>
        <div class="mf__preview-btns">
          <button type="button" class="mf__btn-sec" @click="mostrarOpciones = !mostrarOpciones">
            {{ mostrarOpciones ? 'Ocultar' : 'Opciones' }}
          </button>
          <button type="button" class="mf__btn-del" :disabled="disabled" @click="eliminarMedio">
            × Quitar
          </button>
        </div>
      </div>
    </div>

    <!-- ── SUBIDA ARCHIVO ── -->
    <div
      class="mf__drop"
      :class="{
        'mf__drop--active':     arrastrandoDrop,
        'mf__drop--processing': procesando,
        'mf__drop--disabled':   disabled,
      }"
      role="button"
      tabindex="0"
      :aria-label="tieneMedia ? 'Reemplazar imagen' : 'Subir imagen'"
      @click="abrirSelector"
      @keydown.enter.space.prevent="abrirSelector"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div v-if="procesando" class="mf__prog">
        <div class="mf__prog-bar" :style="{ width: progreso + '%' }"></div>
      </div>

      <template v-if="procesando">
        <span class="mf__drop-icon mf__spin" aria-hidden="true">⟳</span>
        <span class="mf__drop-text">Comprimiendo... {{ progreso }}%</span>
      </template>
      <template v-else>
        <span class="mf__drop-icon" aria-hidden="true">{{ arrastrandoDrop ? '↓' : '↑' }}</span>
        <span class="mf__drop-text">
          {{ tieneMedia ? 'Arrastra o haz clic para reemplazar imagen' : 'Arrastra aquí o haz clic para subir imagen' }}
        </span>
        <span class="mf__drop-hint">JPG · PNG · WebP · GIF · AVIF</span>
      </template>
    </div>

    <input
      ref="inputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
      class="mf__file-hidden"
      :disabled="disabled || procesando"
      @change="onFileChange"
    />

    <!-- ── SEPARADOR ── -->
    <div class="mf__sep"><span>o pega una URL (imagen, video, YouTube, TikTok, Vimeo…)</span></div>

    <!-- ── URL ── -->
    <div class="mf__url-row">
      <input
        v-model="urlBorrador"
        type="url"
        class="mf__url-input"
        placeholder="https://..."
        :disabled="disabled || procesando"
        @keydown.enter.prevent="aplicarUrl"
      />
      <button
        type="button"
        class="mf__url-btn"
        :disabled="disabled || procesando || !urlBorrador.trim()"
        @click="aplicarUrl"
      >
        Aplicar
      </button>
    </div>

    <!-- ── ERROR ── -->
    <p v-if="errorLocal" class="mf__error" role="alert">{{ errorLocal }}</p>

    <!-- ── OPCIONES ── -->
    <div v-if="tieneMedia && mostrarOpciones" class="mf__opts">

      <!-- Cambiar tipo manualmente -->
      <div class="mf__opt">
        <label class="mf__opt-label">Tipo de medio</label>
        <select
          :value="medio.tipo"
          class="mf__select"
          :disabled="disabled"
          @change="cambiarTipo($event.target.value)"
        >
          <option v-for="t in TIPOS_MANUAL" :key="t.valor" :value="t.valor">
            {{ t.label }}
          </option>
        </select>
      </div>

      <!-- URL embed manual (para embed sin detección automática) -->
      <div v-if="esEmbed" class="mf__opt">
        <label class="mf__opt-label">URL del embed (si no se detectó automáticamente)</label>
        <input
          type="url"
          :value="medio.embedUrl"
          class="mf__input"
          :disabled="disabled"
          placeholder="https://www.youtube.com/embed/..."
          @input="actualizar('embedUrl', $event.target.value)"
        />
      </div>

      <div class="mf__opt">
        <label class="mf__opt-label">Posición en la sección</label>
        <select
          :value="medio.posicion"
          class="mf__select"
          :disabled="disabled"
          @change="actualizar('posicion', $event.target.value)"
        >
          <option v-for="op in POSICIONES" :key="op.valor" :value="op.valor">
            {{ op.label }}
          </option>
        </select>
      </div>

      <div v-if="medio.posicion === 'fondo'" class="mf__opt">
        <label class="mf__opt-label">
          Transparencia del overlay
          <span class="mf__badge">{{ Math.round(medio.opacidadFondo * 100) }}%</span>
        </label>
        <input
          type="range" min="0" max="1" step="0.05"
          :value="medio.opacidadFondo"
          class="mf__range"
          :disabled="disabled"
          @input="actualizar('opacidadFondo', parseFloat($event.target.value))"
        />
        <span class="mf__opt-hint">0% = imagen completamente visible · 100% = imagen oculta</span>
      </div>

      <div class="mf__opt">
        <label class="mf__opt-label">Animación</label>
        <select
          :value="medio.animacion"
          class="mf__select"
          :disabled="disabled"
          @change="actualizar('animacion', $event.target.value)"
        >
          <option v-for="op in ANIMACIONES" :key="op.valor" :value="op.valor">
            {{ op.label }}
          </option>
        </select>
      </div>

      <div class="mf__opt">
        <label class="mf__opt-label">
          Duración animación
          <span class="mf__badge">{{ medio.duracion }}ms</span>
        </label>
        <input
          type="range" min="200" max="2000" step="100"
          :value="medio.duracion"
          class="mf__range"
          :disabled="disabled"
          @input="actualizar('duracion', parseInt($event.target.value))"
        />
      </div>

      <div class="mf__opt">
        <label class="mf__opt-label">Texto alternativo</label>
        <input
          type="text"
          :value="medio.alt"
          class="mf__input"
          :disabled="disabled"
          placeholder="Descripción de la imagen para accesibilidad"
          @input="actualizar('alt', $event.target.value)"
        />
      </div>

      <!-- Opciones específicas de video directo -->
      <template v-if="esVideo">
        <div class="mf__opt">
          <label class="mf__opt-label">Imagen de portada (URL)</label>
          <input
            type="url"
            :value="medio.poster"
            class="mf__input"
            :disabled="disabled"
            placeholder="https://..."
            @input="actualizar('poster', $event.target.value)"
          />
        </div>
        <div class="mf__checks">
          <label class="mf__check">
            <input type="checkbox" :checked="medio.loop"     :disabled="disabled" @change="actualizar('loop',     $event.target.checked)" />
            Repetir
          </label>
          <label class="mf__check">
            <input type="checkbox" :checked="medio.autoplay" :disabled="disabled" @change="actualizar('autoplay', $event.target.checked)" />
            Autoplay
          </label>
          <label class="mf__check">
            <input type="checkbox" :checked="medio.silencio" :disabled="disabled" @change="actualizar('silencio', $event.target.checked)" />
            Sin sonido
          </label>
          <label class="mf__check">
            <input type="checkbox" :checked="medio.controles":disabled="disabled" @change="actualizar('controles',$event.target.checked)" />
            Mostrar controles
          </label>
        </div>
      </template>

    </div>

  </div>
</template>

<style scoped>
.mf { display: flex; flex-direction: column; gap: 0.6rem; }

/* ── PREVIEW ── */
.mf__preview {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-background-alt);
}
.mf__preview-media { width: 100%; max-height: 200px; object-fit: cover; display: block; }

/* Embed iframe */
.mf__embed-wrap {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 */
  background: #000;
}
.mf__embed-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.mf__preview-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.4rem 0.65rem; gap: 0.5rem; flex-wrap: wrap;
  background: var(--color-surface); border-top: 1px solid var(--color-border);
}
.mf__preview-tipo {
  font-size: 0.72rem; font-weight: 600;
  color: var(--color-text-secondary);
  display: flex; align-items: center; gap: 0.3rem;
}
.mf__plat-icon {
  font-size: 0.9rem;
  color: var(--color-primary);
}
.mf__preview-btns { display: flex; gap: 0.4rem; }
.mf__btn-sec {
  font-size: 0.74rem; padding: 0.2rem 0.5rem;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-background); color: var(--color-text-secondary); cursor: pointer;
}
.mf__btn-del {
  font-size: 0.74rem; padding: 0.2rem 0.5rem;
  border: 1px solid var(--color-danger); border-radius: var(--radius-sm);
  background: transparent; color: var(--color-danger); cursor: pointer;
}

/* ── DROP ── */
.mf__drop {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.25rem; padding: 1.4rem 1rem; min-height: 86px;
  border: 2px dashed var(--color-border); border-radius: var(--radius-md);
  background: var(--color-background-alt);
  cursor: pointer; text-align: center; user-select: none;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.mf__drop:hover:not(.mf__drop--disabled):not(.mf__drop--processing),
.mf__drop:focus-visible {
  border-color: var(--color-primary);
  background: var(--color-surface);
  outline: none;
}
.mf__drop--active    { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)); }
.mf__drop--processing { pointer-events: none; }
.mf__drop--disabled  { opacity: 0.55; cursor: not-allowed; }
.mf__drop-icon { font-size: 1.3rem; color: var(--color-text-muted); }
.mf__spin { display: inline-block; animation: mfSpin 0.7s linear infinite; color: var(--color-primary); }
@keyframes mfSpin { to { transform: rotate(360deg); } }
.mf__drop-text { font-size: 0.84rem; font-weight: 500; color: var(--color-text-secondary); }
.mf__drop-hint { font-size: 0.71rem; color: var(--color-text-muted); }

/* PROGRESO */
.mf__prog { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--color-border); }
.mf__prog-bar { height: 100%; background: var(--color-primary); transition: width 0.2s ease; }
.mf__file-hidden { display: none; }

/* ── SEPARADOR ── */
.mf__sep {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.72rem; color: var(--color-text-muted);
}
.mf__sep::before, .mf__sep::after { content: ''; flex: 1; height: 1px; background: var(--color-border); }

/* ── URL ── */
.mf__url-row { display: flex; gap: 0.45rem; }
.mf__url-input {
  flex: 1; min-width: 0; padding: 0.42rem 0.6rem; font-size: 0.825rem;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-background); color: var(--color-text);
}
.mf__url-input:focus { outline: none; border-color: var(--color-primary); }
.mf__url-btn {
  flex-shrink: 0; padding: 0.42rem 1rem; font-size: 0.825rem; font-weight: 600;
  background: var(--color-primary); color: var(--color-primary-text);
  border: none; border-radius: var(--radius-sm); cursor: pointer;
}
.mf__url-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── ERROR ── */
.mf__error { font-size: 0.8rem; color: var(--color-danger); margin: 0; }

/* ── OPCIONES ── */
.mf__opts {
  display: flex; flex-direction: column; gap: 0.6rem;
  padding: 0.85rem; background: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
}
.mf__opt { display: flex; flex-direction: column; gap: 0.2rem; }
.mf__opt-label {
  font-size: 0.78rem; font-weight: 500; color: var(--color-text-secondary);
  display: flex; justify-content: space-between; align-items: center;
}
.mf__opt-hint { font-size: 0.69rem; color: var(--color-text-muted); }
.mf__badge { font-weight: 600; color: var(--color-primary); font-size: 0.74rem; }
.mf__select,
.mf__input {
  width: 100%; padding: 0.38rem 0.55rem; font-size: 0.8rem; box-sizing: border-box;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-background); color: var(--color-text);
}
.mf__range { width: 100%; accent-color: var(--color-primary); cursor: pointer; }
.mf__checks { display: flex; flex-wrap: wrap; gap: 0.55rem; }
.mf__check {
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.78rem; color: var(--color-text-secondary); cursor: pointer;
}

@media (max-width: 480px) {
  .mf__url-row { flex-direction: column; }
  .mf__url-btn { width: 100%; }
}
</style>
