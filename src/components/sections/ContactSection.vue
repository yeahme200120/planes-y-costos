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
    id="contacto"
    class="section contact"
  >
    <div class="container">

      <div class="contact__card">

        <div class="contact__content">

          <span
            v-if="contenido.eyebrow"
            class="section-eyebrow"
          >
            {{ contenido.eyebrow }}
          </span>

          <h2
            v-if="contenido.titulo"
            class="contact__title"
          >
            {{ contenido.titulo }}
          </h2>

          <p
            v-if="contenido.descripcion"
            class="contact__description"
          >
            {{ contenido.descripcion }}
          </p>

        </div>

        <div
          v-if="contenido.botonTexto"
          class="contact__action"
        >
          <a
            :href="contenido.botonUrl || '#'"
            class="contact__button"
          >
            {{ contenido.botonTexto }}
          </a>
        </div>

      </div>

    </div>
  </section>
</template>