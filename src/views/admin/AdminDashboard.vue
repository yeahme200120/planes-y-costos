<script setup>
import {
  computed,
  onMounted,
  ref,
} from 'vue'

import {
  obtenerPlanesAdmin,
} from '../../services/adminService'

import {
  getActiveCollection,
} from '../../services/contentService'

const cargando = ref(true)
const error = ref('')

const estadisticas = ref({
  planes: 0,
  planesActivos: 0,
  soluciones: 0,
  caracteristicas: 0,
  faq: 0,
})

const porcentajePlanesActivos =
  computed(() => {
    if (!estadisticas.value.planes) {
      return 0
    }

    return Math.round(
      (
        estadisticas.value.planesActivos /
        estadisticas.value.planes
      ) * 100
    )
  })

async function cargarDashboard() {
  try {
    cargando.value = true
    error.value = ''

    const [
      planes,
      soluciones,
      caracteristicas,
      faq,
    ] = await Promise.all([
      obtenerPlanesAdmin(),
      getActiveCollection(
        'soluciones'
      ),
      getActiveCollection(
        'caracteristicas'
      ),
      getActiveCollection(
        'faq'
      ),
    ])

    estadisticas.value = {
      planes: Array.isArray(planes)
        ? planes.length
        : 0,

      planesActivos:
        Array.isArray(planes)
          ? planes.filter(
              (plan) =>
                plan.activo === true
            ).length
          : 0,

      soluciones:
        Array.isArray(soluciones)
          ? soluciones.length
          : 0,

      caracteristicas:
        Array.isArray(caracteristicas)
          ? caracteristicas.length
          : 0,

      faq:
        Array.isArray(faq)
          ? faq.length
          : 0,
    }
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible cargar las estadísticas.'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarDashboard()
})
</script>

<template>
  <section class="admin-page">

    <div class="admin-page__header">

      <div>
        <p class="admin-page__eyebrow">
          RESUMEN
        </p>

        <h2 class="admin-page__title">
          Dashboard
        </h2>

        <p class="admin-page__description">
          Consulta rápidamente el estado del
          contenido de tu landing page.
        </p>
      </div>

    </div>

    <div
      v-if="error"
      class="admin-alert admin-alert--error"
    >
      {{ error }}
    </div>

    <div
      v-if="cargando"
      class="admin-loading"
    >
      <div class="admin-spinner"></div>

      <span>
        Cargando estadísticas...
      </span>
    </div>

    <template v-else>

      <div class="admin-stat-grid">

        <article class="admin-stat-card">

          <div class="admin-stat-card__icon">
            $
          </div>

          <div>
            <span class="admin-stat-card__label">
              Planes
            </span>

            <strong class="admin-stat-card__value">
              {{ estadisticas.planes }}
            </strong>
          </div>

        </article>

        <article class="admin-stat-card">

          <div class="admin-stat-card__icon">
            ✓
          </div>

          <div>
            <span class="admin-stat-card__label">
              Planes activos
            </span>

            <strong class="admin-stat-card__value">
              {{ estadisticas.planesActivos }}
            </strong>
          </div>

          <span class="admin-stat-card__badge">
            {{ porcentajePlanesActivos }}%
          </span>

        </article>

        <article class="admin-stat-card">

          <div class="admin-stat-card__icon">
            ◈
          </div>

          <div>
            <span class="admin-stat-card__label">
              Soluciones
            </span>

            <strong class="admin-stat-card__value">
              {{ estadisticas.soluciones }}
            </strong>
          </div>

        </article>

        <article class="admin-stat-card">

          <div class="admin-stat-card__icon">
            ✦
          </div>

          <div>
            <span class="admin-stat-card__label">
              Características
            </span>

            <strong class="admin-stat-card__value">
              {{ estadisticas.caracteristicas }}
            </strong>
          </div>

        </article>

        <article class="admin-stat-card">

          <div class="admin-stat-card__icon">
            ?
          </div>

          <div>
            <span class="admin-stat-card__label">
              Preguntas FAQ
            </span>

            <strong class="admin-stat-card__value">
              {{ estadisticas.faq }}
            </strong>
          </div>

        </article>

      </div>

      <div class="admin-dashboard-grid">

        <section class="admin-card">

          <div class="admin-card__header">

            <div>
              <p class="admin-card__eyebrow">
                CONTENIDO
              </p>

              <h3 class="admin-card__title">
                Estado de la landing
              </h3>
            </div>

          </div>

          <div class="admin-status-list">

            <div class="admin-status-row">
              <span>
                Planes activos
              </span>

              <strong>
                {{ estadisticas.planesActivos }}
              </strong>
            </div>

            <div class="admin-status-row">
              <span>
                Soluciones publicadas
              </span>

              <strong>
                {{ estadisticas.soluciones }}
              </strong>
            </div>

            <div class="admin-status-row">
              <span>
                Características publicadas
              </span>

              <strong>
                {{ estadisticas.caracteristicas }}
              </strong>
            </div>

            <div class="admin-status-row">
              <span>
                Preguntas frecuentes
              </span>

              <strong>
                {{ estadisticas.faq }}
              </strong>
            </div>

          </div>

        </section>

        <section class="admin-card">

          <div class="admin-card__header">

            <div>
              <p class="admin-card__eyebrow">
                ACCIONES
              </p>

              <h3 class="admin-card__title">
                Administración rápida
              </h3>
            </div>

          </div>

          <div class="admin-quick-actions">

            <RouterLink
              to="/admin/planes"
              class="admin-quick-action"
            >
              <strong>
                Administrar planes
              </strong>

              <span>
                Crear y modificar precios
              </span>
            </RouterLink>

            <RouterLink
              to="/admin/secciones"
              class="admin-quick-action"
            >
              <strong>
                Editar secciones
              </strong>

              <span>
                Modificar títulos y textos
              </span>
            </RouterLink>

            <RouterLink
              to="/admin/contenido"
              class="admin-quick-action"
            >
              <strong>
                Administrar contenido
              </strong>

              <span>
                Soluciones, características y FAQ
              </span>
            </RouterLink>

            <RouterLink
              to="/admin/configuracion"
              class="admin-quick-action"
            >
              <strong>
                Configuración
              </strong>

              <span>
                Empresa, colores y contacto
              </span>
            </RouterLink>

          </div>

        </section>

      </div>

    </template>

  </section>
</template>