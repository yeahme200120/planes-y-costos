<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import {
  obtenerPlanesAdmin,
} from '../../services/adminService.js'

import {
  suscribirElementosAdmin,
} from '../../services/adminService.js'

import {
  suscribirContactosNuevos,
} from '../../services/contactosService.js'

const cargando = ref(true)
const actualizando = ref(false)

const error = ref('')
const mensaje = ref('')

const contactosNuevos = ref(0)

const estadisticas = ref({
  planes: 0,
  planesActivos: 0,
  soluciones: 0,
  solucionesActivas: 0,
  caracteristicas: 0,
  caracteristicasActivas: 0,
  faq: 0,
  faqActivas: 0,
})

let cancelarContactos = null

let cancelarSoluciones = null
let cancelarCaracteristicas = null
let cancelarFaq = null

let dashboardActivo = true

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

const contenidoTotal =
  computed(() => {
    return (
      estadisticas.value.planes +
      estadisticas.value.soluciones +
      estadisticas.value.caracteristicas +
      estadisticas.value.faq
    )
  })

const contenidoActivo =
  computed(() => {
    return (
      estadisticas.value.planesActivos +
      estadisticas.value.solucionesActivas +
      estadisticas.value.caracteristicasActivas +
      estadisticas.value.faqActivas
    )
  })

const porcentajeContenidoActivo =
  computed(() => {
    if (!contenidoTotal.value) {
      return 0
    }

    return Math.round(
      (
        contenidoActivo.value /
        contenidoTotal.value
      ) * 100
    )
  })

const estadoContenido =
  computed(() => {
    const porcentaje =
      porcentajeContenidoActivo.value

    if (porcentaje >= 90) {
      return {
        etiqueta: 'Excelente',
        clase: 'success',
      }
    }

    if (porcentaje >= 70) {
      return {
        etiqueta: 'Buen estado',
        clase: 'warning',
      }
    }

    return {
      etiqueta: 'Requiere atención',
      clase: 'danger',
    }
  })

const resumen = computed(() => {
  return [
    {
      nombre: 'Planes',
      valor:
        estadisticas.value.planes,
      detalle:
        `${estadisticas.value.planesActivos} activos`,
      icono: '$',
      clase: 'plans',
      ruta: '/admin/planes',
    },

    {
      nombre: 'Soluciones',
      valor:
        estadisticas.value.soluciones,
      detalle:
        `${estadisticas.value.solucionesActivas} activas`,
      icono: '◈',
      clase: 'solutions',
      ruta: '/admin/contenido',
    },

    {
      nombre: 'Características',
      valor:
        estadisticas.value.caracteristicas,
      detalle:
        `${estadisticas.value.caracteristicasActivas} activas`,
      icono: '✦',
      clase: 'features',
      ruta: '/admin/contenido',
    },

    {
      nombre: 'Preguntas FAQ',
      valor:
        estadisticas.value.faq,
      detalle:
        `${estadisticas.value.faqActivas} activas`,
      icono: '?',
      clase: 'faq',
      ruta: '/admin/contenido',
    },
  ]
})

function obtenerListaSegura(datos) {
  return Array.isArray(datos)
    ? datos
    : []
}

function contarActivos(lista) {
  return lista.filter(
    (elemento) =>
      elemento?.activo !== false
  ).length
}

function aplicarEstadisticasColeccion(
  nombre,
  lista
) {
  if (!dashboardActivo) {
    return
  }

  const datos =
    obtenerListaSegura(lista)

  if (nombre === 'soluciones') {
    estadisticas.value.soluciones =
      datos.length

    estadisticas.value.solucionesActivas =
      contarActivos(datos)
  }

  if (nombre === 'caracteristicas') {
    estadisticas.value.caracteristicas =
      datos.length

    estadisticas.value.caracteristicasActivas =
      contarActivos(datos)
  }

  if (nombre === 'faq') {
    estadisticas.value.faq =
      datos.length

    estadisticas.value.faqActivas =
      contarActivos(datos)
  }
}

function obtenerMensajeError(
  err,
  fallback
) {
  if (
    err instanceof Error &&
    err.message
  ) {
    return err.message
  }

  if (
    err &&
    typeof err === 'object' &&
    typeof err.message === 'string' &&
    err.message
  ) {
    return err.message
  }

  return fallback
}

function detenerSuscripcionesContenido() {
  cancelarSoluciones?.()
  cancelarCaracteristicas?.()
  cancelarFaq?.()

  cancelarSoluciones = null
  cancelarCaracteristicas = null
  cancelarFaq = null
}

