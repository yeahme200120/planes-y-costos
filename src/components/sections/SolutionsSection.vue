<script setup>
import {
  computed,
} from 'vue'

import SolutionCard from './SolutionCard.vue'

const props = defineProps({
  contenido: {
    type: Object,
    default: () => ({}),
  },
})

/*
|--------------------------------------------------------------------------
| Estado de la sección
|--------------------------------------------------------------------------
*/

const activo = computed(() => {
  return props.contenido?.activo !== false
})

/*
|--------------------------------------------------------------------------
| Encabezado
|--------------------------------------------------------------------------
*/

const eyebrow = computed(() => {
  return String(
    props.contenido?.eyebrow ?? ''
  ).trim()
})

const titulo = computed(() => {
  return String(
    props.contenido?.titulo ?? ''
  ).trim()
})

const descripcion = computed(() => {
  return String(
    props.contenido?.descripcion ?? ''
  ).trim()
})

/*
|--------------------------------------------------------------------------
| Normalización de elementos
|--------------------------------------------------------------------------
|
| Firebase puede devolver mapas/objetos completos.
|
| Nunca debemos convertir un item a String() directamente porque eso
| puede provocar que el objeto termine apareciendo como JSON/texto
| en la interfaz.
|
|--------------------------------------------------------------------------
*/

const normalizarItem = (item, index) => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const orden = Number(item.orden)

  return {
    ...item,

    activo: item.activo !== false,

    orden:
      Number.isFinite(orden)
        ? orden
        : index + 1,

    titulo:
      typeof item.titulo === 'string'
        ? item.titulo.trim()
        : '',

    descripcion:
      typeof item.descripcion === 'string'
        ? item.descripcion.trim()
        : '',

    icono:
      typeof item.icono === 'string'
        ? item.icono.trim()
        : '',

    /*
     * Conservamos cualquier otro campo que exista en Firebase.
     *
     * Esto es importante porque no queremos destruir campos
     * adicionales que posteriormente puedan utilizarse.
     */
  }
}

/*
|--------------------------------------------------------------------------
| Elementos de soluciones
|--------------------------------------------------------------------------
*/

const items = computed(() => {
  const elementos =
    props.contenido?.items

  if (!Array.isArray(elementos)) {
    return []
  }

  return elementos
    .map((item, index) => {
      return normalizarItem(item, index)
    })
    .filter((item) => {
      if (!item) {
        return false
      }

      if (item.activo === false) {
        return false
      }

      return Boolean(
        item.titulo ||
        item.descripcion ||
        item.icono
      )
    })
    .sort((a, b) => {
      return (
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
      )
    })
})

/*
|--------------------------------------------------------------------------
| Estados de renderizado
|--------------------------------------------------------------------------
*/

const tieneEncabezado = computed(() => {
  return Boolean(
    eyebrow.value ||
    titulo.value ||
    descripcion.value
  )
})

const tieneSoluciones = computed(() => {
  return items.value.length > 0
})

/*
|--------------------------------------------------------------------------
| Clave estable
|--------------------------------------------------------------------------
|
| Evitamos depender exclusivamente del título porque puede repetirse.
|--------------------------------------------------------------------------
*/

const obtenerClaveItem = (item, index) => {
  if (item?.id) {
    return String(item.id)
  }

  return [
    'solution',
    item?.orden ?? index,
    item?.titulo || '',
    index,
  ].join('-')
}
</script>

<template>
  <section
    v-if="activo"
    id="soluciones"
    class="section solutions"
    aria-labelledby="solutions-title"
  >
    <div class="container solutions__container">

      <!-- =========================================================
           ENCABEZADO
           ========================================================= -->

      <header
        v-if="tieneEncabezado"
        class="section-header solutions__header"
      >
        <span
          v-if="eyebrow"
          class="section-eyebrow solutions__eyebrow"
        >
          {{ eyebrow }}
        </span>

        <h2
          v-if="titulo"
          id="solutions-title"
          class="section-title solutions__title"
        >
          {{ titulo }}
        </h2>

        <p
          v-if="descripcion"
          class="section-description solutions__description"
        >
          {{ descripcion }}
        </p>
      </header>

      <!-- =========================================================
           SOLUCIONES
           ========================================================= -->

      <div
        v-if="tieneSoluciones"
        class="solutions__grid"
      >
        <SolutionCard
          v-for="(item, index) in items"
          :key="obtenerClaveItem(item, index)"
          :item="item"
        />
      </div>

      <!-- =========================================================
           ESTADO VACÍO
           ========================================================= -->

      <div
        v-else
        class="solutions__empty"
        aria-live="polite"
      >
        <span
          class="solutions__empty-icon"
          aria-hidden="true"
        >
          ✦
        </span>

        <p class="solutions__empty-text">
          Actualmente estamos preparando
          nuestras soluciones.
        </p>
      </div>

    </div>
  </section>
</template>
