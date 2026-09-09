<script setup>
import {
  computed,
  reactive,
  ref,
} from 'vue'

import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../../config/firebase'

const props = defineProps({
  contenido: {
    type: Object,
    default: () => ({}),
  },

  configuracion: {
    type: Object,
    default: () => ({}),
  },
})

/*
|--------------------------------------------------------------------------
| Formulario
|--------------------------------------------------------------------------
*/

const formulario = reactive({
  nombre: '',
  email: '',
  telefono: '',
  asunto: '',
  mensaje: '',
})

const errores = reactive({
  nombre: '',
  email: '',
  telefono: '',
  asunto: '',
  mensaje: '',
})

const estado = ref('idle')
const mensajeEstado = ref('')

/*
|--------------------------------------------------------------------------
| Información de contacto
|--------------------------------------------------------------------------
*/

const telefono = computed(() => {
  return String(
    props.configuracion?.telefono ||
      props.contenido?.telefono ||
      '',
  ).trim()
})

const email = computed(() => {
  return String(
    props.configuracion?.email ||
      props.contenido?.email ||
      '',
  ).trim()
})

const whatsapp = computed(() => {
  return String(
    props.configuracion?.whatsapp ||
      props.contenido?.whatsapp ||
      '',
  ).trim()
})

const direccion = computed(() => {
  return String(
    props.configuracion?.direccion ||
      props.contenido?.direccion ||
      '',
  ).trim()
})

/*
|--------------------------------------------------------------------------
| Contenido
|--------------------------------------------------------------------------
*/

const titulo = computed(() => {
  return String(
    props.contenido?.titulo ||
      'Hablemos de tu proyecto',
  ).trim()
})

const descripcion = computed(() => {
  return String(
    props.contenido?.descripcion ||
      'Cuéntanos qué necesitas y nos pondremos en contacto contigo.',
  ).trim()
})

const botonTexto = computed(() => {
  return String(
    props.contenido?.botonTexto ||
      'Enviar mensaje',
  ).trim()
})

const mensajeExito = computed(() => {
  return String(
    props.contenido?.mensajeExito ||
      'Tu mensaje fue enviado correctamente. Nos pondremos en contacto contigo pronto.',
  ).trim()
})

const mensajeError = computed(() => {
  return String(
    props.contenido?.mensajeError ||
      'No fue posible enviar tu mensaje. Inténtalo nuevamente.',
  ).trim()
})

/*
|--------------------------------------------------------------------------
| URLs de contacto
|--------------------------------------------------------------------------
*/

const whatsappUrl = computed(() => {
  const valor = whatsapp.value

  if (!valor) {
    return ''
  }

  if (/^https?:\/\/wa\.me\//i.test(valor)) {
    return valor
  }

  const numero = valor.replace(/\D/g, '')

  return numero
    ? `https://wa.me/${numero}`
    : ''
})

const telefonoUrl = computed(() => {
  if (!telefono.value) {
    return ''
  }

  return `tel:${telefono.value.replace(/\D/g, '')}`
})

const emailUrl = computed(() => {
  if (!email.value) {
    return ''
  }

  return `mailto:${email.value}`
})

const mostrarContacto = computed(() => {
  return Boolean(
    telefono.value ||
      email.value ||
      whatsappUrl.value ||
      direccion.value,
  )
})

const enviarBloqueado = computed(() => {
  return estado.value === 'sending'
})

/*
|--------------------------------------------------------------------------
| Normalización de campos
|--------------------------------------------------------------------------
*/

/**
 * Nombre
 *
 * Permitidos:
 * - Letras
 * - Vocales acentuadas
 * - Ñ
 * - Ü
 * - Espacios
 *
 * No permite:
 * - Números
 * - @
 * - # 
 * - $
 * - %
 * - Otros caracteres especiales
 */
