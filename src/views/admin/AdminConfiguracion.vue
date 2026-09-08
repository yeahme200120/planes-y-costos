<script setup>
import {
  onMounted,
  reactive,
  ref,
} from 'vue'

import {
  actualizarConfiguracion,
  obtenerConfiguracionAdmin,
} from '../../services/adminService'

const cargando = ref(true)
const guardando = ref(false)

const error = ref('')
const mensaje = ref('')

const configuracion = reactive({})

async function cargarConfiguracion() {
  try {
    cargando.value = true
    error.value = ''
    mensaje.value = ''

    const resultado =
      await obtenerConfiguracionAdmin(
        'general'
      )

    Object.keys(configuracion).forEach(
      (key) => {
        delete configuracion[key]
      }
    )

    if (resultado) {
      Object.assign(
        configuracion,
        resultado
      )
    }
  } catch (err) {
    console.error(err)

    error.value =
      'No fue posible cargar la configuración.'
  } finally {
    cargando.value = false
  }
}

async function guardarConfiguracion() {
  try {
    guardando.value = true
    error.value = ''
    mensaje.value = ''

    const datos = {
      ...configuracion,
    }

    delete datos.id

    await actualizarConfiguracion(
      'general',
      datos
    )

    mensaje.value =
      'Configuración actualizada correctamente.'
  } catch (err) {
    console.error(err)

    error.value =
      err.message ??
      'No fue posible guardar la configuración.'
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarConfiguracion()
})
</script>

<template>
  <section>
    <h2>
      Configuración general
    </h2>

    <p>
      Configuración general de la landing page.
    </p>

    <hr>

    <p v-if="cargando">
      Cargando configuración...
    </p>

    <p v-if="error">
      {{ error }}
    </p>

    <p v-if="mensaje">
      {{ mensaje }}
    </p>

    <form
      v-if="!cargando"
      @submit.prevent="
        guardarConfiguracion
      "
    >
      <div
        v-for="(valor, campo) in configuracion"
        :key="campo"
      >
        <div v-if="campo !== 'id'">
          <label :for="`config-${campo}`">
            {{ campo }}
          </label>

          <div
            v-if="
              typeof valor === 'boolean'
            "
          >
            <label>
              <input
                :id="`config-${campo}`"
                v-model="
                  configuracion[campo]
                "
                type="checkbox"
              >

              {{
                configuracion[campo]
                  ? 'Activado'
                  : 'Desactivado'
              }}
            </label>
          </div>

          <div
            v-else-if="
              typeof valor === 'number'
            "
          >
            <input
              :id="`config-${campo}`"
              v-model.number="
                configuracion[campo]
              "
              type="number"
            >
          </div>

          <div
            v-else-if="
              Array.isArray(valor)
            "
          >
            <textarea
              :id="`config-${campo}`"
              :value="valor.join('\n')"
              rows="5"
              @input="
                configuracion[campo] =
                  $event.target.value
                    .split('\n')
                    .map(
                      (item) =>
                        item.trim()
                    )
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
              :id="`config-${campo}`"
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
                    configuracion[campo] =
                      JSON.parse(
                        $event.target.value
                      )
                  } catch {
                    // Mantener el valor
                    // hasta que el JSON sea válido
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
              :id="`config-${campo}`"
              v-model="
                configuracion[campo]
              "
              rows="5"
            />

            <input
              v-else
              :id="`config-${campo}`"
              v-model="
                configuracion[campo]
              "
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
            : 'Guardar configuración'
        }}
      </button>
    </form>

    <p
      v-if="
        !cargando &&
        !Object.keys(configuracion).length
      "
    >
      No existe el documento
      configuracion/general.
    </p>
  </section>
</template>