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

/*
 * Todas las secciones disponibles en Firebase.
 *
 * Colección:
 * secciones/
 *
 * Documentos:
 * header
 * hero
 * soluciones
 * caracteristicas
 * planes
 * nosotros
 * faq
 * contacto
 * footer
 */
const secciones = [
  {
    id: 'header',
    nombre: 'Header',
  },
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
    id: 'planes',
    nombre: 'Planes',
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
  {
    id: 'footer',
    nombre: 'Footer',
  },
]

const seccionSeleccionada =
  ref('header')

const cargando = ref(false)

const guardando = ref(false)

const error = ref('')

const mensaje = ref('')

const datos = reactive({})

const conectadaTiempoReal =
  ref(false)

let unsubscribeSeccion = null

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function clonar(valor) {
  if (
    valor === undefined ||
    valor === null
  ) {
    return valor
  }

  try {
    return JSON.parse(
      JSON.stringify(valor)
    )
  } catch {
    return valor
  }
}

function esObjeto(valor) {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    !Array.isArray(valor)
  )
}

function esValorSimple(valor) {
  return (
    valor === null ||
    valor === undefined ||
    typeof valor === 'string' ||
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  )
}

/*
 * Intenta convertir una cadena JSON que representa
 * un objeto en un objeto real.
 *
 * Ejemplo:
 *
 * '{"titulo":"Gestión","activo":true}'
 *
 * =>
 *
 * {
 *   titulo: 'Gestión',
 *   activo: true
 * }
 */
function intentarParsearObjeto(
  valor
) {
  if (esObjeto(valor)) {
    return clonar(valor)
  }

  if (
    typeof valor !== 'string'
  ) {
    return null
  }

  const texto =
    valor.trim()

  if (!texto) {
    return null
  }

  if (
    !texto.startsWith('{') ||
    !texto.endsWith('}')
  ) {
    return null
  }

  try {
    const parseado =
      JSON.parse(texto)

    if (
      esObjeto(parseado)
    ) {
      return parseado
    }
  } catch {
    /*
     * No es JSON válido.
     * Se conserva como texto.
     */
  }

  return null
}

/*
 * Intenta convertir una cadena JSON que representa
 * un array en un array real.
 *
 * Ejemplo:
 *
 * '[{"titulo":"A"},{"titulo":"B"}]'
 *
 * =>
 *
 * [
 *   { titulo: 'A' },
 *   { titulo: 'B' }
 * ]
 */
function intentarParsearArray(
  valor
) {
  if (Array.isArray(valor)) {
    return clonar(valor)
  }

  if (
    typeof valor !== 'string'
  ) {
    return null
  }

  const texto =
    valor.trim()

  if (!texto) {
    return null
  }

  if (
    !texto.startsWith('[') ||
    !texto.endsWith(']')
  ) {
    return null
  }

  try {
    const parseado =
      JSON.parse(texto)

    if (
      Array.isArray(parseado)
    ) {
      return parseado
    }
  } catch {
    /*
     * Se conserva el valor original.
     */
  }

  return null
}

/*
 * Normaliza un valor que puede estar doblemente serializado.
 *
 * Ejemplo:
 *
 * '"[{\\"titulo\\":\\"A\\"}]"'
 *
 * =>
 *
 * [
 *   { titulo: 'A' }
 * ]
 *
 * Se limita el número de intentos para evitar ciclos.
 */
function deserializarValor(
  valor,
  profundidad = 0
) {
  if (
    profundidad >= 3 ||
    typeof valor !== 'string'
  ) {
    return valor
  }

  const texto =
    valor.trim()

  if (!texto) {
    return valor
  }

  try {
    const parseado =
      JSON.parse(texto)

    if (
      typeof parseado ===
      'string'
    ) {
      return deserializarValor(
        parseado,
        profundidad + 1
      )
    }

    return parseado
  } catch {
    return valor
  }
}

/*
 * Normaliza cualquier array para que los elementos que
 * representan objetos JSON sean realmente objetos.
 *
 * Conserva valores simples.
 */
