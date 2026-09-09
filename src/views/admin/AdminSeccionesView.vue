<script setup>

import {
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from 'vue'

import {
  actualizarSeccion,
  suscribirSeccionAdmin,
} from '../../services/adminService'

const secciones = [
  {
    id: 'hero',
    nombre: 'Hero',
  },
  {
    id: 'soluciones',
    nombre: 'Soluciones',
  },
  {
    id: 'caracteristicas',
    nombre: 'Características',
  },
  {
    id: 'nosotros',
    nombre: 'Nosotros',
  },
  {
    id: 'faq',
    nombre: 'Preguntas frecuentes',
  },
  {
    id: 'contacto',
    nombre: 'Contacto',
  },
]

const seccionSeleccionada =
  ref('hero')

const cargando = ref(false)

const guardando = ref(false)

const error = ref('')

const mensaje = ref('')

const datos = reactive({})

const conectadaTiempoReal =
  ref(false)

let unsubscribeSeccion = null

function limpiarDatos() {
  Object.keys(datos).forEach(
    (key) => {
      delete datos[key]
    }
  )
}

function cargarDatosSeccion(
  seccion
) {
  limpiarDatos()

  if (!seccion) {
    return
  }

  Object.assign(
    datos,
    seccion
  )
}

function iniciarSuscripcionSeccion() {
  if (unsubscribeSeccion) {
    unsubscribeSeccion()

    unsubscribeSeccion = null
  }

  cargando.value = true
  error.value = ''
  mensaje.value = ''
  conectadaTiempoReal.value = false

  limpiarDatos()

  const sectionId =
    seccionSeleccionada.value

  unsubscribeSeccion =
    suscribirSeccionAdmin(
      sectionId,
      (seccion) => {
        /*
         * Evita que una respuesta atrasada
         * de una sección anterior modifique
         * la sección actualmente seleccionada.
         */
        if (
          sectionId !==
          seccionSeleccionada.value
        ) {
          return
        }

        if (!seccion) {
          limpiarDatos()

          error.value =
            'La sección no existe en Firebase.'

          cargando.value = false

          conectadaTiempoReal.value =
            false

          return
        }

        cargarDatosSeccion(
          seccion
        )

        cargando.value = false

        error.value = ''

        conectadaTiempoReal.value =
          true
      },
      (err) => {
        console.error(
          err
        )

        error.value =
          'No fue posible sincronizar la sección en tiempo real.'

        cargando.value = false

        conectadaTiempoReal.value =
          false
      }
    )
}

function cambiarSeccion() {
  iniciarSuscripcionSeccion()
}

async function guardarSeccion() {
  try {
    guardando.value = true

    error.value = ''

    mensaje.value = ''

    const datosGuardar = {
      ...datos,
    }

    delete datosGuardar.id

    if (
      datosGuardar.orden !==
      undefined
    ) {
      datosGuardar.orden =
        Number(
          datosGuardar.orden
        )
    }

    if (
      datosGuardar.activo !==
      undefined
    ) {
      datosGuardar.activo =
        Boolean(
          datosGuardar.activo
        )
    }

    await actualizarSeccion(
      seccionSeleccionada.value,
      datosGuardar
    )

    /*
     * No hacemos cargarSeccion().
     *
     * Firestore onSnapshot()
     * actualizará automáticamente
     * el formulario.
     */
    mensaje.value =
      'Sección actualizada correctamente.'
  } catch (err) {
    console.error(err)

    error.value =
      err.message ??
      'No fue posible guardar la sección.'
  } finally {
    guardando.value = false
  }
}

function cerrarMensaje() {
  mensaje.value = ''
}

function cerrarError() {
  error.value = ''
}

onMounted(() => {
  iniciarSuscripcionSeccion()
})

onUnmounted(() => {
  if (unsubscribeSeccion) {
    unsubscribeSeccion()

    unsubscribeSeccion = null
  }
})

</script>

<template>

  <section class="admin-secciones">

    <header class="admin-secciones__header">

      <div>
        <p
          class="admin-secciones__eyebrow"
        >
          Administración
        </p>

        <h2
          class="admin-secciones__title"
        >
          Secciones
        </h2>

        <p
          class="admin-secciones__description"
        >
          Modifica el contenido general
          de las secciones de la landing
          page.
        </p>
      </div>

      <div
        class="admin-secciones__realtime"
        :class="{
          'admin-secciones__realtime--online':
            conectadaTiempoReal
        }"
      >

        <span
          class="admin-secciones__realtime-dot"
          aria-hidden="true"
        ></span>

        <span>
          {{
            conectadaTiempoReal
              ? 'Tiempo real activo'
              : 'Conectando...'
          }}
        </span>

      </div>

    </header>

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
        aria-label="Cerrar error"
        @click="cerrarError"
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
        @click="cerrarMensaje"
      >
        ×
      </button>

    </div>

    <div
      class="admin-secciones__selector-card"
    >

      <div
        class="admin-secciones__selector"
      >

        <label
          for="seccion"
          class="admin-secciones__label"
        >
          Sección
        </label>

        <select
          id="seccion"
          v-model="seccionSeleccionada"
          class="admin-secciones__select"
          :disabled="guardando"
          @change="cambiarSeccion"
        >

          <option
            v-for="seccion in secciones"
            :key="seccion.id"
            :value="seccion.id"
          >
            {{ seccion.nombre }}
          </option>

        </select>

      </div>

    </div>

    <div
      v-if="cargando"
      class="admin-layout__loading"
    >

      <span
        class="admin-spinner"
        aria-hidden="true"
      ></span>

      <span>
        Sincronizando sección...
      </span>

    </div>

    <form
      v-else-if="
        Object.keys(datos).length > 0
      "
      class="admin-secciones__form"
      @submit.prevent="guardarSeccion"
    >

      <div
        class="admin-secciones__form-header"
      >

        <div>

          <h3>
            {{
              secciones.find(
                (seccion) =>
                  seccion.id ===
                  seccionSeleccionada
              )?.nombre ??
              seccionSeleccionada
            }}
          </h3>

          <p>
            Los cambios se sincronizan
            automáticamente con Firebase.
          </p>

        </div>

        <span
          v-if="datos.id"
          class="admin-secciones__document-id"
        >
          ID: {{ datos.id }}
        </span>

      </div>

      <div
        class="admin-secciones__fields"
      >

        <template
          v-for="(valor, campo) in datos"
          :key="campo"
        >

          <div
            v-if="campo !== 'id'"
            class="admin-secciones__field"
          >

            <label
              :for="campo"
              class="admin-secciones__label"
            >
              {{ campo }}
            </label>

            <!-- BOOLEAN -->
            <div
              v-if="
                typeof valor ===
                'boolean'
              "
              class="admin-secciones__boolean"
            >

              <label
                class="admin-secciones__switch"
              >

                <input
                  :id="campo"
                  v-model="
                    datos[campo]
                  "
                  type="checkbox"
                >

                <span
                  class="admin-secciones__switch-slider"
                ></span>

                <span>
                  {{
                    datos[campo]
                      ? 'Activo'
                      : 'Inactivo'
                  }}
                </span>

              </label>

            </div>

            <!-- NUMBER -->
            <div
              v-else-if="
                typeof valor ===
                'number'
              "
            >

              <input
                :id="campo"
                v-model.number="
                  datos[campo]
                "
                class="admin-secciones__input"
                type="number"
              >

            </div>

            <!-- ARRAY -->
            <div
              v-else-if="
                Array.isArray(valor)
              "
            >

              <textarea
                :id="campo"
                class="admin-secciones__textarea"
                rows="6"
                :value="
                  valor.join('\n')
                "
                @input="
                  datos[campo] =
                    $event.target.value
                      .split('\n')
                      .map(
                        (item) =>
                          item.trim()
                      )
                      .filter(Boolean)
                "
              ></textarea>

              <small
                class="admin-secciones__hint"
              >
                Un elemento por línea.
              </small>

            </div>

            <!-- OBJECT -->
            <div
              v-else-if="
                typeof valor ===
                  'object' &&
                valor !== null
              "
            >

              <textarea
                :id="campo"
                class="admin-secciones__textarea admin-secciones__textarea--code"
                rows="10"
                :value="
                  JSON.stringify(
                    valor,
                    null,
                    2
                  )
                "
                @input="
                  (() => {
                    try {
                      datos[campo] =
                        JSON.parse(
                          $event.target.value
                        )
                    } catch {
                      // Esperar JSON válido
                    }
                  })()
                "
              ></textarea>

              <small
                class="admin-secciones__hint"
              >
                Formato JSON válido.
              </small>

            </div>

            <!-- STRING -->
            <div
              v-else
            >

              <textarea
                v-if="
                  String(valor).length >
                  100
                "
                :id="campo"
                v-model="
                  datos[campo]
                "
                class="admin-secciones__textarea"
                rows="6"
              ></textarea>

              <input
                v-else
                :id="campo"
                v-model="
                  datos[campo]
                "
                class="admin-secciones__input"
                type="text"
              >

            </div>

          </div>

        </template>

      </div>

      <footer
        class="admin-secciones__actions"
      >

        <div
          class="admin-secciones__sync-status"
        >

          <span
            class="admin-secciones__realtime-dot"
            :class="{
              'admin-secciones__realtime-dot--active':
                conectadaTiempoReal
            }"
          ></span>

          {{
            conectadaTiempoReal
              ? 'Sincronizado en tiempo real'
              : 'Sincronizando...'
          }}

        </div>

        <button
          type="submit"
          class="admin-secciones__save"
          :disabled="
            guardando ||
            !conectadaTiempoReal
          "
        >

          {{
            guardando
              ? 'Guardando...'
              : 'Guardar sección'
          }}

        </button>

      </footer>

    </form>

    <div
      v-else-if="!cargando"
      class="admin-secciones__empty"
    >

      <h3>
        Sección no encontrada
      </h3>

      <p>
        El documento
        <strong>
          secciones/{{
            seccionSeleccionada
          }}
        </strong>
        no existe en Firebase.
      </p>

    </div>

  </section>

</template>