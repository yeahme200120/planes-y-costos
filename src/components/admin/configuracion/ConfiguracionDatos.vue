<script setup>
import {
  computed,
} from 'vue'

const props = defineProps({
  configuracion: {
    type: Object,
    default: () => ({}),
  },

  camposColor: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'actualizar',
])

/* =========================================================
   CAMPOS EXCLUIDOS
   ========================================================= */

const camposExcluidos = computed(() => [
  ...props.camposColor,

  // Paleta y degradados → gestionados en Apariencia
  'paleta',
  'degradados',

  // Campos de logo/favicon → gestionados en Identidad
  'logoUrl',
  'logoPngUrl',
  'logoIcoUrl',
  'faviconUrl',
  'faviconMimeType',
  'logoVersion',
  'logoEditor',
  'logoStoragePath',
  'logoTexto',

  // Datos binarios — NUNCA mostrar como texto
  'logoBlob',
  'logoMimeType',

  // Overrides de degradados → gestionados en Apariencia
  'primaryGradientText',
  'secondaryGradientText',
  'accentGradientText',
  'darkGradientText',
  'softGradientText',

  // Color base → gestionado en Apariencia
  'colorBase',

  // Identificador interno de Firebase
  'id',
])

/* =========================================================
   CAMPOS VISIBLES
   ========================================================= */

const campos = computed(() => {
  return Object.keys(
    props.configuracion || {},
  )
    .filter(
      (campo) =>
        !camposExcluidos.value.includes(
          campo,
        ),
    )
    .sort((a, b) =>
      a.localeCompare(b),
    )
})

/* =========================================================
   ETIQUETAS
   ========================================================= */

function etiqueta(campo) {
  const textos = {
    nombreEmpresa:
      'Nombre de la empresa',

    descripcion:
      'Descripción',

    descripcionEmpresa:
      'Descripción de la empresa',

    email:
      'Correo electrónico',

    telefono:
      'Teléfono',

    whatsapp:
      'WhatsApp',

    direccion:
      'Dirección',

    ciudad:
      'Ciudad',

    estado:
      'Estado',

    pais:
      'País',

    sitioWeb:
      'Sitio web',

    copyright:
      'Copyright',

    activo:
      'Configuración activa',

    orden:
      'Orden',

    logoTexto:
      'Texto del logotipo',

    telefonoEmpresa:
      'Teléfono empresarial',

    whatsappEmpresa:
      'WhatsApp empresarial',
  }

  if (textos[campo]) {
    return textos[campo]
  }

  return String(campo || '')
    .replace(
      /([A-Z])/g,
      ' $1',
    )
    .replace(
      /^./,
      (letra) =>
        letra.toUpperCase(),
    )
}

/* =========================================================
   TIPO DE VALOR
   ========================================================= */

function esObjeto(valor) {
  return (
    valor !== null &&
    typeof valor === 'object' &&
    !Array.isArray(valor)
  )
}

function tipoCampo(valor) {
  // Datos binarios — nunca renderizar
  if (valor instanceof Uint8Array || valor instanceof ArrayBuffer) {
    return 'binary'
  }
  if (valor !== null && typeof valor === 'object' && typeof valor.toUint8Array === 'function') {
    return 'binary'
  }

  if (
    typeof valor ===
    'boolean'
  ) {
    return 'boolean'
  }

  if (
    typeof valor ===
    'number'
  ) {
    return 'number'
  }

  if (
    Array.isArray(valor)
  ) {
    return 'array'
  }

  if (esObjeto(valor)) {
    return 'object'
  }

  if (
    typeof valor === 'string' &&
    valor.length > 120
  ) {
    return 'textarea'
  }

  return 'text'
}

/* =========================================================
   VALORES
   ========================================================= */

function valorTexto(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return ''
  }

  return String(valor)
}

/* =========================================================
   ACTUALIZAR CAMPO
   ========================================================= */

function actualizar(
  campo,
  valor,
) {
  if (!campo) {
    return
  }

  emit(
    'actualizar',
    {
      [campo]: valor,
    },
  )
}

/* =========================================================
   ACTUALIZAR ARRAY
   ========================================================= */

/*
 * IMPORTANTE:
 *
 * Si el textarea está completamente vacío, guardamos []
 * pero si el usuario escribe varias líneas (aunque queden
 * líneas vacías intermedias), no las perdemos.
 *
 * Esto evita que el campo se borre accidentalmente al
 * perder el foco cuando el usuario todavía no terminó
 * de escribir.
 */
function actualizarArray(
  campo,
  event,
) {
  const texto =
    event?.target?.value || ''

  /*
   * Textarea completamente vacío → []
   */
  if (texto.trim() === '') {
    actualizar(campo, [])
    return
  }

  const valores = texto
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item !== '')

  actualizar(
    campo,
    valores,
  )
}

/* =========================================================
   ACTUALIZAR OBJETO
   ========================================================= */

/*
 * Esta función se conserva para cualquier objeto
 * que realmente necesite editarse desde Datos generales.
 *
 * Los objetos visuales como "degradados" ya no llegan
 * a esta sección porque están excluidos arriba.
 */

