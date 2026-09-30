<script setup>
import { computed } from 'vue'
import SectionMediaWrapper from './SectionMediaWrapper.vue'
import FeatureCard from './FeatureCard.vue'

const props = defineProps({
  contenido: { type: Object, default: () => ({}) },
})

const activo      = computed(() => props.contenido?.activo !== false)
const eyebrow     = computed(() => String(props.contenido?.eyebrow || '').trim())
const titulo      = computed(() => String(props.contenido?.titulo || '').trim())
const descripcion = computed(() => String(props.contenido?.descripcion || '').trim())

const items = computed(() => {
  const elementos = props.contenido?.items
  if (!Array.isArray(elementos)) return []
  return [...elementos]
    .filter(item => item && item.activo !== false &&
      (String(item.titulo || '').trim() || String(item.descripcion || '').trim()))
    .sort((a, b) => Number(a.orden ?? 999) - Number(b.orden ?? 999))
})

const tieneEncabezado = computed(() => Boolean(eyebrow.value || titulo.value || descripcion.value))
</script>

<template>
  <section
    v-if="activo"
    id="caracteristicas"
    class="section features"
    style="position: relative;"
    aria-labelledby="features-title"
  >
    <SectionMediaWrapper :medio="contenido?.medio">

      <header v-if="tieneEncabezado" class="section-header features__header">
        <span v-if="eyebrow" class="section-eyebrow">{{ eyebrow }}</span>
        <h2 v-if="titulo" id="features-title" class="section-title">{{ titulo }}</h2>
        <p v-if="descripcion" class="section-description">{{ descripcion }}</p>
      </header>

      <div v-if="items.length" class="features__grid">
        <FeatureCard
          v-for="item in items"
          :key="item.id || `${item.orden ?? 999}-${item.titulo || 'feature'}`"
          :item="item"
        />
      </div>

      <div v-else class="features__empty" aria-live="polite">
        <span class="features__empty-icon" aria-hidden="true">✓</span>
        <p>Estamos preparando las características de nuestras soluciones.</p>
      </div>

    </SectionMediaWrapper>
  </section>
</template>
