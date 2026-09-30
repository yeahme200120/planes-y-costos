<script setup>
import {
  computed,
  reactive,
  ref,
} from 'vue'

/* =========================================================
   PROPS
   ========================================================= */

const props = defineProps({
  coleccion: {
    type: String,
    required: true,
  },

  items: {
    type: Array,
    default: () => [],
  },

  plantilla: {
    type: Object,
    default: () => ({}),
  },

  conectadaTiempoReal: {
    type: Boolean,
    default: false,
  },

  guardando: {
    type: Boolean,
    default: false,
  },
})

/* =========================================================
   EMITS
   ========================================================= */

const emit = defineEmits([
  'crear',
  'actualizar',
  'eliminar',
  'mover',
])

/* =========================================================
   ESTADO
   ========================================================= */

const cambiosLocales = reactive({})
const itemsGuardando = reactive({})
const itemsOptimistas = ref([])

/* =========================================================
   ITEMS COMBINADOS
   ========================================================= */

const itemsCombinados = computed(() => {
  const reales = props.items.map((item) => {
    const cambios =
      cambiosLocales[item.id] || {}

    return {
      ...item,
      ...cambios,
      _optimista: false,
      _guardando: Boolean(
        itemsGuardando[item.id]
      ),
    }
  })

  const optimistas = itemsOptimistas.value.map(
    (item) => ({
      ...item,
      _optimista: true,
      _guardando: true,
    })
  )

  const todos = [...reales, ...optimistas]

  return todos.sort((a, b) => {
    const ordenA = Number(a.orden ?? 999)
    const ordenB = Number(b.orden ?? 999)
    return ordenA - ordenB
  })
})

/* =========================================================
   OBTENER VALOR DE UN CAMPO
   ========================================================= */

function obtenerValor(item, campo) {
  const cambios =
    cambiosLocales[item.id] || {}

  if (
    Object.prototype.hasOwnProperty.call(
      cambios,
      campo
    )
  ) {
    return cambios[campo]
  }

  if (
    Object.prototype.hasOwnProperty.call(
      item,
      campo
    )
  ) {
    return item[campo]
  }

  return props.plantilla[campo] ?? ''
}

/* =========================================================
   ACTUALIZAR CAMPO LOCALMENTE
   ========================================================= */

function actualizarCampo(item, campo, valor) {
  if (item._optimista) {
    const index =
      itemsOptimistas.value.findIndex(
        (i) => i._tempId === item._tempId
      )

    if (index !== -1) {
      itemsOptimistas.value[index] = {
        ...itemsOptimistas.value[index],
        [campo]: valor,
      }
    }

    return
  }

  if (!cambiosLocales[item.id]) {
    cambiosLocales[item.id] = {}
  }

  cambiosLocales[item.id][campo] = valor

  emit('actualizar', {
    id: item.id,
    campo,
    valor,
  })
}

/* =========================================================
   CREAR ITEM
   ========================================================= */

function crearItem() {
  const tempId = `temp-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`

  const ultimoOrden =
    itemsCombinados.value.reduce(
      (max, item) => {
        const orden = Number(item.orden)

        return Number.isFinite(orden)
          ? Math.max(max, orden)
          : max
      },
      0
    )

  const nuevo = {
    ...props.plantilla,
    _tempId: tempId,
    orden: ultimoOrden + 1,
    activo: true,
  }

  itemsOptimistas.value.push(nuevo)

  emit('crear', {
    tempId,
    datos: { ...nuevo },
  })
}

/* =========================================================
   ELIMINAR ITEM
   ========================================================= */

function eliminarItem(item) {
  if (item._optimista) {
    itemsOptimistas.value =
      itemsOptimistas.value.filter(
        (i) => i._tempId !== item._tempId
      )

    return
  }

  const nombre =
    item.titulo ||
    item.pregunta ||
    'este elemento'

  const ok = window.confirm(
    `¿Deseas eliminar "${nombre}"? Esta acción no se puede deshacer.`
  )

  if (!ok) {
    return
  }

  emit('eliminar', { id: item.id })
}

/* =========================================================
   MOVER ITEM
   ========================================================= */

function moverItem(item, direccion) {
  if (item._optimista) {
    return
  }

  emit('mover', {
    id: item.id,
    direccion,
  })
}

/* =========================================================
   CAMPOS DEL ITEM
   ========================================================= */

function camposDelItem(item) {
  const excluidos = [
    'id',
    '_tempId',
    '_optimista',
    '_guardando',
  ]

  return Object.keys(item).filter(
    (campo) => !excluidos.includes(campo)
  )
}

/* =========================================================
   TIPOS DE CAMPO
   ========================================================= */

function esBooleano(valor) {
  return typeof valor === 'boolean'
}

function esNumero(valor) {
  return (
    typeof valor === 'number' &&
    Number.isFinite(valor)
  )
}

function esTextoLargo(valor) {
  return (
    typeof valor === 'string' &&
    (valor.length > 100 ||
      valor.includes('\n'))
  )
}

/* =========================================================
   LABELS
   ========================================================= */

function etiqueta(campo) {
  const labels = {
    activo: 'Activo',
    orden: 'Orden',
    titulo: 'Título',
    descripcion: 'Descripción',
    icono: 'Icono',
    pregunta: 'Pregunta',
    respuesta: 'Respuesta',
  }

  return (
    labels[campo] ||
    campo
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (l) =>
        l.toUpperCase()
      )
  )
}

/* =========================================================
   API PÚBLICA
   ========================================================= */

function confirmarOperacion(
  tempId,
  idReal,
) {
  if (tempId) {
    itemsOptimistas.value =
      itemsOptimistas.value.filter(
        (i) => i._tempId !== tempId
      )
  }

  if (idReal) {
    delete cambiosLocales[idReal]
    delete itemsGuardando[idReal]
  }
}

