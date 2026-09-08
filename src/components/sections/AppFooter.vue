<script setup>
import { computed } from 'vue'

const props = defineProps({
  contenido: {
    type: Object,
    default: null,
  },

  configuracion: {
    type: Object,
    default: null,
  },
})

const empresa = computed(() => {
  return (
    props.configuracion
      ?.nombreEmpresa ||
    props.contenido
      ?.nombreEmpresa ||
    'Desarrollos IAEH'
  )
})

const logo = computed(() => {
  return (
    props.configuracion
      ?.logoTexto ||
    props.contenido
      ?.logoTexto ||
    'IA'
  )
})

const logoUrl = computed(() => {
  return (
    props.configuracion
      ?.logoUrl ||
    ''
  )
})

const descripcion = computed(() => {
  return (
    props.contenido
      ?.descripcion ||
    props.configuracion
      ?.descripcion ||
    'Soluciones tecnológicas para empresas.'
  )
})

const copyright = computed(() => {
  return (
    props.contenido?.copyright ||
    `© ${new Date().getFullYear()} ${empresa.value}. Todos los derechos reservados.`
  )
})

const telefono = computed(() => {
  return (
    props.configuracion
      ?.telefono ||
    props.contenido?.telefono ||
    ''
  )
})

const email = computed(() => {
  return (
    props.configuracion
      ?.email ||
    props.contenido?.email ||
    ''
  )
})

const whatsapp = computed(() => {
  return (
    props.configuracion
      ?.whatsapp ||
    props.contenido?.whatsapp ||
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

  if (
    /^https?:\/\//i.test(valor)
  ) {
    return valor
  }

  const numero =
    valor.replace(/\D/g, '')

  if (!numero) {
    return ''
  }

  return `https://wa.me/${numero}`
})

const navegacion = computed(() => {
  const items =
    Array.isArray(
      props.contenido
        ?.navegacion
    )
      ? props.contenido
          .navegacion
      : []

  return [...items]
    .filter(
      (item) =>
        item?.activo !== false
    )
    .sort((a, b) => {
      return (
        Number(
          a?.orden ?? 999
        ) -
        Number(
          b?.orden ?? 999
        )
      )
    })
})
</script>

<template>
  <footer class="app-footer">
    <div
      class="app-footer__container"
    >

      <div
        class="app-footer__brand"
      >
        <div
          class="app-footer__logo"
        >
          <img
            v-if="logoUrl"
            :src="logoUrl"
            :alt="empresa"
          >

          <span v-else>
            {{ logo }}
          </span>
        </div>

        <h3
          class="app-footer__company"
        >
          {{ empresa }}
        </h3>

        <p
          class="app-footer__description"
        >
          {{ descripcion }}
        </p>
      </div>

      <div
        v-if="navegacion.length"
        class="app-footer__column"
      >
        <h4
          class="app-footer__column-title"
        >
          Navegación
        </h4>

        <ul
          class="app-footer__links"
        >
          <li
            v-for="item in navegacion"
            :key="
              item.url ||
              item.texto
            "
          >
            <a
              :href="
                item.url || '#'
              "
            >
              {{ item.texto }}
            </a>
          </li>
        </ul>
      </div>

      <div
        class="app-footer__column"
      >
        <h4
          class="app-footer__column-title"
        >
          Contacto
        </h4>

        <div
          class="app-footer__contact"
        >
          <div
            v-if="telefono"
            class="app-footer__contact-item"
          >
            <a
              :href="
                `tel:${telefono}`
              "
            >
              {{ telefono }}
            </a>
          </div>

          <div
            v-if="email"
            class="app-footer__contact-item"
          >
            <a
              :href="
                `mailto:${email}`
              "
            >
              {{ email }}
            </a>
          </div>

          <a
            v-if="whatsappUrl"
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="app-footer__whatsapp"
          >
            WhatsApp
          </a>
        </div>
      </div>

    </div>

    <div
      class="app-footer__divider"
    ></div>

    <div
      class="app-footer__bottom"
    >
      <p
        class="app-footer__copyright"
      >
        {{ copyright }}
      </p>

      <div
        class="app-footer__legal"
      >
        <a href="#inicio">
          Volver arriba
        </a>
      </div>
    </div>
  </footer>
</template>