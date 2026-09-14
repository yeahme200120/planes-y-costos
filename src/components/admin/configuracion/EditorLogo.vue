<script setup>
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

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

const imagenElemento =
  ref(null)

const cropper =
  ref(null)

const cropAspecto =
  ref('original')

const imagenZoom =
  ref(1)

const inicializando =
  ref(false)

const aspectos = [
  {
    valor: 'original',
    etiqueta: 'Original',
  },
  {
    valor: '1:1',
    etiqueta: '1:1',
  },
  {
    valor: '4:3',
    etiqueta: '4:3',
  },
  {
    valor: '16:9',
    etiqueta: '16:9',
  },
]

/* =========================================================
   ASPECT RATIO
   ========================================================= */

function obtenerAspectRatio() {
  switch (
    cropAspecto.value
  ) {
    case '1:1':
      return 1

    case '4:3':
      return 4 / 3

    case '16:9':
      return 16 / 9

    case 'original':
    default:
      return NaN
  }
}

/* =========================================================
   DESTRUIR CROPPER
   ========================================================= */

function destruirCropper() {
  if (
    !cropper.value
  ) {
    return
  }

  try {
    cropper.value.destroy()
  } catch (error) {
    console.warn(
      'No fue posible destruir correctamente el editor de imagen.',
      error,
    )
  }

  cropper.value =
    null
}

/* =========================================================
   ASPECT RATIO
   ========================================================= */

function aplicarAspecto() {
  if (
    !cropper.value
  ) {
    return
  }

  try {
    cropper.value.setAspectRatio(
      obtenerAspectRatio(),
    )
  } catch (error) {
    console.warn(
      'No fue posible aplicar la proporción seleccionada.',
      error,
    )
  }
}

/* =========================================================
   ZOOM
   ========================================================= */

function aplicarZoom() {
  if (
    !cropper.value ||
    props.procesando
  ) {
    return
  }

  const zoom =
    Math.min(
      3,
      Math.max(
        0.5,
        Number(
          imagenZoom.value,
        ) || 1,
      ),
    )

  imagenZoom.value =
    zoom

  try {
    cropper.value.zoomTo(
      zoom,
    )
  } catch (error) {
    console.warn(
      'No fue posible aplicar el zoom.',
      error,
    )
  }
}

/* =========================================================
   OPCIONES CROPPER
   ========================================================= */

function obtenerOpcionesCropper() {
  return {
    viewMode: 1,

    dragMode: 'move',

    responsive: true,

    restore: true,

    checkCrossOrigin: true,

    checkOrientation: true,

    background: false,

    autoCrop: true,

    movable: true,

    zoomable: true,

    rotatable: false,

    scalable: false,

    cropBoxMovable: true,

    cropBoxResizable: true,

    toggleDragModeOnDblclick:
      false,

    aspectRatio:
      obtenerAspectRatio(),

    minContainerWidth:
      320,

    minContainerHeight:
      320,

    ready() {
      inicializarZoom()
    },

    zoom(event) {
      const ratio =
        Number(
          event.detail?.ratio,
        )

      if (
        Number.isFinite(
          ratio,
        )
      ) {
        imagenZoom.value =
          Math.min(
            3,
            Math.max(
              0.5,
              ratio,
            ),
          )
      }
    },
  }
}

/* =========================================================
   ZOOM INICIAL
   ========================================================= */

function inicializarZoom() {
  if (
    !cropper.value
  ) {
    return
  }

  try {
    cropper.value.zoomTo(
      imagenZoom.value,
    )
  } catch {
    /*
     * Cropper puede seguir inicializándose.
     */
  }
}

/* =========================================================
   CARGAR IMAGEN
   ========================================================= */

async function cargarImagen() {
  destruirCropper()

  if (
    !props.imagenUrl
  ) {
    return
  }

  inicializando.value =
    true

  await nextTick()

  const imagen =
    imagenElemento.value

  if (!imagen) {
    inicializando.value =
      false

    return
  }

  try {
    /*
     * Esperar a que la imagen termine de cargar
     * cuando todavía no está disponible.
     */
    if (
      !imagen.complete ||
      imagen.naturalWidth === 0
    ) {
      await new Promise(
        (
          resolve,
          reject,
        ) => {
          const manejarCarga =
            () => {
              limpiarListeners()
              resolve()
            }

          const manejarError =
            () => {
              limpiarListeners()

              reject(
                new Error(
                  'No fue posible cargar la imagen seleccionada.',
                ),
              )
            }

          const limpiarListeners =
            () => {
              imagen.removeEventListener(
                'load',
                manejarCarga,
              )

              imagen.removeEventListener(
                'error',
                manejarError,
              )
            }

          imagen.addEventListener(
            'load',
            manejarCarga,
            {
              once: true,
            },
          )

          imagen.addEventListener(
            'error',
            manejarError,
            {
              once: true,
            },
          )
        },
      )
    }

    cropper.value =
      new Cropper(
        imagen,
        obtenerOpcionesCropper(),
      )
  } catch (error) {
    console.error(
      'No fue posible inicializar el editor de imagen.',
      error,
    )

    cropper.value =
      null
  } finally {
    inicializando.value =
      false
  }
}