function normalizarArray(
  valor
) {
  let array =
    intentarParsearArray(
      valor
    )

  if (!array) {
    return []
  }

  return array.map(
    (item, indice) => {
      const deserializado =
        deserializarValor(
          item
        )

      if (
        esObjeto(
          deserializado
        )
      ) {
        return clonar(
          deserializado
        )
      }

      return deserializado
    }
  )
}

/*
 * Determina si un array contiene objetos reales
 * o strings que representan objetos JSON.
 */
function esArrayObjetos(
  valor
) {
  const array =
    intentarParsearArray(
      valor
    )

  if (!array) {
    return false
  }

  return array.some(
    (item) => {
      if (
        esObjeto(item)
      ) {
        return true
      }

      return (
        intentarParsearObjeto(
          deserializarValor(
            item
          )
        ) !== null
      )
    }
  )
}

/*
 * Determina si un array contiene solamente
 * valores simples.
 */
function esArraySimple(
  valor
) {
  const array =
    intentarParsearArray(
      valor
    )

  if (!array) {
    return false
  }

  return !array.some(
    (item) => {
      if (
        esObjeto(item)
      ) {
        return true
      }

      return (
        intentarParsearObjeto(
          deserializarValor(
            item
          )
        ) !== null
      )
    }
  )
}

/*
 * Devuelve los campos visibles de un objeto
 * para construir un editor estructurado.
 *
 * Se conserva absolutamente todo.
 */
function obtenerCamposItem(
  item
) {
  if (!esObjeto(item)) {
    return []
  }

  return Object.keys(item)
}

/*
 * Normaliza items manteniendo todos los campos.
 *
 * Soporta:
 *
 * 1. items = array real de objetos
 * 2. items = JSON string de array
 * 3. items = array cuyos elementos son JSON strings
 * 4. items = valores simples
 * 5. items = objetos individualmente serializados
 */
function normalizarItemsLocal(
  items
) {
  let valor =
    deserializarValor(
      items
    )

  const arrayParseado =
    intentarParsearArray(
      valor
    )

  if (
    arrayParseado
  ) {
    valor =
      arrayParseado
  }

  /*
   * Si Firebase entrega accidentalmente un único objeto,
   * lo convertimos en un array de un elemento.
   */
  if (
    esObjeto(valor)
  ) {
    valor = [valor]
  }

  if (
    !Array.isArray(valor)
  ) {
    return []
  }

  return valor.map(
    (item, index) => {
      const deserializado =
        deserializarValor(
          item
        )

      /*
       * Objeto real o JSON convertido en objeto.
       */
      if (
        esObjeto(
          deserializado
        )
      ) {
        const resultado =
          clonar(
            deserializado
          )

        if (
          Object.prototype.hasOwnProperty.call(
            resultado,
            'activo'
          )
        ) {
          resultado.activo =
            resultado.activo !==
            false
        }

        if (
          Object.prototype.hasOwnProperty.call(
            resultado,
            'orden'
          )
        ) {
          const numero =
            Number(
              resultado.orden
            )

          resultado.orden =
            Number.isFinite(
              numero
            )
              ? numero
              : index + 1
        } else {
          resultado.orden =
            index + 1
        }

        return resultado
      }

      /*
       * Valor simple.
       *
       * Nunca se intenta destruir ni transformar
       * el valor original.
       */
      return {
        valor:
          deserializado,
        activo: true,
        orden:
          index + 1,
      }
    }
  )
}

/*
 * Normaliza arrays de objetos generales.
 *
 * Se mantiene para campos que sean arrays estructurados.
 */
function normalizarArrayObjetosLocal(
  valor
) {
  let array =
    deserializarValor(
      valor
    )

  const arrayParseado =
    intentarParsearArray(
      array
    )

  if (
    arrayParseado
  ) {
    array =
      arrayParseado
  }

  if (
    !Array.isArray(array)
  ) {
    return []
  }

  return array.map(
    (item) => {
      const deserializado =
        deserializarValor(
          item
        )

      if (
        esObjeto(
          deserializado
        )
      ) {
        return clonar(
          deserializado
        )
      }

      return deserializado
    }
  )
}

/*
 * Normaliza la navegación del Header.
 *
 * Se conserva la estructura completa de cada elemento,
 * incluso si Firebase tiene campos adicionales.
 */