function actualizarObjeto(
  campo,
  event,
) {
  const texto =
    event?.target?.value || ''

  try {
    const valor =
      texto.trim()
        ? JSON.parse(texto)
        : {}

    actualizar(
      campo,
      valor,
    )
  } catch (error) {
    /*
     * No se actualiza Firebase mientras
     * el JSON sea inválido.
     *
     * El usuario puede seguir editando
     * hasta introducir un JSON válido.
     */
    console.warn(
      `JSON inválido para el campo "${campo}".`,
      error,
    )
  }
}

/* =========================================================
   SERIALIZAR JSON
   ========================================================= */

/*
 * Se conserva para objetos que realmente
 * deban editarse manualmente.
 *
 * "degradados" ya no utilizará esta función.
 */

function obtenerJson(valor) {
  try {
    return JSON.stringify(
      valor || {},
      null,
      2,
    )
  } catch (error) {
    console.warn(
      'No fue posible serializar el objeto:',
      error,
    )

    return '{}'
  }
}

/* =========================================================
   SERIALIZAR ARRAY
   ========================================================= */

function obtenerArray(valor) {
  if (
    !Array.isArray(valor)
  ) {
    return ''
  }

  return valor.join('\n')
}
</script>

<template>
  <section
    class="admin-configuracion__panel"
  >

    <!-- ===================================================
         ENCABEZADO
         =================================================== -->

    <div
      class="admin-configuracion__panel-heading"
    >

      <div>

        <span
          class="admin-configuracion__section-kicker"
        >
          INFORMACIÓN
        </span>

        <h2>
          Datos generales
        </h2>

        <p>
          Información empresarial almacenada
          directamente en Firebase.
        </p>

      </div>

    </div>

    <!-- ===================================================
         DATOS GENERALES
         =================================================== -->

    <div
      class="admin-configuracion__data-grid"
    >

      <article
        v-for="campo in campos"
        :key="campo"
        class="admin-configuracion__data-card"
      >

        <!-- =================================================
             ENCABEZADO DEL CAMPO
             ================================================= -->

        <div
          class="admin-configuracion__data-heading"
        >

          <strong>
            {{ etiqueta(campo) }}
          </strong>

          <span>
            {{ campo }}
          </span>

        </div>

        <!-- =================================================
             BINARY — nunca mostrar datos binarios
             ================================================= -->

        <span
          v-if="
            tipoCampo(configuracion[campo]) === 'binary'
          "
          class="admin-configuracion__field-binary"
        >
          Dato binario — gestionado en Identidad visual
        </span>

        <!-- =================================================
             BOOLEAN
             ================================================= -->

        <label
          v-if="
            tipoCampo(
              configuracion[campo],
            ) === 'boolean'
          "
          class="admin-configuracion__switch"
        >

          <input
            :checked="
              Boolean(
                configuracion[campo],
              )
            "
            type="checkbox"
            @change="
              actualizar(
                campo,
                $event.target.checked,
              )
            "
          />

          <span
            class="admin-configuracion__switch-ui"
          ></span>

          <span>
            {{
              configuracion[campo]
                ? 'Activado'
                : 'Desactivado'
            }}
          </span>

        </label>

        <!-- =================================================
             NUMBER
             ================================================= -->

        <input
          v-else-if="
            tipoCampo(
              configuracion[campo],
            ) === 'number'
          "
          :value="
            configuracion[campo]
          "
          type="number"
          class="admin-configuracion__field"
          @change="
            actualizar(
              campo,
              Number(
                $event.target.value,
              ),
            )
          "
        />

        <!-- =================================================
             ARRAY
             ================================================= -->

        <textarea
          v-else-if="
            tipoCampo(
              configuracion[campo],
            ) === 'array'
          "
          class="admin-configuracion__field admin-configuracion__field--textarea"
          :value="
            obtenerArray(
              configuracion[campo],
            )
          "
          placeholder="Un elemento por línea"
          @change="
            actualizarArray(
              campo,
              $event,
            )
          "
        ></textarea>

        <!-- =================================================
             OBJECT
             ================================================= -->

        <textarea
          v-else-if="
            tipoCampo(
              configuracion[campo],
            ) === 'object'
          "
          class="admin-configuracion__field admin-configuracion__field--code"
          :value="
            obtenerJson(
              configuracion[campo],
            )
          "
          @change="
            actualizarObjeto(
              campo,
              $event,
            )
          "
        ></textarea>

        <!-- =================================================
             TEXTAREA
             ================================================= -->

        <textarea
          v-else-if="
            tipoCampo(
              configuracion[campo],
            ) === 'textarea'
          "
          class="admin-configuracion__field admin-configuracion__field--textarea"
          :value="
            valorTexto(
              configuracion[campo],
            )
          "
          @input="
            actualizar(
              campo,
              $event.target.value,
            )
          "
        ></textarea>

        <!-- =================================================
             TEXT
             ================================================= -->

        <input
          v-else
          :value="
            valorTexto(
              configuracion[campo],
            )
          "
          type="text"
          class="admin-configuracion__field"
          @input="
            actualizar(
              campo,
              $event.target.value,
            )
          "
        />

      </article>

    </div>

  </section>
</template>