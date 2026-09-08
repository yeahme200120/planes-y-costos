<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  iniciarSesion,
} from '../../services/authService'

const router = useRouter()

const email = ref('')
const password = ref('')

const cargando = ref(false)
const error = ref('')

async function iniciar() {
  try {
    cargando.value = true
    error.value = ''

    await iniciarSesion(
      email.value.trim(),
      password.value
    )

    const destino =
      router.currentRoute.value
        .query.redirect

    router.push(
      typeof destino === 'string'
        ? destino
        : '/admin/dashboard'
    )
  } catch (err) {
    console.error(err)

    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        error.value =
          'Correo o contraseña incorrectos.'
        break

      case 'auth/too-many-requests':
        error.value =
          'Demasiados intentos. Intenta nuevamente más tarde.'
        break

      default:
        error.value =
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
          IA
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
            required
          >

        </div>

        <div
          v-if="error"
          class="admin-alert admin-alert--error"
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