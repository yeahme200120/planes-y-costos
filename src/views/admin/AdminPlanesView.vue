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

function iniciarSuscripcionPlanes() {
  cargando.value = true
  error.value = ''

  unsubscribePlanes =
    suscribirPlanesAdmin(
      (datos) => {
        planes.value = datos
        cargando.value = false
        error.value = ''
      },
      (err) => {
        console.error(err)

        error.value =
          'No fue posible cargar los planes en tiempo real.'

        cargando.value = false
      }
    )
}

function editarPlan(plan) {
  error.value = ''
  mensaje.value = ''

  modoEdicion.value = true
  planEditandoId.value = plan.id

  formulario.nombre =
    plan.nombre ??
    plan.titulo ??
    ''

  formulario.descripcion =
    plan.descripcion ??
    ''

  formulario.precio =
    Number(plan.precio ?? 0)

  formulario.moneda =
    plan.moneda ??
    'MXN'

  formulario.periodo =
    plan.periodo ??
    'mensual'

  formulario.orden =
    Number(plan.orden ?? 1)

  formulario.activo =
    Boolean(plan.activo)

  formulario.destacado =
    Boolean(plan.destacado)

  if (
    Array.isArray(
      plan.caracteristicas
    )
  ) {
    formulario.caracteristicas =
      [
        ...plan.caracteristicas,
      ]
  } else if (
    typeof plan.caracteristicas ===
    'string'
  ) {
    try {
      const parsed =
        JSON.parse(
          plan.caracteristicas
        )

      formulario.caracteristicas =
        Array.isArray(parsed)
          ? [...parsed]
          : [
              plan.caracteristicas,
            ]
    } catch {
      formulario.caracteristicas =
        plan.caracteristicas
          .split('\n')
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean)
    }
  } else {
    formulario.caracteristicas = []
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

function agregarCaracteristica() {
  const valor =
    nuevaCaracteristica.value.trim()

  if (!valor) {
    return
  }

  formulario.caracteristicas.push(
    valor
  )

  nuevaCaracteristica.value = ''
}

function eliminarCaracteristica(
  index
) {
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

async function guardarPlan() {
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
      Number(formulario.precio)

    if (
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      throw new Error(
        'El precio debe ser un número válido mayor o igual a cero.'
      )
    }

    const orden =
      Number(formulario.orden)

    if (
      !Number.isInteger(orden) ||
      orden < 1
    ) {
      throw new Error(
        'El orden debe ser un número entero mayor o igual a 1.'
      )
    }

    const datos = {
      nombre,

      descripcion:
        formulario.descripcion.trim(),

      precio,

      moneda:
        formulario.moneda.trim() ||
        'MXN',

      periodo:
        formulario.periodo,

      orden,

      activo:
        Boolean(
          formulario.activo
        ),

      destacado:
        Boolean(
          formulario.destacado
        ),

      caracteristicas:
        formulario.caracteristicas
          .map(
            (item) =>
              String(item).trim()
          )
          .filter(Boolean),
    }

    if (modoEdicion.value) {
      await actualizarPlan(
        planEditandoId.value,
        datos
      )

      mensaje.value =
        'Plan actualizado correctamente.'
    } else {
      await crearPlan(datos)

      mensaje.value =
        'Plan creado correctamente.'
    }

    limpiarFormulario()
  } catch (err) {
    console.error(err)

    error.value =
      err.message ??
      'No fue posible guardar el plan.'
  } finally {
    guardando.value = false
  }
}

async function cambiarEstado(plan) {
  try {
    error.value = ''
    mensaje.value = ''

    const nuevoEstado =
      !Boolean(plan.activo)

    await cambiarEstadoPlan(
      plan.id,
      nuevoEstado
    )

    mensaje.value =
      nuevoEstado
        ? 'Plan activado correctamente.'
        : 'Plan desactivado correctamente.'
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible actualizar el estado.'
  }
}

async function eliminar(plan) {
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

    await eliminarPlan(
      plan.id
    )

    mensaje.value =
      'Plan eliminado correctamente.'

    if (
      planEditandoId.value ===
      plan.id
    ) {
      limpiarFormulario()
    }
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible eliminar el plan.'
  }
}

onMounted(() => {
  iniciarSuscripcionPlanes()
})

onUnmounted(() => {
  unsubscribePlanes?.()
  unsubscribePlanes = null
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
              @keydown="
                manejarEnterCaracteristica
              "
            >

            <button
              type="button"
              class="admin-button admin-button--secondary"
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