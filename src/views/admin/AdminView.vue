<script setup>
import {
  onMounted,
} from 'vue'

import {
  useRouter,
} from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.replace(
    '/admin/dashboard'
  )
})
</script>

<template>
  <main class="admin-loading-page">
    <div class="admin-spinner"></div>

    <p>
      Cargando panel administrativo...
    </p>
  </main>
</template>