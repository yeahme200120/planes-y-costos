<script setup>
import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'

import EditorLogo from './EditorLogo.vue'

const props = defineProps({
  configuracion: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'actualizar-logo',
])

/* =========================================================
   REFERENCIAS Y ESTADO
   ========================================================= */

const inputLogo =
  ref(null)

const imagenProcesando =
  ref(false)

const imagenMensaje =
  ref('')

const imagenError =
  ref('')

const editorActivo =
  ref(false)

const imagenSeleccionada =
  ref(null)

/*
 * URL temporal creada a partir del Blob almacenado
 * en Firestore.
 */
const logoBlobUrl =
  ref('')

/* =========================================================
   RECURSOS ACTUALES
   ========================================================= */

const logoActual =
  computed(() => {
    return (
      logoBlobUrl.value ||
      props.configuracion
        ?.logoUrl ||
      props.configuracion
        ?.logoPngUrl ||
      props.configuracion
        ?.logoIcoUrl ||
      ''
    )
  })

const faviconActual =
  computed(() => {
    return (
      logoBlobUrl.value ||
      props.configuracion
        ?.faviconUrl ||
      props.configuracion
        ?.logoIcoUrl ||
      props.configuracion
        ?.logoPngUrl ||
      props.configuracion
        ?.logoUrl ||
      ''
    )
  })

/* =========================================================
   TIPOS DE ARCHIVO
   ========================================================= */

const tiposPermitidos = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]

const extensionesPermitidas = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.ico',
]

/* =========================================================
   VALIDACIÓN
   ========================================================= */

function esImagenPermitida(
  archivo,
) {
  if (!archivo) {
    return false
  }

  const tipo =
    String(
      archivo.type || '',
    ).toLowerCase()

  const tipoValido =
    !tipo ||
    tiposPermitidos.includes(
      tipo,
    )

  const nombre =
    String(
      archivo.name || '',
    ).toLowerCase()

  const extensionValida =
    extensionesPermitidas.some(
      (
        extension,
      ) =>
        nombre.endsWith(
          extension,
        ),
    )

  return (
    tipoValido &&
    extensionValida
  )
}

/* =========================================================
   CONVERSIÓN DE BYTES
   ========================================================= */

/*
 * Firestore puede entregar los bytes como Uint8Array.
 *
 * También soportamos:
 *
 * - ArrayBuffer
 * - objeto Firebase Bytes con toUint8Array()
 * - Base64 de versiones anteriores
 */

function convertirAUint8Array(
  valor,
) {
  if (
    !valor
  ) {
    return null
  }

  if (
    valor instanceof Uint8Array
  ) {
    return valor
  }

  if (
    valor instanceof ArrayBuffer
  ) {
    return new Uint8Array(
      valor,
    )
  }

  if (
    typeof valor
      ?.toUint8Array ===
    'function'
  ) {
    return valor.toUint8Array()
  }

  if (
    typeof valor ===
    'string'
  ) {
    try {
      const binario =
        window.atob(
          valor,
        )

      const bytes =
        new Uint8Array(
          binario.length,
        )

      for (
        let i = 0;
        i <
        binario.length;
        i += 1
      ) {
        bytes[i] =
          binario.charCodeAt(
            i,
          )
      }

      return bytes
    } catch {
      return null
    }
  }

  /*
   * Soporte adicional para estructuras
   * serializadas que contengan bytes.
   */
  if (
    Array.isArray(
      valor,
    )
  ) {
    try {
      return new Uint8Array(
        valor,
      )
    } catch {
      return null
    }
  }

  if (
    Array.isArray(
      valor?._values,
    )
  ) {
    try {
      return new Uint8Array(
        valor._values,
      )
    } catch {
      return null
    }
  }

  return null
}

/* =========================================================
   LIBERAR URL DEL BLOB
   ========================================================= */

function liberarLogoBlobUrl() {
  if (
    logoBlobUrl.value
  ) {
    URL.revokeObjectURL(
      logoBlobUrl.value,
    )
  }

  logoBlobUrl.value =
    ''
}

/* =========================================================
   CARGAR LOGO DESDE FIRESTORE
   ========================================================= */

async function cargarLogoBlob(
  valor,
) {
  liberarLogoBlobUrl()

  const bytes =
    convertirAUint8Array(
      valor,
    )

  if (
    !bytes ||
    bytes.byteLength <= 0
  ) {
    return
  }

  const mimeType =
    props.configuracion
      ?.logoMimeType ||
    'image/jpeg'

  try {
    const blob =
      new Blob(
        [bytes],
        {
          type:
            mimeType,
        },
      )

    logoBlobUrl.value =
      URL.createObjectURL(
        blob,
      )
  } catch (
    error
  ) {
    console.error(
      'No fue posible crear la vista previa del logo almacenado en Firestore:',
      error,
    )

    logoBlobUrl.value =
      ''
  }
}