function limpiarNombre(valor) {
  return String(valor ?? '')
    .replace(
      /[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g,
      '',
    )
    .replace(/\s{2,}/g, ' ')
}

/**
 * Correo
 *
 * Se permiten los caracteres habituales
 * de una dirección de correo electrónico.
 *
 * Los espacios siempre se eliminan.
 */
function limpiarEmail(valor) {
  return String(valor ?? '')
    .replace(
      /[^\w.!#$%&'*+/=?^`{|}~@-]/g,
      '',
    )
    .replace(/\s/g, '')
}

/**
 * Teléfono
 *
 * SOLO:
 * 0-9
 *
 * Máximo:
 * 10 dígitos
 */
function limpiarTelefono(valor) {
  return String(valor ?? '')
    .replace(/\D/g, '')
    .slice(0, 10)
}

/**
 * Asunto
 *
 * Permite:
 * - Letras
 * - Números
 * - Acentos
 * - Ñ
 * - Espacios
 * - Puntuación común
 */
function limpiarAsunto(valor) {
  return String(valor ?? '')
    .replace(
      /[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü.,!?¿¡:;()'"%+\-/#&\s]/g,
      '',
    )
    .replace(/\s{2,}/g, ' ')
}

/**
 * Mensaje
 *
 * Conserva texto, acentos, números y
 * puntuación.
 *
 * Elimina caracteres de control.
 */
function limpiarMensaje(valor) {
  return String(valor ?? '')
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      '',
    )
}

/*
|--------------------------------------------------------------------------
| Normalización en tiempo real
|--------------------------------------------------------------------------
*/

function normalizarNombre() {
  formulario.nombre = limpiarNombre(
    formulario.nombre,
  )
}

function normalizarEmail() {
  formulario.email = limpiarEmail(
    formulario.email,
  )
}

function normalizarTelefono() {
  formulario.telefono =
    limpiarTelefono(
      formulario.telefono,
    )
}

function normalizarAsunto() {
  formulario.asunto =
    limpiarAsunto(
      formulario.asunto,
    )
}

function normalizarMensaje() {
  formulario.mensaje =
    limpiarMensaje(
      formulario.mensaje,
    )
}

/*
|--------------------------------------------------------------------------
| Validación
|--------------------------------------------------------------------------
*/

function limpiarErrores() {
  Object.keys(errores).forEach((campo) => {
    errores[campo] = ''
  })
}

function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
    valor,
  )
}

