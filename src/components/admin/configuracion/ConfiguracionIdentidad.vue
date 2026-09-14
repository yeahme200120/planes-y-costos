<script setup>
import {
  computed,
  onBeforeUnmount,
  ref,
} from 'vue'

import {
  getApp,
} from 'firebase/app'

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'

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
   FIREBASE STORAGE
   ========================================================= */

const storage = getStorage(
  getApp(),
)

/* =========================================================
   REFERENCIAS Y ESTADO
   ========================================================= */

const inputLogo = ref(null)

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

/* =========================================================
   RECURSOS ACTUALES
   ========================================================= */

const logoActual = computed(() => {
  return (
    props.configuracion?.logoUrl ||
    props.configuracion?.logoPngUrl ||
    '/img/logo.jpg'
  )
})

const faviconActual = computed(() => {
  return (
    props.configuracion?.faviconUrl ||
    props.configuracion?.logoIcoUrl ||
    props.configuracion?.logoPngUrl ||
    props.configuracion?.logoUrl ||
    '/favicon.ico'
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
   VALIDACIÓN DE ARCHIVO
   ========================================================= */

function esImagenPermitida(
  archivo,
) {
  if (!archivo) {
    return false
  }

  const tipoValido =
    !archivo.type ||
    tiposPermitidos.includes(
      archivo.type,
    )

  const nombre =
    String(
      archivo.name || '',
    ).toLowerCase()

  const extensionValida =
    extensionesPermitidas.some(
      (extension) =>
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
   SELECCIONAR ARCHIVO
   ========================================================= */

function seleccionarArchivo() {
  if (
    imagenProcesando.value
  ) {
    return
  }

  inputLogo.value?.click()
}

/* =========================================================
   MANEJAR ARCHIVO
   ========================================================= */

function manejarArchivo(event) {
  const archivo =
    event?.target?.files?.[0]

  if (!archivo) {
    return
  }

  imagenError.value = ''
  imagenMensaje.value = ''

  /* -------------------------------------------------------
     Validar formato
     ------------------------------------------------------- */

  if (
    !esImagenPermitida(
      archivo,
    )
  ) {
    imagenError.value =
      'Selecciona una imagen PNG, JPG, WEBP, GIF, SVG o ICO.'

    if (event?.target) {
      event.target.value = ''
    }

    return
  }

  /* -------------------------------------------------------
     Validar tamaño
     ------------------------------------------------------- */

  const maximo =
    15 * 1024 * 1024

  if (
    archivo.size > maximo
  ) {
    imagenError.value =
      'La imagen no puede superar los 15 MB.'

    if (event?.target) {
      event.target.value = ''
    }

    return
  }

  /* -------------------------------------------------------
     Cerrar selección anterior
     ------------------------------------------------------- */

  if (
    imagenSeleccionada.value
      ?.url
  ) {
    URL.revokeObjectURL(
      imagenSeleccionada.value
        .url,
    )
  }

  /* -------------------------------------------------------
     Crear preview local
     ------------------------------------------------------- */

  const url =
    URL.createObjectURL(
      archivo,
    )

  imagenSeleccionada.value = {
    archivo,
    url,
  }

  editorActivo.value = true
}

/* =========================================================
   CERRAR EDITOR
   ========================================================= */

function cerrarEditor() {
  if (
    imagenSeleccionada.value
      ?.url
  ) {
    URL.revokeObjectURL(
      imagenSeleccionada.value
        .url,
    )
  }

  imagenSeleccionada.value =
    null

  editorActivo.value =
    false

  if (inputLogo.value) {
    inputLogo.value.value =
      ''
  }
}

/* =========================================================
   NOMBRE ÚNICO PARA STORAGE
   ========================================================= */

function obtenerNombreLogo() {
  return (
    `configuracion/logo/logo-${Date.now()}.png`
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

  imagenError.value = ''
  imagenMensaje.value = ''

  try {
    /* -----------------------------------------------------
       Validar Blob
       ----------------------------------------------------- */

    if (
      !(datos.blob instanceof Blob)
    ) {
      throw new Error(
        'El editor no generó una imagen válida.',
      )
    }

    /* -----------------------------------------------------
       Crear referencia Firebase Storage
       ----------------------------------------------------- */

    const nombreArchivo =
      obtenerNombreLogo()

    const referencia =
      storageRef(
        storage,
        nombreArchivo,
      )

    /* -----------------------------------------------------
       Subir PNG directamente
       a Firebase Storage
       ----------------------------------------------------- */

    const metadata = {
      contentType:
        'image/png',

      cacheControl:
        'public,max-age=31536000,immutable',
    }

    const resultadoUpload =
      await uploadBytes(
        referencia,
        datos.blob,
        metadata,
      )

    if (
      !resultadoUpload?.ref
    ) {
      throw new Error(
        'Firebase Storage no devolvió una referencia válida.',
      )
    }

    /* -----------------------------------------------------
       Obtener URL pública
       ----------------------------------------------------- */

    const logoUrl =
      await getDownloadURL(
        resultadoUpload.ref,
      )

    if (
      !logoUrl
    ) {
      throw new Error(
        'Firebase Storage no devolvió la URL del logotipo.',
      )
    }

    /* -----------------------------------------------------
       Versión del recurso
       ----------------------------------------------------- */

    const logoVersion =
      Date.now()

    /* -----------------------------------------------------
       Actualizar configuración
       -----------------------------------------------------

       El padre de este componente continúa siendo
       responsable de guardar estos datos en:

         configuracion/general

       Este componente solamente genera/sube el recurso
       y emite la información actualizada.
       ----------------------------------------------------- */

    emit(
      'actualizar-logo',
      {
        logoUrl,
        logoPngUrl:
          logoUrl,

        /*
         * No generamos ICO artificialmente.
         *
         * El mismo PNG puede utilizarse como favicon
         * moderno del navegador.
         */
        logoIcoUrl:
          logoUrl,

        faviconUrl:
          logoUrl,

        logoVersion,

        /*
         * Conservamos información del editor.
         * Esto permite mantener registrada la edición
         * realizada aunque no sea necesaria para mostrar
         * el logo.
         */
        logoEditor: {
          aspecto:
            datos.aspecto ??
            null,

          zoom:
            datos.zoom ??
            null,

          rotacion:
            datos.rotacion ??
            0,

          flipX:
            datos.flipX ??
            false,

          flipY:
            datos.flipY ??
            false,
        },

        /*
         * Ruta interna de Firebase Storage.
         */
        logoStoragePath:
          nombreArchivo,
      },
    )

    imagenMensaje.value =
      'Logo actualizado correctamente. Guarda la configuración para confirmar los cambios.'

    cerrarEditor()
  } catch (error) {
    console.error(
      'Error procesando logo:',
      error,
    )

    imagenError.value =
      error?.message ||
      'No fue posible guardar el logo en Firebase Storage.'
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
    imagenSeleccionada.value
      ?.url
  ) {
    URL.revokeObjectURL(
      imagenSeleccionada.value
        .url,
    )
  }

  imagenSeleccionada.value =
    null
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
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon"
          @change="manejarArchivo"
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
              :src="logoActual"
              alt="Logotipo actual"
              loading="lazy"
            />

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
                configuracion.logoVersion
                  ? `Versión ${configuracion.logoVersion}`
                  : 'Recurso activo'
              }}
            </strong>

            <p>
              El mismo recurso puede utilizarse en
              Header, Sidebar y Footer.
            </p>

            <button
              type="button"
              class="admin-configuracion__button admin-configuracion__button--primary"
              :disabled="imagenProcesando"
              @click="seleccionarArchivo"
            >
              {{
                imagenProcesando
                  ? 'Procesando...'
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
            WEBP
          </span>

          <span>
            PNG
          </span>

          <span>
            JPG
          </span>

          <span>
            FAVICON
          </span>

        </div>

        <!-- =================================================
             MENSAJE ÉXITO
             ================================================= -->

        <div
          v-if="imagenMensaje"
          class="admin-configuracion__inline-message admin-configuracion__inline-message--success"
          role="status"
        >
          {{ imagenMensaje }}
        </div>

        <!-- =================================================
             MENSAJE ERROR
             ================================================= -->

        <div
          v-if="imagenError"
          class="admin-configuracion__inline-message admin-configuracion__inline-message--error"
          role="alert"
        >
          {{ imagenError }}
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
                configuracion.nombreEmpresa ||
                'Mi empresa'
              }}
            </span>

          </div>

          <div
            class="admin-configuracion__favicon-icon"
          >

            <img
              :src="faviconActual"
              alt="Favicon actual"
              loading="lazy"
            />

          </div>

        </div>

        <!-- =================================================
             INFORMACIÓN
             ================================================= -->

        <div
          class="admin-configuracion__info-box"
        >

          <strong>
            Recurso generado
          </strong>

          <span>
            El PNG recortado se almacena directamente
            en Firebase Storage y puede utilizarse
            también como favicon.
          </span>

        </div>

      </article>

    </div>

    <!-- ===================================================
         EDITOR DE LOGO
         =================================================== -->

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
      @cancelar="cerrarEditor"
      @guardar="guardarImagen"
    />

  </section>
</template>