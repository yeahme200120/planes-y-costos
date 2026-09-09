<script setup>
import {
  computed,
  ref,
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

const imageManagerUrl =
  import.meta.env.VITE_IMAGE_MANAGER_URL ||
  'http://localhost:8787'

const inputLogo = ref(null)

const imagenProcesando = ref(false)
const imagenMensaje = ref('')
const imagenError = ref('')

const editorActivo = ref(false)
const imagenSeleccionada = ref(null)

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
    '/favicon.ico'
  )
})

function seleccionarArchivo() {
  inputLogo.value?.click()
}

function manejarArchivo(event) {
  const archivo = event.target.files?.[0]

  if (!archivo) return

  imagenError.value = ''
  imagenMensaje.value = ''

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

  if (
    archivo.type &&
    !tiposPermitidos.includes(archivo.type)
  ) {
    imagenError.value =
      'Selecciona una imagen PNG, JPG, WEBP, GIF, SVG o ICO.'

    event.target.value = ''
    return
  }

  if (archivo.size > 15 * 1024 * 1024) {
    imagenError.value =
      'La imagen no puede superar los 15 MB.'

    event.target.value = ''
    return
  }

  const url = URL.createObjectURL(archivo)

  imagenSeleccionada.value = {
    archivo,
    url,
  }

  editorActivo.value = true
}

function cerrarEditor() {
  if (imagenSeleccionada.value?.url) {
    URL.revokeObjectURL(
      imagenSeleccionada.value.url,
    )
  }

  imagenSeleccionada.value = null
  editorActivo.value = false

  if (inputLogo.value) {
    inputLogo.value.value = ''
  }
}

async function guardarImagen(datos) {
  if (!datos?.blob) return

  imagenProcesando.value = true
  imagenError.value = ''
  imagenMensaje.value = ''

  try {
    const healthResponse = await fetch(
      `${imageManagerUrl}/api/health`,
    )

    if (!healthResponse.ok) {
      throw new Error(
        'El administrador de imágenes no está disponible.',
      )
    }

    const formData = new FormData()

    formData.append(
      'image',
      datos.blob,
      'logo.png',
    )

    const response = await fetch(
      `${imageManagerUrl}/api/images/logo`,
      {
        method: 'POST',
        body: formData,
      },
    )

    if (!response.ok) {
      throw new Error(
        'No fue posible subir la imagen.',
      )
    }

    const resultado = await response.json()

    emit('actualizar-logo', {
      logoUrl: resultado.logoUrl,
      logoPngUrl: resultado.logoPngUrl,
      logoIcoUrl: resultado.logoIcoUrl,
      faviconUrl: resultado.faviconUrl,
      logoVersion: resultado.logoVersion,
    })

    imagenMensaje.value =
      'Logo actualizado. Guarda la configuración para confirmar los cambios.'

    cerrarEditor()
  } catch (error) {
    console.error(error)

    imagenError.value =
      error?.message ||
      'No fue posible procesar el logo.'
  } finally {
    imagenProcesando.value = false
  }
}
</script>

<template>
  <section class="admin-configuracion__panel">

    <div class="admin-configuracion__panel-heading">
      <div>
        <span class="admin-configuracion__section-kicker">
          IDENTIDAD
        </span>

        <h2>Identidad visual</h2>

        <p>
          Define el logotipo y los recursos gráficos
          utilizados por la plataforma.
        </p>
      </div>

      <div class="admin-configuracion__identity-badge">
        <span>Marca</span>
        <strong>Visual</strong>
      </div>
    </div>

    <div class="admin-configuracion__identity-grid">

      <!-- LOGO -->
      <article class="admin-configuracion__card admin-configuracion__identity-card">

        <div class="admin-configuracion__card-heading">
          <div>
            <h3>Logotipo principal</h3>
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

        <div class="admin-configuracion__logo-stage">

          <div class="admin-configuracion__logo-preview">
            <img
              :src="logoActual"
              alt="Logotipo actual"
            />
          </div>

          <div class="admin-configuracion__logo-info">
            <span class="admin-configuracion__mini-label">
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
              @click="seleccionarArchivo"
            >
              Seleccionar imagen
            </button>
          </div>
        </div>

        <div class="admin-configuracion__resources">
          <span>WEBP</span>
          <span>PNG</span>
          <span>ICO</span>
          <span>FAVICON</span>
        </div>

        <div
          v-if="imagenMensaje"
          class="admin-configuracion__inline-message admin-configuracion__inline-message--success"
        >
          {{ imagenMensaje }}
        </div>

        <div
          v-if="imagenError"
          class="admin-configuracion__inline-message admin-configuracion__inline-message--error"
        >
          {{ imagenError }}
        </div>

      </article>

      <!-- FAVICON -->
      <article class="admin-configuracion__card admin-configuracion__favicon-card">

        <div class="admin-configuracion__card-heading">
          <div>
            <h3>Favicon</h3>
            <p>
              Icono utilizado por el navegador.
            </p>
          </div>
        </div>

        <div class="admin-configuracion__favicon-preview">
          <div class="admin-configuracion__favicon-browser">
            <span class="admin-configuracion__favicon-dot" />

            <span>
              {{ configuracion.nombreEmpresa || 'Mi empresa' }}
            </span>
          </div>

          <div class="admin-configuracion__favicon-icon">
            <img
              :src="faviconActual"
              alt="Favicon actual"
            />
          </div>
        </div>

        <div class="admin-configuracion__info-box">
          <strong>Recursos generados</strong>

          <span>
            El gestor de imágenes genera automáticamente
            las variantes necesarias.
          </span>
        </div>

      </article>

    </div>

    <!-- EDITOR -->
    <EditorLogo
      v-if="editorActivo && imagenSeleccionada"
      :imagen-url="imagenSeleccionada.url"
      :procesando="imagenProcesando"
      @cancelar="cerrarEditor"
      @guardar="guardarImagen"
    />

  </section>
</template>