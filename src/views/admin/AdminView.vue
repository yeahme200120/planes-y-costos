<script setup>
import {
  onBeforeUnmount,
  onMounted,
} from 'vue'

import {
  useRouter,
} from 'vue-router'

const router = useRouter()

let componenteActivo = false

onMounted(async () => {
  componenteActivo = true

  try {
    if (!componenteActivo) {
      return
    }

    await router.replace(
      '/admin/dashboard',
    )
  } catch (error) {
    console.error(
      'Error redirigiendo al dashboard administrativo:',
      error,
    )
  }
})

onBeforeUnmount(() => {
  componenteActivo = false
})
</script>

<template>
  <main
    class="admin-loading-page"
    aria-live="polite"
    aria-busy="true"
  >
    <div
      class="admin-spinner"
      aria-hidden="true"
    ></div>

    <p>
      Cargando panel administrativo...
    </p>
  </main>
</template>