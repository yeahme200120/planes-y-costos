<script setup>
import { onMounted, reactive, ref } from 'vue'

import {
  actualizarSeccion,
  obtenerSeccionAdmin,
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

const seccionSeleccionada = ref('hero')

const cargando = ref(false)
const guardando = ref(false)

const error = ref('')
const mensaje = ref('')

const datos = reactive({})

async function cargarSeccion() {
  try {
    cargando.value = true
    error.value = ''
    mensaje.value = ''

    const seccion = await obtenerSeccionAdmin(
      seccionSeleccionada.value,
    )

    Object.keys(datos).forEach((key) => {
      delete datos[key]
    })

    if (!seccion) {
      return
    }

    Object.assign(datos, seccion)
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible cargar la sección.'
  } finally {
    cargando.value = false
  }
}

function cambiarSeccion() {
  cargarSeccion()
}

function parsearValor(valor) {
  if (typeof valor !== 'string') {
    return valor
  }

  const texto = valor.trim()

  if (!texto) {
    return ''
  }

  try {
    return JSON.parse(texto)
  } catch {
    return texto
  }
}

async function guardarSeccion() {
  try {
    guardando.value = true
    error.value = ''
    mensaje.value = ''

    const datosGuardar = {}

    Object.entries(datos).forEach(
      ([campo, valor]) => {
        if (campo === 'id') {
          return
        }

        datosGuardar[campo] = valor
      },
    )

    if (
      datosGuardar.orden !== undefined &&
      datosGuardar.orden !== ''
    ) {
      datosGuardar.orden = Number(
        datosGuardar.orden,
      )
    }

    if (
      datosGuardar.activo !== undefined
    ) {
      datosGuardar.activo = Boolean(
        datosGuardar.activo,
      )
    }

    await actualizarSeccion(
      seccionSeleccionada.value,
      datosGuardar,
    )

    mensaje.value =
      'Sección actualizada correctamente.'
  } catch (err) {
    console.error(err)

    error.value =
      err?.message ||
      'No fue posible guardar la sección.'
  } finally {
    guardando.value = false
  }
}

function nombreSeccionActual() {
  const seccion = secciones.find(
    (item) =>
      item.id === seccionSeleccionada.value,
  )

  return seccion?.nombre ||
    seccionSeleccionada.value
}

function esCampoGrande(campo, valor) {
  if (
    Array.isArray(valor) ||
    (typeof valor === 'object' &&
      valor !== null)
  ) {
    return true
  }

  return (
    String(valor ?? '').length > 100 ||
    campo === 'descripcion' ||
    campo === 'texto' ||
    campo === 'contenido'
  )
}

function esCampoCodigo(valor) {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    !Array.isArray(valor)
  )
}

onMounted(() => {
  cargarSeccion()
})
</script>

