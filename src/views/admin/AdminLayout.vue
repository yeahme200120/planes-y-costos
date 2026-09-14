<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import {
  onAuthStateChanged,
} from 'firebase/auth'

import {
  useRouter,
  useRoute,
} from 'vue-router'

import { auth } from '../../config/firebase'
import { cerrarSesion } from '../../services/authService'
import { useContactosNuevos } from '../../composables/useContactosNuevos.js'

const router = useRouter()
const route = useRoute()

// =========================================================
// ESTADO
// =========================================================

const usuario = ref(null)
const cerrandoSesion = ref(false)
const menuAbierto = ref(false)
const cargandoRuta = ref(false)
const errorSesion = ref(null)

const sidebarRef = ref(null)
const menuButtonRef = ref(null)

let unsubscribeAuth = null
let timeoutErrorSesion = null

let componenteActivo = false

// =========================================================
// CONTACTOS NUEVOS
// =========================================================

const {
  cantidad: contactosNuevos,
} = useContactosNuevos()

// =========================================================
// CICLO DE VIDA
// =========================================================

onMounted(() => {
  componenteActivo = true

  unsubscribeAuth =
    onAuthStateChanged(
      auth,
      (usuarioActual) => {
        if (!componenteActivo) {
          return
        }

        const usuarioAnterior =
          usuario.value

        usuario.value =
          usuarioActual

        if (usuarioActual) {
          limpiarErrorSesion()
          return
        }

        if (usuarioAnterior) {
          mostrarErrorSesion(
            'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
          )
        }
      },
      (error) => {
        console.error(
          'Error observando autenticación:',
          error
        )

        if (!componenteActivo) {
          return
        }

        mostrarErrorSesion(
          obtenerMensajeError(
            error,
            'No fue posible verificar el estado de la sesión.'
          )
        )
      }
    )

  document.addEventListener(
    'keydown',
    manejarTecla
  )

  document.addEventListener(
    'click',
    manejarClickFuera
  )
})

onUnmounted(() => {
  componenteActivo = false

  if (
    typeof unsubscribeAuth ===
    'function'
  ) {
    unsubscribeAuth()
  }

  unsubscribeAuth = null

  document.removeEventListener(
    'keydown',
    manejarTecla
  )

  document.removeEventListener(
    'click',
    manejarClickFuera
  )

  if (timeoutErrorSesion) {
    clearTimeout(timeoutErrorSesion)
    timeoutErrorSesion = null
  }
})

// =========================================================
// UTILIDADES DE SESIÓN
// =========================================================

function obtenerMensajeError(
  error,
  fallback
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message
  }

  if (
    error &&
    typeof error === 'object' &&
    typeof error.message === 'string' &&
    error.message
  ) {
    return error.message
  }

  return fallback
}

function limpiarErrorSesion() {
  errorSesion.value = null

  if (timeoutErrorSesion) {
    clearTimeout(timeoutErrorSesion)
    timeoutErrorSesion = null
  }
}

function mostrarErrorSesion(
  mensaje,
  duracion = 6000
) {
  errorSesion.value = mensaje

  if (timeoutErrorSesion) {
    clearTimeout(timeoutErrorSesion)
  }

  timeoutErrorSesion =
    window.setTimeout(() => {
      if (!componenteActivo) {
        return
      }

      errorSesion.value = null
      timeoutErrorSesion = null
    }, duracion)
}

// =========================================================
// NAVEGACIÓN Y MENÚ
// =========================================================

function manejarTecla(event) {
  if (
    event.key === 'Escape' &&
    menuAbierto.value
  ) {
    cerrarMenu()

    nextTick(() => {
      menuButtonRef.value?.focus()
    })

    return
  }

  if (
    event.key.toLowerCase() === 'm' &&
    event.altKey
  ) {
    event.preventDefault()
    alternarMenu()
  }
}

function manejarClickFuera(event) {
  if (!menuAbierto.value) {
    return
  }

  const sidebar =
    sidebarRef.value

  const menuButton =
    menuButtonRef.value

  if (
    sidebar &&
    !sidebar.contains(event.target) &&
    menuButton &&
    !menuButton.contains(event.target)
  ) {
    cerrarMenu()
  }
}

