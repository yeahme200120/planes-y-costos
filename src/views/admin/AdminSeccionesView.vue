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
  <section
    class="admin-secciones"
    data-theme="global"
  >

    <!-- HEADER DEL ADMIN -->
    <header
      class="admin-secciones__header"
    >

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

    <!-- ERROR -->
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

    <!-- MENSAJE -->
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

    <!-- SELECTOR DE SECCIÓN -->
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

    <!-- LOADING -->
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

    <!-- FORMULARIO -->
    <form
      v-else-if="
        Object.keys(datos).length > 0
      "
      class="admin-secciones__form"
      @submit.prevent="
        guardarSeccion
      "
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
          v-for="(
            valor,
            campo
          ) in datos"
          :key="campo"
        >

          <div
            v-if="campo !== 'id'"
            class="admin-secciones__field"
            :class="{
              'admin-secciones__field--full':
                esNavegacion(campo) ||
                esItems(campo, valor),
            }"
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
                  :disabled="guardando"
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
                :disabled="guardando"
              >
            </div>

            <!-- NAVEGACIÓN -->
            <div
              v-else-if="
                esNavegacion(campo) &&
                Array.isArray(valor)
              "
              class="admin-secciones__navigation"
            >

              <div
                v-for="(
                  item,
                  indice
                ) in datos.navegacion"
                :key="indice"
                class="admin-secciones__navigation-item"
              >

                <div
                  class="admin-secciones__navigation-header"
                >

                  <div>
                    <strong>
                      Elemento
                      {{ indice + 1 }}
                    </strong>

                    <span>
                      {{
                        item.texto ||
                        'Sin texto'
                      }}
                    </span>
                  </div>

                  <div
                    class="admin-secciones__navigation-actions"
                  >

                    <button
                      type="button"
                      class="admin-secciones__navigation-button"
                      :disabled="
                        guardando ||
                        indice === 0
                      "
                      title="Subir"
                      @click="
                        moverNavegacion(
                          indice,
                          -1
                        )
                      "
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      class="admin-secciones__navigation-button"
                      :disabled="
                        guardando ||
                        indice ===
                          datos
                            .navegacion
                            .length -
                            1
                      "
                      title="Bajar"
                      @click="
                        moverNavegacion(
                          indice,
                          1
                        )
                      "
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      class="admin-secciones__navigation-button admin-secciones__navigation-button--danger"
                      :disabled="guardando"
                      title="Eliminar"
                      @click="
                        eliminarNavegacion(
                          indice
                        )
                      "
                    >
                      ×
                    </button>

                  </div>
                </div>

                <div
                  class="admin-secciones__navigation-fields"
                >

                  <!-- TEXTO -->
                  <div
                    class="admin-secciones__navigation-field"
                  >
                    <label
                      :for="`navegacion-${indice}-texto`"
                      class="admin-secciones__label"
                    >
                      Texto
                    </label>

                    <input
                      :id="`navegacion-${indice}-texto`"
                      :value="
                        item.texto ??
                        ''
                      "
                      class="admin-secciones__input"
                      type="text"
                      :disabled="guardando"
                      @input="
                        actualizarNavegacionCampo(
                          indice,
                          'texto',
                          $event
                            .target
                            .value
                        )
                      "
                    >
                  </div>

                  <!-- URL -->
                  <div
                    class="admin-secciones__navigation-field"
                  >
                    <label
                      :for="`navegacion-${indice}-url`"
                      class="admin-secciones__label"
                    >
                      URL
                    </label>

                    <input
                      :id="`navegacion-${indice}-url`"
                      :value="
                        item.url ??
                        ''
                      "
                      class="admin-secciones__input"
                      type="text"
                      :disabled="guardando"
                      @input="
                        actualizarNavegacionCampo(
                          indice,
                          'url',
                          $event
                            .target
                            .value
                        )
                      "
                    >
                  </div>

                  <!-- ORDEN -->
                  <div
                    class="admin-secciones__navigation-field"
                  >
                    <label
                      :for="`navegacion-${indice}-orden`"
                      class="admin-secciones__label"
                    >
                      Orden
                    </label>

                    <input
                      :id="`navegacion-${indice}-orden`"
                      :value="
                        item.orden ??
                        1
                      "
                      class="admin-secciones__input"
                      type="number"
                      min="1"
                      max="999"
                      :disabled="guardando"
                      @input="
                        actualizarNavegacionCampo(
                          indice,
                          'orden',
                          $event
                            .target
                            .value
                        )
                      "
                    >
                  </div>

                  <!-- ACTIVO -->
                  <div
                    class="admin-secciones__navigation-field"
                  >
                    <label
                      class="admin-secciones__label"
                    >
                      Estado
                    </label>

                    <label
                      class="admin-secciones__switch"
                    >
                      <input
                        :checked="
                          item.activo ===
                          true
                        "
                        type="checkbox"
                        :disabled="
                          guardando
                        "
                        @change="
                          actualizarNavegacionCampo(
                            indice,
                            'activo',
                            $event
                              .target
                              .checked
                          )
                        "
                      >

                      <span
                        class="admin-secciones__switch-slider"
                      ></span>

                      <span>
                        {{
                          item.activo ===
                          true
                            ? 'Activo'
                            : 'Inactivo'
                        }}
                      </span>
                    </label>
                  </div>

                </div>

              </div>

              <button
                type="button"
                class="admin-secciones__navigation-add"
                :disabled="guardando"
                @click="
                  agregarNavegacion
                "
              >
                + Agregar elemento
              </button>

              <small
                class="admin-secciones__hint"
              >
                Configura los elementos del menú
                de navegación.
              </small>

            </div>

            <!-- ITEMS ESTRUCTURADOS -->
            <div
              v-else-if="
                esItems(
                  campo,
                  valor
                )
              "
              class="admin-secciones__items"
            >

              <div
                v-if="
                  valor.length === 0
                "
                class="admin-secciones__empty-items"
              >
                <p>
                  No hay elementos configurados.
                </p>
              </div>

              <div
                v-for="(
                  item,
                  indice
                ) in valor"
                :key="indice"
                class="admin-secciones__item"
              >

                <div
                  class="admin-secciones__item-header"
                >

                  <div>
                    <strong>
                      Elemento
                      {{ indice + 1 }}
                    </strong>

                    <span
                      v-if="
                        item.titulo
                      "
                    >
                      {{
                        item.titulo
                      }}
                    </span>
                  </div>

                  <div
                    class="admin-secciones__item-actions"
                  >

                    <button
                      type="button"
                      class="admin-secciones__navigation-button"
                      :disabled="
                        guardando ||
                        indice === 0
                      "
                      title="Subir"
                      @click="
                        moverItem(
                          campo,
                          indice,
                          -1
                        )
                      "
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      class="admin-secciones__navigation-button"
                      :disabled="
                        guardando ||
                        indice ===
                          valor.length -
                            1
                      "
                      title="Bajar"
                      @click="
                        moverItem(
                          campo,
                          indice,
                          1
                        )
                      "
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      class="admin-secciones__navigation-button admin-secciones__navigation-button--danger"
                      :disabled="
                        guardando
                      "
                      title="Eliminar"
                      @click="
                        eliminarItem(
                          campo,
                          indice
                        )
                      "
                    >
                      ×
                    </button>

                  </div>
                </div>

                <div
                  class="admin-secciones__item-fields"
                >

                  <template
                    v-for="
                      itemCampo in obtenerCamposItem(
                        item
                      )
                    "
                    :key="
                      itemCampo
                    "
                  >

                    <!-- BOOLEAN ITEM -->
                    <div
                      v-if="
                        esBooleano(
                          item[
                            itemCampo
                          ]
                        )
                      "
                      class="admin-secciones__item-field"
                    >
                      <label
                        class="admin-secciones__label"
                      >
                        {{ itemCampo }}
                      </label>

                      <label
                        class="admin-secciones__switch"
                      >
                        <input
                          :checked="
                            item[
                              itemCampo
                            ] === true
                          "
                          type="checkbox"
                          :disabled="
                            guardando
                          "
                          @change="
                            actualizarItemCampo(
                              indice,
                              itemCampo,
                              $event
                                .target
                                .checked
                            )
                          "
                        >

                        <span
                          class="admin-secciones__switch-slider"
                        ></span>

                        <span>
                          {{
                            item[
                              itemCampo
                            ]
                              ? 'Activo'
                              : 'Inactivo'
                          }}
                        </span>
                      </label>
                    </div>

                    <!-- NUMBER ITEM -->
                    <div
                      v-else-if="
                        esNumero(
                          item[
                            itemCampo
                          ]
                        )
                      "
                      class="admin-secciones__item-field"
                    >
                      <label
                        :for="`item-${indice}-${itemCampo}`"
                        class="admin-secciones__label"
                      >
                        {{ itemCampo }}
                      </label>

                      <input
                        :id="`item-${indice}-${itemCampo}`"
                        :value="
                          item[
                            itemCampo
                          ]
                        "
                        class="admin-secciones__input"
                        type="number"
                        :disabled="
                          guardando
                        "
                        @input="
                          actualizarItemCampo(
                            indice,
                            itemCampo,
                            $event
                              .target
                              .value
                          )
                        "
                      >
                    </div>

                    <!-- ARRAY ITEM -->
                    <div
                      v-else-if="
                        Array.isArray(
                          item[
                            itemCampo
                          ]
                        )
                      "
                      class="admin-secciones__item-field admin-secciones__item-field--full"
                    >
                      <label
                        :for="`item-${indice}-${itemCampo}`"
                        class="admin-secciones__label"
                      >
                        {{ itemCampo }}
                      </label>

                      <textarea
                        :id="`item-${indice}-${itemCampo}`"
                        class="admin-secciones__textarea"
                        rows="5"
                        :value="
                          JSON.stringify(
                            item[
                              itemCampo
                            ],
                            null,
                            2
                          )
                        "
                        :disabled="
                          guardando
                        "
                        @input="
                          (() => {
                            try {
                              item[
                                itemCampo
                              ] =
                                JSON.parse(
                                  $event
                                    .target
                                    .value
                                )
                            } catch {
                              // Espera JSON válido.
                            }
                          })()
                        "
                      ></textarea>

                      <small
                        class="admin-secciones__hint"
                      >
                        Array JSON válido.
                      </small>
                    </div>

                    <!-- OBJECT ITEM -->
                    <div
                      v-else-if="
                        esObjeto(
                          item[
                            itemCampo
                          ]
                        )
                      "
                      class="admin-secciones__item-field admin-secciones__item-field--full"
                    >
                      <label
                        :for="`item-${indice}-${itemCampo}`"
                        class="admin-secciones__label"
                      >
                        {{ itemCampo }}
                      </label>

                      <textarea
                        :id="`item-${indice}-${itemCampo}`"
                        class="admin-secciones__textarea admin-secciones__textarea--code"
                        rows="8"
                        :value="
                          JSON.stringify(
                            item[
                              itemCampo
                            ],
                            null,
                            2
                          )
                        "
                        :disabled="
                          guardando
                        "
                        @input="
                          (() => {
                            try {
                              item[
                                itemCampo
                              ] =
                                JSON.parse(
                                  $event
                                    .target
                                    .value
                                )
                            } catch {
                              // Espera JSON válido.
                            }
                          })()
                        "
                      ></textarea>

                      <small
                        class="admin-secciones__hint"
                      >
                        Objeto JSON válido.
                      </small>
                    </div>

                    <!-- STRING ITEM -->
                    <div
                      v-else
                      class="admin-secciones__item-field"
                      :class="{
                        'admin-secciones__item-field--full':
                          esTextoLargo(
                            item[
                              itemCampo
                            ]
                          ),
                      }"
                    >
                      <label
                        :for="`item-${indice}-${itemCampo}`"
                        class="admin-secciones__label"
                      >
                        {{ itemCampo }}
                      </label>

                      <textarea
                        v-if="
                          esTextoLargo(
                            item[
                              itemCampo
                            ]
                          )
                        "
                        :id="`item-${indice}-${itemCampo}`"
                        :value="
                          item[
                            itemCampo
                          ] ??
                          ''
                        "
                        class="admin-secciones__textarea"
                        rows="5"
                        :disabled="
                          guardando
                        "
                        @input="
                          actualizarItemCampo(
                            indice,
                            itemCampo,
                            $event
                              .target
                              .value
                          )
                        "
                      ></textarea>

                      <input
                        v-else
                        :id="`item-${indice}-${itemCampo}`"
                        :value="
                          item[
                            itemCampo
                          ] ??
                          ''
                        "
                        class="admin-secciones__input"
                        type="text"
                        :disabled="
                          guardando
                        "
                        @input="
                          actualizarItemCampo(
                            indice,
                            itemCampo,
                            $event
                              .target
                              .value
                          )
                        "
                      >
                    </div>

                  </template>

                </div>

              </div>

              <button
                type="button"
                class="admin-secciones__navigation-add"
                :disabled="guardando"
                @click="
                  agregarItem(campo)
                "
              >
                + Agregar elemento
              </button>

              <small
                class="admin-secciones__hint"
              >
                Los elementos se editan como
                campos estructurados y se conservan
                los campos adicionales de Firebase.
              </small>

            </div>

            <!-- ARRAY NORMAL -->
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
                  valor
                    .map(
                      (item) =>
                        typeof item ===
                          'object' &&
                        item !== null
                          ? JSON.stringify(
                              item
                            )
                          : String(
                              item ??
                                ''
                            )
                    )
                    .join('\n')
                "
                :disabled="
                  guardando
                "
                @input="
                  datos[campo] =
                    $event
                      .target
                      .value
                      .split('\n')
                      .map(
                        (item) =>
                          item.trim()
                      )
                      .filter(
                        Boolean
                      )
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
                :disabled="
                  guardando
                "
                @input="
                  (() => {
                    try {
                      datos[campo] =
                        JSON.parse(
                          $event
                            .target
                            .value
                        )
                    } catch {
                      // Esperar JSON válido.
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
            <div v-else>
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
                :disabled="
                  guardando
                "
              ></textarea>

              <input
                v-else
                :id="campo"
                v-model="
                  datos[campo]
                "
                class="admin-secciones__input"
                type="text"
                :disabled="
                  guardando
                "
              >
            </div>

          </div>

        </template>

      </div>

      <!-- ACCIONES -->
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

    <!-- SECCIÓN NO ENCONTRADA -->
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