function normalizarNavegacionLocal(
  navegacion
) {
  let valor =
    deserializarValor(
      navegacion
    )

  const arrayParseado =
    intentarParsearArray(
      valor
    )

  if (
    arrayParseado
  ) {
    valor =
      arrayParseado
  }

  if (
    esObjeto(valor)
  ) {
    valor = [valor]
  }

  if (
    !Array.isArray(valor)
  ) {
    return []
  }

  return valor.map(
    (item, indice) => {
      const deserializado =
        deserializarValor(
          item
        )

      /*
       * Cuando ya es un objeto, se preservan
       * todos los campos existentes.
       */
      if (
        esObjeto(
          deserializado
        )
      ) {
        const resultado =
          clonar(
            deserializado
          )

        resultado.activo =
          resultado.activo !==
          false

        const orden =
          Number(
            resultado.orden
          )

        resultado.orden =
          Number.isFinite(
            orden
          )
            ? orden
            : indice + 1

        resultado.texto =
          String(
            resultado.texto ??
            ''
          )

        resultado.url =
          String(
            resultado.url ??
            ''
          )

        return resultado
      }

      /*
       * Valores simples.
       */
      return {
        activo: true,
        orden:
          indice + 1,
        texto:
          String(
            deserializado ??
            ''
          ),
        url: '',
      }
    }
  )
}

/*
 * Reemplaza completamente los datos reactivos
 * por los datos recibidos desde Firebase.
 */
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

  const copia =
    clonar(
      seccion
    )

  /*
   * Normaliza explícitamente los campos
   * estructurados antes de pintarlos.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      copia,
      'items'
    )
  ) {
    copia.items =
      normalizarItemsLocal(
        copia.items
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      copia,
      'navegacion'
    )
  ) {
    copia.navegacion =
      normalizarNavegacionLocal(
        copia.navegacion
      )
  }

  /*
   * Normaliza otros arrays únicamente cuando
   * vienen como JSON serializado.
   */
  Object.keys(copia).forEach(
    (campo) => {
      if (
        campo === 'id' ||
        campo === 'items' ||
        campo ===
          'navegacion'
      ) {
        return
      }

      const valor =
        copia[campo]

      if (
        typeof valor !==
        'string'
      ) {
        return
      }

      const deserializado =
        deserializarValor(
          valor
        )

      if (
        Array.isArray(
          deserializado
        )
      ) {
        copia[campo] =
          normalizarArray(
            deserializado
          )
      } else if (
        esObjeto(
          deserializado
        )
      ) {
        copia[campo] =
          deserializado
      }
    }
  )

  Object.assign(
    datos,
    copia
  )
}

