<script setup>
import {
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from 'vue'

import {
  cambiarEstadoPlan,
  crearPlan,
  eliminarPlan,
  suscribirPlanesAdmin,
  actualizarPlan,
} from '../../services/adminService'

const planes = ref([])

const cargando = ref(true)
const guardando = ref(false)

const error = ref('')
const mensaje = ref('')

const modoEdicion = ref(false)
const planEditandoId = ref(null)

const nuevaCaracteristica =
  ref('')

let unsubscribePlanes = null

let componenteActivo = false

const formulario = reactive({
  nombre: '',
  descripcion: '',
  precio: 0,
  moneda: 'MXN',
  periodo: 'mensual',
  orden: 1,
  activo: true,
  destacado: false,
  caracteristicas: [],
})

// =========================================================
// UTILIDADES
// =========================================================

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

function normalizarCaracteristicas(
  caracteristicas
) {
  if (
    Array.isArray(caracteristicas)
  ) {
    return caracteristicas
      .map((item) => {
        if (
          item === null ||
          item === undefined
        ) {
          return ''
        }

        if (
          typeof item === 'string'
        ) {
          return item.trim()
        }

        if (
          typeof item === 'object'
        ) {
          return String(
            item.texto ??
            item.nombre ??
            item.descripcion ??
            ''
          ).trim()
        }

        return String(item).trim()
      })
      .filter(Boolean)
  }

  if (
    typeof caracteristicas ===
    'string'
  ) {
    const texto =
      caracteristicas.trim()

    if (!texto) {
      return []
    }

    try {
      const parsed =
        JSON.parse(texto)

      if (
        Array.isArray(parsed)
      ) {
        return normalizarCaracteristicas(
          parsed
        )
      }
    } catch {
      // No es JSON; continuar como texto.
    }

    return texto
      .split(/\r?\n/)
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean)
  }

  return []
}

function normalizarOrden(valor) {
  const numero = Number(valor)

  if (
    !Number.isFinite(numero) ||
    numero < 1
  ) {
    return 1
  }

  return Math.min(
    Math.floor(numero),
    999
  )
}

function normalizarPrecio(valor) {
  const numero = Number(valor)

  if (
    !Number.isFinite(numero) ||
    numero < 0
  ) {
    return 0
  }

  return Math.round(
    numero * 100
  ) / 100
}

// =========================================================
// FORMULARIO
// =========================================================

function limpiarFormulario() {
  formulario.nombre = ''
  formulario.descripcion = ''
  formulario.precio = 0
  formulario.moneda = 'MXN'
  formulario.periodo = 'mensual'

  formulario.orden =
    planes.value.length + 1

  formulario.activo = true
  formulario.destacado = false
  formulario.caracteristicas = []

  nuevaCaracteristica.value = ''

  modoEdicion.value = false
  planEditandoId.value = null
}

function prepararFormularioDesdePlan(
  plan
) {
  formulario.nombre =
    String(
      plan?.nombre ??
      plan?.titulo ??
      ''
    ).trim()

  formulario.descripcion =
    String(
      plan?.descripcion ??
      ''
    ).trim()

  formulario.precio =
    normalizarPrecio(
      plan?.precio
    )

  formulario.moneda =
    String(
      plan?.moneda ??
      'MXN'
    ).trim() || 'MXN'

  formulario.periodo =
    String(
      plan?.periodo ??
      'mensual'
    ).trim() || 'mensual'

  formulario.orden =
    normalizarOrden(
      plan?.orden
    )

  formulario.activo =
    plan?.activo !== false

  formulario.destacado =
    plan?.destacado === true

  formulario.caracteristicas =
    normalizarCaracteristicas(
      plan?.caracteristicas
    )
}

// =========================================================
// SUSCRIPCIÓN FIREBASE
// =========================================================

function detenerSuscripcionPlanes() {
  if (
    typeof unsubscribePlanes ===
    'function'
  ) {
    unsubscribePlanes()
  }

  unsubscribePlanes = null
}

