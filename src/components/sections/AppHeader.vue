<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

/* =========================================================
   PROPS
   ========================================================= */

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
   ESTADO
   ========================================================= */

const menuAbierto = ref(false)

const headerRef = ref(null)

const menuButtonRef = ref(null)

/* =========================================================
   ESTADO DEL HEADER
   ========================================================= */

const headerActivo = computed(() => {
  return props.contenido?.activo !== false
})

/* =========================================================
   NAVEGACIÓN PRINCIPAL
   ========================================================= */

const navegacion = computed(() => {
  const items = props.contenido?.navegacion

  const navegacionFirebase = Array.isArray(items)
    ? [...items]
        .filter((item) => {
          return (
            item &&
            String(item.texto || '').trim() &&
            item.activo !== false
          )
        })
        .sort((a, b) => {
          return (
            Number(a.orden ?? 999) -
            Number(b.orden ?? 999)
          )
        })
    : []

  /* -------------------------------------------------------
     DETECTAR CONTACTO
     ------------------------------------------------------- */

  const existeContacto =
    navegacionFirebase.some((item) => {
      const texto = String(
        item.texto || '',
      )
        .trim()
        .toLowerCase()

      const url = String(
        item.url || '',
      )
        .trim()
        .toLowerCase()

      return (
        texto === 'contacto' ||
        texto.includes('contacto') ||
        url === '#contacto' ||
        url.endsWith('#contacto')
      )
    })

  /* -------------------------------------------------------
     CONTACTO POR DEFECTO
     ------------------------------------------------------- */

  if (!existeContacto) {
    navegacionFirebase.push({
      id: 'contacto-default',
      texto: 'Contacto',
      url: '#contacto',
      orden: 999,
      activo: true,
    })
  }

  return navegacionFirebase
})

/* =========================================================
   EMPRESA
   ========================================================= */

const nombreEmpresa = computed(() => {
  return (
    props.configuracion?.nombreEmpresa ||
    props.contenido?.nombreEmpresa ||
    'Desarrollos IAEH'
  )
})

/* =========================================================
   TEXTO DEL LOGO
   ========================================================= */

const logoTexto = computed(() => {
  return (
    props.configuracion?.logoTexto ||
    props.contenido?.logoTexto ||
    'IA'
  )
})

/* =========================================================
   LOGO
   ========================================================= */

const logoUrl = computed(() => {
  const logo =
    props.configuracion?.logo || {}

  if (logo.activo === false) {
    return ''
  }

  return (
    logo.pngUrl ||
    logo.originalUrl ||
    props.configuracion?.logoUrl ||
    props.contenido?.logoUrl ||
    '/img/logo.jpg'
  )
})

/* =========================================================
   SUBTÍTULO
   ========================================================= */

const subtitulo = computed(() => {
  return (
    props.contenido?.subtitulo ||
    props.configuracion?.subtitulo ||
    ''
  )
})

/* =========================================================
   CTA
   ========================================================= */

const ctaTexto = computed(() => {
  return (
    props.contenido?.ctaTexto ||
    ''
  )
})

const ctaUrl = computed(() => {
  return (
    props.contenido?.ctaUrl ||
    '#contacto'
  )
})

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

const tieneNavegacion = computed(() => {
  return navegacion.value.length > 0
})

/* =========================================================
   CERRAR MENÚ
   ========================================================= */

function cerrarMenu() {
  menuAbierto.value = false
}

/* =========================================================
   ALTERNAR MENÚ
   ========================================================= */

function alternarMenu() {
  menuAbierto.value =
    !menuAbierto.value
}

/* =========================================================
   ESCAPE
   ========================================================= */

function manejarTeclaEscape(event) {
  if (event.key !== 'Escape') {
    return
  }

  if (!menuAbierto.value) {
    return
  }

  cerrarMenu()

  nextTick(() => {
    menuButtonRef.value?.focus()
  })
}

/* =========================================================
   CLICK EXTERIOR
   ========================================================= */

function manejarClickExterior(event) {
  if (!menuAbierto.value) {
    return
  }

  const elemento = event.target

  if (
    headerRef.value &&
    !headerRef.value.contains(elemento)
  ) {
    cerrarMenu()
  }
}

/* =========================================================
   ENLACE EXTERNO
   ========================================================= */