function marcarGuardando(id) {
  itemsGuardando[id] = true
}

defineExpose({
  confirmarOperacion,
  marcarGuardando,
})
</script>

<template>
  <div class="items-collection-editor">

    <!-- ===================================================
         HEADER
         =================================================== -->

    <div class="items-collection-editor__header">
      <div>
        <span class="items-collection-editor__eyebrow">
          COLECCIÓN
        </span>

        <h3 class="items-collection-editor__title">
          Items de {{ coleccion }}
        </h3>

        <p class="items-collection-editor__description">
          Los items se guardan automáticamente en la colección
          <strong>{{ coleccion }}</strong>
          de Firestore.
        </p>
      </div>

      <div class="items-collection-editor__status">
        <span
          class="items-collection-editor__status-dot"
          :class="{
            'is-online':
              conectadaTiempoReal,
          }"
        ></span>

        {{
          conectadaTiempoReal
            ? 'Sincronizado'
            : 'Conectando...'
        }}
      </div>
    </div>

    <!-- ===================================================
         LISTA VACÍA
         =================================================== -->

    <div
      v-if="itemsCombinados.length === 0"
      class="items-collection-editor__empty"
    >
      <div class="items-collection-editor__empty-icon">
        ◇
      </div>

      <p>
        No hay elementos en esta colección.
      </p>
    </div>

    <!-- ===================================================
         LISTA DE ITEMS
         =================================================== -->

    <div
      v-else
      class="items-collection-editor__list"
    >
      <article
        v-for="(item, index) in itemsCombinados"
        :key="item.id || item._tempId || index"
        class="items-collection-editor__item"
        :class="{
          'is-optimistic': item._optimista,
          'is-saving': item._guardando,
        }"
      >

        <div class="items-collection-editor__item-header">
          <div>
            <strong>
              Elemento {{ index + 1 }}
            </strong>

            <span
              v-if="
                item.titulo || item.pregunta
              "
              class="items-collection-editor__item-preview"
            >
              {{ item.titulo || item.pregunta }}
            </span>
          </div>

          <div class="items-collection-editor__item-actions">
            <span
              v-if="item._guardando"
              class="items-collection-editor__saving"
              aria-label="Guardando"
            >
              ⟳
            </span>

            <button
              type="button"
              title="Subir"
              :disabled="
                index === 0 ||
                item._optimista ||
                guardando
              "
              @click="moverItem(item, -1)"
            >
              ↑
            </button>

            <button
              type="button"
              title="Bajar"
              :disabled="
                index ===
                  itemsCombinados.length - 1 ||
                item._optimista ||
                guardando
              "
              @click="moverItem(item, 1)"
            >
              ↓
            </button>

            <button
              type="button"
              title="Eliminar"
              :disabled="
                guardando ||
                (!item.id && !item._optimista)
              "
              @click="eliminarItem(item)"
            >
              ×
            </button>
          </div>
        </div>

        <div class="items-collection-editor__fields">
          <div
            v-for="campo in camposDelItem(item)"
            :key="campo"
            class="items-collection-editor__field"
            :class="{
              'is-full': esTextoLargo(
                obtenerValor(item, campo)
              ),
            }"
          >
            <label
              :for="`${item.id || item._tempId}-${campo}`"
              class="items-collection-editor__label"
            >
              {{ etiqueta(campo) }}
            </label>

            <label
              v-if="
                esBooleano(
                  obtenerValor(item, campo)
                )
              "
              class="items-collection-editor__switch"
            >
              <input
                :id="`${item.id || item._tempId}-${campo}`"
                type="checkbox"
                :checked="
                  obtenerValor(item, campo)
                "
                :disabled="guardando"
                @change="
                  actualizarCampo(
                    item,
                    campo,
                    $event.target.checked
                  )
                "
              />

              <span class="items-collection-editor__switch-ui"></span>

              <span>
                {{
                  obtenerValor(item, campo)
                    ? 'Activo'
                    : 'Inactivo'
                }}
              </span>
            </label>

            <input
              v-else-if="
                esNumero(
                  obtenerValor(item, campo)
                )
              "
              :id="`${item.id || item._tempId}-${campo}`"
              type="number"
              class="items-collection-editor__input"
              :value="obtenerValor(item, campo)"
              :disabled="guardando"
              @input="
                actualizarCampo(
                  item,
                  campo,
                  Number($event.target.value)
                )
              "
            />

            <textarea
              v-else-if="
                esTextoLargo(
                  obtenerValor(item, campo)
                )
              "
              :id="`${item.id || item._tempId}-${campo}`"
              class="items-collection-editor__textarea"
              rows="4"
              :value="obtenerValor(item, campo)"
              :disabled="guardando"
              @input="
                actualizarCampo(
                  item,
                  campo,
                  $event.target.value
                )
              "
            ></textarea>

            <input
              v-else
              :id="`${item.id || item._tempId}-${campo}`"
              type="text"
              class="items-collection-editor__input"
              :value="obtenerValor(item, campo)"
              :disabled="guardando"
              @input="
                actualizarCampo(
                  item,
                  campo,
                  $event.target.value
                )
              "
            />
          </div>
        </div>

      </article>
    </div>

    <!-- ===================================================
         ACCIONES
         =================================================== -->

    <div class="items-collection-editor__actions">
      <button
        type="button"
        class="items-collection-editor__add"
        :disabled="guardando"
        @click="crearItem"
      >
        <span aria-hidden="true">+</span>
        Agregar elemento
      </button>
    </div>

  </div>
</template>