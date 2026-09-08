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
    id="nosotros"
    class="section about"
  >
    <div class="container">

      <div class="about__layout">

        <!-- Contenido -->
        <div class="about__content">

          <span
            v-if="contenido.eyebrow"
            class="section-eyebrow"
          >
            {{ contenido.eyebrow }}
          </span>

          <h2
            v-if="contenido.titulo"
            class="section-title"
          >
            {{ contenido.titulo }}
          </h2>

          <p
            v-if="contenido.descripcion"
            class="about__description"
          >
            {{ contenido.descripcion }}
          </p>

        </div>

        <!-- Imagen -->
        <div
          v-if="contenido.imagenUrl"
          class="about__media"
        >
          <img
            :src="contenido.imagenUrl"
            :alt="contenido.titulo || 'Nosotros'"
            loading="lazy"
          />
        </div>

        <!-- Placeholder cuando todavía no existe imagen -->
        <div
          v-else
          class="about__visual"
          aria-hidden="true"
        >
          <div class="about__visual-inner">
            <span>IAEH</span>
          </div>
        </div>

      </div>

    </div>
  </section>
</template>