function iniciarSuscripcionSeccion() {
  if (
    unsubscribeSeccion
  ) {
    unsubscribeSeccion()

    unsubscribeSeccion =
      null
  }

  cargando.value = true
  error.value = ''
  mensaje.value = ''
  conectadaTiempoReal.value =
    false

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
        console.error(err)

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

/*
 * =========================================================
 * NAVEGACIÓN
 * =========================================================
 */

/*
 * Determina si el campo corresponde
 * específicamente al menú de navegación
 * del header.
 */
function esNavegacion(
  campo
) {
  return (
    campo ===
    'navegacion'
  )
}

/*
 * Actualiza una propiedad individual
 * de un elemento de navegación.
 */
function actualizarNavegacionCampo(
  indice,
  campo,
  valor
) {
  if (
    !Array.isArray(
      datos.navegacion
    )
  ) {
    return
  }

  const item =
    datos.navegacion[
      indice
    ]

  if (
    !item ||
    typeof item !==
      'object'
  ) {
    return
  }

  if (
    campo ===
    'activo'
  ) {
    item.activo =
      valor === true

    return
  }

  if (
    campo ===
    'orden'
  ) {
    const numero =
      Number(
        valor
      )

    item.orden =
      Number.isFinite(
        numero
      )
        ? Math.max(
          1,
          Math.min(
            Math.floor(
              numero
            ),
            999
          )
        )
        : 1

    return
  }

  item[campo] =
    String(
      valor ?? ''
    )
}

/*
 * Agrega un elemento nuevo al menú.
 */
function agregarNavegacion() {
  if (
    !Array.isArray(
      datos.navegacion
    )
  ) {
    datos.navegacion = []
  }

  const ultimoOrden =
    datos.navegacion.reduce(
      (
        maximo,
        item
      ) => {
        const orden =
          Number(
            item?.orden
          )

        return Number.isFinite(
          orden
        )
          ? Math.max(
            maximo,
            orden
          )
          : maximo
      },
      0
    )

  datos.navegacion.push({
    activo: true,
    orden:
      ultimoOrden + 1,
    texto: '',
    url: '',
  })
}

/*
 * Elimina un elemento del menú.
 */
function eliminarNavegacion(
  indice
) {
  if (
    !Array.isArray(
      datos.navegacion
    )
  ) {
    return
  }

  datos.navegacion.splice(
    indice,
    1
  )
}

/*
 * Mueve un elemento dentro
 * del array de navegación.
 */
function moverNavegacion(
  indice,
  direccion
) {
  if (
    !Array.isArray(
      datos.navegacion
    )
  ) {
    return
  }

  const nuevoIndice =
    indice + direccion

  if (
    nuevoIndice < 0 ||
    nuevoIndice >=
      datos.navegacion.length
  ) {
    return
  }

  const actual =
    datos.navegacion[
      indice
    ]

  const siguiente =
    datos.navegacion[
      nuevoIndice
    ]

  datos.navegacion[
    indice
  ] = siguiente

  datos.navegacion[
    nuevoIndice
  ] = actual
}

/*
 * =========================================================
 * ITEMS
 * =========================================================
 */

/*
 * Determina si un campo es un array de items
 * estructurados.
 *
 * Actualmente se utiliza para que el template
 * pueda representar items como formularios,
 * no como JSON plano.
 */
function esItems(
  campo,
  valor
) {
  if (
    campo !== 'items'
  ) {
    return false
  }

  return (
    Array.isArray(
      valor
    ) &&
    (
      esArrayObjetos(
        valor
      ) ||
      valor.length === 0
    )
  )
}

/*
 * Actualiza un campo de un item.
 *
 * Mantiene el tipo cuando el valor original
 * era boolean o number.
 */
function actualizarItemCampo(
  indice,
  campo,
  valor
) {
  if (
    !Array.isArray(
      datos.items
    )
  ) {
    return
  }

  const item =
    datos.items[
      indice
    ]

  if (
    !esObjeto(item)
  ) {
    return
  }

  const valorActual =
    item[campo]

  if (
    typeof valorActual ===
    'boolean'
  ) {
    item[campo] =
      valor === true

    return
  }

  if (
    typeof valorActual ===
    'number'
  ) {
    const numero =
      Number(
        valor
      )

    item[campo] =
      Number.isFinite(
        numero
      )
        ? numero
        : 0

    return
  }

  item[campo] =
    String(
      valor ?? ''
    )
}

/*
 * Determina si un campo de item
 * es boolean.
 */
function esBooleano(
  valor
) {
  return (
    typeof valor ===
    'boolean'
  )
}

/*
 * Determina si un campo de item
 * es numérico.
 */
function esNumero(
  valor
) {
  return (
    typeof valor ===
    'number'
  )
}

/*
 * Determina si un texto debe ser
 * textarea.
 */
function esTextoLargo(
  valor
) {
  return (
    typeof valor ===
      'string' &&
    valor.length >
      100
  )
}

/*
 * Crea un item nuevo basándose
 * en la estructura del último item existente.
 *
 * Esto permite conservar campos personalizados.
 */
function crearItemDesdeEstructuraExistente() {
  if (
    !Array.isArray(
      datos.items
    ) ||
    datos.items.length ===
      0
  ) {
    return {
      activo: true,
      orden: 1,
      titulo: '',
      descripcion: '',
      icono: '',
    }
  }

  const ultimo =
    datos.items[
      datos.items.length - 1
    ]

  const ultimoParseado =
    deserializarValor(
      ultimo
    )

  if (
    !esObjeto(
      ultimoParseado
    )
  ) {
    return {
      activo: true,
      orden:
        datos.items.length +
        1,
      titulo: '',
      descripcion: '',
      icono: '',
    }
  }

  const nuevo =
    clonar(
      ultimoParseado
    )

  Object.keys(nuevo).forEach(
    (campo) => {
      const valor =
        nuevo[campo]

      if (
        campo ===
        'activo'
      ) {
        nuevo[campo] =
          true

        return
      }

      if (
        campo ===
        'orden'
      ) {
        nuevo[campo] =
          datos.items.length +
          1

        return
      }

      if (
        typeof valor ===
        'boolean'
      ) {
        nuevo[campo] =
          false

        return
      }

      if (
        typeof valor ===
        'number'
      ) {
        nuevo[campo] =
          0

        return
      }

      if (
        typeof valor ===
        'string'
      ) {
        nuevo[campo] =
          ''
        return
      }

      if (
        Array.isArray(
          valor
        )
      ) {
        nuevo[campo] = []
        return
      }

      if (
        esObjeto(valor)
      ) {
        nuevo[campo] = {}
      }
    }
  )

  if (
    !Object.prototype.hasOwnProperty.call(
      nuevo,
      'activo'
    )
  ) {
    nuevo.activo =
      true
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      nuevo,
      'orden'
    )
  ) {
    nuevo.orden =
      datos.items.length +
      1
  }

  return nuevo
}