watch(
  () =>
    props.configuracion
      ?.logoBlob,
  (valor) => {
    cargarLogoBlob(
      valor,
    )
  },
  {
    immediate: true,
  },
)

/* =========================================================
   SELECCIONAR ARCHIVO
   ========================================================= */

function seleccionarArchivo() {
  if (
    imagenProcesando.value ||
    editorActivo.value
  ) {
    return
  }

  imagenError.value =
    ''

  imagenMensaje.value =
    ''

  inputLogo.value?.click()
}

/* =========================================================
   MANEJAR ARCHIVO
   ========================================================= */

function manejarArchivo(
  event,
) {
  if (
    imagenProcesando.value ||
    editorActivo.value
  ) {
    return
  }

  const archivo =
    event?.target?.files?.[0]

  if (!archivo) {
    return
  }

  imagenError.value =
    ''

  imagenMensaje.value =
    ''

  if (
    !esImagenPermitida(
      archivo,
    )
  ) {
    imagenError.value =
      'Selecciona una imagen PNG, JPG, WEBP, GIF, SVG o ICO.'

    if (
      event?.target
    ) {
      event.target.value =
        ''
    }

    return
  }

  /*
   * Aunque el archivo original pueda ser grande,
   * posteriormente el EditorLogo debe generar
   * el JPG final para Firestore.
   */
  const maximo =
    15 * 1024 * 1024

  if (
    archivo.size >
    maximo
  ) {
    imagenError.value =
      'La imagen no puede superar los 15 MB.'

    if (
      event?.target
    ) {
      event.target.value =
        ''
    }

    return
  }

  if (
    imagenSeleccionada
      .value?.url
  ) {
    URL.revokeObjectURL(
      imagenSeleccionada
        .value
        .url,
    )
  }

  /*
   * Preview completamente local.
   */
  const url =
    URL.createObjectURL(
      archivo,
    )

  imagenSeleccionada.value =
    {
      archivo,
      url,
    }

  editorActivo.value =
    true
}

/* =========================================================
   CERRAR EDITOR
   ========================================================= */

function cerrarEditor() {
  if (
    imagenSeleccionada
      .value?.url
  ) {
    URL.revokeObjectURL(
      imagenSeleccionada
        .value
        .url,
    )
  }

  imagenSeleccionada.value =
    null

  editorActivo.value =
    false

  if (
    inputLogo.value
  ) {
    inputLogo.value.value =
      ''
  }
}

/* =========================================================
   CONFIGURACIÓN DEL LOGO
   ========================================================= */

/*
 * Ya no existe una ruta física dentro de public/.
 *
 * El recurso principal ahora vive en:
 *
 * configuracion/general.logoBlob
 *
 * de Firestore.
 */

const RUTA_LOGO =
  'firestore:configuracion/general.logoBlob'

const MIME_LOGO =
  'image/jpeg'

/* =========================================================
   VALIDAR TAMAÑO PARA FIRESTORE
   ========================================================= */

/*
 * Firestore tiene un límite de 1 MiB por documento.
 *
 * Dejamos margen para el resto de campos de
 * configuracion/general.
 */
const MAXIMO_LOGO_FIRESTORE =
  700 * 1024

/* =========================================================
   CONVERTIR BLOB A UINT8ARRAY
   ========================================================= */

async function blobAUint8Array(
  blob,
) {
  if (
    !(blob instanceof Blob)
  ) {
    throw new Error(
      'El editor no generó una imagen válida.',
    )
  }

  const buffer =
    await blob.arrayBuffer()

  const bytes =
    new Uint8Array(
      buffer,
    )

  if (
    bytes.byteLength <= 0
  ) {
    throw new Error(
      'El editor generó una imagen vacía.',
    )
  }

  return bytes
}

/* =========================================================
   EMITIR CONFIGURACIÓN
   ========================================================= */

function emitirConfiguracionLogo(
  datos,
  version,
  bytes,
) {
  emit(
    'actualizar-logo',
    {
      /*
       * NUEVO:
       * bytes binarios directamente en Firestore.
       */
      logoBlob:
        bytes,

      /*
       * Tipo MIME utilizado para reconstruir
       * la imagen en el navegador.
       */
      logoMimeType:
        MIME_LOGO,

      /*
       * Mantenemos los campos existentes para
       * no romper la estructura actual.
       *
       * Las vistas nuevas deben priorizar logoBlob.
       */
      logoUrl:
        props.configuracion
          ?.logoUrl ||
        '',

      logoPngUrl:
        props.configuracion
          ?.logoPngUrl ||
        '',

      logoIcoUrl:
        props.configuracion
          ?.logoIcoUrl ||
        '',

      faviconUrl:
        props.configuracion
          ?.faviconUrl ||
        '',

      logoVersion:
        version,

      logoEditor:
        {
          aspecto:
            datos?.aspecto ??
            null,

          zoom:
            datos?.zoom ??
            null,

          rotacion:
            datos?.rotacion ??
            0,

          flipX:
            datos?.flipX ??
            false,

          flipY:
            datos?.flipY ??
            false,

          formato:
            'jpg',

          almacenamiento:
            'firestore',

          campo:
            'configuracion/general.logoBlob',

          actualizado:
            new Date()
              .toISOString(),
        },

      logoStoragePath:
        RUTA_LOGO,
    },
  )
}

