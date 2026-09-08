<script setup>
import { computed, ref } from 'vue'

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

function cerrarMenu() {
  menuAbierto.value = false
}

const navegacion = computed(() => {
  const items = props.contenido?.navegacion

  if (!Array.isArray(items)) {
    return []
  }

  return items
    .filter((item) => {
      return (
        item &&
        item.texto &&
        item.activo !== false
      )
    })
    .sort((a, b) => {
      return (
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
      )
    })
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

const headerActivo = computed(() => {
  return props.contenido?.activo !== false
})
</script>

<template>
  <header
    v-if="headerActivo"
    class="app-header"
  >
    <div class="container app-header__inner">

      <!-- LOGOTIPO -->
      <a
        href="#inicio"
        class="app-header__brand"
        @click="cerrarMenu"
      >
        <span class="app-header__logo">
          <img
            v-if="logoUrl"
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

      <!-- NAVEGACIÓN DESKTOP -->
      <nav
        v-if="navegacion.length"
        class="app-header__nav"
        aria-label="Navegación principal"
      >
        <a
          v-for="item in navegacion"
          :key="`${item.orden}-${item.texto}`"
          :href="item.url || '#'"
          @click="cerrarMenu"
        >
          {{ item.texto }}
        </a>
      </nav>

      <!-- CTA -->
      <a
        v-if="ctaTexto"
        :href="ctaUrl"
        class="app-header__cta"
        @click="cerrarMenu"
      >
        {{ ctaTexto }}
      </a>

      <!-- BOTÓN MENÚ MÓVIL -->
      <button
        type="button"
        class="app-header__menu-button"
        aria-label="Abrir menú"
        :aria-expanded="menuAbierto"
        @click="menuAbierto = !menuAbierto"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- MENÚ MÓVIL -->
    <div
      v-if="
        menuAbierto &&
        navegacion.length
      "
      class="app-header__mobile-menu"
    >
      <nav
        aria-label="Navegación móvil"
      >
        <a
          v-for="item in navegacion"
          :key="`mobile-${item.orden}-${item.texto}`"
          :href="item.url || '#'"
          @click="cerrarMenu"
        >
          {{ item.texto }}
        </a>

        <a
          v-if="ctaTexto"
          :href="ctaUrl"
          class="app-header__mobile-cta"
          @click="cerrarMenu"
        >
          {{ ctaTexto }}
        </a>
      </nav>
    </div>
  </header>
</template>