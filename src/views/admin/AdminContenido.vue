<script setup>
import {
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from 'vue'

import {
  cambiarEstadoElementoAdmin,
  crearElementoAdmin,
  eliminarElementoAdmin,
  actualizarElementoAdmin,
  suscribirElementosAdmin,
} from '../../services/adminService'

const colecciones = [
  {
    id: 'soluciones',
    nombre: 'Soluciones',
  },
  {
    id: 'caracteristicas',
    nombre: 'Características',
  },
  {
    id: 'faq',
    nombre: 'Preguntas frecuentes',
  },
]

const coleccionSeleccionada =
  ref('soluciones')

const elementos = ref([])

const cargando = ref(false)
const guardando = ref(false)

const error = ref('')
const mensaje = ref('')

const conectadaTiempoReal =
  ref(false)

const modoEdicion = ref(false)
const elementoEditandoId =
  ref(null)

const formulario = reactive({
  titulo: '',
  descripcion: '',
  icono: '',
  pregunta: '',
  respuesta: '',
  orden: 1,
  activo: true,
})

let unsubscribeElementos = null

/*
|--------------------------------------------------------------------------
| FORMULARIO
|--------------------------------------------------------------------------
*/

function limpiarFormulario() {
  formulario.titulo = ''
  formulario.descripcion = ''
  formulario.icono = ''
  formulario.pregunta = ''
  formulario.respuesta = ''
  formulario.orden = 1
  formulario.activo = true

  modoEdicion.value = false
  elementoEditandoId.value = null
}

/*
|--------------------------------------------------------------------------
| SUSCRIPCIÓN EN TIEMPO REAL
|--------------------------------------------------------------------------
*/

function iniciarSuscripcion() {
  if (unsubscribeElementos) {
    unsubscribeElementos()
    unsubscribeElementos = null
  }

  const coleccion =
    coleccionSeleccionada.value

  elementos.value = []

  cargando.value = true
  error.value = ''
  conectadaTiempoReal.value = false

  unsubscribeElementos =
    suscribirElementosAdmin(
      coleccion,
      (datos) => {
        /*
         * Verificamos que la respuesta
         * pertenezca a la colección
         * actualmente seleccionada.
         */
        if (
          coleccion !==
          coleccionSeleccionada.value
        ) {
          return
        }

        elementos.value = datos

        cargando.value = false
        conectadaTiempoReal.value = true
        error.value = ''
      },
      (err) => {
        console.error(
          'Error en tiempo real:',
          err
        )

        cargando.value = false
        conectadaTiempoReal.value = false

        error.value =
          'No fue posible sincronizar el contenido en tiempo real.'
      }
    )
}

function cambiarColeccion() {
  limpiarFormulario()

  mensaje.value = ''
  error.value = ''

  iniciarSuscripcion()
}

/*
|--------------------------------------------------------------------------
| EDICIÓN
|--------------------------------------------------------------------------
*/

function editarElemento(elemento) {
  error.value = ''
  mensaje.value = ''

  modoEdicion.value = true

  elementoEditandoId.value =
    elemento.id

  formulario.titulo =
    elemento.titulo ?? ''

  formulario.descripcion =
    elemento.descripcion ?? ''

  formulario.icono =
    elemento.icono ?? ''

  formulario.pregunta =
    elemento.pregunta ?? ''

  formulario.respuesta =
    elemento.respuesta ?? ''

  formulario.orden =
    Number(elemento.orden ?? 1)

  formulario.activo =
    Boolean(elemento.activo)

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

/*
|--------------------------------------------------------------------------
| GUARDAR
|--------------------------------------------------------------------------
*/

async function guardarElemento() {
  try {
    guardando.value = true

    error.value = ''
    mensaje.value = ''

    let datos = {}

    /*
     * FAQ
     */
    if (
      coleccionSeleccionada.value ===
      'faq'
    ) {
      datos = {
        pregunta:
          formulario.pregunta.trim(),

        respuesta:
          formulario.respuesta.trim(),

        orden:
          Number(formulario.orden),

        activo:
          Boolean(formulario.activo),
      }

      if (!datos.pregunta) {
        throw new Error(
          'La pregunta es obligatoria.'
        )
      }

      if (!datos.respuesta) {
        throw new Error(
          'La respuesta es obligatoria.'
        )
      }
    }

    /*
     * SOLUCIONES / CARACTERÍSTICAS
     */
    else {
      datos = {
        titulo:
          formulario.titulo.trim(),

        descripcion:
          formulario.descripcion.trim(),

        icono:
          formulario.icono.trim(),

        orden:
          Number(formulario.orden),

        activo:
          Boolean(formulario.activo),
      }

      if (!datos.titulo) {
        throw new Error(
          'El título es obligatorio.'
        )
      }
    }

    /*
     * ACTUALIZAR
     */
    if (modoEdicion.value) {
      await actualizarElementoAdmin(
        coleccionSeleccionada.value,
        elementoEditandoId.value,
        datos
      )

      mensaje.value =
        'Elemento actualizado correctamente.'
    }

    /*
     * CREAR
     */
    else {
      await crearElementoAdmin(
        coleccionSeleccionada.value,
        datos
      )

      mensaje.value =
        'Elemento creado correctamente.'
    }

    /*
     * IMPORTANTE:
     *
     * No hacemos:
     *
     * await cargarElementos()
     *
     * Firestore onSnapshot()
     * actualizará automáticamente
     * la lista.
     */
    limpiarFormulario()
  } catch (err) {
    console.error(err)

    error.value =
      err.message ??
      'No fue posible guardar el elemento.'
  } finally {
    guardando.value = false
  }
}

/*
|--------------------------------------------------------------------------
| ESTADO
|--------------------------------------------------------------------------
*/

async function cambiarEstado(elemento) {
  try {
    error.value = ''
    mensaje.value = ''

    const nuevoEstado =
      !Boolean(elemento.activo)

    await cambiarEstadoElementoAdmin(
      coleccionSeleccionada.value,
      elemento.id,
      nuevoEstado
    )

    /*
     * No modificamos manualmente
     * elementos.value.
     *
     * Firestore emitirá el cambio
     * mediante onSnapshot().
     */
    mensaje.value =
      'Estado actualizado correctamente.'
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible actualizar el estado.'
  }
}

/*
|--------------------------------------------------------------------------
| ELIMINAR
|--------------------------------------------------------------------------
*/

async function eliminar(elemento) {
  const nombre =
    elemento.pregunta ??
    elemento.titulo ??
    elemento.id

  const confirmar =
    window.confirm(
      `¿Deseas eliminar "${nombre}"?`
    )

  if (!confirmar) {
    return
  }

  try {
    error.value = ''
    mensaje.value = ''

    await eliminarElementoAdmin(
      coleccionSeleccionada.value,
      elemento.id
    )

    /*
     * No filtramos manualmente
     * la lista.
     *
     * onSnapshot() detectará
     * la eliminación.
     */

    if (
      elementoEditandoId.value ===
      elemento.id
    ) {
      limpiarFormulario()
    }

    mensaje.value =
      'Elemento eliminado correctamente.'
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible eliminar el elemento.'
  }
}

/*
|--------------------------------------------------------------------------
| CICLO DE VIDA
|--------------------------------------------------------------------------
*/

onMounted(() => {
  iniciarSuscripcion()
})

onUnmounted(() => {
  if (unsubscribeElementos) {
    unsubscribeElementos()
    unsubscribeElementos = null
  }
})
</script>

<template>
  <section class="admin-contenido">

    <!-- HEADER -->
    <header class="admin-contenido__header">

      <div>
        <span class="admin-contenido__eyebrow">
          Administración
        </span>

        <h2 class="admin-contenido__title">
          Contenido
        </h2>

        <p class="admin-contenido__description">
          Administra los elementos que aparecen
          dentro de las secciones de la landing.
        </p>
      </div>

      <!-- ESTADO TIEMPO REAL -->
      <div
        class="admin-contenido__realtime"
        :class="{
          'is-connected':
            conectadaTiempoReal,
        }"
      >
        <span
          class="admin-contenido__realtime-dot"
          aria-hidden="true"
        ></span>

        <span>
          {{
            conectadaTiempoReal
              ? 'En tiempo real'
              : 'Conectando...'
          }}
        </span>
      </div>

    </header>

    <!-- MENSAJE DE ERROR -->
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

    <!-- MENSAJE DE ÉXITO -->
    <div
      v-if="mensaje"
      class="admin-contenido__success"
      role="status"
    >
      <span
        aria-hidden="true"
      >
        ✓
      </span>

      <span>
        {{ mensaje }}
      </span>

      <button
        type="button"
        aria-label="Cerrar mensaje"
        @click="mensaje = ''"
      >
        ×
      </button>
    </div>

    <!-- SELECTOR -->
    <section class="admin-contenido__selector">

      <div>
        <span class="admin-contenido__card-eyebrow">
          Colección
        </span>

        <h3 class="admin-contenido__card-title">
          Selecciona el contenido
        </h3>
      </div>

      <label
        class="admin-contenido__select-wrapper"
        for="coleccion"
      >
        <span class="sr-only">
          Colección de contenido
        </span>

        <select
          id="coleccion"
          v-model="coleccionSeleccionada"
          class="admin-contenido__select"
          @change="cambiarColeccion"
        >
          <option
            v-for="coleccion in colecciones"
            :key="coleccion.id"
            :value="coleccion.id"
          >
            {{ coleccion.nombre }}
          </option>
        </select>
      </label>

    </section>

    <!-- LOADING -->
    <div
      v-if="cargando"
      class="admin-contenido__loading"
    >
      <span
        class="admin-spinner"
        aria-hidden="true"
      ></span>

      <span>
        Sincronizando contenido...
      </span>
    </div>

    <div
      v-else
      class="admin-contenido__layout"
    >

      <!-- FORMULARIO -->
      <section class="admin-contenido__form-card">

        <div class="admin-contenido__form-header">

          <div>
            <span class="admin-contenido__card-eyebrow">
              {{
                modoEdicion
                  ? 'Edición'
                  : 'Nuevo registro'
              }}
            </span>

            <h3 class="admin-contenido__card-title">
              {{
                modoEdicion
                  ? 'Editar elemento'
                  : 'Crear elemento'
              }}
            </h3>
          </div>

          <span
            v-if="modoEdicion"
            class="admin-contenido__edit-badge"
          >
            Editando
          </span>

        </div>

        <form
          class="admin-contenido__form"
          @submit.prevent="guardarElemento"
        >

          <!-- SOLUCIONES / CARACTERÍSTICAS -->
          <template
            v-if="
              coleccionSeleccionada !==
              'faq'
            "
          >

            <div class="admin-contenido__field">

              <label for="titulo">
                Título
              </label>

              <input
                id="titulo"
                v-model="formulario.titulo"
                type="text"
                placeholder="Ej. Desarrollo web"
                maxlength="120"
                required
              >

            </div>

            <div class="admin-contenido__field">

              <label for="descripcion">
                Descripción
              </label>

              <textarea
                id="descripcion"
                v-model="formulario.descripcion"
                rows="5"
                maxlength="500"
                placeholder="Describe esta solución..."
              ></textarea>

              <small>
                {{
                  formulario.descripcion.length
                }}/500
              </small>

            </div>

            <div class="admin-contenido__field">

              <label for="icono">
                Icono
              </label>

              <input
                id="icono"
                v-model="formulario.icono"
                type="text"
                maxlength="50"
                placeholder="Ej. 💻"
              >

              <small>
                Puedes utilizar un emoji o
                el identificador de tu icono.
              </small>

            </div>

          </template>

          <!-- FAQ -->
          <template v-else>

            <div class="admin-contenido__field">

              <label for="pregunta">
                Pregunta
              </label>

              <input
                id="pregunta"
                v-model="formulario.pregunta"
                type="text"
                maxlength="250"
                placeholder="Ej. ¿Cómo puedo contratar?"
                required
              >

            </div>

            <div class="admin-contenido__field">

              <label for="respuesta">
                Respuesta
              </label>

              <textarea
                id="respuesta"
                v-model="formulario.respuesta"
                rows="7"
                maxlength="1000"
                placeholder="Escribe la respuesta..."
                required
              ></textarea>

              <small>
                {{
                  formulario.respuesta.length
                }}/1000
              </small>

            </div>

          </template>

          <!-- ORDEN -->
          <div class="admin-contenido__form-row">

            <div class="admin-contenido__field">

              <label for="orden">
                Orden
              </label>

              <input
                id="orden"
                v-model.number="formulario.orden"
                type="number"
                min="1"
                max="999"
                required
              >

            </div>

            <!-- ACTIVO -->
            <div class="admin-contenido__field">

              <span class="admin-contenido__field-label">
                Estado
              </span>

              <label
                class="admin-contenido__switch"
              >
                <input
                  v-model="formulario.activo"
                  type="checkbox"
                >

                <span
                  class="admin-contenido__switch-track"
                >
                  <span
                    class="admin-contenido__switch-thumb"
                  ></span>
                </span>

                <span>
                  {{
                    formulario.activo
                      ? 'Activo'
                      : 'Inactivo'
                  }}
                </span>
              </label>

            </div>

          </div>

          <!-- ACCIONES -->
          <div class="admin-contenido__actions">

            <button
              type="submit"
              class="admin-button admin-button--primary"
              :disabled="
                guardando ||
                !conectadaTiempoReal
              "
            >
              <span
                v-if="guardando"
                class="admin-spinner admin-spinner--small"
              ></span>

              {{
                guardando
                  ? 'Guardando...'
                  : modoEdicion
                    ? 'Actualizar elemento'
                    : 'Crear elemento'
              }}
            </button>

            <button
              v-if="modoEdicion"
              type="button"
              class="admin-button admin-button--secondary"
              @click="limpiarFormulario"
            >
              Cancelar
            </button>

          </div>

        </form>

      </section>

      <!-- LISTADO -->
      <section class="admin-contenido__list-card">

        <div class="admin-contenido__list-header">

          <div>
            <span class="admin-contenido__card-eyebrow">
              Registros
            </span>

            <h3 class="admin-contenido__card-title">
              Elementos registrados
            </h3>
          </div>

          <span class="admin-contenido__count">
            {{ elementos.length }}
          </span>

        </div>

        <!-- VACÍO -->
        <div
          v-if="!elementos.length"
          class="admin-contenido__empty"
        >
          <div
            class="admin-contenido__empty-icon"
            aria-hidden="true"
          >
            ◇
          </div>

          <h4>
            No hay elementos
          </h4>

          <p>
            Esta colección todavía no tiene
            contenido registrado.
          </p>
        </div>

        <!-- ELEMENTOS -->
        <div
          v-else
          class="admin-contenido__items"
        >

          <article
            v-for="elemento in elementos"
            :key="elemento.id"
            class="admin-contenido__item"
          >

            <div class="admin-contenido__item-main">

              <!-- ICONO -->
              <div
                v-if="
                  coleccionSeleccionada !==
                    'faq' &&
                  elemento.icono
                "
                class="admin-contenido__item-icon"
              >
                {{ elemento.icono }}
              </div>

              <!-- INFO -->
              <div class="admin-contenido__item-info">

                <div class="admin-contenido__item-top">

                  <span
                    class="admin-contenido__order"
                  >
                    #{{ elemento.orden ?? 999 }}
                  </span>

                  <span
                    class="admin-contenido__status"
                    :class="{
                      'is-active':
                        elemento.activo,
                      'is-inactive':
                        !elemento.activo,
                    }"
                  >
                    {{
                      elemento.activo
                        ? 'Activo'
                        : 'Inactivo'
                    }}
                  </span>

                </div>

                <!-- FAQ -->
                <template
                  v-if="
                    coleccionSeleccionada ===
                    'faq'
                  "
                >
                  <h4>
                    {{ elemento.pregunta }}
                  </h4>

                  <p>
                    {{ elemento.respuesta }}
                  </p>
                </template>

                <!-- RESTO -->
                <template v-else>

                  <h4>
                    {{ elemento.titulo }}
                  </h4>

                  <p
                    v-if="
                      elemento.descripcion
                    "
                  >
                    {{
                      elemento.descripcion
                    }}
                  </p>

                </template>

              </div>

            </div>

            <!-- ACCIONES -->
            <div
              class="admin-contenido__item-actions"
            >

              <button
                type="button"
                class="admin-icon-button"
                title="Editar"
                aria-label="Editar elemento"
                @click="
                  editarElemento(elemento)
                "
              >
                ✎
              </button>

              <button
                type="button"
                class="admin-icon-button"
                :title="
                  elemento.activo
                    ? 'Desactivar'
                    : 'Activar'
                "
                :aria-label="
                  elemento.activo
                    ? 'Desactivar elemento'
                    : 'Activar elemento'
                "
                @click="
                  cambiarEstado(elemento)
                "
              >
                {{
                  elemento.activo
                    ? '◉'
                    : '○'
                }}
              </button>

              <button
                type="button"
                class="admin-icon-button admin-icon-button--danger"
                title="Eliminar"
                aria-label="Eliminar elemento"
                @click="
                  eliminar(elemento)
                "
              >
                ×
              </button>

            </div>

          </article>

        </div>

      </section>

    </div>

  </section>
</template>
