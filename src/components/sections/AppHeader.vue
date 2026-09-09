<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

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

const menuAbierto = ref(false)

const headerRef = ref(null)
const menuButtonRef = ref(null)

const headerActivo = computed(() => {
  return props.contenido?.activo !== false
})

/*
 * Navegación principal.
 *
 * Los elementos pueden venir desde Firebase.
 * Si Contacto no existe, se agrega automáticamente
 * para garantizar que siempre esté disponible.
 */
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

  /*
   * Detectamos si Firebase ya tiene un enlace
   * hacia Contacto.
   */
  const existeContacto = navegacionFirebase.some((item) => {
    const texto = String(
      item.texto || ''
    )
      .trim()
      .toLowerCase()

    const url = String(
      item.url || ''
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

  /*
   * Si Contacto no está configurado en Firebase,
   * lo agregamos automáticamente.
   */
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

const nombreEmpresa = computed(() => {
  return (
    props.configuracion?.nombreEmpresa ||
    props.contenido?.nombreEmpresa ||
    'Desarrollos IAEH'
  )
})

const logoTexto = computed(() => {
  return (
    props.configuracion?.logoTexto ||
    props.contenido?.logoTexto ||
    'IA'
  )
})

const logoUrl = computed(() => {
  return (
    props.configuracion?.logoUrl ||
    props.contenido?.logoUrl ||
    ''
  )
})

const subtitulo = computed(() => {
  return (
    props.contenido?.subtitulo ||
    props.configuracion?.subtitulo ||
    ''
  )
})

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

const tieneNavegacion = computed(() => {
  return navegacion.value.length > 0
})

function cerrarMenu() {
  menuAbierto.value = false
}

function alternarMenu() {
  menuAbierto.value = !menuAbierto.value
}

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

/*
 * Detecta correctamente:
 * - https://...
 * - http://...
 * - www....
 */
function esEnlaceExterno(url) {
  const valor = String(url || '').trim()

  if (!valor) {
    return false
  }

  return (
    /^https?:\/\//i.test(valor) ||
    /^www\./i.test(valor)
  )
}

/*
 * Maneja navegación sin interferir con
 * el comportamiento natural del navegador.
 */
function manejarNavegacion(url) {
  const valor = String(url || '').trim()

  cerrarMenu()

  if (!valor) {
    return
  }

  /*
   * Los enlaces de ancla se dejan al navegador.
   *
   * Ejemplo:
   * #inicio
   * #soluciones
   * #caracteristicas
   * #planes
   * #nosotros
   * #faq
   * #contacto
   */
  if (valor.startsWith('#')) {
    return
  }

  /*
   * Estos enlaces también deben conservar
   * el comportamiento nativo del navegador.
   */
  if (
    valor.startsWith('mailto:') ||
    valor.startsWith('tel:') ||
    esEnlaceExterno(valor)
  ) {
    return
  }
}

watch(
  menuAbierto,
  (abierto) => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.toggle(
      'mobile-menu-open',
      abierto
    )
  }
)

watch(
  () => props.contenido,
  () => {
    cerrarMenu()
  },
  {
    deep: true,
  }
)

onMounted(() => {
  document.addEventListener(
    'keydown',
    manejarTeclaEscape
  )

  document.addEventListener(
    'click',
    manejarClickExterior
  )
})

onBeforeUnmount(() => {
  document.removeEventListener(
    'keydown',
    manejarTeclaEscape
  )

  document.removeEventListener(
    'click',
    manejarClickExterior
  )

  if (typeof document !== 'undefined') {
    document.body.classList.remove(
      'mobile-menu-open'
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

      <!-- LOGOTIPO / MARCA -->
      <a
        href="#inicio"
        class="app-header__brand"
        :aria-label="`Ir al inicio de ${nombreEmpresa}`"
        @click="manejarNavegacion('#inicio')"
      >
        <span class="app-header__logo">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            :alt="nombreEmpresa"
            loading="eager"
          />

          <span
            v-else
            aria-hidden="true"
          >
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

      <!-- NAVEGACIÓN DESKTOP -->
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

      <!-- CTA DESKTOP -->
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

      <!-- BOTÓN MENÚ MÓVIL -->
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

    <!-- MENÚ MÓVIL -->
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