function validarFormulario() {
  limpiarErrores()

  /*
   * Normalizar nuevamente antes de validar.
   * Esto garantiza que nunca se envíen datos
   * sin limpiar a Firestore.
   */
  normalizarNombre()
  normalizarEmail()
  normalizarTelefono()
  normalizarAsunto()
  normalizarMensaje()

  let valido = true

  const nombre =
    formulario.nombre.trim()

  const emailValor =
    formulario.email.trim()

  const telefonoValor =
    formulario.telefono.trim()

  const asunto =
    formulario.asunto.trim()

  const mensaje =
    formulario.mensaje.trim()

  /*
  |--------------------------------------------------------------------------
  | Nombre
  |--------------------------------------------------------------------------
  */

  if (!nombre) {
    errores.nombre =
      'Ingresa tu nombre.'

    valido = false
  } else if (nombre.length < 2) {
    errores.nombre =
      'El nombre debe tener al menos 2 caracteres.'

    valido = false
  } else if (nombre.length > 100) {
    errores.nombre =
      'El nombre no puede superar los 100 caracteres.'

    valido = false
  }

  /*
  |--------------------------------------------------------------------------
  | Email
  |--------------------------------------------------------------------------
  */

  if (!emailValor) {
    errores.email =
      'Ingresa tu correo electrónico.'

    valido = false
  } else if (emailValor.length > 150) {
    errores.email =
      'El correo no puede superar los 150 caracteres.'

    valido = false
  } else if (!validarEmail(emailValor)) {
    errores.email =
      'Ingresa un correo electrónico válido.'

    valido = false
  }

  /*
  |--------------------------------------------------------------------------
  | Teléfono
  |--------------------------------------------------------------------------
  |
  | Es opcional.
  |
  | Pero si el usuario escribe algo:
  | DEBE contener exactamente 10 dígitos.
  |
  */

  if (telefonoValor) {
    if (!/^\d{10}$/.test(telefonoValor)) {
      errores.telefono =
        'El teléfono debe contener exactamente 10 dígitos.'

      valido = false
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Asunto
  |--------------------------------------------------------------------------
  */

  if (asunto.length > 120) {
    errores.asunto =
      'El asunto no puede superar los 120 caracteres.'

    valido = false
  }

  /*
  |--------------------------------------------------------------------------
  | Mensaje
  |--------------------------------------------------------------------------
  */

  if (!mensaje) {
    errores.mensaje =
      'Escribe un mensaje.'

    valido = false
  } else if (mensaje.length < 10) {
    errores.mensaje =
      'El mensaje debe tener al menos 10 caracteres.'

    valido = false
  } else if (mensaje.length > 2000) {
    errores.mensaje =
      'El mensaje no puede superar los 2000 caracteres.'

    valido = false
  }

  return valido
}

/*
|--------------------------------------------------------------------------
| Limpiar formulario
|--------------------------------------------------------------------------
*/

function limpiarFormulario() {
  formulario.nombre = ''
  formulario.email = ''
  formulario.telefono = ''
  formulario.asunto = ''
  formulario.mensaje = ''

  limpiarErrores()
}

/*
|--------------------------------------------------------------------------
| WhatsApp
|--------------------------------------------------------------------------
*/

function crearMensajeWhatsApp() {
  const nombre =
    formulario.nombre.trim()

  const emailValor =
    formulario.email.trim()

  const telefonoValor =
    formulario.telefono.trim()

  const asunto =
    formulario.asunto.trim()

  const mensaje =
    formulario.mensaje.trim()

  return [
    'Hola, quiero solicitar información.',
    '',
    `Nombre: ${nombre}`,
    `Correo: ${emailValor}`,

    telefonoValor
      ? `Teléfono: ${telefonoValor}`
      : '',

    asunto
      ? `Asunto: ${asunto}`
      : '',

    '',
    mensaje,
  ]
    .filter(Boolean)
    .join('\n')
}

function abrirWhatsApp() {
  if (!whatsappUrl.value) {
    return
  }

  const url =
    new URL(
      whatsappUrl.value,
    )

  url.searchParams.set(
    'text',
    crearMensajeWhatsApp(),
  )

  window.open(
    url.toString(),
    '_blank',
    'noopener,noreferrer',
  )
}

/*
|--------------------------------------------------------------------------
| Email
|--------------------------------------------------------------------------
*/

function abrirEmail() {
  if (!email.value) {
    return
  }

  const asunto =
    formulario.asunto.trim() ||
    'Solicitud de información'

  const cuerpo =
    crearMensajeWhatsApp()

  const url =
    `mailto:${email.value}` +
    `?subject=${encodeURIComponent(asunto)}` +
    `&body=${encodeURIComponent(cuerpo)}`

  window.location.href = url
}

/*
|--------------------------------------------------------------------------
| Enviar formulario
|--------------------------------------------------------------------------
*/

async function enviarFormulario() {
  if (enviarBloqueado.value) {
    return
  }

  if (!validarFormulario()) {
    return
  }

  estado.value = 'sending'
  mensajeEstado.value = ''

  try {
    const referencia =
      await addDoc(
        collection(
          db,
          'contactos',
        ),
        {
          nombre:
            formulario.nombre.trim(),

          email:
            formulario.email.trim(),

          telefono:
            formulario.telefono.trim(),

          asunto:
            formulario.asunto.trim(),

          mensaje:
            formulario.mensaje.trim(),

          estado: 'nuevo',

          origen: 'landing',

          fecha:
            serverTimestamp(),
        },
      )

    if (!referencia?.id) {
      throw new Error(
        'No se obtuvo el identificador del contacto.',
      )
    }

    estado.value =
      'success'

    mensajeEstado.value =
      mensajeExito.value

    limpiarFormulario()
  } catch (error) {
    console.error(
      'Error al enviar formulario de contacto:',
      error,
    )

    estado.value =
      'error'

    mensajeEstado.value =
      mensajeError.value
  }
}

function reiniciarEstado() {
  estado.value =
    'idle'

  mensajeEstado.value =
    ''
}
</script>

<template>
  <section
    v-if="
      contenido &&
      contenido.activo !== false
    "
    id="contacto"
    class="section contact"
    aria-labelledby="contact-title"
  >
    <div class="container">
      <div class="contact__card">

        <!-- Información -->
        <div class="contact__content">

          <span
            v-if="contenido.eyebrow"
            class="section-eyebrow"
          >
            {{ contenido.eyebrow }}
          </span>

          <h2
            id="contact-title"
            class="contact__title"
          >
            {{ titulo }}
          </h2>

          <p
            class="contact__description"
          >
            {{ descripcion }}
          </p>

          <div
            v-if="mostrarContacto"
            class="contact__details"
          >

            <!-- Teléfono -->
            <div
              v-if="telefono"
              class="contact__detail"
            >
              <span
                class="contact__detail-icon"
                aria-hidden="true"
              >
                ☎
              </span>

              <div>
                <span
                  class="contact__detail-label"
                >
                  Teléfono
                </span>

                <a
                  :href="telefonoUrl"
                >
                  {{ telefono }}
                </a>
              </div>
            </div>

            <!-- Email -->
            <div
              v-if="email"
              class="contact__detail"
            >
              <span
                class="contact__detail-icon"
                aria-hidden="true"
              >
                @
              </span>

              <div>
                <span
                  class="contact__detail-label"
                >
                  Correo
                </span>

                <a
                  :href="emailUrl"
                >
                  {{ email }}
                </a>
              </div>
            </div>

            <!-- Dirección -->
            <div
              v-if="direccion"
              class="contact__detail"
            >
              <span
                class="contact__detail-icon"
                aria-hidden="true"
              >
                ●
              </span>

              <div>
                <span
                  class="contact__detail-label"
                >
                  Ubicación
                </span>

                <span>
                  {{ direccion }}
                </span>
              </div>
            </div>

          </div>

          <!-- Contacto alternativo -->
          <div
            v-if="
              whatsappUrl ||
              email
            "
            class="contact__alternatives"
          >
            <span
              class="contact__alternatives-title"
            >
              También puedes contactarnos directamente
            </span>

            <div
              class="contact__alternative-buttons"
            >

              <!-- WhatsApp -->
              <button
                v-if="whatsappUrl"
                type="button"
                class="contact__alternative contact__alternative--whatsapp"
                @click="abrirWhatsApp"
              >
                <span
                  aria-hidden="true"
                >
                  WA
                </span>

                <span>
                  WhatsApp
                </span>
              </button>

              <!-- Email -->
              <button
                v-if="email"
                type="button"
                class="contact__alternative"
                @click="abrirEmail"
              >
                <span
                  aria-hidden="true"
                >
                  @
                </span>

                <span>
                  Email
                </span>
              </button>

            </div>
          </div>

        </div>

        <!-- Formulario -->
        <div
          class="contact__form-wrapper"
        >
          <form
            class="contact__form"
            novalidate
            @submit.prevent="enviarFormulario"
          >

            <!-- Encabezado -->
            <div
              class="contact__form-header"
            >
              <span>
                Solicita información
              </span>

              <p>
                Completa el formulario y nos pondremos en contacto contigo.
              </p>
            </div>

            <div
              class="contact__fields"
            >

              <!-- Nombre -->
              <div
                class="contact__field"
              >
                <label
                  for="contact-nombre"
                >
                  Nombre

                  <span
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>

                <input
                  id="contact-nombre"
                  v-model="formulario.nombre"
                  @input="normalizarNombre"
                  type="text"
                  name="nombre"
                  autocomplete="name"
                  maxlength="100"
                  placeholder="Tu nombre"
                  :aria-invalid="
                    Boolean(
                      errores.nombre,
                    )
                  "
                  :aria-describedby="
                    errores.nombre
                      ? 'contact-nombre-error'
                      : undefined
                  "
                >

                <span
                  v-if="errores.nombre"
                  id="contact-nombre-error"
                  class="contact__field-error"
                >
                  {{ errores.nombre }}
                </span>
              </div>

              <!-- Email -->
              <div
                class="contact__field"
              >
                <label
                  for="contact-email"
                >
                  Correo electrónico

                  <span
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>

                <input
                  id="contact-email"
                  v-model="formulario.email"
                  @input="normalizarEmail"
                  type="email"
                  name="email"
                  autocomplete="email"
                  maxlength="150"
                  placeholder="correo@ejemplo.com"
                  :aria-invalid="
                    Boolean(
                      errores.email,
                    )
                  "
                  :aria-describedby="
                    errores.email
                      ? 'contact-email-error'
                      : undefined
                  "
                >

                <span
                  v-if="errores.email"
                  id="contact-email-error"
                  class="contact__field-error"
                >
                  {{ errores.email }}
                </span>
              </div>

              <!-- Teléfono -->
              <div
                class="contact__field"
              >
                <label
                  for="contact-telefono"
                >
                  Teléfono

                  <span
                    class="contact__optional"
                  >
                    Opcional
                  </span>
                </label>

                <input
                  id="contact-telefono"
                  v-model="formulario.telefono"
                  @input="normalizarTelefono"
                  type="tel"
                  inputmode="numeric"
                  pattern="[0-9]{10}"
                  name="telefono"
                  autocomplete="tel"
                  maxlength="10"
                  placeholder="7351234567"
                  :aria-invalid="
                    Boolean(
                      errores.telefono,
                    )
                  "
                  :aria-describedby="
                    errores.telefono
                      ? 'contact-telefono-error'
                      : undefined
                  "
                >

                <span
                  v-if="errores.telefono"
                  id="contact-telefono-error"
                  class="contact__field-error"
                >
                  {{ errores.telefono }}
                </span>
              </div>

              <!-- Asunto -->
              <div
                class="contact__field"
              >
                <label
                  for="contact-asunto"
                >
                  Asunto

                  <span
                    class="contact__optional"
                  >
                    Opcional
                  </span>
                </label>

                <input
                  id="contact-asunto"
                  v-model="formulario.asunto"
                  @input="normalizarAsunto"
                  type="text"
                  name="asunto"
                  maxlength="120"
                  placeholder="¿En qué podemos ayudarte?"
                  :aria-invalid="
                    Boolean(
                      errores.asunto,
                    )
                  "
                  :aria-describedby="
                    errores.asunto
                      ? 'contact-asunto-error'
                      : undefined
                  "
                >

                <span
                  v-if="errores.asunto"
                  id="contact-asunto-error"
                  class="contact__field-error"
                >
                  {{ errores.asunto }}
                </span>
              </div>

              <!-- Mensaje -->
              <div
                class="contact__field contact__field--full"
              >
                <label
                  for="contact-mensaje"
                >
                  Mensaje

                  <span
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>

                <textarea
                  id="contact-mensaje"
                  v-model="formulario.mensaje"
                  @input="normalizarMensaje"
                  name="mensaje"
                  rows="5"
                  maxlength="2000"
                  placeholder="Cuéntanos brevemente qué necesitas..."
                  :aria-invalid="
                    Boolean(
                      errores.mensaje,
                    )
                  "
                  :aria-describedby="
                    errores.mensaje
                      ? 'contact-mensaje-error'
                      : undefined
                  "
                ></textarea>

                <div
                  class="contact__textarea-footer"
                >
                  <span
                    v-if="errores.mensaje"
                    id="contact-mensaje-error"
                    class="contact__field-error"
                  >
                    {{ errores.mensaje }}
                  </span>

                  <span
                    class="contact__counter"
                  >
                    {{
                      formulario.mensaje.length
                    }}/2000
                  </span>
                </div>
              </div>

            </div>

            <!-- Estado -->
            <div
              v-if="estado !== 'idle'"
              class="contact__status"
              :class="{
                'contact__status--sending':
                  estado === 'sending',

                'contact__status--success':
                  estado === 'success',

                'contact__status--error':
                  estado === 'error',
              }"
              :aria-live="
                estado === 'sending'
                  ? 'polite'
                  : 'assertive'
              "
            >
              <span
                class="contact__status-icon"
                aria-hidden="true"
              >

                <span
                  v-if="
                    estado === 'sending'
                  "
                  class="contact__spinner"
                ></span>

                <span
                  v-else-if="
                    estado === 'success'
                  "
                >
                  ✓
                </span>

                <span
                  v-else
                >
                  !
                </span>

              </span>

              <span>
                {{
                  estado === 'sending'
                    ? 'Enviando mensaje...'
                    : mensajeEstado
                }}
              </span>
            </div>

            <!-- Botón -->
            <button
              type="submit"
              class="contact__submit"
              :disabled="enviarBloqueado"
            >
              <span
                v-if="
                  estado === 'sending'
                "
                class="contact__submit-spinner"
                aria-hidden="true"
              ></span>

              <span>
                {{
                  estado === 'sending'
                    ? 'Enviando...'
                    : botonTexto
                }}
              </span>

              <span
                v-if="
                  estado !== 'sending'
                "
                class="contact__submit-icon"
                aria-hidden="true"
              >
                →
              </span>
            </button>

            <!-- Nuevo mensaje -->
            <button
              v-if="
                estado === 'success'
              "
              type="button"
              class="contact__reset"
              @click="reiniciarEstado"
            >
              Enviar otro mensaje
            </button>

            <!-- Privacidad -->
            <p
              class="contact__privacy"
            >
              Al enviar este formulario aceptas que utilicemos tus datos únicamente para responder a tu solicitud.
            </p>

          </form>
        </div>

      </div>
    </div>
  </section>
</template>