<template>
  <section class="admin-secciones">

    <!-- =====================================================
         HEADER
         ====================================================== -->

    <header class="admin-secciones__header">

      <div>
        <p class="admin-secciones__eyebrow">
          Landing page
        </p>

        <h2 class="admin-secciones__title">
          Administración de secciones
        </h2>

        <p class="admin-secciones__description">
          Modifica el contenido general de las
          secciones de la landing page.
        </p>
      </div>

      <div
        class="admin-secciones__realtime admin-secciones__realtime--online"
      >
        <span
          class="admin-secciones__realtime-dot"
        ></span>

        Contenido conectado a Firebase
      </div>

    </header>


    <!-- =====================================================
         SELECTOR
         ====================================================== -->

    <div class="admin-secciones__selector-card">

      <div class="admin-secciones__selector">

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
          :disabled="cargando || guardando"
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


    <!-- =====================================================
         ESTADOS
         ====================================================== -->

    <div
      v-if="cargando"
      class="admin-secciones__empty"
    >
      <h3>
        Cargando sección
      </h3>

      <p>
        Obteniendo información desde Firebase...
      </p>
    </div>


    <div
      v-else-if="error"
      class="admin-secciones__empty"
    >
      <h3>
        No fue posible cargar la sección
      </h3>

      <p>
        {{ error }}
      </p>
    </div>


    <div
      v-else-if="Object.keys(datos).length === 0"
      class="admin-secciones__empty"
    >
      <h3>
        Sección sin configuración
      </h3>

      <p>
        No existen datos para
        "{{ nombreSeccionActual() }}".
      </p>
    </div>


    <!-- =====================================================
         FORMULARIO
         ====================================================== -->

    <form
      v-else
      class="admin-secciones__form"
      @submit.prevent="guardarSeccion"
    >

      <!-- FORM HEADER -->

      <div class="admin-secciones__form-header">

        <div>
          <h3>
            {{ nombreSeccionActual() }}
          </h3>

          <p>
            Configuración y contenido de la sección.
          </p>
        </div>

        <code
          v-if="datos.id"
          class="admin-secciones__document-id"
        >
          {{ datos.id }}
        </code>

      </div>


      <!-- FIELDS -->

      <div class="admin-secciones__fields">

        <template
          v-for="(valor, campo) in datos"
          :key="campo"
        >

          <div
            v-if="campo !== 'id'"
            class="admin-secciones__field"
          >

            <label
              :for="`campo-${campo}`"
              class="admin-secciones__label"
            >
              {{ campo }}
            </label>


            <!-- BOOLEAN -->

            <div
              v-if="typeof valor === 'boolean'"
              class="admin-secciones__boolean"
            >

              <label
                class="admin-secciones__switch"
              >

                <input
                  :id="`campo-${campo}`"
                  v-model="datos[campo]"
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

            <input
              v-else-if="typeof valor === 'number'"
              :id="`campo-${campo}`"
              v-model.number="datos[campo]"
              class="admin-secciones__input"
              type="number"
            >


            <!-- ARRAY -->

            <textarea
              v-else-if="Array.isArray(valor)"
              :id="`campo-${campo}`"
              class="admin-secciones__textarea"
              rows="7"
              :value="valor.join('\n')"
              @input="
                datos[campo] = $event.target.value
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean)
              "
            ></textarea>


            <!-- OBJECT / JSON -->

            <textarea
              v-else-if="
                typeof valor === 'object' &&
                valor !== null
              "
              :id="`campo-${campo}`"
              class="admin-secciones__textarea admin-secciones__textarea--code"
              rows="10"
              :value="
                JSON.stringify(
                  valor,
                  null,
                  2,
                )
              "
              @input="
                (() => {
                  const nuevoValor =
                    parsearValor(
                      $event.target.value,
                    )

                  if (
                    typeof nuevoValor ===
                      'object' &&
                    nuevoValor !== null
                  ) {
                    datos[campo] = nuevoValor
                  }
                })()
              "
            ></textarea>


            <!-- TEXT -->

            <textarea
              v-else-if="
                esCampoGrande(
                  campo,
                  valor,
                )
              "
              :id="`campo-${campo}`"
              v-model="datos[campo]"
              class="admin-secciones__textarea"
              rows="6"
            ></textarea>


            <!-- SIMPLE TEXT -->

            <input
              v-else
              :id="`campo-${campo}`"
              v-model="datos[campo]"
              class="admin-secciones__input"
              type="text"
            >

            <small
              v-if="Array.isArray(valor)"
              class="admin-secciones__hint"
            >
              Escribe un elemento por línea.
            </small>

            <small
              v-else-if="esCampoCodigo(valor)"
              class="admin-secciones__hint"
            >
              Este campo utiliza formato JSON.
            </small>

          </div>

        </template>

      </div>


      <!-- ACTIONS -->

      <div class="admin-secciones__actions">

        <div
          v-if="mensaje"
          class="admin-secciones__sync-status"
        >
          <span
            class="admin-secciones__realtime-dot admin-secciones__realtime-dot--active"
          ></span>

          {{ mensaje }}
        </div>

        <div
          v-else
          class="admin-secciones__sync-status"
        >
          <span
            class="admin-secciones__realtime-dot admin-secciones__realtime-dot--active"
          ></span>

          Cambios listos para guardar
        </div>

        <button
          type="submit"
          class="admin-secciones__save"
          :disabled="guardando"
        >
          {{
            guardando
              ? 'Guardando...'
              : 'Guardar sección'
          }}
        </button>

      </div>

    </form>

  </section>
</template>
