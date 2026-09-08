<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  nextTick,
} from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'
import { auth } from '../../config/firebase'
import { cerrarSesion } from '../../services/authService'

const router = useRouter()
const route = useRoute()

// Estado
const usuario = ref(null)
const cerrandoSesion = ref(false)
const menuAbierto = ref(false)
const cargandoRuta = ref(false)
const errorSesion = ref(null)

let unsubscribeAuth = null

// === CICLO DE VIDA ===
onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (usuarioActual) => {
    usuario.value = usuarioActual
    errorSesion.value = null
  })

  document.addEventListener('keydown', manejarTecla)
  document.addEventListener('click', manejarClickFuera)
})

onUnmounted(() => {
  if (typeof unsubscribeAuth === 'function') unsubscribeAuth()
  document.removeEventListener('keydown', manejarTecla)
  document.removeEventListener('click', manejarClickFuera)
})

// === NAVEGACIÓN Y MENÚ ===
function manejarTecla(event) {
  if (event.key === 'Escape' && menuAbierto.value) {
    cerrarMenu()
  }
  // Atajo: Alt + M para abrir/cerrar menú
  if (event.key === 'm' && event.altKey) {
    event.preventDefault()
    alternarMenu()
  }
}

function manejarClickFuera(event) {
  const sidebar = document.querySelector('.admin-layout__sidebar')
  const menuBtn = document.querySelector('.admin-layout__menu-button')
  if (
    menuAbierto.value &&
    sidebar &&
    !sidebar.contains(event.target) &&
    menuBtn &&
    !menuBtn.contains(event.target)
  ) {
    cerrarMenu()
  }
}

function cerrarMenu() {
  menuAbierto.value = false
  // Devolver foco al botón del menú cuando se cierra
  nextTick(() => {
    const btn = document.querySelector('.admin-layout__menu-button')
    if (btn) btn.focus()
  })
}

function alternarMenu() {
  menuAbierto.value = !menuAbierto.value
  if (menuAbierto.value) {
    // Enfocar el primer enlace del sidebar al abrir
    nextTick(() => {
      const firstLink = document.querySelector('.admin-sidebar__link')
      if (firstLink) firstLink.focus()
    })
  }
}

function navegar(ruta) {
  if (route.path === ruta) return
  cargandoRuta.value = true
  cerrarMenu()
  router.push(ruta).finally(() => {
    cargandoRuta.value = false
  })
}

function irALanding() {
  cerrarMenu()
  window.open('/', '_blank') // Abre en nueva pestaña para no perder sesión
}

// === CIERRE DE SESIÓN CON CONFIRMACIÓN ===
async function salir() {
  if (cerrandoSesion.value) return

  // Confirmación amigable
  const confirmar = window.confirm(
    '¿Estás seguro de que deseas cerrar sesión?\n\nLos cambios no guardados se perderán.'
  )
  if (!confirmar) return

  try {
    cerrandoSesion.value = true
    errorSesion.value = null
    cerrarMenu()

    await cerrarSesion()
    router.replace('/admin/login')
  } catch (err) {
    console.error('Error al cerrar sesión:', err)
    errorSesion.value = err.message || 'Ocurrió un error al cerrar sesión.'
    // Mostrar error en la interfaz
    setTimeout(() => { errorSesion.value = null }, 5000)
  } finally {
    cerrandoSesion.value = false
  }
}

// === COMPUTADAS ===
const nombreUsuario = computed(() => {
  if (!usuario.value) return 'Administrador'
  return usuario.value.displayName || usuario.value.email || 'Administrador'
})

const emailUsuario = computed(() => usuario.value?.email || '')

const inicialUsuario = computed(() => {
  const nombre = usuario.value?.displayName || usuario.value?.email || 'A'
  return nombre.trim().charAt(0).toUpperCase()
})

const usuarioEstaAutenticado = computed(() => !!usuario.value)

// === WATCH para detectar errores de autenticación ===
watch(
  () => auth.currentUser,
  (user) => {
    if (!user && usuario.value) {
      // El usuario se desautenticó inesperadamente
      errorSesion.value = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
      setTimeout(() => { errorSesion.value = null }, 6000)
    }
  }
)
</script>

