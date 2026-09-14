<script setup>
import {
  ref,
} from 'vue'

import {
  useRouter,
} from 'vue-router'

import {
  iniciarSesion,
} from '../../services/authService'

const router = useRouter()

// =========================================================
// ESTADO
// =========================================================

const email = ref('')
const password = ref('')

const cargando = ref(false)
const error = ref('')

// =========================================================
// INICIO DE SESIÓN
// =========================================================

async function iniciar() {
  if (cargando.value) {
    return
  }

  try {
    cargando.value = true
    error.value = ''

    const correo =
      email.value.trim()

    if (!correo || !password.value) {
      error.value =
        'Ingresa tu correo electrónico y contraseña.'

      return
    }

    await iniciarSesion(
      correo,
      password.value
    )

    const destino =
      router.currentRoute.value
        .query
        .redirect

    const rutaDestino =
      typeof destino === 'string' &&
      destino.startsWith('/admin')
        ? destino
        : '/admin/dashboard'

    await router.push(
      rutaDestino
    )
  } catch (err) {
    console.error(
      'Error al iniciar sesión:',
      err
    )

    const codigoError =
      err?.code || ''

    switch (codigoError) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        error.value =
          'Correo o contraseña incorrectos.'
        break

      case 'auth/too-many-requests':
        error.value =
          'Demasiados intentos. Intenta nuevamente más tarde.'
        break

      case 'auth/user-disabled':
        error.value =
          'Esta cuenta se encuentra deshabilitada.'
        break

      case 'auth/network-request-failed':
        error.value =
          'No fue posible conectarse con el servidor. Verifica tu conexión a internet.'
        break

      default:
        error.value =
          err?.message ||
          'No fue posible iniciar sesión.'
    }
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="admin-login">

    <section class="admin-login__card">

      <div class="admin-login__brand">

        <div class="admin-login__logo">
          <img
            class="logo-image"
            src="/img/logo.jpg"
            alt="Logo"
          >
        </div>

        <span>
          Administración
        </span>

      </div>

      <div class="admin-login__header">

        <p class="admin-login__eyebrow">
          PANEL ADMINISTRATIVO
        </p>

        <h1>
          Bienvenido
        </h1>

        <p>
          Inicia sesión para administrar
          la landing page.
        </p>

      </div>

      <form
        class="admin-form"
        @submit.prevent="iniciar"
      >

        <div class="admin-form__group">

          <label
            for="email"
            class="admin-form__label"
          >
            Correo electrónico
          </label>

          <input
            id="email"
            v-model="email"
            class="admin-form__input"
            type="email"
            autocomplete="username"
            placeholder="correo@ejemplo.com"
            :disabled="cargando"
            required
          >

        </div>

        <div class="admin-form__group">

          <label
            for="password"
            class="admin-form__label"
          >
            Contraseña
          </label>

          <input
            id="password"
            v-model="password"
            class="admin-form__input"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="cargando"
            required
          >

        </div>

        <div
          v-if="error"
          class="admin-alert admin-alert--error"
          role="alert"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          class="admin-button admin-button--primary admin-button--full"
          :disabled="cargando"
        >
          {{
            cargando
              ? 'Iniciando sesión...'
              : 'Iniciar sesión'
          }}
        </button>

      </form>

      <RouterLink
        to="/"
        class="admin-login__back"
      >
        ← Volver a la landing
      </RouterLink>

    </section>

  </main>
</template>