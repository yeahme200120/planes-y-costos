<script setup>
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
} from 'vue'

const props = defineProps({
  imagenUrl: {
    type: String,
    required: true,
  },

  procesando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'cancelar',
  'guardar',
])

const cropCanvas = ref(null)
const imagenCargada = ref(null)

const imagenZoom = ref(1)
const imagenRotacion = ref(0)

const flipX = ref(false)
const flipY = ref(false)

const cropAspecto = ref('original')

const cropX = ref(0)
const cropY = ref(0)

const arrastrando = ref(false)
const punteroX = ref(0)
const punteroY = ref(0)

const editorWidth = 720
const editorHeight = 430
const editorMargin = 24

const areaWidth = computed(
  () => editorWidth - editorMargin * 2,
)

const areaHeight = computed(
  () => editorHeight - editorMargin * 2,
)

const cropWidth = computed(() => {
  if (cropAspecto.value === '1:1') {
    return Math.min(
      areaWidth.value,
      areaHeight.value,
    )
  }

  if (cropAspecto.value === '4:3') {
    const ratio = 4 / 3

    const width =
      Math.min(
        areaWidth.value,
        areaHeight.value * ratio,
      )

    return width
  }

  if (cropAspecto.value === '16:9') {
    const ratio = 16 / 9

    return Math.min(
      areaWidth.value,
      areaHeight.value * ratio,
    )
  }

  return areaWidth.value
})

const cropHeight = computed(() => {
  if (cropAspecto.value === '1:1') {
    return cropWidth.value
  }

  if (cropAspecto.value === '4:3') {
    return cropWidth.value * (3 / 4)
  }

  if (cropAspecto.value === '16:9') {
    return cropWidth.value * (9 / 16)
  }

  return areaHeight.value
})

const cropLeft = computed(
  () =>
    (editorWidth - cropWidth.value) / 2,
)

const cropTop = computed(
  () =>
    (editorHeight - cropHeight.value) / 2,
)

const estiloCrop = computed(() => ({
  left: `${cropLeft.value}px`,
  top: `${cropTop.value}px`,
  width: `${cropWidth.value}px`,
  height: `${cropHeight.value}px`,
}))

function cargarImagen() {
  if (!props.imagenUrl) return

  const imagen = new Image()

  imagen.onload = () => {
    imagenCargada.value = imagen

    cropX.value = 0
    cropY.value = 0

    nextTick(dibujarEditor)
  }

  imagen.onerror = () => {
    imagenCargada.value = null
  }

  imagen.src = props.imagenUrl
}

function obtenerTransformacionImagen() {
  const imagen = imagenCargada.value

  if (!imagen) return null

  const angulo =
    ((imagenRotacion.value % 360) + 360) % 360

  const rotada =
    angulo === 90 || angulo === 270

  const ancho =
    rotada
      ? imagen.naturalHeight
      : imagen.naturalWidth

  const alto =
    rotada
      ? imagen.naturalWidth
      : imagen.naturalHeight

  const escalaBase = Math.max(
    cropWidth.value / ancho,
    cropHeight.value / alto,
  )

  const escala =
    escalaBase * imagenZoom.value

  return {
    ancho,
    alto,
    escala,
  }
}