<template>
  <div class="admin-layout">

    <!-- HEADER -->
    <header class="admin-layout__header" role="banner">

      <div class="admin-layout__header-left">

        <button
          type="button"
          class="admin-layout__menu-button"
          :aria-label="menuAbierto ? 'Cerrar menú' : 'Abrir menú'"
          :aria-expanded="menuAbierto"
          :aria-controls="'admin-sidebar'"
          @click="alternarMenu"
          :class="{ 'is-active': menuAbierto }"
        >
          <span aria-hidden="true" v-if="!menuAbierto">☰</span>
          <span aria-hidden="true" v-else>✕</span>
        </button>

        <div>
          <p class="admin-layout__eyebrow">Administración</p>
          <h1 class="admin-layout__title">Panel administrativo</h1>
          <p class="admin-layout__subtitle">Gestión de contenido de la landing page.</p>
        </div>

      </div>

      <!-- ACCIONES DEL HEADER -->
      <div class="admin-layout__header-actions">

        <!-- Perfil del usuario (mejorado) -->
        <div v-if="usuario" class="admin-layout__user" :title="emailUsuario">
          <div class="admin-layout__avatar" aria-hidden="true">
            {{ inicialUsuario }}
          </div>
          <div class="admin-layout__user-info">
            <span class="admin-layout__user-label">Sesión activa</span>
            <strong class="admin-layout__user-name">{{ nombreUsuario }}</strong>
          </div>
        </div>

        <!-- Botones -->
        <button
          type="button"
          class="admin-button admin-button--secondary"
          @click="irALanding"
          title="Abrir la landing page en una nueva pestaña"
        >
          <span aria-hidden="true">🌐</span> Ver landing
        </button>

        <button
          type="button"
          class="admin-button admin-button--danger"
          :disabled="cerrandoSesion"
          @click="salir"
        >
          <span v-if="cerrandoSesion" aria-hidden="true">⏳</span>
          <span>{{ cerrandoSesion ? 'Cerrando...' : 'Cerrar sesión' }}</span>
        </button>

      </div>

    </header>

    <!-- CUERPO -->
    <div class="admin-layout__body">

      <!-- SIDEBAR -->
      <aside
        id="admin-sidebar"
        class="admin-layout__sidebar"
        :class="{ 'admin-layout__sidebar--open': menuAbierto }"
        aria-label="Menú administrativo"
        role="navigation"
      >

        <!-- BRAND -->
        <div class="admin-sidebar__brand">
          <div class="admin-sidebar__logo" aria-hidden="true">IA</div>
          <div>
            <strong>Landing Admin</strong>
            <span>Gestión de contenido</span>
          </div>
        </div>

        <!-- NAVEGACIÓN -->
        <nav class="admin-sidebar__nav" aria-label="Navegación administrativa">

          <p class="admin-sidebar__label">PRINCIPAL</p>

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{ 'admin-sidebar__link--active': route.path === '/admin' || route.path === '/admin/dashboard' }"
            :aria-current="route.path === '/admin' || route.path === '/admin/dashboard' ? 'page' : undefined"
            @click="navegar('/admin/dashboard')"
          >
            <span class="admin-sidebar__icon" aria-hidden="true">▦</span>
            <span>Dashboard</span>
          </button>

          <p class="admin-sidebar__label">CONTENIDO</p>

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{ 'admin-sidebar__link--active': route.path.startsWith('/admin/planes') }"
            :aria-current="route.path.startsWith('/admin/planes') ? 'page' : undefined"
            @click="navegar('/admin/planes')"
          >
            <span class="admin-sidebar__icon" aria-hidden="true">$</span>
            <span>Planes</span>
          </button>

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{ 'admin-sidebar__link--active': route.path.startsWith('/admin/secciones') }"
            :aria-current="route.path.startsWith('/admin/secciones') ? 'page' : undefined"
            @click="navegar('/admin/secciones')"
          >
            <span class="admin-sidebar__icon" aria-hidden="true">◫</span>
            <span>Secciones</span>
          </button>

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{ 'admin-sidebar__link--active': route.path.startsWith('/admin/contenido') }"
            :aria-current="route.path.startsWith('/admin/contenido') ? 'page' : undefined"
            @click="navegar('/admin/contenido')"
          >
            <span class="admin-sidebar__icon" aria-hidden="true">◈</span>
            <span>Contenido</span>
          </button>

          <p class="admin-sidebar__label">SISTEMA</p>

          <button
            type="button"
            class="admin-sidebar__link"
            :class="{ 'admin-sidebar__link--active': route.path.startsWith('/admin/configuracion') }"
            :aria-current="route.path.startsWith('/admin/configuracion') ? 'page' : undefined"
            @click="navegar('/admin/configuracion')"
          >
            <span class="admin-sidebar__icon" aria-hidden="true">⚙</span>
            <span>Configuración</span>
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
            <span aria-hidden="true">↪</span>
            <span>{{ cerrandoSesion ? 'Cerrando sesión...' : 'Cerrar sesión' }}</span>
          </button>
        </div>

      </aside>

      <!-- OVERLAY MÓVIL -->
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
        />
      </transition>

      <!-- CONTENIDO PRINCIPAL -->
      <main class="admin-layout__content" tabindex="-1">

        <!-- Indicador de carga de ruta -->
        <div v-if="cargandoRuta" class="admin-layout__loading" aria-live="polite">
          <span class="admin-spinner" aria-hidden="true"></span>
          Cargando...
        </div>

        <!-- Error de sesión -->
        <div v-if="errorSesion" class="admin-alert admin-alert--error" role="alert">
          <span aria-hidden="true">⚠️</span>
          {{ errorSesion }}
          <button type="button" class="admin-alert__close" @click="errorSesion = null" aria-label="Cerrar mensaje">✕</button>
        </div>

        <!-- Vista principal con transición -->
        <transition name="fade-slide" mode="out-in">
          <RouterView :key="route.fullPath" />
        </transition>

      </main>

    </div>

  </div>
