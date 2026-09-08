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

const cerrarMenu = () => {
  menuAbierto.value = false
}

const navegacion = computed(() => {
  const items =
    props.contenido?.navegacion ?? []

  if (!Array.isArray(items)) {
    return []
  }

  return [...items]
    .filter(
      (item) =>
        item &&
        item.activo !== false
    )
    .sort(
      (a, b) =>
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
    )
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
</script>

<template>
  <header
    v-if="
      contenido &&
      contenido.activo !== false
    "
    class="app-header"
  >
    <div
      class="container app-header__inner"
    >
      <a
        href="#inicio"
        class="app-header__brand"
        @click="cerrarMenu"
      >
        <span
          class="app-header__logo"
        >
          <img
            v-if="logoUrl"
            :src="logoUrl"
            :alt="nombreEmpresa"
          >

          <span v-else>
            {{ logoTexto }}
          </span>
        </span>

        <span
          class="app-header__brand-text"
        >
          <strong>
            {{ nombreEmpresa }}
          </strong>

          <small v-if="subtitulo">
            {{ subtitulo }}
          </small>
        </span>
      </a>

      <nav
        v-if="navegacion.length"
        class="app-header__nav"
      >
        <a
          v-for="item in navegacion"
          :key="
            `${item.orden}-${item.texto}`
          "
          :href="item.url || '#'"
          @click="cerrarMenu"
        >
          {{ item.texto }}
        </a>
      </nav>

      <a
        v-if="ctaTexto"
        :href="ctaUrl"
        class="app-header__cta"
        @click="cerrarMenu"
      >
        {{ ctaTexto }}
      </a>

      <button
        class="app-header__menu-button"
        type="button"
        aria-label="Abrir menú"
        :aria-expanded="menuAbierto"
        @click="
          menuAbierto = !menuAbierto
        "
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <div
      v-if="
        menuAbierto &&
        navegacion.length
      "
      class="app-header__mobile-menu"
    >
      <nav>
        <a
          v-for="item in navegacion"
          :key="
            `mobile-${item.orden}-${item.texto}`
          "
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