function cerrarMenu() {
  menuAbierto.value = false
}

function alternarMenu() {
  menuAbierto.value =
    !menuAbierto.value

  if (menuAbierto.value) {
    nextTick(() => {
      const firstLink =
        document.querySelector(
          '.admin-sidebar__link'
        )

      firstLink?.focus()
    })
  }
}

async function navegar(ruta) {
  if (cargandoRuta.value) {
    return
  }

  if (route.path === ruta) {
    cerrarMenu()
    return
  }

  cargandoRuta.value = true

  cerrarMenu()

  try {
    await router.push(ruta)
  } catch (error) {
    console.error(
      'Error de navegación:',
      error
    )

    if (componenteActivo) {
      mostrarErrorSesion(
        obtenerMensajeError(
          error,
          'No fue posible realizar la navegación.'
        ),
        5000
      )
    }
  } finally {
    if (componenteActivo) {
      cargandoRuta.value = false
    }
  }
}

function irALanding() {
  cerrarMenu()

  window.open(
    '/',
    '_blank',
    'noopener,noreferrer'
  )
}

// =========================================================
// CIERRE DE SESIÓN
// =========================================================

async function salir() {
  if (cerrandoSesion.value) {
    return
  }

  const confirmar =
    window.confirm(
      '¿Estás seguro de que deseas cerrar sesión?\n\nLos cambios no guardados se perderán.'
    )

  if (!confirmar) {
    return
  }

  try {
    cerrandoSesion.value = true

    limpiarErrorSesion()

    cerrarMenu()

    await cerrarSesion()

    if (!componenteActivo) {
      return
    }

    await router.replace(
      '/admin/login'
    )
  } catch (err) {
    console.error(
      'Error al cerrar sesión:',
      err
    )

    if (componenteActivo) {
      mostrarErrorSesion(
        obtenerMensajeError(
          err,
          'Ocurrió un error al cerrar sesión.'
        ),
        5000
      )
    }
  } finally {
    if (componenteActivo) {
      cerrandoSesion.value = false
    }
  }
}

// =========================================================
// COMPUTADAS
// =========================================================

const nombreUsuario = computed(() => {
  if (!usuario.value) {
    return 'Administrador'
  }

  return (
    usuario.value.displayName ||
    usuario.value.email ||
    'Administrador'
  )
})

const emailUsuario = computed(() => {
  return usuario.value?.email || ''
})

const inicialUsuario = computed(() => {
  const nombre =
    usuario.value?.displayName ||
    usuario.value?.email ||
    'A'

  return nombre
    .trim()
    .charAt(0)
    .toUpperCase()
})
</script>

