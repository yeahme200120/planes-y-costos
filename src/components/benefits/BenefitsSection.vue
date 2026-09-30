<script setup>
import { computed } from 'vue'
import SectionMediaWrapper from '../sections/SectionMediaWrapper.vue'
import BenefitCard from './BenefitCard.vue'

const props = defineProps({
  contenido: { type: Object, default: () => ({}) },
})

const activo      = computed(() => props.contenido?.activo !== false)
const eyebrow     = computed(() => { const v = props.contenido?.eyebrow; return typeof v === 'string' ? v.trim() : '' })
const titulo      = computed(() => { const v = props.contenido?.titulo;  return typeof v === 'string' ? v.trim() : '' })
const descripcion = computed(() => { const v = props.contenido?.descripcion; return typeof v === 'string' ? v.trim() : '' })

const items = computed(() => {
  const elementos = props.contenido?.items
  if (!Array.isArray(elementos)) return []
  return [...elementos]
    .filter(item => item && typeof item === 'object' && item.activo !== false)
    .map((item, index) => {
      const orden = Number(item.orden)
      return { ...item, orden: Number.isFinite(orden) ? orden : index + 1 }
    })
    .sort((a, b) => a.orden - b.orden)
})

const tieneEncabezado = computed(() => Boolean(eyebrow.value || titulo.value || descripcion.value))
</script>

<template>
  <section
    v-if="activo"
    id="beneficios"
    class="section benefits"
    style="position: relative;"
  >
    <SectionMediaWrapper :medio="contenido?.medio">

      <div v-if="tieneEncabezado" class="section-header">
        <span v-if="eyebrow" class="section-eyebrow">{{ eyebrow }}</span>
        <h2 v-if="titulo" class="section-title">{{ titulo }}</h2>
        <p v-if="descripcion" class="section-description">{{ descripcion }}</p>
      </div>

      <div v-if="items.length" class="benefits__grid">
        <BenefitCard
          v-for="(item, index) in items"
          :key="item.id || `${item.orden}-${index}-${item.titulo || ''}`"
          :item="item"
        />
      </div>

    </SectionMediaWrapper>
  </section>
</template>
