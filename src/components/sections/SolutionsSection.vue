<script setup>
import { computed } from 'vue'
import SectionMediaWrapper from './SectionMediaWrapper.vue'
import SolutionCard from './SolutionCard.vue'

const props = defineProps({
  contenido: { type: Object, default: () => ({}) },
})

const activo      = computed(() => props.contenido?.activo !== false)
const eyebrow     = computed(() => String(props.contenido?.eyebrow ?? '').trim())
const titulo      = computed(() => String(props.contenido?.titulo ?? '').trim())
const descripcion = computed(() => String(props.contenido?.descripcion ?? '').trim())

const normalizarItem = (item, index) => {
  if (!item || typeof item !== 'object') return null
  const orden = Number(item.orden)
  return {
    ...item,
    activo:      item.activo !== false,
    orden:       Number.isFinite(orden) ? orden : index + 1,
    titulo:      typeof item.titulo      === 'string' ? item.titulo.trim()      : '',
    descripcion: typeof item.descripcion === 'string' ? item.descripcion.trim() : '',
    icono:       typeof item.icono       === 'string' ? item.icono.trim()       : '',
  }
}

const items = computed(() => {
  const elementos = props.contenido?.items
  if (!Array.isArray(elementos)) return []
  return elementos
    .map(normalizarItem)
    .filter(item => item && item.activo !== false && Boolean(item.titulo || item.descripcion || item.icono))
    .sort((a, b) => Number(a.orden ?? 999) - Number(b.orden ?? 999))
})

const tieneEncabezado = computed(() => Boolean(eyebrow.value || titulo.value || descripcion.value))
const tieneSoluciones = computed(() => items.value.length > 0)

const obtenerClaveItem = (item, index) => {
  if (item?.id) return String(item.id)
  return ['solution', item?.orden ?? index, item?.titulo || '', index].join('-')
}
</script>

<template>
  <section
    v-if="activo"
    id="soluciones"
    class="section solutions"
    style="position: relative;"
    aria-labelledby="solutions-title"
  >
    <SectionMediaWrapper :medio="contenido?.medio" container-class="solutions__container">

      <header v-if="tieneEncabezado" class="section-header solutions__header">
        <span v-if="eyebrow" class="section-eyebrow solutions__eyebrow">{{ eyebrow }}</span>
        <h2 v-if="titulo" id="solutions-title" class="section-title solutions__title">{{ titulo }}</h2>
        <p v-if="descripcion" class="section-description solutions__description">{{ descripcion }}</p>
      </header>

      <div v-if="tieneSoluciones" class="solutions__grid">
        <SolutionCard
          v-for="(item, index) in items"
          :key="obtenerClaveItem(item, index)"
          :item="item"
        />
      </div>

      <div v-else class="solutions__empty" aria-live="polite">
        <span class="solutions__empty-icon" aria-hidden="true">✦</span>
        <p class="solutions__empty-text">Actualmente estamos preparando nuestras soluciones.</p>
      </div>

    </SectionMediaWrapper>
  </section>
</template>