function agregarItem(
  campo
) {
  let valor =
    datos[campo]

  valor =
    deserializarValor(
      valor
    )

  if (
    !Array.isArray(
      valor
    )
  ) {
    valor = []
  }

  /*
   * Garantiza que los elementos que llegan como
   * JSON string sean objetos reales antes de agregar.
   */
  datos[campo] =
    normalizarItemsLocal(
      valor
    )

  const nuevo =
    crearItemDesdeEstructuraExistente()

  datos[campo].push(
    nuevo
  )
}

function eliminarItem(
  campo,
  indice
) {
  if (
    !Array.isArray(
      datos[campo]
    )
  ) {
    return
  }

  datos[campo].splice(
    indice,
    1
  )
}

function moverItem(
  campo,
  indice,
  direccion
) {
  if (
    !Array.isArray(
      datos[campo]
    )
  ) {
    return
  }

  const nuevoIndice =
    indice + direccion

  if (
    nuevoIndice < 0 ||
    nuevoIndice >=
      datos[campo].length
  ) {
    return
  }

  const actual =
    datos[campo][
      indice
    ]

  const siguiente =
    datos[campo][
      nuevoIndice
    ]

  datos[campo][
    indice
  ] = siguiente

  datos[campo][
    nuevoIndice
  ] = actual
}

/*
 * =========================================================
 * GUARDADO
 * =========================================================
 */

async function guardarSeccion() {
  try {
    guardando.value = true

    error.value = ''

    mensaje.value = ''

    /*
     * Se crea una copia profunda para
     * evitar referencias compartidas.
     */
    const datosGuardar =
      clonar(
        datos
      ) ?? {}

    /*
     * El ID es el ID del documento,
     * no debe guardarse como campo.
     */
    delete datosGuardar.id

    if (
      datosGuardar.orden !==
      undefined
    ) {
      const orden =
        Number(
          datosGuardar.orden
        )

      datosGuardar.orden =
        Number.isFinite(
          orden
        )
          ? orden
          : 0
    }

    if (
      datosGuardar.activo !==
      undefined
    ) {
      datosGuardar.activo =
        datosGuardar.activo ===
        true
    }

    /*
     * Normaliza items antes de enviar
     * nuevamente a Firestore.
     *
     * Esto evita guardar strings JSON
     * cuando ya tenemos objetos reales.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        datosGuardar,
        'items'
      )
    ) {
      datosGuardar.items =
        normalizarItemsLocal(
          datosGuardar.items
        )
    }

    /*
     * Normaliza la navegación
     * conservando campos adicionales.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        datosGuardar,
        'navegacion'
      )
    ) {
      datosGuardar.navegacion =
        normalizarNavegacionLocal(
          datosGuardar.navegacion
        )
    }

    /*
     * Normaliza otros arrays que hayan
     * quedado serializados.
     */
    Object.keys(
      datosGuardar
    ).forEach(
      (campo) => {
        if (
          campo === 'items' ||
          campo ===
            'navegacion'
        ) {
          return
        }

        const valor =
          datosGuardar[campo]

        if (
          typeof valor !==
          'string'
        ) {
          return
        }

        const deserializado =
          deserializarValor(
            valor
          )

        if (
          Array.isArray(
            deserializado
          )
        ) {
          datosGuardar[campo] =
            normalizarArray(
              deserializado
            )
        } else if (
          esObjeto(
            deserializado
          )
        ) {
          datosGuardar[campo] =
            deserializado
        }
      }
    )

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
      err?.message ??
      'No fue posible guardar la sección.'
  } finally {
    guardando.value =
      false
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
  if (
    unsubscribeSeccion
  ) {
    unsubscribeSeccion()

    unsubscribeSeccion =
      null
  }
})
</script>