/* =========================================================
   GUARDAR IMAGEN
   ========================================================= */

async function guardarImagen(
  datos,
) {
  if (
    !datos?.blob ||
    imagenProcesando.value
  ) {
    return
  }

  imagenProcesando.value =
    true

  imagenError.value =
    ''

  imagenMensaje.value =
    ''

  try {
    /*
     * 1. Validar el Blob.
     */
    if (
      !(datos.blob instanceof Blob)
    ) {
      throw new Error(
        'El editor no generó una imagen válida.',
      )
    }

    if (
      datos.blob.size <= 0
    ) {
      throw new Error(
        'El editor generó una imagen vacía.',
      )
    }

    /*
     * 2. Convertir directamente a bytes.
     *
     * No se utiliza:
     *
     * /__admin/logo
     * public/img/logo.jpg
     * File System Access API
     * Firebase Storage
     */
    imagenMensaje.value =
      'Preparando logo para Firestore...'

    const bytes =
      await blobAUint8Array(
        datos.blob,
      )

    /*
     * 3. Verificar tamaño.
     *
     * El documento entero de Firestore también
     * contiene el resto de configuraciones.
     */
    if (
      bytes.byteLength >
      MAXIMO_LOGO_FIRESTORE
    ) {
      throw new Error(
        'El logo recortado supera 700 KB. Reduce su tamaño o resolución antes de guardarlo.',
      )
    }

    /*
     * 4. Nueva versión.
     */
    const version =
      Date.now()

    /*
     * 5. Actualizar configuración.
     *
     * El componente padre deberá escribir
     * logoBlob como bytes directamente en Firestore.
     */
    imagenMensaje.value =
      'Guardando logo en Firestore...'

    emitirConfiguracionLogo(
      datos,
      version,
      bytes,
    )

    /*
     * 6. Actualizar inmediatamente la vista local.
     */
    liberarLogoBlobUrl()

    logoBlobUrl.value =
      URL.createObjectURL(
        new Blob(
          [bytes],
          {
            type:
              MIME_LOGO,
          },
        ),
      )

    /*
     * 7. Cerrar editor.
     */
    cerrarEditor()

    imagenMensaje.value =
      'Logo guardado correctamente en Firestore.'
  } catch (
    error
  ) {
    console.error(
      'Error procesando logo:',
      error,
    )

    imagenError.value =
      error?.message ||
      'No fue posible guardar el logo.'
  } finally {
    imagenProcesando.value =
      false
  }
}

/* =========================================================
   LIMPIEZA
   ========================================================= */

onBeforeUnmount(() => {
  if (
    imagenSeleccionada
      .value?.url
  ) {
    URL.revokeObjectURL(
      imagenSeleccionada
        .value
        .url,
    )
  }

  imagenSeleccionada.value =
    null

  editorActivo.value =
    false

  liberarLogoBlobUrl()
})
</script>