function iniciarSuscripcionesContenido() {
  detenerSuscripcionesContenido()

  cancelarSoluciones =
    suscribirElementosAdmin(
      'soluciones',
      (datos) => {
        aplicarEstadisticasColeccion(
          'soluciones',
          datos
        )
      },
      (err) => {
        console.error(
          'Error obteniendo soluciones:',
          err
        )

        if (dashboardActivo) {
          error.value =
            obtenerMensajeError(
              err,
              'No fue posible obtener las soluciones.'
            )
        }
      }
    )

  cancelarCaracteristicas =
    suscribirElementosAdmin(
      'caracteristicas',
      (datos) => {
        aplicarEstadisticasColeccion(
          'caracteristicas',
          datos
        )
      },
      (err) => {
        console.error(
          'Error obteniendo características:',
          err
        )

        if (dashboardActivo) {
          error.value =
            obtenerMensajeError(
              err,
              'No fue posible obtener las características.'
            )
        }
      }
    )

  cancelarFaq =
    suscribirElementosAdmin(
      'faq',
      (datos) => {
        aplicarEstadisticasColeccion(
          'faq',
          datos
        )
      },
      (err) => {
        console.error(
          'Error obteniendo FAQ:',
          err
        )

        if (dashboardActivo) {
          error.value =
            obtenerMensajeError(
              err,
              'No fue posible obtener las preguntas FAQ.'
            )
        }
      }
    )
}

async function cargarDashboard({
  silencioso = false,
} = {}) {
  try {
    if (silencioso) {
      actualizando.value = true
    } else {
      cargando.value = true
    }

    error.value = ''

    const planes =
      await obtenerPlanesAdmin()

    if (!dashboardActivo) {
      return
    }

    const planesLista =
      obtenerListaSegura(planes)

    estadisticas.value = {
      ...estadisticas.value,

      planes:
        planesLista.length,

      planesActivos:
        planesLista.filter(
          (plan) =>
            plan?.activo !== false
        ).length,
    }

    if (silencioso) {
      mensaje.value =
        'Dashboard actualizado correctamente.'

      window.setTimeout(() => {
        if (dashboardActivo) {
          mensaje.value = ''
        }
      }, 3000)
    }
  } catch (err) {
    console.error(
      'Error cargando Dashboard:',
      err
    )

    if (dashboardActivo) {
      error.value =
        obtenerMensajeError(
          err,
          'No fue posible cargar las estadísticas del dashboard.'
        )
    }
  } finally {
    if (dashboardActivo) {
      cargando.value = false
      actualizando.value = false
    }
  }
}

function iniciarSuscripcionContactos() {
  cancelarContactos?.()

  cancelarContactos =
    suscribirContactosNuevos(
      (total) => {
        if (!dashboardActivo) {
          return
        }

        contactosNuevos.value =
          Number(total) || 0
      },
      (err) => {
        console.error(
          'Error obteniendo contactos nuevos:',
          err
        )

        if (dashboardActivo) {
          error.value =
            obtenerMensajeError(
              err,
              'No fue posible obtener los contactos nuevos.'
            )
        }
      }
    )
}

function actualizarDashboard() {
  if (actualizando.value) {
    return
  }

  cargarDashboard({
    silencioso: true,
  })
}

onMounted(() => {
  dashboardActivo = true

  cargarDashboard()
  iniciarSuscripcionesContenido()
  iniciarSuscripcionContactos()
})

onUnmounted(() => {
  dashboardActivo = false

  detenerSuscripcionesContenido()

  cancelarContactos?.()
  cancelarContactos = null
})
</script>

