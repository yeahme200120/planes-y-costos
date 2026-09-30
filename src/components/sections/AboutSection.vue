<script setup>
import { computed } from 'vue'
import SectionMediaWrapper from './SectionMediaWrapper.vue'
import { medioTieneContenido } from '../../services/mediaService.js'

const props = defineProps({
  contenido: { type: Object, default: () => ({}) },
})

const activo              = computed(() => props.contenido?.activo !== false)
const eyebrow             = computed(() => String(props.contenido?.eyebrow || '').trim())
const titulo              = computed(() => String(props.contenido?.titulo || '').trim())
const descripcion         = computed(() => String(props.contenido?.descripcion || '').trim())
const textoSecundario     = computed(() => String(props.contenido?.textoSecundario || props.contenido?.descripcionSecundaria || '').trim())
const imagenUrl           = computed(() => String(props.contenido?.imagenUrl || props.contenido?.imagen || '').trim())
const imagenAlt           = computed(() => String(props.contenido?.imagenAlt || titulo.value || 'Conoce nuestra empresa').trim())
const botonTexto          = computed(() => String(props.contenido?.botonTexto || '').trim())
const botonUrl            = computed(() => String(props.contenido?.botonUrl || props.contenido?.url || '').trim() || '#contacto')
const mostrarBoton        = computed(() => Boolean(botonTexto.value))
const mostrarImagen       = computed(() => Boolean(imagenUrl.value))
const tieneContenido      = computed(() => Boolean(eyebrow.value || titulo.value || descripcion.value || textoSecundario.value || botonTexto.value))

const esEnlaceExterno     = computed(() => /^https?:\/\//i.test(botonUrl.value) || /^www\./i.test(botonUrl.value))

// Si hay medio dinámico, no mostrar la imagen estática vieja
const medioTiene          = computed(() => medioTieneContenido(props.contenido?.medio))
</script>

<template>
  <section
    v-if="activo"
    id="nosotros"
    class="section about"
    style="position: relative;"
    aria-labelledby="about-title"
  >
    <!--
      AboutSection tiene su propio layout grid interno (about__layout).
      SectionMediaWrapper solo gestiona el fondo absoluto.
      Para posición lateral usamos el grid existente integrando el medio.
    -->
    <SectionMediaWrapper :medio="contenido?.medio">

      <div
        class="about__layout"
        :class="{ 'about__layout--without-media': !mostrarImagen && !medioTiene }"
      >
        <div v-if="tieneContenido" class="about__content">
          <span v-if="eyebrow" class="section-eyebrow">{{ eyebrow }}</span>
          <h2 v-if="titulo" id="about-title" class="section-title">{{ titulo }}</h2>
          <p v-if="descripcion" class="about__description">{{ descripcion }}</p>
          <p v-if="textoSecundario" class="about__secondary">{{ textoSecundario }}</p>
          <a
            v-if="mostrarBoton"
            :href="botonUrl"
            class="about__button"
            :target="esEnlaceExterno ? '_blank' : undefined"
            :rel="esEnlaceExterno ? 'noopener noreferrer' : undefined"
          >
            <span>{{ botonTexto }}</span>
            <span class="about__button-icon" aria-hidden="true">→</span>
          </a>
        </div>

        <!-- Imagen estática (campo imagenUrl) — solo si no hay medio dinámico -->
        <div v-if="mostrarImagen && !medioTiene" class="about__media">
          <div class="about__media-frame">
            <img :src="imagenUrl" :alt="imagenAlt" class="about__image" loading="lazy" decoding="async" />
          </div>
        </div>

        <!-- Visual decorativo — si no hay imagen ni medio -->
        <div v-else-if="!mostrarImagen && !medioTiene" class="about__visual" aria-hidden="true">
          <div class="about__visual-glow"></div>
          <div class="about__visual-inner">
            <span class="about__visual-mark">IA</span>
            <span class="about__visual-name">IAEH</span>
            <span class="about__visual-line"></span>
          </div>
        </div>
      </div>

    </SectionMediaWrapper>
  </section>
</template>