<template>
  <div class="admin-layout">

    <!-- ===================================================
         HEADER
         =================================================== -->

    <header
      class="admin-layout__header"
      role="banner"
    >

      <div class="admin-layout__header-left">

        <button
          ref="menuButtonRef"
          type="button"
          class="admin-layout__menu-button"
          :aria-label="
            menuAbierto
              ? 'Cerrar menú'
              : 'Abrir menú'
          "
          :aria-expanded="menuAbierto"
          aria-controls="admin-sidebar"
          :class="{
            'is-active': menuAbierto,
          }"
          @click="alternarMenu"
        >
          <span
            v-if="!menuAbierto"
            aria-hidden="true"
          >
            ☰
          </span>

          <span
            v-else
            aria-hidden="true"
          >
            ✕
          </span>
        </button>

        <div>
          <p class="admin-layout__eyebrow">
            Administración
          </p>

          <h1 class="admin-layout__title">
            Panel administrativo
          </h1>

          <p class="admin-layout__subtitle">
            Gestión de contenido de la landing page.
          </p>
        </div>

      </div>

      <!-- ACCIONES DEL HEADER -->

      <div class="admin-layout__header-actions">

        <!-- Perfil -->

        <div
          v-if="usuario"
          class="admin-layout__user"
          :title="emailUsuario"
        >

          <div
            class="admin-layout__avatar"
            aria-hidden="true"
          >
            {{ inicialUsuario }}
          </div>

          <div class="admin-layout__user-info">

            <span class="admin-layout__user-label">
              Sesión activa
            </span>

            <strong class="admin-layout__user-name">
              {{ nombreUsuario }}
            </strong>

          </div>

        </div>

        <!-- Landing -->

        <button
          type="button"
          class="admin-button admin-button--secondary"
          title="Abrir la landing page en una nueva pestaña"
          @click="irALanding"
        >
          <span aria-hidden="true">
            🌐
          </span>

          Ver landing
        </button>

        <!-- Logout -->

        <button
          type="button"
          class="admin-button admin-button--danger"
          :disabled="cerrandoSesion"
          @click="salir"
        >
          <span
            v-if="cerrandoSesion"
            aria-hidden="true"
          >
            ⏳
          </span>

          <span>
            {{
              cerrandoSesion
                ? 'Cerrando...'
                : 'Cerrar sesión'
            }}
          </span>
        </button>

      </div>
    </header>

    <!-- ===================================================
         CUERPO
         =================================================== -->

    <div class="admin-layout__body">

      <!-- SIDEBAR -->

      <aside
        id="admin-sidebar"
        ref="sidebarRef"
        class="admin-layout__sidebar"
        :class="{
          'admin-layout__sidebar--open':
            menuAbierto,
        }"
        aria-label="Menú administrativo"
        role="navigation"
      >

        <!-- BRAND -->

        <div class="admin-sidebar__brand">

          <div class="admin-sidebar__logo">
            <img
              class="logo-image"
              src="/img/logo.jpg"
              alt="Logo"
            >
          </div>

          <div>
            <strong>
              Landing Admin
            </strong>

            <span>
              Gestión de contenido
            </span>
          </div>

        </div>

        <!-- NAVEGACIÓN -->

        <nav
          class="admin-sidebar__nav"
          aria-label="Navegación administrativa"
        >

          <p class="admin-sidebar__label">
            PRINCIPAL
          </p>

          <!-- Dashboard -->

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{
              'admin-sidebar__link--active':
                route.path === '/admin' ||
                route.path === '/admin/dashboard',
            }"
            :aria-current="
              route.path === '/admin' ||
              route.path === '/admin/dashboard'
                ? 'page'
                : undefined
            "
            @click="
              navegar('/admin/dashboard')
            "
          >
            <span
              class="admin-sidebar__icon"
              aria-hidden="true"
            >
              ▦
            </span>

            <span>
              Dashboard
            </span>
          </button>

          <p class="admin-sidebar__label">
            CONTENIDO
          </p>

          <!-- Planes -->

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{
              'admin-sidebar__link--active':
                route.path.startsWith(
                  '/admin/planes'
                ),
            }"
            :aria-current="
              route.path.startsWith(
                '/admin/planes'
              )
                ? 'page'
                : undefined
            "
            @click="
              navegar('/admin/planes')
            "
          >
            <span
              class="admin-sidebar__icon"
              aria-hidden="true"
            >
              $
            </span>

            <span>
              Planes
            </span>
          </button>

          <!-- Secciones -->

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{
              'admin-sidebar__link--active':
                route.path.startsWith(
                  '/admin/secciones'
                ),
            }"
            :aria-current="
              route.path.startsWith(
                '/admin/secciones'
              )
                ? 'page'
                : undefined
            "
            @click="
              navegar('/admin/secciones')
            "
          >
            <span
              class="admin-sidebar__icon"
              aria-hidden="true"
            >
              ◫
            </span>

            <span>
              Secciones
            </span>
          </button>

          <!-- Contenido -->

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{
              'admin-sidebar__link--active':
                route.path.startsWith(
                  '/admin/contenido'
                ),
            }"
            :aria-current="
              route.path.startsWith(
                '/admin/contenido'
              )
                ? 'page'
                : undefined
            "
            @click="
              navegar('/admin/contenido')
            "
          >
            <span
              class="admin-sidebar__icon"
              aria-hidden="true"
            >
              ◈
            </span>

            <span class="admin-sidebar__link-text">
              Contenido
            </span>
          </button>

          <!-- Contactos -->

          <button
            type="button"
            class="admin-sidebar__link admin-sidebar__link--contacts"
            :class="{
              'admin-sidebar__link--active':
                route.path.startsWith(
                  '/admin/contactos'
                ),
            }"
            :aria-current="
              route.path.startsWith(
                '/admin/contactos'
              )
                ? 'page'
                : undefined
            "
            @click="
              navegar('/admin/contactos')
            "
          >
            <span
              class="admin-sidebar__icon"
              aria-hidden="true"
            >
              ✉
            </span>

            <span class="admin-sidebar__link-text">
              Contactos
            </span>

            <span
              v-if="contactosNuevos > 0"
              class="admin-sidebar__badge"
              :aria-label="`${contactosNuevos} contactos nuevos`"
            >
              {{
                contactosNuevos > 99
                  ? '99+'
                  : contactosNuevos
              }}
            </span>
          </button>

          <p class="admin-sidebar__label">
            SISTEMA
          </p>

          <!-- Usuarios -->

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{
              'admin-sidebar__link--active':
                route.path.startsWith(
                  '/admin/usuarios'
                ),
            }"
            :aria-current="
              route.path.startsWith(
                '/admin/usuarios'
              )
                ? 'page'
                : undefined
            "
            @click="
              navegar('/admin/usuarios')
            "
          >
            <span
              class="admin-sidebar__icon"
              aria-hidden="true"
            >
              👥
            </span>

            <span class="admin-sidebar__link-text">
              Usuarios
            </span>
          </button>

          <!-- Configuración -->

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{
              'admin-sidebar__link--active':
                route.path.startsWith(
                  '/admin/configuracion'
                ),
            }"
            :aria-current="
              route.path.startsWith(
                '/admin/configuracion'
              )
                ? 'page'
                : undefined
            "
            @click="
              navegar('/admin/configuracion')
            "
          >
            <span
              class="admin-sidebar__icon"
              aria-hidden="true"
            >
              ⚙
            </span>

            <span>
              Configuración
            </span>
          </button>

        </nav>

        <!-- FOOTER SIDEBAR -->

        <div class="admin-sidebar__footer">

          <button
            type="button"
            class="admin-sidebar__logout"
            :disabled="cerrandoSesion"
            @click="salir"
          >
            <span aria-hidden="true">
              ↪
            </span>

            <span>
              {{
                cerrandoSesion
                  ? 'Cerrando sesión...'
                  : 'Cerrar sesión'
              }}
            </span>
          </button>

        </div>

      </aside>

      <!-- OVERLAY -->

      <transition name="fade">

        <div
          v-if="menuAbierto"
          class="admin-layout__overlay"
          role="button"
          tabindex="0"
          aria-label="Cerrar menú"
          @click="cerrarMenu"
          @keydown.enter="cerrarMenu"
          @keydown.space.prevent="cerrarMenu"
        ></div>

      </transition>

      <!-- CONTENIDO -->

      <main
  class="admin-layout__content"
  tabindex="-1"
>

  <div
    v-if="cargandoRuta"
    class="admin-layout__loading"
    aria-live="polite"
  >
    <span
      class="admin-spinner"
      aria-hidden="true"
    ></span>

    Cargando...
  </div>

  <div
    v-if="errorSesion"
    class="admin-alert admin-alert--error"
    role="alert"
  >
    <span aria-hidden="true">
      ⚠️
    </span>

    {{ errorSesion }}

    <button
      type="button"
      class="admin-alert__close"
      aria-label="Cerrar mensaje"
      @click="limpiarErrorSesion"
    >
      ✕
    </button>
  </div>

  <RouterView v-slot="{ Component }">
    <transition
      name="fade-slide"
      mode="out-in"
    >
      <component
        :is="Component"
        :key="route.fullPath"
      />
    </transition>
  </RouterView>

</main>

    </div>

  </div>
</template>