function dibujarEditor() {
  const canvas = cropCanvas.value
  const imagen = imagenCargada.value

  if (!canvas || !imagen) return

  const ctx = canvas.getContext('2d')

  canvas.width = editorWidth
  canvas.height = editorHeight

  ctx.clearRect(
    0,
    0,
    editorWidth,
    editorHeight,
  )

  ctx.fillStyle = '#111827'

  ctx.fillRect(
    0,
    0,
    editorWidth,
    editorHeight,
  )

  const transformacion =
    obtenerTransformacionImagen()

  if (!transformacion) return

  ctx.save()

  ctx.translate(
    editorWidth / 2 + cropX.value,
    editorHeight / 2 + cropY.value,
  )

  ctx.rotate(
    (imagenRotacion.value * Math.PI) / 180,
  )

  ctx.scale(
    flipX.value ? -1 : 1,
    flipY.value ? -1 : 1,
  )

  const ancho =
    imagen.naturalWidth *
    transformacion.escala

  const alto =
    imagen.naturalHeight *
    transformacion.escala

  ctx.drawImage(
    imagen,
    -ancho / 2,
    -alto / 2,
    ancho,
    alto,
  )

  ctx.restore()

  ctx.save()

  ctx.fillStyle =
    'rgba(0, 0, 0, 0.58)'

  ctx.beginPath()

  ctx.rect(
    0,
    0,
    editorWidth,
    editorHeight,
  )

  ctx.rect(
    cropLeft.value,
    cropTop.value,
    cropWidth.value,
    cropHeight.value,
  )

  ctx.fill('evenodd')

  ctx.restore()

  ctx.save()

  ctx.strokeStyle =
    'rgba(255, 255, 255, 0.95)'

  ctx.lineWidth = 2

  ctx.strokeRect(
    cropLeft.value,
    cropTop.value,
    cropWidth.value,
    cropHeight.value,
  )

  ctx.strokeStyle =
    'rgba(255, 255, 255, 0.30)'

  ctx.lineWidth = 1

  for (let i = 1; i < 3; i++) {
    const x =
      cropLeft.value +
      (cropWidth.value / 3) * i

    const y =
      cropTop.value +
      (cropHeight.value / 3) * i

    ctx.beginPath()
    ctx.moveTo(
      x,
      cropTop.value,
    )
    ctx.lineTo(
      x,
      cropTop.value + cropHeight.value,
    )
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(
      cropLeft.value,
      y,
    )
    ctx.lineTo(
      cropLeft.value + cropWidth.value,
      y,
    )
    ctx.stroke()
  }

  ctx.restore()
}

function iniciarArrastre(event) {
  arrastrando.value = true

  punteroX.value =
    event.clientX

  punteroY.value =
    event.clientY

  event.currentTarget?.setPointerCapture?.(
    event.pointerId,
  )
}

function moverImagen(event) {
  if (!arrastrando.value) return

  cropX.value +=
    event.clientX - punteroX.value

  cropY.value +=
    event.clientY - punteroY.value

  punteroX.value = event.clientX
  punteroY.value = event.clientY

  dibujarEditor()
}

function terminarArrastre() {
  arrastrando.value = false
}

function manejarWheel(event) {
  event.preventDefault()

  const incremento =
    event.deltaY > 0 ? -0.05 : 0.05

  imagenZoom.value = Math.min(
    3,
    Math.max(
      0.5,
      imagenZoom.value + incremento,
    ),
  )
}

function rotar(direccion) {
  imagenRotacion.value =
    (imagenRotacion.value + direccion + 360) %
    360

  dibujarEditor()
}

function restaurar() {
  imagenZoom.value = 1
  imagenRotacion.value = 0

  flipX.value = false
  flipY.value = false

  cropX.value = 0
  cropY.value = 0

  cropAspecto.value = 'original'

  dibujarEditor()
}

function generarRecorte() {
  const imagen = imagenCargada.value

  if (!imagen) return null

  const escalaSalida = Math.min(
    1600 / cropWidth.value,
    1600 / cropHeight.value,
  )

  const salidaWidth =
    Math.round(
      cropWidth.value * escalaSalida,
    )

  const salidaHeight =
    Math.round(
      cropHeight.value * escalaSalida,
    )

  const canvas =
    document.createElement('canvas')

  canvas.width = salidaWidth
  canvas.height = salidaHeight

  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#FFFFFF'

  ctx.fillRect(
    0,
    0,
    salidaWidth,
    salidaHeight,
  )

  const transformacion =
    obtenerTransformacionImagen()

  ctx.save()

  ctx.translate(
    salidaWidth / 2 -
      cropX.value * escalaSalida,
    salidaHeight / 2 -
      cropY.value * escalaSalida,
  )

  ctx.rotate(
    (imagenRotacion.value * Math.PI) / 180,
  )

  ctx.scale(
    flipX.value ? -1 : 1,
    flipY.value ? -1 : 1,
  )

  const ancho =
    imagen.naturalWidth *
    transformacion.escala *
    escalaSalida

  const alto =
    imagen.naturalHeight *
    transformacion.escala *
    escalaSalida

  ctx.drawImage(
    imagen,
    -ancho / 2,
    -alto / 2,
    ancho,
    alto,
  )

  ctx.restore()

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      'image/png',
      0.95,
    )
  })
}