<template>
  <section class="admin-dashboard">

    <header
      class="admin-dashboard__header"
    >
      <div
        class="admin-dashboard__heading"
      >
        <span
          class="admin-dashboard__eyebrow"
        >
          RESUMEN GENERAL
        </span>

        <h1
          class="admin-dashboard__title"
        >
          Dashboard
        </h1>

        <p
          class="admin-dashboard__description"
        >
          Administra y supervisa rápidamente
          el contenido publicado en tu landing page.
        </p>
      </div>

      <div
        class="admin-dashboard__header-actions"
      >
        <button
          type="button"
          class="admin-dashboard__refresh"
          :disabled="actualizando"
          @click="actualizarDashboard"
        >
          <span
            class="admin-dashboard__refresh-icon"
            :class="{
              'is-spinning':
                actualizando,
            }"
            aria-hidden="true"
          >
            ↻
          </span>

          <span>
            {{
              actualizando
                ? 'Actualizando...'
                : 'Actualizar'
            }}
          </span>
        </button>
      </div>
    </header>

    <div
      v-if="mensaje"
      class="admin-dashboard__notice admin-dashboard__notice--success"
      role="status"
    >
      <span aria-hidden="true">
        ✓
      </span>

      {{ mensaje }}
    </div>

    <div
      v-if="error"
      class="admin-dashboard__notice admin-dashboard__notice--error"
      role="alert"
    >
      <span aria-hidden="true">
        !
      </span>

      {{ error }}
    </div>

    <div
      v-if="cargando"
      class="admin-dashboard__loading"
    >
      <div
        class="admin-dashboard__spinner"
        aria-hidden="true"
      ></div>

      <strong>
        Cargando dashboard...
      </strong>

      <span>
        Consultando información de Firebase.
      </span>
    </div>

    <template v-else>

      <!-- CONTACTOS -->
      <section
        class="admin-dashboard__attention"
        :class="{
          'is-empty':
            contactosNuevos === 0,
        }"
      >
        <div
          class="admin-dashboard__attention-icon"
          aria-hidden="true"
        >
          ✉
        </div>

        <div
          class="admin-dashboard__attention-content"
        >
          <span
            class="admin-dashboard__attention-label"
          >
            MENSAJES DE CONTACTO
          </span>

          <strong
            class="admin-dashboard__attention-title"
          >
            <template
              v-if="contactosNuevos > 0"
            >
              Tienes
              {{ contactosNuevos }}
              {{
                contactosNuevos === 1
                  ? 'contacto nuevo'
                  : 'contactos nuevos'
              }}
            </template>

            <template v-else>
              No tienes contactos nuevos
            </template>
          </strong>

          <span
            class="admin-dashboard__attention-description"
          >
            {{
              contactosNuevos > 0
                ? 'Revisa los mensajes recibidos desde la landing.'
                : 'Los nuevos mensajes aparecerán automáticamente aquí.'
            }}
          </span>
        </div>

        <RouterLink
          to="/admin/contactos"
          class="admin-dashboard__attention-action"
        >
          Ver contactos
        </RouterLink>
      </section>

      <!-- ESTADÍSTICAS -->
      <section
        class="admin-dashboard__stats"
        aria-label="Estadísticas"
      >
        <article
          v-for="item in resumen"
          :key="item.nombre"
          class="admin-dashboard__stat"
          :class="`admin-dashboard__stat--${item.clase}`"
        >
          <div
            class="admin-dashboard__stat-top"
          >
            <div
              class="admin-dashboard__stat-icon"
            >
              {{ item.icono }}
            </div>

            <span
              class="admin-dashboard__stat-indicator"
            >
              {{ item.detalle }}
            </span>
          </div>

          <div
            class="admin-dashboard__stat-body"
          >
            <span
              class="admin-dashboard__stat-label"
            >
              {{ item.nombre }}
            </span>

            <strong
              class="admin-dashboard__stat-value"
            >
              {{ item.valor }}
            </strong>
          </div>

          <RouterLink
            :to="item.ruta"
            class="admin-dashboard__stat-link"
          >
            Administrar

            <span aria-hidden="true">
              →
            </span>
          </RouterLink>
        </article>
      </section>

      <!-- CONTENIDO -->
      <div
        class="admin-dashboard__grid"
      >

        <section
          class="admin-dashboard__card"
        >
          <header
            class="admin-dashboard__card-header"
          >
            <div>
              <span
                class="admin-dashboard__card-eyebrow"
              >
                CONTENIDO
              </span>

              <h2
                class="admin-dashboard__card-title"
              >
                Estado de la landing
              </h2>

              <p
                class="admin-dashboard__card-description"
              >
                Resumen del contenido actualmente
                publicado.
              </p>
            </div>

            <span
              class="admin-dashboard__content-status"
              :class="`is-${estadoContenido.clase}`"
            >
              {{ estadoContenido.etiqueta }}
            </span>
          </header>

          <div
            class="admin-dashboard__progress"
          >
            <div
              class="admin-dashboard__progress-header"
            >
              <span>
                Contenido publicado
              </span>

              <strong>
                {{ porcentajeContenidoActivo }}%
              </strong>
            </div>

            <div
              class="admin-dashboard__progress-track"
              aria-hidden="true"
            >
              <div
                class="admin-dashboard__progress-bar"
                :style="{
                  width:
                    `${porcentajeContenidoActivo}%`,
                }"
              ></div>
            </div>
          </div>

          <div
            class="admin-dashboard__status-list"
          >
            <div
              class="admin-dashboard__status-row"
            >
              <div>
                <span
                  class="admin-dashboard__status-dot admin-dashboard__status-dot--plans"
                ></span>

                <span>
                  Planes activos
                </span>
              </div>

              <strong>
                {{
                  estadisticas.planesActivos
                }}
                /
                {{
                  estadisticas.planes
                }}
              </strong>
            </div>

            <div
              class="admin-dashboard__status-row"
            >
              <div>
                <span
                  class="admin-dashboard__status-dot admin-dashboard__status-dot--solutions"
                ></span>

                <span>
                  Soluciones
                </span>
              </div>

              <strong>
                {{
                  estadisticas.solucionesActivas
                }}
                /
                {{
                  estadisticas.soluciones
                }}
              </strong>
            </div>

            <div
              class="admin-dashboard__status-row"
            >
              <div>
                <span
                  class="admin-dashboard__status-dot admin-dashboard__status-dot--features"
                ></span>

                <span>
                  Características
                </span>
              </div>

              <strong>
                {{
                  estadisticas.caracteristicasActivas
                }}
                /
                {{
                  estadisticas.caracteristicas
                }}
              </strong>
            </div>

            <div
              class="admin-dashboard__status-row"
            >
              <div>
                <span
                  class="admin-dashboard__status-dot admin-dashboard__status-dot--faq"
                ></span>

                <span>
                  Preguntas frecuentes
                </span>
              </div>

              <strong>
                {{
                  estadisticas.faqActivas
                }}
                /
                {{
                  estadisticas.faq
                }}
              </strong>
            </div>
          </div>
        </section>

        <!-- ACCIONES -->
        <section
          class="admin-dashboard__card"
        >
          <header
            class="admin-dashboard__card-header"
          >
            <div>
              <span
                class="admin-dashboard__card-eyebrow"
              >
                ACCESOS RÁPIDOS
              </span>

              <h2
                class="admin-dashboard__card-title"
              >
                Administración
              </h2>

              <p
                class="admin-dashboard__card-description"
              >
                Accede directamente a las áreas
                principales.
              </p>
            </div>
          </header>

          <div
            class="admin-dashboard__quick-actions"
          >
            <RouterLink
              to="/admin/planes"
              class="admin-dashboard__quick-action"
            >
              <span
                class="admin-dashboard__quick-icon"
              >
                $
              </span>

              <span
                class="admin-dashboard__quick-content"
              >
                <strong>
                  Administrar planes
                </strong>

                <small>
                  Precios y características
                </small>
              </span>

              <span
                class="admin-dashboard__quick-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </RouterLink>

            <RouterLink
              to="/admin/secciones"
              class="admin-dashboard__quick-action"
            >
              <span
                class="admin-dashboard__quick-icon"
              >
                ▤
              </span>

              <span
                class="admin-dashboard__quick-content"
              >
                <strong>
                  Editar secciones
                </strong>

                <small>
                  Textos y estructura
                </small>
              </span>

              <span
                class="admin-dashboard__quick-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </RouterLink>

            <RouterLink
              to="/admin/contenido"
              class="admin-dashboard__quick-action"
            >
              <span
                class="admin-dashboard__quick-icon"
              >
                ◈
              </span>

              <span
                class="admin-dashboard__quick-content"
              >
                <strong>
                  Administrar contenido
                </strong>

                <small>
                  Soluciones, características y FAQ
                </small>
              </span>

              <span
                class="admin-dashboard__quick-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </RouterLink>

            <RouterLink
              to="/admin/contactos"
              class="admin-dashboard__quick-action"
            >
              <span
                class="admin-dashboard__quick-icon"
              >
                ✉
              </span>

              <span
                class="admin-dashboard__quick-content"
              >
                <strong>
                  Revisar contactos
                </strong>

                <small>
                  Mensajes recibidos
                </small>
              </span>

              <span
                v-if="contactosNuevos > 0"
                class="admin-dashboard__quick-badge"
              >
                {{ contactosNuevos }}
              </span>

              <span
                v-else
                class="admin-dashboard__quick-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </RouterLink>

            <RouterLink
              to="/admin/configuracion"
              class="admin-dashboard__quick-action"
            >
              <span
                class="admin-dashboard__quick-icon"
              >
                ⚙
              </span>

              <span
                class="admin-dashboard__quick-content"
              >
                <strong>
                  Configuración
                </strong>

                <small>
                  Datos generales y apariencia
                </small>
              </span>

              <span
                class="admin-dashboard__quick-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </RouterLink>
          </div>
        </section>
      </div>

      <!-- RESUMEN -->
      <section
        class="admin-dashboard__summary"
      >
        <div
          class="admin-dashboard__summary-icon"
          aria-hidden="true"
        >
          ✓
        </div>

        <div
          class="admin-dashboard__summary-content"
        >
          <strong>
            {{
              porcentajeContenidoActivo
            }}%
            del contenido está publicado
          </strong>

          <span>
            {{ contenidoActivo }}
            elementos publicados de
            {{ contenidoTotal }}
            registrados.
          </span>
        </div>

        <RouterLink
          to="/admin/contenido"
          class="admin-dashboard__summary-link"
        >
          Gestionar contenido

          <span aria-hidden="true">
            →
          </span>
        </RouterLink>
      </section>

    </template>
  </section>
</template>