</template>

<style scoped>
/* =========================================================
   MEJORAS UX: TRANSICIONES, ANIMACIONES Y ESTILOS
   ========================================================= */

/* Animación de entrada/salida para el overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transición de páginas */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Mejora visual del sidebar en móvil */
.admin-layout__sidebar {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* Avatar del usuario */
.admin-layout__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-accent, #2f80ed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.admin-layout__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  border-radius: 30px;
  background: var(--color-background, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  transition: border-color 0.2s;
}

.admin-layout__user:hover {
  border-color: var(--color-accent, #2f80ed);
}

.admin-layout__user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.admin-layout__user-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--color-text-muted, #94a3b8);
  font-weight: 700;
}

.admin-layout__user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary, #0f172a);
}

/* Botón de menú mejorado */
.admin-layout__menu-button {
  display: none;
  transition: transform 0.2s;
}

.admin-layout__menu-button.is-active {
  transform: rotate(90deg);
}

@media (max-width: 900px) {
  .admin-layout__menu-button {
    display: grid;
    place-items: center;
  }
}

/* Indicador de carga */
.admin-layout__loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: var(--color-text-muted);
  font-size: 14px;
  justify-content: center;
}

.admin-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Alerta mejorada */
.admin-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md, 10px);
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 600;
  position: relative;
}

.admin-alert--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.admin-alert__close {
  background: none;
  border: none;
  margin-left: auto;
  padding: 4px 8px;
  font-size: 18px;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.2s;
  line-height: 1;
}

.admin-alert__close:hover {
  opacity: 1;
}

/* Ajustes responsivos para el usuario */
@media (max-width: 800px) {
  .admin-layout__user {
    padding: 6px 10px 6px 6px;
  }
  .admin-layout__user-info {
    display: none; /* Solo avatar en pantallas muy pequeñas */
  }
  .admin-layout__user-label {
    display: none;
  }
}

@media (max-width: 480px) {
  .admin-layout__user {
    padding: 4px;
  }
  .admin-layout__avatar {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }
}
</style>