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

const camposExcluidos = computed(() => [
  ...props.camposColor,
  'paleta',
  'logoUrl',
  'logoPngUrl',
  'logoIcoUrl',
  'faviconUrl',
  'logoVersion',
  'id',
])

const campos = computed(() => {
  return Object.keys(props.configuracion)
    .filter(
      (campo) =>
        !camposExcluidos.value.includes(campo),
    )
    .sort((a, b) =>
      a.localeCompare(b),
    )
})

function etiqueta(campo) {
  const textos = {
    nombreEmpresa: 'Nombre de la empresa',
    descripcionEmpresa: 'Descripción de la empresa',
    email: 'Correo electrónico',
    telefono: 'Teléfono',
    whatsapp: 'WhatsApp',
    direccion: 'Dirección',
    ciudad: 'Ciudad',
    estado: 'Estado',
    pais: 'País',
    sitioWeb: 'Sitio web',
    copyright: 'Copyright',
  }

  if (textos[campo]) {
    return textos[campo]
  }

  return campo
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letra) =>
      letra.toUpperCase(),
    )
}

function esObjeto(valor) {
  return (
    valor !== null &&
    typeof valor === 'object' &&
    !Array.isArray(valor)
  )
}

function tipoCampo(valor) {
  if (typeof valor === 'boolean') {
    return 'boolean'
  }

  if (typeof valor === 'number') {
    return 'number'
  }

  if (Array.isArray(valor)) {
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

function valorTexto(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return ''
  }

  return String(valor)
}

function actualizar(campo, valor) {
  emit('actualizar', {
    [campo]: valor,
  })
}

function actualizarArray(campo, event) {
  const texto =
    event.target.value || ''

  const valores =
    texto
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

  actualizar(
    campo,
    valores,
  )
}

function actualizarObjeto(campo, event) {
  const texto =
    event.target.value || ''

  try {
    const valor =
      texto.trim()
        ? JSON.parse(texto)
        : {}

    actualizar(
      campo,
      valor,
    )
  } catch {
    // Se conserva el texto hasta que sea JSON válido.
  }
}

function obtenerJson(valor) {
  try {
    return JSON.stringify(
      valor || {},
      null,
      2,
    )
  } catch {
    return '{}'
  }
}

function obtenerArray(valor) {
  if (!Array.isArray(valor)) {
    return ''
  }

  return valor.join('\n')
}
</script>

<template>
  <section class="admin-configuracion__panel">

    <div class="admin-configuracion__panel-heading">
      <div>
        <span class="admin-configuracion__section-kicker">
          INFORMACIÓN
        </span>

        <h2>Datos generales</h2>

        <p>
          Información empresarial almacenada
          directamente en Firebase.
        </p>
      </div>
    </div>

    <div class="admin-configuracion__data-grid">

      <article
        v-for="campo in campos"
        :key="campo"
        class="admin-configuracion__data-card"
      >

        <div class="admin-configuracion__data-heading">
          <strong>
            {{ etiqueta(campo) }}
          </strong>

          <span>
            {{ campo }}
          </span>
        </div>

        <!-- BOOLEAN -->
        <label
          v-if="tipoCampo(configuracion[campo]) === 'boolean'"
          class="admin-configuracion__switch"
        >
          <input
            :checked="configuracion[campo]"
            type="checkbox"
            @change="
              actualizar(
                campo,
                $event.target.checked,
              )
            "
          />

          <span class="admin-configuracion__switch-ui" />

          <span>
            {{
              configuracion[campo]
                ? 'Activado'
                : 'Desactivado'
            }}
          </span>
        </label>

        <!-- NUMBER -->
        <input
          v-else-if="
            tipoCampo(configuracion[campo]) === 'number'
          "
          :value="configuracion[campo]"
          type="number"
          class="admin-configuracion__field"
          @change="
            actualizar(
              campo,
              Number($event.target.value),
            )
          "
        />

        <!-- ARRAY -->
        <textarea
          v-else-if="
            tipoCampo(configuracion[campo]) === 'array'
          "
          class="admin-configuracion__field admin-configuracion__field--textarea"
          :value="obtenerArray(configuracion[campo])"
          placeholder="Un elemento por línea"
          @change="
            actualizarArray(
              campo,
              $event,
            )
          "
        />

        <!-- OBJECT -->
        <textarea
          v-else-if="
            tipoCampo(configuracion[campo]) === 'object'
          "
          class="admin-configuracion__field admin-configuracion__field--code"
          :value="obtenerJson(configuracion[campo])"
          @change="
            actualizarObjeto(
              campo,
              $event,
            )
          "
        />

        <!-- TEXTAREA -->
        <textarea
          v-else-if="
            tipoCampo(configuracion[campo]) === 'textarea'
          "
          class="admin-configuracion__field admin-configuracion__field--textarea"
          :value="valorTexto(configuracion[campo])"
          @input="
            actualizar(
              campo,
              $event.target.value,
            )
          "
        />

        <!-- TEXT -->
        <input
          v-else
          :value="valorTexto(configuracion[campo])"
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