function esEnlaceExterno(url) {
  const valor = String(
    url || '',
  ).trim()

  if (!valor) {
    return false
  }

  return (
    /^https?:\/\//i.test(valor) ||
    /^www\./i.test(valor)
  )
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function manejarNavegacion(url) {
  const valor = String(
    url || '',
  ).trim()

  cerrarMenu()

  if (!valor) {
    return
  }

  /* -------------------------------------------------------
     ANCLAS INTERNAS
     ------------------------------------------------------- */

  if (valor.startsWith('#')) {
    return
  }

  /* -------------------------------------------------------
     ENLACES EXTERNOS / CONTACTO
     ------------------------------------------------------- */

  if (
    valor.startsWith('mailto:') ||
    valor.startsWith('tel:') ||
    esEnlaceExterno(valor)
  ) {
    return
  }
}

/* =========================================================
   WATCH MENÚ
   ========================================================= */

watch(
  menuAbierto,
  (abierto) => {
    if (
      typeof document ===
      'undefined'
    ) {
      return
    }

    document.body.classList.toggle(
      'mobile-menu-open',
      abierto,
    )
  },
)

/* =========================================================
   WATCH CONTENIDO
   ========================================================= */

watch(
  () => props.contenido,
  () => {
    cerrarMenu()
  },
  {
    deep: true,
  },
)

/* =========================================================
   MOUNT
   ========================================================= */

onMounted(() => {
  document.addEventListener(
    'keydown',
    manejarTeclaEscape,
  )

  document.addEventListener(
    'click',
    manejarClickExterior,
  )
})

/* =========================================================
   UNMOUNT
   ========================================================= */

onBeforeUnmount(() => {
  document.removeEventListener(
    'keydown',
    manejarTeclaEscape,
  )

  document.removeEventListener(
    'click',
    manejarClickExterior,
  )

  if (
    typeof document !==
    'undefined'
  ) {
    document.body.classList.remove(
      'mobile-menu-open',
    )
  }
})
</script>

<template>
  <header
    v-if="headerActivo"
    ref="headerRef"
    class="app-header"
  >
    <div class="container app-header__inner">

      <!-- =================================================
           LOGOTIPO / MARCA
           ================================================= -->

      <a
        href="#inicio"
        class="app-header__brand"
        :aria-label="`Ir al inicio de ${nombreEmpresa}`"
        @click="manejarNavegacion('#inicio')"
      >
        <span class="app-header__logo">
          <img
            v-if="logoUrl"
            class="logo-image"
            :src="logoUrl"
            :alt="nombreEmpresa"
          >

          <span v-else>
            {{ logoTexto }}
          </span>
        </span>

        <span class="app-header__brand-text">
          <strong>
            {{ nombreEmpresa }}
          </strong>

          <small v-if="subtitulo">
            {{ subtitulo }}
          </small>
        </span>
      </a>

      <!-- =================================================
           NAVEGACIÓN DESKTOP
           ================================================= -->

      <nav
        v-if="tieneNavegacion"
        class="app-header__nav"
        aria-label="Navegación principal"
      >
        <a
          v-for="item in navegacion"
          :key="`${item.id || item.orden}-${item.texto}`"
          :href="item.url || '#'"
          :target="item.target || undefined"
          :rel="
            item.target === '_blank'
              ? 'noopener noreferrer'
              : undefined
          "
          @click="manejarNavegacion(item.url)"
        >
          {{ item.texto }}
        </a>
      </nav>

      <!-- =================================================
           CTA DESKTOP
           ================================================= -->

      <a
        v-if="ctaTexto"
        :href="ctaUrl"
        :target="
          esEnlaceExterno(ctaUrl)
            ? '_blank'
            : undefined
        "
        :rel="
          esEnlaceExterno(ctaUrl)
            ? 'noopener noreferrer'
            : undefined
        "
        class="app-header__cta"
        @click="manejarNavegacion(ctaUrl)"
      >
        <span>
          {{ ctaTexto }}
        </span>

        <span
          class="app-header__cta-icon"
          aria-hidden="true"
        >
          →
        </span>
      </a>

      <!-- =================================================
           BOTÓN MENÚ MÓVIL
           ================================================= -->

      <button
        ref="menuButtonRef"
        type="button"
        class="app-header__menu-button"
        :aria-label="
          menuAbierto
            ? 'Cerrar menú'
            : 'Abrir menú'
        "
        :aria-expanded="menuAbierto"
        aria-controls="app-header-mobile-menu"
        @click.stop="alternarMenu"
      >
        <span
          :class="{
            'is-open': menuAbierto,
          }"
        ></span>

        <span
          :class="{
            'is-open': menuAbierto,
          }"
        ></span>

        <span
          :class="{
            'is-open': menuAbierto,
          }"
        ></span>
      </button>
    </div>

    <!-- =================================================
         MENÚ MÓVIL
         ================================================= -->

    <Transition name="header-mobile-menu">
      <div
        v-if="menuAbierto"
        id="app-header-mobile-menu"
        class="app-header__mobile-menu"
      >
        <div class="container">
          <nav aria-label="Navegación móvil">

            <a
              v-for="item in navegacion"
              :key="`mobile-${item.id || item.orden}-${item.texto}`"
              :href="item.url || '#'"
              :target="item.target || undefined"
              :rel="
                item.target === '_blank'
                  ? 'noopener noreferrer'
                  : undefined
              "
              @click="manejarNavegacion(item.url)"
            >
              <span>
                {{ item.texto }}
              </span>

              <span
                class="app-header__mobile-link-icon"
                aria-hidden="true"
              >
                →
              </span>
            </a>

            <!-- CTA MÓVIL -->

            <a
              v-if="ctaTexto"
              :href="ctaUrl"
              :target="
                esEnlaceExterno(ctaUrl)
                  ? '_blank'
                  : undefined
              "
              :rel="
                esEnlaceExterno(ctaUrl)
                  ? 'noopener noreferrer'
                  : undefined
              "
              class="app-header__mobile-cta"
              @click="manejarNavegacion(ctaUrl)"
            >
              <span>
                {{ ctaTexto }}
              </span>

              <span aria-hidden="true">
                →
              </span>
            </a>

          </nav>
        </div>
      </div>
    </Transition>
  </header>
</template>
