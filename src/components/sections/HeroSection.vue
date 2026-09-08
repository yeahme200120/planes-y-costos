<script setup>
defineProps({
  contenido: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <section
    v-if="contenido && contenido.activo !== false"
    id="inicio"
    class="hero"
  >
    <div class="container hero__content">

      <span
        v-if="contenido.eyebrow"
        class="hero__eyebrow"
      >
        {{ contenido.eyebrow }}
      </span>

      <h1 v-if="contenido.titulo">
        {{ contenido.titulo }}

        <span v-if="contenido.tituloResaltado">
          {{ contenido.tituloResaltado }}
        </span>
      </h1>

      <p v-if="contenido.descripcion">
        {{ contenido.descripcion }}
      </p>

      <a
        v-if="contenido.botonTexto"
        :href="contenido.botonUrl || '#planes'"
        class="hero__button"
      >
        {{ contenido.botonTexto }}
      </a>

    </div>
  </section>
</template>