<template>
  <section
    class="admin-configuracion__panel"
  >

    <!-- ===================================================
         ENCABEZADO
         =================================================== -->

    <div
      class="admin-configuracion__panel-heading"
    >

      <div>

        <span
          class="admin-configuracion__section-kicker"
        >
          IDENTIDAD
        </span>

        <h2>
          Identidad visual
        </h2>

        <p>
          Define el logotipo y los recursos gráficos
          utilizados por la plataforma.
        </p>

      </div>

      <div
        class="admin-configuracion__identity-badge"
      >

        <span>
          Marca
        </span>

        <strong>
          Visual
        </strong>

      </div>

    </div>

    <!-- ===================================================
         IDENTIDAD
         =================================================== -->

    <div
      class="admin-configuracion__identity-grid"
    >

      <!-- =================================================
           LOGO
           ================================================= -->

      <article
        class="admin-configuracion__card admin-configuracion__identity-card"
      >

        <div
          class="admin-configuracion__card-heading"
        >

          <div>

            <h3>
              Logotipo principal
            </h3>

            <p>
              Carga una imagen y ajusta su posición,
              proporción y orientación.
            </p>

          </div>

        </div>

        <input
          ref="inputLogo"
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
          @change="
            manejarArchivo
          "
        />

        <!-- =================================================
             PREVISUALIZACIÓN
             ================================================= -->

        <div
          class="admin-configuracion__logo-stage"
        >

          <div
            class="admin-configuracion__logo-preview"
          >

            <img
              v-if="
                logoActual
              "
              :src="
                logoActual
              "
              alt="Logotipo actual"
              loading="lazy"
            />

            <span
              v-else
              aria-hidden="true"
            >
              {{
                (
                  configuracion
                    .logoTexto ||
                  configuracion
                    .nombreEmpresa ||
                  'IA'
                )
                  .slice(
                    0,
                    2,
                  )
                  .toUpperCase()
              }}
            </span>

          </div>

          <div
            class="admin-configuracion__logo-info"
          >

            <span
              class="admin-configuracion__mini-label"
            >
              LOGO ACTUAL
            </span>

            <strong>
              {{
                configuracion
                  .logoVersion
                  ? `Versión ${configuracion.logoVersion}`
                  : 'Recurso activo'
              }}
            </strong>

            <p>
              El recurso se almacena directamente
              en Firestore como:
              <strong>
                configuracion/general.logoBlob
              </strong>
            </p>

            <button
              type="button"
              class="admin-configuracion__button admin-configuracion__button--primary"
              :disabled="
                imagenProcesando ||
                editorActivo
              "
              @click="
                seleccionarArchivo
              "
            >
              {{
                imagenProcesando
                  ? 'Procesando...'
                  : editorActivo
                    ? 'Editor abierto...'
                    : 'Seleccionar imagen'
              }}
            </button>

          </div>

        </div>

        <!-- =================================================
             FORMATOS
             ================================================= -->

        <div
          class="admin-configuracion__resources"
        >

          <span>
            JPG
          </span>

          <span>
            Firestore
          </span>

          <span>
            Favicon
          </span>

          <span>
            Realtime
          </span>

        </div>

        <!-- =================================================
             MENSAJE ÉXITO
             ================================================= -->

        <div
          v-if="
            imagenMensaje
          "
          class="admin-configuracion__inline-message admin-configuracion__inline-message--success"
          role="status"
        >
          {{
            imagenMensaje
          }}
        </div>

        <!-- =================================================
             MENSAJE ERROR
             ================================================= -->

        <div
          v-if="
            imagenError
          "
          class="admin-configuracion__inline-message admin-configuracion__inline-message--error"
          role="alert"
        >
          {{
            imagenError
          }}
        </div>

      </article>

      <!-- =================================================
           FAVICON
           ================================================= -->

      <article
        class="admin-configuracion__card admin-configuracion__favicon-card"
      >

        <div
          class="admin-configuracion__card-heading"
        >

          <div>

            <h3>
              Favicon
            </h3>

            <p>
              Icono utilizado por el navegador.
            </p>

          </div>

        </div>

        <!-- =================================================
             PREVISUALIZACIÓN FAVICON
             ================================================= -->

        <div
          class="admin-configuracion__favicon-preview"
        >

          <div
            class="admin-configuracion__favicon-browser"
          >

            <span
              class="admin-configuracion__favicon-dot"
            ></span>

            <span>
              {{
                configuracion
                  .nombreEmpresa ||
                'Mi empresa'
              }}
            </span>

          </div>

          <div
            class="admin-configuracion__favicon-icon"
          >

            <img
              v-if="
                faviconActual
              "
              :src="
                faviconActual
              "
              alt="Favicon actual"
              loading="lazy"
            />

            <span
              v-else
              aria-hidden="true"
            >
              {{
                (
                  configuracion
                    .logoTexto ||
                  configuracion
                    .nombreEmpresa ||
                  'IA'
                )
                  .slice(
                    0,
                    2,
                  )
                  .toUpperCase()
              }}
            </span>

          </div>

        </div>

        <!-- =================================================
             INFORMACIÓN
             ================================================= -->

        <div
          class="admin-configuracion__info-box"
        >

          <strong>
            Almacenamiento Firebase
          </strong>

          <span>
            El logotipo se guarda como datos binarios
            directamente en
            configuracion/general.logoBlob,
            sin Firebase Storage, sin permisos adicionales
            y sin modificar archivos del proyecto.
          </span>

        </div>

      </article>

    </div>

    <!-- ===================================================
         EDITOR
         =================================================== -->

    <Teleport
      to="body"
    >

      <EditorLogo
        v-if="
          editorActivo &&
          imagenSeleccionada
        "
        :imagen-url="
          imagenSeleccionada.url
        "
        :procesando="
          imagenProcesando
        "
        @cancelar="
          cerrarEditor
        "
        @guardar="
          guardarImagen
        "
      />

    </Teleport>

  </section>
</template>
