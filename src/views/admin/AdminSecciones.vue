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
      seccionSeleccionada.value
    )

    if (!seccion) {
      Object.keys(datos).forEach((key) => {
        delete datos[key]
      })

      return
    }

    Object.keys(datos).forEach((key) => {
      delete datos[key]
    })

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
      datosGuardar.orden !== undefined
    ) {
      datosGuardar.orden = Number(
        datosGuardar.orden
      )
    }

    if (
      datosGuardar.activo !== undefined
    ) {
      datosGuardar.activo = Boolean(
        datosGuardar.activo
      )
    }

    await actualizarSeccion(
      seccionSeleccionada.value,
      datosGuardar
    )

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

onMounted(() => {
  cargarSeccion()
})
</script>

<template>
  <section>
    <h2>
      Administración de secciones
    </h2>

    <p>
      Modifica el contenido general de las
      secciones de la landing page.
    </p>

    <hr>

    <div>
      <label for="seccion">
        Sección
      </label>

      <select
        id="seccion"
        v-model="seccionSeleccionada"
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

    <br>

    <p v-if="cargando">
      Cargando sección...
    </p>

    <p v-if="error">
      {{ error }}
    </p>

    <p v-if="mensaje">
      {{ mensaje }}
    </p>

    <form
      v-if="!cargando"
      @submit.prevent="guardarSeccion"
    >
      <div
        v-for="(valor, campo) in datos"
        :key="campo"
      >
        <div v-if="campo !== 'id'">
          <label :for="campo">
            {{ campo }}
          </label>

          <div
            v-if="typeof valor === 'boolean'"
          >
            <label>
              <input
                :id="campo"
                v-model="datos[campo]"
                type="checkbox"
              >

              {{ datos[campo] ? 'Activo' : 'Inactivo' }}
            </label>
          </div>

          <div
            v-else-if="typeof valor === 'number'"
          >
            <input
              :id="campo"
              v-model.number="datos[campo]"
              type="number"
            >
          </div>

          <div
            v-else-if="
              Array.isArray(valor)
            "
          >
            <textarea
              :id="campo"
              :value="valor.join('\n')"
              rows="5"
              @input="
                datos[campo] =
                  $event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean)
              "
            />
          </div>

          <div
            v-else-if="
              typeof valor === 'object' &&
              valor !== null
            "
          >
            <textarea
              :id="campo"
              :value="
                JSON.stringify(
                  valor,
                  null,
                  2
                )
              "
              rows="8"
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
            />
          </div>

          <div v-else>
            <textarea
              v-if="
                String(valor).length > 100
              "
              :id="campo"
              v-model="datos[campo]"
              rows="5"
            />

            <input
              v-else
              :id="campo"
              v-model="datos[campo]"
              type="text"
            >
          </div>

          <br>
        </div>
      </div>

      <button
        type="submit"
        :disabled="guardando"
      >
        {{
          guardando
            ? 'Guardando...'
            : 'Guardar sección'
        }}
      </button>
    </form>
  </section>
</template>