/* =========================================================
   SELECCIONAR ASPECTO
   ========================================================= */

function seleccionarAspecto(
  aspecto,
) {
  if (
    props.procesando ||
    cropAspecto.value ===
      aspecto
  ) {
    return
  }

  cropAspecto.value =
    aspecto

  nextTick(() => {
    aplicarAspecto()
  })
}

/* =========================================================
   DISMINUIR ZOOM
   ========================================================= */

function disminuirZoom() {
  if (
    props.procesando
  ) {
    return
  }

  imagenZoom.value =
    Math.max(
      0.5,
      Math.round(
        (
          imagenZoom.value -
          0.05
        ) * 100,
      ) / 100,
    )

  aplicarZoom()
}

/* =========================================================
   AUMENTAR ZOOM
   ========================================================= */

function aumentarZoom() {
  if (
    props.procesando
  ) {
    return
  }

  imagenZoom.value =
    Math.min(
      3,
      Math.round(
        (
          imagenZoom.value +
          0.05
        ) * 100,
      ) / 100,
    )

  aplicarZoom()
}

/* =========================================================
   AJUSTAR ZOOM
   ========================================================= */

function ajustarZoom(
  event,
) {
  if (
    props.procesando
  ) {
    return
  }

  imagenZoom.value =
    Number(
      event.target.value,
    )

  aplicarZoom()
}

/* =========================================================
   RESTAURAR
   ========================================================= */

function restaurar() {
  if (
    props.procesando ||
    !cropper.value
  ) {
    return
  }

  cropAspecto.value =
    'original'

  imagenZoom.value =
    1

  try {
    cropper.value.reset()
  } catch (error) {
    console.warn(
      'No fue posible restaurar el editor.',
      error,
    )
  }

  nextTick(() => {
    aplicarAspecto()
    aplicarZoom()
  })
}

/* =========================================================
   GENERAR RECORTE
   ========================================================= */

async function generarRecorte() {
  if (
    !cropper.value
  ) {
    throw new Error(
      'El editor de imagen no está listo.',
    )
  }

  const canvas =
    cropper.value.getCroppedCanvas({
      /*
       * Limitamos la resolución para mantener
       * el tamaño final del logo razonable.
       */
      maxWidth: 1600,
      maxHeight: 1600,

      /*
       * JPG no conserva transparencia.
       * El fondo será blanco.
       */
      fillColor: '#ffffff',

      imageSmoothingEnabled:
        true,

      imageSmoothingQuality:
        'high',
    })

  if (!canvas) {
    throw new Error(
      'No se pudo generar el recorte.',
    )
  }

  /*
   * Convertimos directamente a JPG.
   *
   * Calidad 0.92:
   * buen equilibrio entre calidad visual
   * y tamaño del documento de Firestore.
   */
  const blob =
    await new Promise(
      (
        resolve,
        reject,
      ) => {
        canvas.toBlob(
          (resultado) => {
            if (!resultado) {
              reject(
                new Error(
                  'No se pudo convertir el recorte a JPG.',
                ),
              )

              return
            }

            resolve(
              resultado,
            )
          },
          'image/jpeg',
          0.92,
        )
      },
    )

  if (
    !(blob instanceof Blob)
  ) {
    throw new Error(
      'El resultado del editor no es un Blob válido.',
    )
  }

  if (
    blob.size <= 0
  ) {
    throw new Error(
      'El JPG generado está vacío.',
    )
  }

  /*
   * Algunos navegadores pueden devolver
   * un MIME diferente.
   *
   * Normalizamos explícitamente el Blob
   * a image/jpeg.
   */
  if (
    blob.type !==
    'image/jpeg'
  ) {
    console.warn(
      'El navegador devolvió un MIME distinto:',
      blob.type,
    )

    const buffer =
      await blob.arrayBuffer()

    return new Blob(
      [buffer],
      {
        type:
          'image/jpeg',
      },
    )
  }

  return blob
}

/* =========================================================
   GUARDAR
   ========================================================= */

async function guardar() {
  if (
    props.procesando ||
    inicializando.value
  ) {
    return
  }

  try {
    const blob =
      await generarRecorte()

    if (!blob) {
      return
    }

    /*
     * No se guarda directamente aquí.
     *
     * EditorLogo solamente genera el recurso.
     *
     * ConfiguracionIdentidad.vue recibe el Blob,
     * lo transforma a Uint8Array y lo envía a
     * Firestore.
     */
    emit(
      'guardar',
      {
        blob,

        aspecto:
          cropAspecto.value,

        zoom:
          imagenZoom.value,

        /*
         * Se conservan para mantener
         * compatibilidad con el contrato actual.
         */
        rotacion: 0,

        flipX: false,

        flipY: false,
      },
    )
  } catch (error) {
    console.error(
      'No fue posible generar el logo:',
      error,
    )
  }
}

