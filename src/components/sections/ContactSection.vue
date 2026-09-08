<script setup>
import { computed } from 'vue'

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

const telefono = computed(() => {
  return (
    props.configuracion?.telefono ||
    props.contenido?.telefono ||
    ''
  )
})

const email = computed(() => {
  return (
    props.configuracion?.email ||
    props.contenido?.email ||
    ''
  )
})

const whatsapp = computed(() => {
  return (
    props.configuracion?.whatsapp ||
    props.contenido?.whatsapp ||
    ''
  )
})

const direccion = computed(() => {
  return (
    props.configuracion?.direccion ||
    props.contenido?.direccion ||
    ''
  )
})

const whatsappUrl = computed(() => {
  const valor = String(
    whatsapp.value || ''
  ).trim()

  if (!valor) {
    return ''
  }

  if (/^https?:\/\//i.test(valor)) {
    return valor
  }

  const numero = valor.replace(/\D/g, '')

  return numero
    ? `https://wa.me/${numero}`
    : ''
})

const botonTexto = computed(() => {
  return (
    props.contenido?.botonTexto ||
    'Contactar'
  )
})

const botonUrl = computed(() => {
  if (props.contenido?.botonUrl) {
    return props.contenido.botonUrl
  }

  if (whatsappUrl.value) {
    return whatsappUrl.value
  }

  if (email.value) {
    return `mailto:${email.value}`
  }

  if (telefono.value) {
    return `tel:${telefono.value}`
  }

  return '#'
})
</script>

<template>
  <section
    v-if="
      contenido &&
      contenido.activo !== false
    "
    id="contacto"
    class="section contact"
  >
    <div class="container">

      <div class="contact__card">

        <div class="contact__content">

          <span
            v-if="contenido.eyebrow"
            class="section-eyebrow"
          >
            {{ contenido.eyebrow }}
          </span>

          <h2
            v-if="contenido.titulo"
            class="contact__title"
          >
            {{ contenido.titulo }}
          </h2>

          <p
            v-if="contenido.descripcion"
            class="contact__description"
          >
            {{ contenido.descripcion }}
          </p>

          <div class="contact__details">

            <p v-if="telefono">
              <strong>Teléfono:</strong>

              <a :href="`tel:${telefono}`">
                {{ telefono }}
              </a>
            </p>

            <p v-if="email">
              <strong>Correo:</strong>

              <a :href="`mailto:${email}`">
                {{ email }}
              </a>
            </p>

            <p v-if="direccion">
              <strong>Dirección:</strong>

              {{ direccion }}
            </p>

          </div>

        </div>

        <div
          v-if="botonTexto"
          class="contact__action"
        >
          <a
            :href="botonUrl"
            class="contact__button"
            :target="
              botonUrl.startsWith('https://wa.me/')
                ? '_blank'
                : undefined
            "
            :rel="
              botonUrl.startsWith('https://wa.me/')
                ? 'noopener noreferrer'
                : undefined
            "
          >
            {{ botonTexto }}
          </a>
        </div>

      </div>

    </div>
  </section>
</template>