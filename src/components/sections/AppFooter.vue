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

/* =========================================================
   EMPRESA
   ========================================================= */

const empresa = computed(() => {
  return (
    props.configuracion?.nombreEmpresa ||
    props.contenido?.nombreEmpresa ||
    'Desarrollos IAEH'
  )
})

/* =========================================================
   LOGO
   ========================================================= */

const logo = computed(() => {
  return (
    props.configuracion?.logoTexto ||
    props.contenido?.logoTexto ||
    'IA'
  )
})

const logoUrl = computed(() => {
  const logoConfiguracion = props.configuracion?.logo || {}

  if (logoConfiguracion.activo === false) {
    return ''
  }

  return (
    logoConfiguracion.pngUrl ||
    logoConfiguracion.originalUrl ||
    props.configuracion?.logoUrl ||
    props.contenido?.logoUrl ||
    '/img/logo.jpg'
  )
})

/* =========================================================
   DESCRIPCIÓN
   ========================================================= */

const descripcion = computed(() => {
  return (
    props.contenido?.descripcion ||
    props.configuracion?.descripcion ||
    'Soluciones tecnológicas para empresas.'
  )
})

/* =========================================================
   COPYRIGHT
   ========================================================= */

const copyright = computed(() => {
  return (
    props.contenido?.copyright ||
    `© ${new Date().getFullYear()} ${empresa.value}. Todos los derechos reservados.`
  )
})

/* =========================================================
   CONTACTO
   ========================================================= */

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

const telefonoUrl = computed(() => {
  const numero = String(telefono.value || '').trim()

  if (!numero) {
    return ''
  }

  return `tel:${numero.replace(/[^\d+]/g, '')}`
})

const whatsappUrl = computed(() => {
  const numero = String(
    whatsapp.value || '',
  ).replace(/\D/g, '')

  if (!numero) {
    return ''
  }

  return `https://wa.me/${numero}`
})

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

const navegacion = computed(() => {
  const items = Array.isArray(
    props.contenido?.navegacion,
  )
    ? props.contenido.navegacion
    : []

  return [...items]
    .filter((item) => {
      return (
        item &&
        item.activo !== false &&
        String(item.texto || '').trim()
      )
    })
    .sort((a, b) => {
      return (
        Number(a?.orden ?? 999) -
        Number(b?.orden ?? 999)
      )
    })
})

/* =========================================================
   ENLACES DE NAVEGACIÓN
   ========================================================= */

const enlacesEmpresa = computed(() => {
  return navegacion.value.slice(0, 5)
})

const enlacesSecundarios = computed(() => {
  return navegacion.value.slice(5, 10)
})

/* =========================================================
   REDES SOCIALES
   ========================================================= */

const redes = computed(() => {
  const redesConfiguracion =
    props.contenido?.redes ||
    props.configuracion?.redes ||
    {}

  return [
    {
      nombre: 'Facebook',
      url: redesConfiguracion.facebook,
      icono: 'f',
    },
    {
      nombre: 'Instagram',
      url: redesConfiguracion.instagram,
      icono: 'ig',
    },
    {
      nombre: 'LinkedIn',
      url: redesConfiguracion.linkedin,
      icono: 'in',
    },
    {
      nombre: 'X',
      url: redesConfiguracion.x || redesConfiguracion.twitter,
      icono: 'X',
    },
  ].filter((red) => red.url)
})
</script>

<template>
  <footer class="app-footer">

    <!-- =====================================================
         CONTENIDO PRINCIPAL
         ===================================================== -->

    <div class="app-footer__container">

      <!-- MARCA -->

      <section class="app-footer__brand">

        <a
          href="#inicio"
          class="app-footer__logo"
          aria-label="Ir al inicio"
        >
          <img
            v-if="logoUrl"
            class="app-footer__logo-image"
            :src="logoUrl"
            :alt="empresa"
          >

          <span
            v-else
            class="app-footer__logo-text"
          >
            {{ logo }}
          </span>
        </a>

        <h3 class="app-footer__company">
          {{ empresa }}
        </h3>

        <p class="app-footer__description">
          {{ descripcion }}
        </p>

        <!-- REDES -->

        <div
          v-if="redes.length"
          class="app-footer__social"
        >
          <a
            v-for="red in redes"
            :key="red.nombre"
            :href="red.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="red.nombre"
            :title="red.nombre"
          >
            {{ red.icono }}
          </a>
        </div>

      </section>

      <!-- EMPRESA -->

      <section
        v-if="enlacesEmpresa.length"
        class="app-footer__column"
      >
        <h4 class="app-footer__column-title">
          Empresa
        </h4>

        <ul class="app-footer__links">
          <li
            v-for="item in enlacesEmpresa"
            :key="
              item.id ||
              item.url ||
              item.texto
            "
          >
            <a
              :href="item.url || '#'"
              :target="
                item.target || undefined
              "
              :rel="
                item.target === '_blank'
                  ? 'noopener noreferrer'
                  : undefined
              "
            >
              {{ item.texto }}
            </a>
          </li>
        </ul>
      </section>

      <!-- NAVEGACIÓN -->

      <section
        v-if="enlacesSecundarios.length"
        class="app-footer__column"
      >
        <h4 class="app-footer__column-title">
          Navegación
        </h4>

        <ul class="app-footer__links">
          <li
            v-for="item in enlacesSecundarios"
            :key="
              item.id ||
              item.url ||
              item.texto
            "
          >
            <a
              :href="item.url || '#'"
              :target="
                item.target || undefined
              "
              :rel="
                item.target === '_blank'
                  ? 'noopener noreferrer'
                  : undefined
              "
            >
              {{ item.texto }}
            </a>
          </li>
        </ul>
      </section>

      <!-- CONTACTO -->

      <section class="app-footer__column">

        <h4 class="app-footer__column-title">
          Contacto
        </h4>

        <div class="app-footer__contact">

          <!-- TELÉFONO -->

          <a
            v-if="telefonoUrl"
            :href="telefonoUrl"
            class="app-footer__contact-item"
          >
            <span class="app-footer__contact-icon">
              ☎
            </span>

            <span class="app-footer__contact-content">
              <small>Teléfono</small>
              <strong>
                {{ telefono }}
              </strong>
            </span>
          </a>

          <!-- EMAIL -->

          <a
            v-if="email"
            :href="`mailto:${email}`"
            class="app-footer__contact-item"
          >
            <span class="app-footer__contact-icon">
              @
            </span>

            <span class="app-footer__contact-content">
              <small>Correo electrónico</small>
              <strong>
                {{ email }}
              </strong>
            </span>
          </a>

          <!-- WHATSAPP -->

          <a
            v-if="whatsappUrl"
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="app-footer__contact-item app-footer__contact-item--whatsapp"
          >
            <span class="app-footer__contact-icon">
              W
            </span>

            <span class="app-footer__contact-content">
              <small>Atención directa</small>
              <strong>
                WhatsApp
              </strong>
            </span>
          </a>

        </div>

      </section>

    </div>

    <!-- =====================================================
         PARTE INFERIOR
         ===================================================== -->

    <div class="app-footer__bottom">

      <p class="app-footer__copyright">
        {{ copyright }}
      </p>

      <div class="app-footer__bottom-right">

        <a
          href="#inicio"
          class="app-footer__back-top"
        >
          Volver arriba
          <span>↑</span>
        </a>

      </div>

    </div>

  </footer>
</template>