/* =========================================================
   CANCELAR
   ========================================================= */

function cancelar() {
  if (
    props.procesando
  ) {
    return
  }

  emit(
    'cancelar',
  )
}

/* =========================================================
   WATCH IMAGEN
   ========================================================= */

watch(
  () =>
    props.imagenUrl,
  async () => {
    await nextTick()

    await cargarImagen()
  },
)

/* =========================================================
   MOUNTED
   ========================================================= */

onMounted(() => {
  cargarImagen()
})

/* =========================================================
   UNMOUNTED
   ========================================================= */

onBeforeUnmount(() => {
  destruirCropper()
})
</script>

<template>
  <div
    class="admin-configuracion__editor"
  >

    <!-- ===================================================
         HEADER
         =================================================== -->

    <div
      class="admin-configuracion__editor-header"
    >

      <div>

        <span
          class="admin-configuracion__section-kicker"
        >
          EDITOR
        </span>

        <h3>
          Ajustar logotipo
        </h3>

        <p>
          Arrastra la imagen para
          posicionarla y utiliza el
          control de zoom para ajustar
          el encuadre.
        </p>

      </div>

      <button
        type="button"
        class="admin-configuracion__icon-button"
        :disabled="
          procesando
        "
        @click="
          cancelar
        "
      >
        ×
      </button>

    </div>

    <!-- ===================================================
         BODY
         =================================================== -->

    <div
      class="admin-configuracion__editor-body"
    >

      <!-- =================================================
           CROPPER
           ================================================= -->

      <div
        class="admin-configuracion__canvas-wrapper admin-configuracion__cropper-wrapper"
        :class="{
          'is-processing':
            procesando ||
            inicializando,
        }"
      >

        <img
          ref="imagenElemento"
          :src="
            imagenUrl
          "
          alt="Imagen para recortar"
          class="admin-configuracion__crop-image"
          draggable="false"
        >

      </div>

      <!-- =================================================
           CONTROLES
           ================================================= -->

      <aside
        class="admin-configuracion__editor-controls"
      >

        <!-- PROPORCIÓN -->

        <div
          class="admin-configuracion__control-group"
        >

          <span
            class="admin-configuracion__control-title"
          >
            Proporción
          </span>

          <div
            class="admin-configuracion__segmented"
          >

            <button
              v-for="
                aspecto in aspectos
              "
              :key="
                aspecto.valor
              "
              type="button"
              :disabled="
                procesando
              "
              :class="{
                'is-active':
                  cropAspecto ===
                  aspecto.valor,
              }"
              @click="
                seleccionarAspecto(
                  aspecto.valor,
                )
              "
            >
              {{
                aspecto.etiqueta
              }}
            </button>

          </div>

        </div>

        <!-- ZOOM -->

        <div
          class="admin-configuracion__control-group"
        >

          <div
            class="admin-configuracion__range-label"
          >

            <span>
              Zoom
            </span>

            <strong>
              {{
                Math.round(
                  imagenZoom *
                    100,
                )
              }}%
            </strong>

          </div>

          <div
            class="admin-configuracion__zoom-control"
          >

            <button
              type="button"
              class="admin-configuracion__editor-control-button"
              :disabled="
                procesando ||
                imagenZoom <=
                  0.5
              "
              @click="
                disminuirZoom
              "
            >
              −
            </button>

            <input
              :value="
                imagenZoom
              "
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              :disabled="
                procesando
              "
              @input="
                ajustarZoom
              "
            >

            <button
              type="button"
              class="admin-configuracion__editor-control-button"
              :disabled="
                procesando ||
                imagenZoom >=
                  3
              "
              @click="
                aumentarZoom
              "
            >
              +
            </button>

          </div>

        </div>

        <!-- INFORMACIÓN -->

        <div
          class="admin-configuracion__control-group"
        >

          <span
            class="admin-configuracion__control-title"
          >
            Ajuste
          </span>

          <p
            class="admin-configuracion__editor-help"
          >
            Puedes mover la imagen,
            ampliar o reducir su tamaño
            y modificar el área de recorte
            desde los bordes del marco.
          </p>

        </div>

        <!-- RESTAURAR -->

        <button
          type="button"
          class="admin-configuracion__reset-editor"
          :disabled="
            procesando ||
            !cropper
          "
          @click="
            restaurar
          "
        >
          Restaurar ajustes
        </button>

      </aside>

    </div>

    <!-- ===================================================
         FOOTER
         =================================================== -->

    <footer
      class="admin-configuracion__editor-footer"
    >

      <button
        type="button"
        class="admin-configuracion__button admin-configuracion__button--secondary"
        :disabled="
          procesando
        "
        @click="
          cancelar
        "
      >
        Cancelar
      </button>

      <button
        type="button"
        class="admin-configuracion__button admin-configuracion__button--primary"
        :disabled="
          procesando ||
          inicializando ||
          !cropper
        "
        @click="
          guardar
        "
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
