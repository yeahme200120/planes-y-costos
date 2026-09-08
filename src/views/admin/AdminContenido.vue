<script setup>
import {
  onMounted,
  reactive,
  ref,
} from 'vue'

import {
  cambiarEstadoElementoAdmin,
  crearElementoAdmin,
  eliminarElementoAdmin,
  obtenerElementosAdmin,
  actualizarElementoAdmin,
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

const modoEdicion = ref(false)
const elementoEditandoId = ref(null)

const formulario = reactive({
  titulo: '',
  descripcion: '',
  icono: '',
  pregunta: '',
  respuesta: '',
  orden: 1,
  activo: true,
})

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

async function cargarElementos() {
  try {
    cargando.value = true
    error.value = ''
    mensaje.value = ''

    elementos.value =
      await obtenerElementosAdmin(
        coleccionSeleccionada.value
      )
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible cargar los elementos.'
  } finally {
    cargando.value = false
  }
}

function cambiarColeccion() {
  limpiarFormulario()
  cargarElementos()
}

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
}

function obtenerNombreElemento() {
  if (
    coleccionSeleccionada.value ===
    'faq'
  ) {
    return formulario.pregunta.trim()
  }

  return formulario.titulo.trim()
}

async function guardarElemento() {
  try {
    guardando.value = true
    error.value = ''
    mensaje.value = ''

    let datos = {}

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
    } else {
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

    if (modoEdicion.value) {
      await actualizarElementoAdmin(
        coleccionSeleccionada.value,
        elementoEditandoId.value,
        datos
      )

      mensaje.value =
        'Elemento actualizado correctamente.'
    } else {
      await crearElementoAdmin(
        coleccionSeleccionada.value,
        datos
      )

      mensaje.value =
        'Elemento creado correctamente.'
    }

    limpiarFormulario()

    await cargarElementos()
  } catch (err) {
    console.error(err)

    error.value =
      err.message ??
      'No fue posible guardar el elemento.'
  } finally {
    guardando.value = false
  }
}

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

    elemento.activo = nuevoEstado

    mensaje.value =
      'Estado actualizado correctamente.'
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible actualizar el estado.'
  }
}

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

    elementos.value =
      elementos.value.filter(
        (item) =>
          item.id !== elemento.id
      )

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

onMounted(() => {
  cargarElementos()
})
</script>

<template>
  <section>
    <h2>
      Administración de contenido
    </h2>

    <p>
      Administra los elementos que aparecen
      dentro de las secciones.
    </p>

    <hr>

    <div>
      <label for="coleccion">
        Contenido
      </label>

      <select
        id="coleccion"
        v-model="coleccionSeleccionada"
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
    </div>

    <br>

    <p v-if="cargando">
      Cargando contenido...
    </p>

    <p v-if="error">
      {{ error }}
    </p>

    <p v-if="mensaje">
      {{ mensaje }}
    </p>

    <section v-if="!cargando">
      <h3>
        {{
          modoEdicion
            ? 'Editar elemento'
            : 'Nuevo elemento'
        }}
      </h3>

      <form
        @submit.prevent="guardarElemento"
      >

        <!-- SOLUCIONES / CARACTERÍSTICAS -->

        <template
          v-if="
            coleccionSeleccionada !== 'faq'
          "
        >
          <div>
            <label for="titulo">
              Título
            </label>

            <input
              id="titulo"
              v-model="formulario.titulo"
              type="text"
              placeholder="Título"
              required
            >
          </div>

          <br>

          <div>
            <label for="descripcion">
              Descripción
            </label>

            <textarea
              id="descripcion"
              v-model="
                formulario.descripcion
              "
              rows="4"
              placeholder="Descripción"
            />
          </div>

          <br>

          <div>
            <label for="icono">
              Icono
            </label>

            <input
              id="icono"
              v-model="formulario.icono"
              type="text"
              placeholder="Icono"
            >
          </div>

          <br>
        </template>

        <!-- FAQ -->

        <template
          v-else
        >
          <div>
            <label for="pregunta">
              Pregunta
            </label>

            <input
              id="pregunta"
              v-model="formulario.pregunta"
              type="text"
              placeholder="Pregunta frecuente"
              required
            >
          </div>

          <br>

          <div>
            <label for="respuesta">
              Respuesta
            </label>

            <textarea
              id="respuesta"
              v-model="formulario.respuesta"
              rows="6"
              placeholder="Respuesta"
              required
            />
          </div>

          <br>
        </template>

        <div>
          <label for="orden">
            Orden
          </label>

          <input
            id="orden"
            v-model.number="formulario.orden"
            type="number"
            min="1"
          >
        </div>

        <br>

        <div>
          <label>
            <input
              v-model="formulario.activo"
              type="checkbox"
            >

            Activo
          </label>
        </div>

        <br>

        <button
          type="submit"
          :disabled="guardando"
        >
          {{
            guardando
              ? 'Guardando...'
              : modoEdicion
                ? 'Actualizar'
                : 'Crear'
          }}
        </button>

        <button
          v-if="modoEdicion"
          type="button"
          @click="limpiarFormulario"
        >
          Cancelar
        </button>
      </form>
    </section>

    <hr>

    <section>
      <h3>
        Elementos registrados
      </h3>

      <p
        v-if="
          !cargando &&
          !elementos.length
        "
      >
        No existen elementos registrados.
      </p>

      <article
        v-for="elemento in elementos"
        :key="elemento.id"
      >
        <hr>

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

        <template v-else>
          <h4>
            {{ elemento.titulo }}
          </h4>

          <p
            v-if="
              elemento.descripcion
            "
          >
            {{ elemento.descripcion }}
          </p>

          <p
            v-if="elemento.icono"
          >
            Icono:
            {{ elemento.icono }}
          </p>
        </template>

        <p>
          Orden:
          {{ elemento.orden ?? 999 }}
        </p>

        <p>
          Estado:
          {{
            elemento.activo
              ? 'Activo'
              : 'Inactivo'
          }}
        </p>

        <button
          type="button"
          @click="
            editarElemento(elemento)
          "
        >
          Editar
        </button>

        <button
          type="button"
          @click="
            cambiarEstado(elemento)
          "
        >
          {{
            elemento.activo
              ? 'Desactivar'
              : 'Activar'
          }}
        </button>

        <button
          type="button"
          @click="eliminar(elemento)"
        >
          Eliminar
        </button>
      </article>
    </section>
  </section>
</template>