<template>
  <section class="secciones-index">

    <header class="secciones-index__header">
      <div>
        <p class="secciones-index__eyebrow">ADMINISTRACIÓN</p>
        <h1 class="secciones-index__title">Secciones</h1>
        <p class="secciones-index__desc">
          Selecciona una sección para editar su contenido, campos y fondo visual.
        </p>
      </div>
    </header>

    <div class="secciones-index__grid">
      <button
        v-for="sec in [
          { id: 'header',          nombre: 'Header',          icono: '◉', desc: 'Logotipo, CTA y navegación principal' },
          { id: 'hero',            nombre: 'Hero',            icono: '⬡', desc: 'Título principal, descripción y botones de acción' },
          { id: 'soluciones',      nombre: 'Soluciones',      icono: '◈', desc: 'Cards de soluciones con icono, título y descripción' },
          { id: 'caracteristicas', nombre: 'Características', icono: '◇', desc: 'Lista de funcionalidades y beneficios técnicos' },
          { id: 'beneficios',      nombre: 'Beneficios',      icono: '✦', desc: 'Ventajas y propuesta de valor del servicio' },
          { id: 'planes',          nombre: 'Planes',          icono: '$',  desc: 'Encabezado de la sección de precios' },
          { id: 'nosotros',        nombre: 'Nosotros',        icono: '⬤', desc: 'Historia, misión y presentación del equipo' },
          { id: 'faq',             nombre: 'FAQ',             icono: '?',  desc: 'Preguntas frecuentes con preguntas y respuestas' },
          { id: 'contacto',        nombre: 'Contacto',        icono: '✉', desc: 'Formulario de contacto y datos de la empresa' },
          { id: 'footer',          nombre: 'Footer',          icono: '—',  desc: 'Copyright, redes sociales y navegación inferior' },
        ]"
        :key="sec.id"
        type="button"
        class="secciones-index__card"
        @click="$router.push(`/admin/secciones/${sec.id}`)"
      >
        <span class="secciones-index__card-icon" aria-hidden="true">{{ sec.icono }}</span>
        <div class="secciones-index__card-info">
          <strong class="secciones-index__card-name">{{ sec.nombre }}</strong>
          <span class="secciones-index__card-desc">{{ sec.desc }}</span>
        </div>
        <span class="secciones-index__card-arrow" aria-hidden="true">›</span>
      </button>
    </div>

  </section>
</template>

<style scoped>
.secciones-index {
  padding: 1.5rem 2rem 3rem;
  max-width: 800px;
}

.secciones-index__header {
  margin-bottom: 1.5rem;
}

.secciones-index__eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  margin: 0 0 0.25rem;
}

.secciones-index__title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.4rem;
}

.secciones-index__desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.secciones-index__grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.secciones-index__card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background var(--transition-fast);
  width: 100%;
}

.secciones-index__card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  background: var(--color-surface-alt);
}

.secciones-index__card-icon {
  font-size: 1.3rem;
  color: var(--color-primary);
  width: 2rem;
  text-align: center;
  flex-shrink: 0;
}

.secciones-index__card-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.secciones-index__card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.secciones-index__card-desc {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.secciones-index__card-arrow {
  font-size: 1.2rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.secciones-index__card:hover .secciones-index__card-arrow {
  transform: translateX(3px);
  color: var(--color-primary);
}

@media (max-width: 600px) {
  .secciones-index { padding: 1rem; }
}
</style>