function iniciarSuscripcionPlanes() {
  detenerSuscripcionPlanes()

  cargando.value = true
  error.value = ''

  try {
    unsubscribePlanes =
      suscribirPlanesAdmin(
        (datos) => {
          if (!componenteActivo) {
            return
          }

          planes.value =
            Array.isArray(datos)
              ? datos
              : []

          cargando.value = false
          error.value = ''
        },
        (err) => {
          console.error(
            'Error obteniendo planes:',
            err
          )

          if (!componenteActivo) {
            return
          }

          error.value =
            obtenerMensajeError(
              err,
              'No fue posible cargar los planes en tiempo real.'
            )

          cargando.value = false
        }
      )
  } catch (err) {
    console.error(
      'Error iniciando suscripción de planes:',
      err
    )

    if (componenteActivo) {
      error.value =
        obtenerMensajeError(
          err,
          'No fue posible conectar con los planes.'
        )

      cargando.value = false
    }
  }
}

// =========================================================
// EDICIÓN
// =========================================================

function editarPlan(plan) {
  if (
    !plan ||
    !plan.id
  ) {
    error.value =
      'No fue posible identificar el plan seleccionado.'

    return
  }

  error.value = ''
  mensaje.value = ''

  modoEdicion.value = true
  planEditandoId.value = plan.id

  prepararFormularioDesdePlan(
    plan
  )

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// =========================================================
// CARACTERÍSTICAS
// =========================================================

function agregarCaracteristica() {
  const valor =
    nuevaCaracteristica.value.trim()

  if (!valor) {
    return
  }

  const existe =
    formulario.caracteristicas.some(
      (item) =>
        String(item)
          .trim()
          .toLowerCase() ===
        valor.toLowerCase()
    )

  if (existe) {
    error.value =
      'Esta característica ya fue agregada.'

    return
  }

  error.value = ''

  formulario.caracteristicas.push(
    valor
  )

  nuevaCaracteristica.value = ''
}

function eliminarCaracteristica(
  index
) {
  if (
    index < 0 ||
    index >=
      formulario.caracteristicas.length
  ) {
    return
  }

  formulario.caracteristicas.splice(
    index,
    1
  )
}

function manejarEnterCaracteristica(
  event
) {
  if (event.key === 'Enter') {
    event.preventDefault()

    agregarCaracteristica()
  }
}

// =========================================================
// GUARDAR PLAN
// =========================================================

async function guardarPlan() {
  if (guardando.value) {
    return
  }

  try {
    error.value = ''
    mensaje.value = ''
    guardando.value = true

    const nombre =
      formulario.nombre.trim()

    if (!nombre) {
      throw new Error(
        'El nombre del plan es obligatorio.'
      )
    }

    const precio =
      normalizarPrecio(
        formulario.precio
      )

    if (
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      throw new Error(
        'El precio debe ser un número válido mayor o igual a cero.'
      )
    }

    const orden =
      normalizarOrden(
        formulario.orden
      )

    if (
      !Number.isInteger(orden) ||
      orden < 1
    ) {
      throw new Error(
        'El orden debe ser un número entero mayor o igual a 1.'
      )
    }

    const moneda =
      String(
        formulario.moneda
      ).trim() || 'MXN'

    const periodo =
      String(
        formulario.periodo
      ).trim() || 'mensual'

    const caracteristicas =
      normalizarCaracteristicas(
        formulario.caracteristicas
      )

    const datos = {
      nombre,

      descripcion:
        String(
          formulario.descripcion
        ).trim(),

      precio,

      moneda,

      periodo,

      orden,

      activo:
        formulario.activo === true,

      destacado:
        formulario.destacado === true,

      caracteristicas,
    }

    if (modoEdicion.value) {
      if (
        !planEditandoId.value
      ) {
        throw new Error(
          'No se identificó el plan que deseas actualizar.'
        )
      }

      await actualizarPlan(
        planEditandoId.value,
        datos
      )

      if (!componenteActivo) {
        return
      }

      mensaje.value =
        'Plan actualizado correctamente.'
    } else {
      await crearPlan(
        datos
      )

      if (!componenteActivo) {
        return
      }

      mensaje.value =
        'Plan creado correctamente.'
    }

    limpiarFormulario()

    /*
     * limpiarFormulario() restablece
     * el formulario, pero no toca
     * mensaje ni error.
     *
     * La lista se actualizará
     * automáticamente mediante
     * suscribirPlanesAdmin().
     */
  } catch (err) {
    console.error(
      'Error guardando plan:',
      err
    )

    if (componenteActivo) {
      error.value =
        obtenerMensajeError(
          err,
          'No fue posible guardar el plan.'
        )
    }
  } finally {
    if (componenteActivo) {
      guardando.value = false
    }
  }
}

// =========================================================
// CAMBIAR ESTADO
// =========================================================

async function cambiarEstado(plan) {
  if (
    guardando.value
  ) {
    return
  }

  if (
    !plan ||
    !plan.id
  ) {
    error.value =
      'No fue posible identificar el plan.'

    return
  }

  try {
    error.value = ''
    mensaje.value = ''
    guardando.value = true

    const nuevoEstado =
      !Boolean(plan.activo)

    await cambiarEstadoPlan(
      plan.id,
      nuevoEstado
    )

    if (!componenteActivo) {
      return
    }

    mensaje.value =
      nuevoEstado
        ? 'Plan activado correctamente.'
        : 'Plan desactivado correctamente.'
  } catch (err) {
    console.error(
      'Error cambiando estado del plan:',
      err
    )

    if (componenteActivo) {
      error.value =
        obtenerMensajeError(
          err,
          'No fue posible actualizar el estado.'
        )
    }
  } finally {
    if (componenteActivo) {
      guardando.value = false
    }
  }
}

// =========================================================
// ELIMINAR
// =========================================================

async function eliminar(plan) {
  if (
    guardando.value
  ) {
    return
  }

  if (
    !plan ||
    !plan.id
  ) {
    error.value =
      'No fue posible identificar el plan.'

    return
  }

  const nombre =
    plan.nombre ??
    plan.titulo ??
    plan.id

  const confirmar =
    window.confirm(
      `¿Deseas eliminar el plan "${nombre}"? Esta acción no se puede deshacer.`
    )

  if (!confirmar) {
    return
  }

  try {
    error.value = ''
    mensaje.value = ''
    guardando.value = true

    await eliminarPlan(
      plan.id
    )

    if (!componenteActivo) {
      return
    }

    mensaje.value =
      'Plan eliminado correctamente.'

    if (
      planEditandoId.value ===
      plan.id
    ) {
      limpiarFormulario()
    }
  } catch (err) {
    console.error(
      'Error eliminando plan:',
      err
    )

    if (componenteActivo) {
      error.value =
        obtenerMensajeError(
          err,
          'No fue posible eliminar el plan.'
        )
    }
  } finally {
    if (componenteActivo) {
      guardando.value = false
    }
  }
}

// =========================================================
// CICLO DE VIDA
// =========================================================

onMounted(() => {
  componenteActivo = true

  iniciarSuscripcionPlanes()
})

onUnmounted(() => {
  componenteActivo = false

  detenerSuscripcionPlanes()
})
</script>

<template>
  <main class="admin-page">

    <div class="admin-page__header">

      <div>
        <p class="admin-page__eyebrow">
          CONTENIDO
        </p>

        <h2 class="admin-page__title">
          Planes
        </h2>

        <p
          class="admin-page__description"
        >
          Crea, modifica y administra
          los planes que aparecen en
          la landing.
        </p>
      </div>

    </div>

    <div
      v-if="error"
      class="admin-alert admin-alert--error"
      role="alert"
    >
      <span>
        {{ error }}
      </span>

      <button
        type="button"
        class="admin-alert__close"
        aria-label="Cerrar mensaje"
        @click="error = ''"
      >
        ×
      </button>
    </div>

    <div
      v-if="mensaje"
      class="admin-alert admin-alert--success"
      role="status"
    >
      <span>
        {{ mensaje }}
      </span>

      <button
        type="button"
        class="admin-alert__close"
        aria-label="Cerrar mensaje"
        @click="mensaje = ''"
      >
        ×
      </button>
    </div>

    <section class="admin-card">

      <div class="admin-card__header">

        <div>
          <p class="admin-card__eyebrow">
            {{
              modoEdicion
                ? 'EDICIÓN'
                : 'NUEVO'
            }}
          </p>

          <h3
            class="admin-card__title"
          >
            {{
              modoEdicion
                ? 'Editar plan'
                : 'Crear nuevo plan'
            }}
          </h3>
        </div>

        <button
          v-if="modoEdicion"
          type="button"
          class="admin-button admin-button--secondary"
          :disabled="guardando"
          @click="limpiarFormulario"
        >
          Cancelar edición
        </button>

      </div>

      <form
        class="admin-form"
        @submit.prevent="guardarPlan"
      >

        <div
          class="admin-form__grid admin-form__grid--2"
        >

          <div
            class="admin-form__group"
          >

            <label
              for="nombre"
              class="admin-form__label"
            >
              Nombre
            </label>

            <input
              id="nombre"
              v-model="
                formulario.nombre
              "
              class="admin-form__input"
              type="text"
              maxlength="100"
              placeholder="Ej. Plan Profesional"
              :disabled="guardando"
              required
            >

          </div>

          <div
            class="admin-form__group"
          >

            <label
              for="precio"
              class="admin-form__label"
            >
              Precio
            </label>

            <input
              id="precio"
              v-model.number="
                formulario.precio
              "
              class="admin-form__input"
              type="number"
              min="0"
              step="0.01"
              :disabled="guardando"
              required
            >

          </div>

        </div>

        <div
          class="admin-form__group"
        >

          <label
            for="descripcion"
            class="admin-form__label"
          >
            Descripción
          </label>

          <textarea
            id="descripcion"
            v-model="
              formulario.descripcion
            "
            class="admin-form__textarea"
            rows="4"
            maxlength="500"
            placeholder="Descripción del plan"
            :disabled="guardando"
          ></textarea>

          <p
            class="admin-form__hint"
          >
            Describe brevemente qué
            incluye este plan.
          </p>

        </div>

        <div
          class="admin-form__grid admin-form__grid--3"
        >

          <div
            class="admin-form__group"
          >

            <label
              for="moneda"
              class="admin-form__label"
            >
              Moneda
            </label>

            <input
              id="moneda"
              v-model="
                formulario.moneda
              "
              class="admin-form__input"
              type="text"
              maxlength="10"
              placeholder="MXN"
              :disabled="guardando"
            >

          </div>

          <div
            class="admin-form__group"
          >

            <label
              for="periodo"
              class="admin-form__label"
            >
              Periodo
            </label>

            <select
              id="periodo"
              v-model="
                formulario.periodo
              "
              class="admin-form__select"
              :disabled="guardando"
            >
              <option
                value="mensual"
              >
                Mensual
              </option>

              <option
                value="anual"
              >
                Anual
              </option>

              <option
                value="unico"
              >
                Pago único
              </option>
            </select>

          </div>

          <div
            class="admin-form__group"
          >

            <label
              for="orden"
              class="admin-form__label"
            >
              Orden
            </label>

            <input
              id="orden"
              v-model.number="
                formulario.orden
              "
              class="admin-form__input"
              type="number"
              min="1"
              step="1"
              :disabled="guardando"
              required
            >

          </div>

        </div>

        <div
          class="admin-form__options"
        >

          <label
            class="admin-checkbox"
          >
            <input
              v-model="
                formulario.activo
              "
              type="checkbox"
              :disabled="guardando"
            >

            <span>
              Activo
            </span>
          </label>

          <label
            class="admin-checkbox"
          >
            <input
              v-model="
                formulario.destacado
              "
              type="checkbox"
              :disabled="guardando"
            >

            <span>
              Plan destacado
            </span>
          </label>

        </div>

        <div
          class="admin-form__group"
        >

          <label
            class="admin-form__label"
            for="nueva-caracteristica"
          >
            Características
          </label>

          <div
            class="admin-inline-form"
          >

            <input
              id="nueva-caracteristica"
              v-model="
                nuevaCaracteristica
              "
              class="admin-form__input"
              type="text"
              maxlength="150"
              placeholder="Escribe una característica"
              :disabled="guardando"
              @keydown="
                manejarEnterCaracteristica
              "
            >

            <button
              type="button"
              class="admin-button admin-button--secondary"
              :disabled="guardando"
              @click="
                agregarCaracteristica
              "
            >
              Agregar
            </button>

          </div>

          <div
            v-if="
              formulario
                .caracteristicas
                .length
            "
            class="admin-tag-list"
          >

            <div
              v-for="(
                caracteristica,
                index
              ) in formulario.caracteristicas"
              :key="`${index}-${caracteristica}`"
              class="admin-tag"
            >

              <span>
                {{ caracteristica }}
              </span>

              <button
                type="button"
                aria-label="Eliminar característica"
                :disabled="guardando"
                @click="
                  eliminarCaracteristica(
                    index
                  )
                "
              >
                ×
              </button>

            </div>

          </div>

          <p
            v-else
            class="admin-form__hint"
          >
            No se han agregado
            características.
          </p>

        </div>

        <div
          class="admin-form__actions"
        >

          <button
            type="submit"
            class="admin-button admin-button--primary"
            :disabled="guardando"
          >
            {{
              guardando
                ? 'Guardando...'
                : modoEdicion
                  ? 'Actualizar plan'
                  : 'Crear plan'
            }}
          </button>

        </div>

      </form>

    </section>

    <section class="admin-card">

      <div
        class="admin-card__header"
      >

        <div>
          <p
            class="admin-card__eyebrow"
          >
            FIRESTORE
          </p>

          <h3
            class="admin-card__title"
          >
            Planes registrados
          </h3>
        </div>

        <span
          class="admin-count"
        >
          {{ planes.length }}
        </span>

      </div>

      <div
        v-if="cargando"
        class="admin-loading"
      >
        <div
          class="admin-spinner"
        ></div>

        <span>
          Cargando planes...
        </span>
      </div>

      <div
        v-else-if="!planes.length"
        class="admin-empty"
      >

        <div
          class="admin-empty__icon"
        >
          $
        </div>

        <h4>
          No existen planes
          registrados
        </h4>

        <p>
          Crea el primer plan
          utilizando el formulario
          anterior.
        </p>

      </div>

      <div
        v-else
        class="admin-plan-list"
      >

        <article
          v-for="plan in planes"
          :key="plan.id"
          class="admin-plan-card"
        >

          <div
            class="admin-plan-card__header"
          >

            <div>

              <div
                class="admin-plan-card__badges"
              >

                <span
                  class="admin-badge"
                  :class="
                    plan.activo
                      ? 'admin-badge--success'
                      : 'admin-badge--muted'
                  "
                >
                  {{
                    plan.activo
                      ? 'Activo'
                      : 'Inactivo'
                  }}
                </span>

                <span
                  v-if="plan.destacado"
                  class="admin-badge admin-badge--accent"
                >
                  Destacado
                </span>

              </div>

              <h4>
                {{
                  plan.nombre ??
                  plan.titulo ??
                  'Sin nombre'
                }}
              </h4>

            </div>

            <div
              class="admin-plan-card__price"
            >

              <strong>
                {{
                  Number(
                    plan.precio ?? 0
                  ).toLocaleString(
                    'es-MX',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )
                }}
              </strong>

              <span>
                {{
                  plan.moneda ??
                  'MXN'
                }}
              </span>

            </div>

          </div>

          <p
            v-if="plan.descripcion"
            class="admin-plan-card__description"
          >
            {{ plan.descripcion }}
          </p>

          <div
            class="admin-plan-card__meta"
          >

            <span>
              Orden:
              {{ plan.orden ?? 999 }}
            </span>

            <span>
              Periodo:
              {{ plan.periodo ?? 'mensual' }}
            </span>

            <span>
              ID:
              {{ plan.id }}
            </span>

          </div>

          <ul
            v-if="
              Array.isArray(
                plan.caracteristicas
              ) &&
              plan.caracteristicas
                .length
            "
            class="admin-plan-card__features"
          >

            <li
              v-for="(
                caracteristica,
                index
              ) in plan.caracteristicas"
              :key="`${plan.id}-feature-${index}`"
            >
              {{ caracteristica }}
            </li>

          </ul>

          <div
            class="admin-card__actions"
          >

            <button
              type="button"
              class="admin-button admin-button--secondary"
              :disabled="guardando"
              @click="
                editarPlan(plan)
              "
            >
              Editar
            </button>

            <button
              type="button"
              class="admin-button"
              :class="
                plan.activo
                  ? 'admin-button--warning'
                  : 'admin-button--success'
              "
              :disabled="guardando"
              @click="
                cambiarEstado(plan)
              "
            >
              {{
                plan.activo
                  ? 'Desactivar'
                  : 'Activar'
              }}
            </button>

            <button
              type="button"
              class="admin-button admin-button--danger"
              :disabled="guardando"
              @click="
                eliminar(plan)
              "
            >
              Eliminar
            </button>

          </div>

        </article>

      </div>

    </section>

  </main>
</template>