async function guardar() {
  const blob = await generarRecorte()

  if (!blob) return

  emit('guardar', {
    blob,
    aspecto: cropAspecto.value,
    zoom: imagenZoom.value,
    rotacion: imagenRotacion.value,
    flipX: flipX.value,
    flipY: flipY.value,
  })
}

watch(
  () => props.imagenUrl,
  cargarImagen,
)

watch(
  [
    cropAspecto,
    imagenZoom,
    imagenRotacion,
    flipX,
    flipY,
    cropX,
    cropY,
  ],
  () => {
    nextTick(dibujarEditor)
  },
)

onMounted(() => {
  cargarImagen()
})
</script>

<template>
  <div class="admin-configuracion__editor">

    <div class="admin-configuracion__editor-header">
      <div>
        <span class="admin-configuracion__section-kicker">
          EDITOR
        </span>

        <h3>Ajustar logotipo</h3>

        <p>
          Arrastra la imagen para cambiar su posición
          y utiliza las herramientas para ajustarla.
        </p>
      </div>

      <button
        type="button"
        class="admin-configuracion__icon-button"
        @click="$emit('cancelar')"
      >
        ×
      </button>
    </div>

    <div class="admin-configuracion__editor-body">

      <div class="admin-configuracion__canvas-wrapper">

        <canvas
          ref="cropCanvas"
          class="admin-configuracion__crop-canvas"
          @pointerdown="iniciarArrastre"
          @pointermove="moverImagen"
          @pointerup="terminarArrastre"
          @pointercancel="terminarArrastre"
          @wheel="manejarWheel"
        />

        <div
          class="admin-configuracion__crop-frame"
          :style="estiloCrop"
        />
      </div>

      <aside class="admin-configuracion__editor-controls">

        <div class="admin-configuracion__control-group">
          <span class="admin-configuracion__control-title">
            Proporción
          </span>

          <div class="admin-configuracion__segmented">
            <button
              v-for="aspecto in [
                'original',
                '1:1',
                '4:3',
                '16:9',
              ]"
              :key="aspecto"
              type="button"
              :class="{
                'is-active':
                  cropAspecto === aspecto,
              }"
              @click="cropAspecto = aspecto"
            >
              {{ aspecto }}
            </button>
          </div>
        </div>

        <div class="admin-configuracion__control-group">

          <div class="admin-configuracion__range-label">
            <span>Zoom</span>
            <strong>
              {{ Math.round(imagenZoom * 100) }}%
            </strong>
          </div>

          <input
            v-model.number="imagenZoom"
            type="range"
            min="0.5"
            max="3"
            step="0.05"
          />
        </div>

        <div class="admin-configuracion__control-group">

          <div class="admin-configuracion__range-label">
            <span>Rotación</span>
            <strong>
              {{ imagenRotacion }}°
            </strong>
          </div>

          <input
            v-model.number="imagenRotacion"
            type="range"
            min="0"
            max="359"
            step="1"
          />
        </div>

        <div class="admin-configuracion__control-group">

          <span class="admin-configuracion__control-title">
            Transformación
          </span>

          <div class="admin-configuracion__editor-buttons">

            <button
              type="button"
              @click="rotar(-90)"
            >
              ↶ Rotar
            </button>

            <button
              type="button"
              @click="rotar(90)"
            >
              ↷ Rotar
            </button>

            <button
              type="button"
              @click="flipX = !flipX"
            >
              ↔ Espejo X
            </button>

            <button
              type="button"
              @click="flipY = !flipY"
            >
              ↕ Espejo Y
            </button>

          </div>
        </div>

        <button
          type="button"
          class="admin-configuracion__reset-editor"
          @click="restaurar"
        >
          Restaurar ajustes
        </button>

      </aside>
    </div>

    <footer class="admin-configuracion__editor-footer">

      <button
        type="button"
        class="admin-configuracion__button admin-configuracion__button--secondary"
        :disabled="procesando"
        @click="$emit('cancelar')"
      >
        Cancelar
      </button>

      <button
        type="button"
        class="admin-configuracion__button admin-configuracion__button--primary"
        :disabled="procesando"
        @click="guardar"
      >
        {{
          procesando
            ? 'Procesando...'
            : 'Usar este logo'
        }}
      </button>

    </footer>

  </div>
</template>