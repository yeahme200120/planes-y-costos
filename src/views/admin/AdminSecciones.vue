<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'

import {
  actualizarSeccion,
  obtenerSeccionAdmin,
  suscribirSeccionAdmin,
} from '../../services/adminService'

/* =========================================================
   SECCIONES
   ========================================================= */

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

/* =========================================================
   ESTADO
   ========================================================= */

const seccionActiva = ref('header')

const cargando = ref(false)
const guardando = ref(false)

const error = ref('')
const mensaje = ref('')

const conectadaTiempoReal = ref(false)

const datos = reactive({})

let unsubscribe = null

/* =========================================================
   SECCIÓN ACTIVA
   ========================================================= */

const seccionSeleccionada = computed(() => {
  return (
    secciones.find(
      (seccion) =>
        seccion.id === seccionActiva.value
    ) || secciones[0]
  )
})

/* =========================================================
   UTILIDADES
   ========================================================= */

function limpiarMensajes() {
  error.value = ''
  mensaje.value = ''
}

function clonar(valor) {
  if (
    valor === null ||
    valor === undefined
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
    valor !== null &&
    typeof valor === 'object' &&
    !Array.isArray(valor)
  )
}

function esArray(valor) {
  return Array.isArray(valor)
}

function esItems(campo) {
  /*
   * "items" tiene un editor especializado.
   *
   * No debemos comprobar aquí el tipo del valor,
   * porque Firebase puede entregar temporalmente
   * el campo como string JSON.
   */
  return campo === 'items'
}

function esNavegacion(campo) {
  return campo === 'navegacion'
}

function esBooleano(valor) {
  return typeof valor === 'boolean'
}

function esNumero(valor) {
  return (
    typeof valor === 'number' &&
    Number.isFinite(valor)
  )
}

function esString(valor) {
  return typeof valor === 'string'
}

/* =========================================================
   OBJETOS SERIALIZADOS
   ========================================================= */

function intentarParsearObjeto(valor) {
  if (esObjeto(valor)) {
    return clonar(valor)
  }

  if (typeof valor !== 'string') {
    return null
  }

  const texto = valor.trim()

  if (!texto) {
    return null
  }

  /*
   * Evitamos intentar parsear cualquier texto.
   * Solamente consideramos strings que parezcan
   * objetos JSON.
   */
  if (
    !texto.startsWith('{') ||
    !texto.endsWith('}')
  ) {
    return null
  }

  try {
    const parseado = JSON.parse(texto)

    if (esObjeto(parseado)) {
      return parseado
    }
  } catch {
    /*
     * El valor no es JSON válido.
     * Se conserva como texto.
     */
  }

  return null
}

/*
 * Convierte un campo que pudiera venir como:
 *
 * [
 *   {...},
 *   {...}
 * ]
 *
 * o como:
 *
 * "[{\"orden\":1,...},{\"orden\":2,...}]"
 *
 * en un array real.
 */
function intentarParsearArray(valor) {
  if (Array.isArray(valor)) {
    return clonar(valor)
  }

  if (typeof valor !== 'string') {
    return null
  }

  const texto = valor.trim()

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
    const parseado = JSON.parse(texto)

    if (Array.isArray(parseado)) {
      return parseado
    }
  } catch {
    /*
     * Se conserva el valor original.
     */
  }

  return null
}

/* =========================================================
   ARRAYS
   ========================================================= */

function esArraySimple(valor) {
  if (!Array.isArray(valor)) {
    return false
  }

  return !valor.some((item) => {
    if (esObjeto(item)) {
      return true
    }

    return (
      intentarParsearObjeto(item) !== null
    )
  })
}

function esArrayObjetos(valor) {
  if (!Array.isArray(valor)) {
    return false
  }

  return valor.some((item) => {
    if (esObjeto(item)) {
      return true
    }

    return (
      intentarParsearObjeto(item) !== null
    )
  })
}

function esCampoLargo(valor) {
  if (!esString(valor)) {
    return false
  }

  return (
    valor.length > 120 ||
    valor.includes('\n')
  )
}

/* =========================================================
   TEXTO / VALORES
   ========================================================= */

function obtenerValorTexto(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return ''
  }

  if (esString(valor)) {
    return valor
  }

  if (esBooleano(valor)) {
    return valor ? 'true' : 'false'
  }

  if (esNumero(valor)) {
    return String(valor)
  }

  if (Array.isArray(valor)) {
    /*
     * Los arrays simples se muestran como
     * elementos separados por líneas.
     *
     * Los objetos no se convierten aquí a JSON.
     */
    if (
      valor.every(
        (item) =>
          !esObjeto(item) &&
          !Array.isArray(item)
      )
    ) {
      return valor
        .map((item) =>
          item === null ||
          item === undefined
            ? ''
            : String(item)
        )
        .join('\n')
    }

    return ''
  }

  if (esObjeto(valor)) {
    return ''
  }

  return String(valor)
}

function convertirArrayTexto(valor) {
  if (!Array.isArray(valor)) {
    return []
  }

  return valor
    .map((item) => {
      if (
        item === null ||
        item === undefined
      ) {
        return ''
      }

      return String(item)
    })
    .filter(
      (item) =>
        item.trim() !== ''
    )
}

/* =========================================================
   NORMALIZACIÓN DE NAVEGACIÓN
   ========================================================= */

function normalizarNavegacionLocal(
  navegacion
) {
  /*
   * También soportamos navegación serializada
   * como JSON.
   */
  let fuente = navegacion

  const arrayParseado =
    intentarParsearArray(fuente)

  if (arrayParseado) {
    fuente = arrayParseado
  }

  if (!Array.isArray(fuente)) {
    return []
  }

  return fuente
    .map((item, index) => {
      const objetoParseado =
        intentarParsearObjeto(item)

      if (objetoParseado) {
        return {
          ...objetoParseado,

          activo:
            objetoParseado.activo !== false,

          orden:
            Number.isFinite(
              Number(
                objetoParseado.orden
              )
            )
              ? Number(
                  objetoParseado.orden
                )
              : index + 1,
        }
      }

      if (!esObjeto(item)) {
        return {
          texto: String(
            item ?? ''
          ),
          url: '',
          activo: true,
          orden: index + 1,
        }
      }

      return {
        ...clonar(item),

        activo:
          item.activo !== false,

        orden:
          Number.isFinite(
            Number(item.orden)
          )
            ? Number(item.orden)
            : index + 1,
      }
    })
    .sort(
      (a, b) =>
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
    )
}

/* =========================================================
   NORMALIZACIÓN DE ITEMS
   ========================================================= */

function normalizarItemsLocal(items) {
  /*
   * IMPORTANTE:
   *
   * "items" puede llegar de tres formas:
   *
   * 1. Array real de objetos.
   *
   * 2. Array cuyos elementos son strings JSON.
   *
   * 3. El array completo serializado como string JSON.
   *
   * Normalizamos los tres casos antes de
   * entregarlos al editor.
   */

  let fuente = items

  const arrayParseado =
    intentarParsearArray(fuente)

  if (arrayParseado) {
    fuente = arrayParseado
  }

  if (!Array.isArray(fuente)) {
    return []
  }

  return fuente.map((item, index) => {
    /*
     * =====================================================
     * CASO 1
     * Objeto real de Firestore.
     * =====================================================
     */

    if (esObjeto(item)) {
      return {
        ...clonar(item),

        activo:
          item.activo !== false,

        orden:
          Number.isFinite(
            Number(item.orden)
          )
            ? Number(item.orden)
            : index + 1,
      }
    }

    /*
     * =====================================================
     * CASO 2
     * String que contiene un objeto JSON.
     * =====================================================
     *
     * Ejemplo:
     *
     * '{"orden":1,"icono":"💼","activo":true}'
     *
     * Se convierte en:
     *
     * {
     *   orden: 1,
     *   icono: '💼',
     *   activo: true
     * }
     *
     * De esta manera el template puede recorrer
     * cada propiedad individualmente.
     */

    const objetoParseado =
      intentarParsearObjeto(item)

    if (objetoParseado) {
      return {
        ...objetoParseado,

        activo:
          objetoParseado.activo !== false,

        orden:
          Number.isFinite(
            Number(
              objetoParseado.orden
            )
          )
            ? Number(
                objetoParseado.orden
              )
            : index + 1,
      }
    }

    /*
     * =====================================================
     * CASO 3
     * Valor primitivo real.
     * =====================================================
     *
     * Se conserva como valor editable para
     * compatibilidad con datos antiguos.
     */

    return {
      valor:
        item === null ||
        item === undefined
          ? ''
          : String(item),

      activo: true,

      orden:
        index + 1,
    }
  })
}

/* =========================================================
   NORMALIZACIÓN DE ARRAYS DE OBJETOS
   ========================================================= */

function normalizarArrayObjetosLocal(
  items
) {
  let fuente = items

  const arrayParseado =
    intentarParsearArray(fuente)

  if (arrayParseado) {
    fuente = arrayParseado
  }

  if (!Array.isArray(fuente)) {
    return []
  }

  return fuente.map((item) => {
    if (esObjeto(item)) {
      return {
        ...clonar(item),
      }
    }

    const objetoParseado =
      intentarParsearObjeto(item)

    if (objetoParseado) {
      return {
        ...objetoParseado,
      }
    }

    return item
  })
}

/* =========================================================
   CARGA DE DATOS
   ========================================================= */

function reemplazarDatos(
  nuevosDatos
) {
  /*
   * Limpiamos únicamente las propiedades
   * existentes de la sección actual.
   */
  Object.keys(datos).forEach(
    (campo) => {
      delete datos[campo]
    }
  )

  if (
    !nuevosDatos ||
    typeof nuevosDatos !== 'object'
  ) {
    return
  }

  const copia = clonar(
    nuevosDatos
  )

  Object.assign(
    datos,
    copia
  )

  /*
   * =====================================================
   * NAVEGACIÓN
   * =====================================================
   */

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'navegacion'
    )
  ) {
    datos.navegacion =
      normalizarNavegacionLocal(
        datos.navegacion
      )
  }

  /*
   * =====================================================
   * ITEMS
   * =====================================================
   *
   * Siempre pasan por la normalización.
   * Esto es lo que evita que un JSON string
   * termine mostrándose directamente en pantalla.
   */

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'items'
    )
  ) {
    datos.items =
      normalizarItemsLocal(
        datos.items
      )
  }
}

/* =========================================================
   CARGA DE DATOS
   ========================================================= */

async function cargarSeccion(
  id
) {
  cargando.value = true
  limpiarMensajes()

  try {
    const resultado =
      await obtenerSeccionAdmin(id)

    reemplazarDatos(
      resultado || {}
    )

    conectadaTiempoReal.value =
      false
  } catch (err) {
    error.value =
      err?.message ||
      'No se pudo cargar la sección.'
  } finally {
    cargando.value = false
  }
}

/* =========================================================
   TIEMPO REAL
   ========================================================= */

function iniciarSuscripcion(
  id
) {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }

  cargando.value = true
  limpiarMensajes()

  try {
    unsubscribe =
      suscribirSeccionAdmin(
        id,
        (resultado) => {
          reemplazarDatos(
            resultado || {}
          )

          cargando.value = false
          conectadaTiempoReal.value =
            true
        },
        (err) => {
          cargando.value = false
          conectadaTiempoReal.value =
            false

          error.value =
            err?.message ||
            'No se pudo sincronizar la sección.'
        }
      )
  } catch (err) {
    cargando.value = false
    conectadaTiempoReal.value =
      false

    error.value =
      err?.message ||
      'No se pudo iniciar la sincronización.'
  }
}

/* =========================================================
   CAMBIO DE SECCIÓN
   ========================================================= */

async function seleccionarSeccion(
  id
) {
  if (
    id === seccionActiva.value &&
    Object.keys(datos).length
  ) {
    return
  }

  seccionActiva.value = id

  iniciarSuscripcion(id)

  /*
   * La suscripción es la fuente principal.
   * Este fallback mantiene compatibilidad con
   * implementaciones que no disparen inmediatamente.
   */
  if (
    Object.keys(datos).length === 0
  ) {
    await cargarSeccion(id)
  }
}

/* =========================================================
   GUARDAR
   ========================================================= */

async function guardar() {
  if (guardando.value) {
    return
  }

  guardando.value = true
  limpiarMensajes()

  try {
    /*
     * Clonamos para evitar enviar referencias
     * reactivas de Vue a Firebase.
     */
    const payload = clonar(
      datos
    )

    /*
     * ===================================================
     * ITEMS
     * ===================================================
     *
     * Aunque el editor ya los mantiene como objetos,
     * volvemos a normalizarlos antes de guardar.
     *
     * Esto garantiza que los strings JSON antiguos
     * no regresen accidentalmente a Firestore.
     */
    if (
      Array.isArray(
        payload.items
      )
    ) {
      payload.items =
        normalizarItemsLocal(
          payload.items
        )
    } else if (
      typeof payload.items ===
      'string'
    ) {
      payload.items =
        normalizarItemsLocal(
          payload.items
        )
    }

    /*
     * ===================================================
     * NAVEGACIÓN
     * ===================================================
     */

    if (
      Array.isArray(
        payload.navegacion
      )
    ) {
      payload.navegacion =
        normalizarNavegacionLocal(
          payload.navegacion
        )
    } else if (
      typeof payload.navegacion ===
      'string'
    ) {
      payload.navegacion =
        normalizarNavegacionLocal(
          payload.navegacion
        )
    }

    await actualizarSeccion(
      seccionActiva.value,
      payload
    )

    mensaje.value =
      'Cambios guardados correctamente.'
  } catch (err) {
    error.value =
      err?.message ||
      'No se pudieron guardar los cambios.'
  } finally {
    guardando.value = false
  }
}

/* =========================================================
   CAMPOS NORMALES
   ========================================================= */

function actualizarCampo(
  campo,
  valor
) {
  datos[campo] = valor
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function actualizarNavegacionCampo(
  index,
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

  if (
    !datos.navegacion[index]
  ) {
    return
  }

  datos.navegacion[index] = {
    ...datos.navegacion[index],
    [campo]: valor,
  }
}

function agregarNavegacion() {
  if (
    !Array.isArray(
      datos.navegacion
    )
  ) {
    datos.navegacion = []
  }

  const siguienteOrden =
    datos.navegacion.length + 1

  datos.navegacion.push({
    texto: 'Nueva sección',
    url: '#',
    activo: true,
    orden: siguienteOrden,
  })
}

function eliminarNavegacion(
  index
) {
  if (
    !Array.isArray(
      datos.navegacion
    )
  ) {
    return
  }

  datos.navegacion.splice(
    index,
    1
  )

  datos.navegacion =
    normalizarNavegacionLocal(
      datos.navegacion
    )
}

function moverNavegacion(
  index,
  direccion
) {
  if (
    !Array.isArray(
      datos.navegacion
    )
  ) {
    return
  }

  const nuevoIndex =
    index + direccion

  if (
    nuevoIndex < 0 ||
    nuevoIndex >=
      datos.navegacion.length
  ) {
    return
  }

  const actual =
    datos.navegacion[index]

  const destino =
    datos.navegacion[nuevoIndex]

  datos.navegacion[index] =
    destino

  datos.navegacion[nuevoIndex] =
    actual

  datos.navegacion =
    datos.navegacion.map(
      (item, itemIndex) => ({
        ...item,
        orden:
          itemIndex + 1,
      })
    )
}

/* =========================================================
   ITEMS
   ========================================================= */

function actualizarItemCampo(
  campo,
  index,
  subcampo,
  valor
) {
  if (
    !Array.isArray(
      datos[campo]
    )
  ) {
    return
  }

  const item =
    datos[campo][index]

  if (!esObjeto(item)) {
    return
  }

  /*
   * No sustituimos el objeto completo.
   * Solamente modificamos el campo solicitado.
   *
   * Esto preserva cualquier campo adicional
   * existente en Firestore.
   */
  datos[campo][index] = {
    ...item,
    [subcampo]: valor,
  }
}

function actualizarItemArray(
  campo,
  index,
  subcampo,
  texto
) {
  if (
    !Array.isArray(
      datos[campo]
    )
  ) {
    return
  }

  const item =
    datos[campo][index]

  if (!esObjeto(item)) {
    return
  }

  datos[campo][index] = {
    ...item,
    [subcampo]:
      convertirArrayTexto(
        texto.split('\n')
      ),
  }
}

function actualizarItemObjeto(
  campo,
  index,
  subcampo,
  texto
) {
  if (
    !Array.isArray(
      datos[campo]
    )
  ) {
    return
  }

  const item =
    datos[campo][index]

  if (!esObjeto(item)) {
    return
  }

  let valor = {}

  try {
    const parseado =
      JSON.parse(texto)

    if (esObjeto(parseado)) {
      valor = parseado
    } else {
      valor =
        item[subcampo] || {}
    }
  } catch {
    /*
     * No destruimos el objeto actual si
     * el usuario está escribiendo JSON inválido.
     */
    valor =
      item[subcampo] || {}
  }

  datos[campo][index] = {
    ...item,
    [subcampo]: valor,
  }
}

function crearItemDesdeEstructuraExistente(
  items
) {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return {
      activo: true,
      orden: 1,
    }
  }

  const ultimo =
    items[items.length - 1]

  /*
   * Por seguridad, si el último elemento
   * todavía llegara serializado, intentamos
   * convertirlo antes de construir el nuevo.
   */
  const ultimoNormalizado =
    intentarParsearObjeto(ultimo)

  const estructura =
    ultimoNormalizado ||
    ultimo

  if (!esObjeto(estructura)) {
    return {
      activo: true,
      orden: items.length + 1,
    }
  }

  const nuevo = {}

  /*
   * Conservamos la estructura del elemento
   * existente, pero no copiamos sus valores.
   */
  Object.keys(estructura).forEach(
    (campo) => {
      const valor =
        estructura[campo]

      if (campo === 'activo') {
        nuevo[campo] = true
        return
      }

      if (campo === 'orden') {
        nuevo[campo] =
          items.length + 1
        return
      }

      if (Array.isArray(valor)) {
        nuevo[campo] = []
        return
      }

      if (esObjeto(valor)) {
        nuevo[campo] = {}
        return
      }

      if (typeof valor === 'number') {
        nuevo[campo] = 0
        return
      }

      if (typeof valor === 'boolean') {
        nuevo[campo] = false
        return
      }

      nuevo[campo] = ''
    }
  )

  /*
   * Si el documento tenía campos adicionales
   * esperados para un item, se conservan.
   */
  if (
    !Object.prototype.hasOwnProperty.call(
      nuevo,
      'activo'
    )
  ) {
    nuevo.activo = true
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      nuevo,
      'orden'
    )
  ) {
    nuevo.orden =
      items.length + 1
  }

  return nuevo
}

function agregarItem(
  campo
) {
  /*
   * Si el campo llegara como JSON string,
   * primero lo normalizamos.
   */
  if (
    typeof datos[campo] ===
    'string'
  ) {
    datos[campo] =
      normalizarItemsLocal(
        datos[campo]
      )
  }

  if (
    !Array.isArray(
      datos[campo]
    )
  ) {
    datos[campo] = []
  }

  const nuevo =
    crearItemDesdeEstructuraExistente(
      datos[campo]
    )

  datos[campo].push(
    nuevo
  )
}

function eliminarItem(
  campo,
  index
) {
  if (
    !Array.isArray(
      datos[campo]
    )
  ) {
    return
  }

  datos[campo].splice(
    index,
    1
  )

  datos[campo] =
    datos[campo].map(
      (item, itemIndex) => {
        if (!esObjeto(item)) {
          return item
        }

        return {
          ...item,
          orden:
            itemIndex + 1,
        }
      }
    )
}

function moverItem(
  campo,
  index,
  direccion
) {
  if (
    !Array.isArray(
      datos[campo]
    )
  ) {
    return
  }

  const nuevoIndex =
    index + direccion

  if (
    nuevoIndex < 0 ||
    nuevoIndex >=
      datos[campo].length
  ) {
    return
  }

  const actual =
    datos[campo][index]

  const destino =
    datos[campo][nuevoIndex]

  datos[campo][index] =
    destino

  datos[campo][nuevoIndex] =
    actual

  datos[campo] =
    datos[campo].map(
      (item, itemIndex) => {
        if (!esObjeto(item)) {
          return item
        }

        return {
          ...item,
          orden:
            itemIndex + 1,
        }
      }
    )
}

/* =========================================================
   ARRAYS SIMPLES
   ========================================================= */

function actualizarArraySimple(
  campo,
  texto
) {
  datos[campo] =
    convertirArrayTexto(
      texto.split('\n')
    )
}

/* =========================================================
   OBJETOS
   ========================================================= */

function actualizarObjeto(
  campo,
  texto
) {
  try {
    const valor =
      JSON.parse(texto)

    if (esObjeto(valor)) {
      datos[campo] = valor
    }
  } catch {
    /*
     * No modificamos el objeto mientras
     * el JSON sea inválido.
     */
  }
}

function obtenerObjetoTexto(
  valor
) {
  if (!esObjeto(valor)) {
    return ''
  }

  try {
    return JSON.stringify(
      valor,
      null,
      2
    )
  } catch {
    return ''
  }
}

/* =========================================================
   LABELS
   ========================================================= */

function obtenerLabelCampo(
  campo
) {
  const labels = {
    activo: 'Activo',
    orden: 'Orden',
    titulo: 'Título',
    descripcion: 'Descripción',
    eyebrow: 'Etiqueta superior',
    icono: 'Icono',
    enlace: 'Enlace',
    textoEnlace: 'Texto del enlace',
    texto: 'Texto',
    url: 'URL',
    pregunta: 'Pregunta',
    respuesta: 'Respuesta',
    nombreEmpresa: 'Nombre de empresa',
    logoTexto: 'Texto del logo',
    subtitulo: 'Subtítulo',
    ctaTexto: 'Texto del botón',
    ctaUrl: 'URL del botón',
  }

  return (
    labels[campo] ||
    campo
      .replace(
        /([A-Z])/g,
        ' $1'
      )
      .replace(
        /^./,
        (letra) =>
          letra.toUpperCase()
      )
  )
}

/* =========================================================
   CAMPOS DE ITEM
   ========================================================= */

function obtenerCamposItem(
  item
) {
  if (!esObjeto(item)) {
    return []
  }

  return Object.keys(item)
}

/* =========================================================
   VALORES PARA INPUT
   ========================================================= */

function obtenerValorInput(
  valor
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return ''
  }

  if (
    typeof valor === 'object'
  ) {
    return ''
  }

  return valor
}

/* =========================================================
   CICLO DE VIDA
   ========================================================= */

onMounted(() => {
  iniciarSuscripcion(
    seccionActiva.value
  )
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
})
</script>

<template>
  <section class="admin-secciones">

<!-- =====================================================
     ENCABEZADO
     ===================================================== -->

<div class="admin-secciones__header">

  <div>
    <h1 class="admin-secciones__title">
      Secciones
    </h1>

    <p class="admin-secciones__description">
      Los cambios se sincronizan automáticamente con Firebase.
    </p>
  </div>

  <div
    class="admin-secciones__status"
    :class="{
      'is-online': conectadaTiempoReal,
    }"
  >
    <span class="admin-secciones__status-dot"></span>

    {{
      conectadaTiempoReal
        ? 'Sincronizado'
        : 'Sin conexión en tiempo real'
    }}
  </div>

</div>

<!-- =====================================================
     MENÚ DE SECCIONES
     ===================================================== -->

<nav
  class="admin-secciones__tabs"
  aria-label="Secciones"
>
  <button
    v-for="seccion in secciones"
    :key="seccion.id"
    type="button"
    class="admin-secciones__tab"
    :class="{
      'is-active':
        seccionActiva === seccion.id,
    }"
    @click="
      seleccionarSeccion(
        seccion.id
      )
    "
  >
    {{ seccion.nombre }}
  </button>
</nav>

<!-- =====================================================
     MENSAJES
     ===================================================== -->

<div
  v-if="error"
  class="admin-secciones__message admin-secciones__message--error"
  role="alert"
>
  {{ error }}
</div>

<div
  v-if="mensaje"
  class="admin-secciones__message admin-secciones__message--success"
  role="status"
>
  {{ mensaje }}
</div>

<!-- =====================================================
     CARGANDO
     ===================================================== -->

<div
  v-if="cargando"
  class="admin-secciones__loading"
>
  <span class="admin-secciones__loading-spinner">
    ⟳
  </span>

  <span>
    Cargando sección...
  </span>
</div>

<!-- =====================================================
     EDITOR
     ===================================================== -->

<div
  v-else
  class="admin-secciones__editor"
>

  <!-- IDENTIFICACIÓN -->

  <div class="admin-secciones__section-heading">

    <div>
      <span class="admin-secciones__eyebrow">
        Sección
      </span>

      <h2 class="admin-secciones__section-title">
        {{ seccionSeleccionada.nombre }}
      </h2>
    </div>

    <div class="admin-secciones__actions">

      <button
        type="button"
        class="admin-secciones__button admin-secciones__button--primary"
        :disabled="guardando"
        @click="guardar"
      >
        {{
          guardando
            ? 'Guardando...'
            : 'Guardar cambios'
        }}
      </button>

    </div>

  </div>

  <!-- ID -->

  <div class="admin-secciones__field">

    <label>
      ID
    </label>

    <input
      :value="seccionActiva"
      type="text"
      disabled
    />

  </div>

  <!-- ===================================================
       CAMPOS
       =================================================== -->

  <div
    v-for="(valor, campo) in datos"
    :key="campo"
    class="admin-secciones__field-group"
  >

    <!-- ================================================
         NAVEGACIÓN
         ================================================ -->

    <template v-if="esNavegacion(campo)">

      <div class="admin-secciones__field-heading">

        <div>
          <label>
            {{ obtenerLabelCampo(campo) }}
          </label>

          <p>
            Enlaces de navegación.
          </p>
        </div>

        <button
          type="button"
          class="admin-secciones__small-button"
          @click="
            agregarNavegacion()
          "
        >
          + Agregar
        </button>

      </div>

      <div
        v-if="
          Array.isArray(
            datos.navegacion
          ) &&
          datos.navegacion.length
        "
        class="admin-secciones__items-list"
      >

        <article
          v-for="(
            item,
            index
          ) in datos.navegacion"
          :key="
            item.id ||
            `navigation-${index}`
          "
          class="admin-secciones__item"
        >

          <div class="admin-secciones__item-header">

            <strong>
              Elemento {{ index + 1 }}
            </strong>

            <div class="admin-secciones__item-actions">

              <button
                type="button"
                title="Subir"
                :disabled="
                  index === 0
                "
                @click="
                  moverNavegacion(
                    index,
                    -1
                  )
                "
              >
                ↑
              </button>

              <button
                type="button"
                title="Bajar"
                :disabled="
                  index ===
                  datos.navegacion.length -
                    1
                "
                @click="
                  moverNavegacion(
                    index,
                    1
                  )
                "
              >
                ↓
              </button>

              <button
                type="button"
                title="Eliminar"
                @click="
                  eliminarNavegacion(
                    index
                  )
                "
              >
                ×
              </button>

            </div>

          </div>

          <div
            v-for="subcampo in Object.keys(item)"
            :key="subcampo"
            class="admin-secciones__item-field"
          >

            <label>
              {{
                obtenerLabelCampo(
                  subcampo
                )
              }}
            </label>

            <input
              v-if="
                typeof item[subcampo] ===
                'string'
              "
              :value="
                obtenerValorInput(
                  item[subcampo]
                )
              "
              type="text"
              @input="
                actualizarNavegacionCampo(
                  index,
                  subcampo,
                  $event.target.value
                )
              "
            />

            <input
              v-else-if="
                typeof item[subcampo] ===
                'number'
              "
              :value="
                item[subcampo]
              "
              type="number"
              @input="
                actualizarNavegacionCampo(
                  index,
                  subcampo,
                  Number(
                    $event.target.value
                  )
                )
              "
            />

            <label
              v-else-if="
                typeof item[subcampo] ===
                'boolean'
              "
              class="admin-secciones__checkbox"
            >
              <input
                :checked="
                  item[subcampo]
                "
                type="checkbox"
                @change="
                  actualizarNavegacionCampo(
                    index,
                    subcampo,
                    $event.target.checked
                  )
                "
              />

              <span>
                {{
                  item[subcampo]
                    ? 'Activo'
                    : 'Inactivo'
                }}
              </span>
            </label>

            <textarea
              v-else-if="
                esArray(item[subcampo])
              "
              :value="
                obtenerValorTexto(
                  item[subcampo]
                )
              "
              rows="4"
              @input="
                actualizarItemArray(
                  'navegacion',
                  index,
                  subcampo,
                  $event.target.value
                )
              "
            ></textarea>

          </div>

        </article>

      </div>

      <div
        v-else
        class="admin-secciones__empty"
      >
        No hay elementos de navegación.
      </div>

    </template>

    <!-- ================================================
         ITEMS
         ================================================ -->

    <template v-else-if="esItems(campo)">

      <div class="admin-secciones__field-heading">

        <div>
          <label>
            {{ obtenerLabelCampo(campo) }}
          </label>

          <p>
            Elementos editables de la sección.
          </p>
        </div>

        <button
          type="button"
          class="admin-secciones__small-button"
          @click="
            agregarItem(campo)
          "
        >
          + Agregar elemento
        </button>

      </div>

      <div
        v-if="
          Array.isArray(
            datos[campo]
          ) &&
          datos[campo].length
        "
        class="admin-secciones__items-list"
      >

        <!-- ==========================================
             CADA ITEM
             ========================================== -->

        <article
          v-for="(
            item,
            index
          ) in datos[campo]"
          :key="
            item.id ||
            `${campo}-${index}-${item.orden ?? index}`
          "
          class="admin-secciones__item"
        >

          <div class="admin-secciones__item-header">

            <div>
              <strong>
                Elemento {{ index + 1 }}
              </strong>

              <span
                v-if="
                  esObjeto(item) &&
                  item.titulo
                "
                class="admin-secciones__item-preview"
              >
                {{ item.titulo }}
              </span>
            </div>

            <div class="admin-secciones__item-actions">

              <button
                type="button"
                title="Subir"
                :disabled="
                  index === 0
                "
                @click="
                  moverItem(
                    campo,
                    index,
                    -1
                  )
                "
              >
                ↑
              </button>

              <button
                type="button"
                title="Bajar"
                :disabled="
                  index ===
                  datos[campo].length -
                    1
                "
                @click="
                  moverItem(
                    campo,
                    index,
                    1
                  )
                "
              >
                ↓
              </button>

              <button
                type="button"
                title="Eliminar"
                @click="
                  eliminarItem(
                    campo,
                    index
                  )
                "
              >
                ×
              </button>

            </div>

          </div>

          <!-- ========================================
               ITEM OBJETO
               ======================================== -->

          <div
            v-if="esObjeto(item)"
            class="admin-secciones__item-fields"
          >

            <div
              v-for="subcampo in obtenerCamposItem(item)"
              :key="subcampo"
              class="admin-secciones__item-field"
            >

              <label>
                {{
                  obtenerLabelCampo(
                    subcampo
                  )
                }}
              </label>

              <!-- BOOLEAN -->

              <label
                v-if="
                  esBooleano(
                    item[subcampo]
                  )
                "
                class="admin-secciones__checkbox"
              >
                <input
                  :checked="
                    item[subcampo]
                  "
                  type="checkbox"
                  @change="
                    actualizarItemCampo(
                      campo,
                      index,
                      subcampo,
                      $event.target.checked
                    )
                  "
                />

                <span>
                  {{
                    item[subcampo]
                      ? 'Activo'
                      : 'Inactivo'
                  }}
                </span>
              </label>

              <!-- NUMBER -->

              <input
                v-else-if="
                  esNumero(
                    item[subcampo]
                  )
                "
                :value="
                  item[subcampo]
                "
                type="number"
                @input="
                  actualizarItemCampo(
                    campo,
                    index,
                    subcampo,
                    Number(
                      $event.target.value
                    )
                  )
                "
              />

              <!-- ARRAY -->

              <textarea
                v-else-if="
                  esArray(
                    item[subcampo]
                  )
                "
                :value="
                  obtenerValorTexto(
                    item[subcampo]
                  )
                "
                rows="4"
                @input="
                  actualizarItemArray(
                    campo,
                    index,
                    subcampo,
                    $event.target.value
                  )
                "
              ></textarea>

              <!-- OBJECT -->

              <textarea
                v-else-if="
                  esObjeto(
                    item[subcampo]
                  )
                "
                :value="
                  obtenerObjetoTexto(
                    item[subcampo]
                  )
                "
                rows="7"
                class="admin-secciones__json-field"
                @input="
                  actualizarItemObjeto(
                    campo,
                    index,
                    subcampo,
                    $event.target.value
                  )
                "
              ></textarea>

              <!-- LONG TEXT -->

              <textarea
                v-else-if="
                  esCampoLargo(
                    item[subcampo]
                  )
                "
                :value="
                  obtenerValorInput(
                    item[subcampo]
                  )
                "
                rows="5"
                @input="
                  actualizarItemCampo(
                    campo,
                    index,
                    subcampo,
                    $event.target.value
                  )
                "
              ></textarea>

              <!-- STRING -->

              <input
                v-else
                :value="
                  obtenerValorInput(
                    item[subcampo]
                  )
                "
                type="text"
                @input="
                  actualizarItemCampo(
                    campo,
                    index,
                    subcampo,
                    $event.target.value
                  )
                "
              />

            </div>

          </div>

          <!-- ========================================
               ITEM PRIMITIVO
               ======================================== -->

          <div
            v-else
            class="admin-secciones__item-field"
          >

            <label>
              Valor
            </label>

            <input
              :value="
                obtenerValorInput(
                  item
                )
              "
              type="text"
              @input="
                datos[campo][index] =
                  $event.target.value
              "
            />

          </div>

        </article>

      </div>

      <div
        v-else
        class="admin-secciones__empty"
      >
        No hay elementos configurados.
      </div>

    </template>

    <!-- ================================================
         ARRAY GENÉRICO SIMPLE
         ================================================ -->

    <template
      v-else-if="
        esArraySimple(valor)
      "
    >

      <label>
        {{ obtenerLabelCampo(campo) }}
      </label>

      <p class="admin-secciones__hint">
        Un elemento por línea.
      </p>

      <textarea
        :value="
          obtenerValorTexto(
            valor
          )
        "
        rows="6"
        @input="
          actualizarArraySimple(
            campo,
            $event.target.value
          )
        "
      ></textarea>

    </template>

    <!-- ================================================
         ARRAY GENÉRICO DE OBJETOS
         ================================================ -->

    <template
      v-else-if="
        esArrayObjetos(valor)
      "
    >

      <div class="admin-secciones__field-heading">

        <div>
          <label>
            {{ obtenerLabelCampo(campo) }}
          </label>

          <p>
            Elementos estructurados.
          </p>
        </div>

        <button
          type="button"
          class="admin-secciones__small-button"
          @click="
            agregarItem(campo)
          "
        >
          + Agregar elemento
        </button>

      </div>

      <div
        class="admin-secciones__items-list"
      >

        <article
          v-for="(
            item,
            index
          ) in valor"
          :key="
            item.id ||
            `${campo}-object-${index}`
          "
          class="admin-secciones__item"
        >

          <div class="admin-secciones__item-header">

            <strong>
              Elemento {{ index + 1 }}
            </strong>

            <div class="admin-secciones__item-actions">

              <button
                type="button"
                :disabled="
                  index === 0
                "
                @click="
                  moverItem(
                    campo,
                    index,
                    -1
                  )
                "
              >
                ↑
              </button>

              <button
                type="button"
                :disabled="
                  index ===
                  valor.length - 1
                "
                @click="
                  moverItem(
                    campo,
                    index,
                    1
                  )
                "
              >
                ↓
              </button>

              <button
                type="button"
                @click="
                  eliminarItem(
                    campo,
                    index
                  )
                "
              >
                ×
              </button>

            </div>

          </div>

          <div
            v-if="esObjeto(item)"
            class="admin-secciones__item-fields"
          >

            <div
              v-for="subcampo in obtenerCamposItem(item)"
              :key="subcampo"
              class="admin-secciones__item-field"
            >

              <label>
                {{
                  obtenerLabelCampo(
                    subcampo
                  )
                }}
              </label>

              <label
                v-if="
                  esBooleano(
                    item[subcampo]
                  )
                "
                class="admin-secciones__checkbox"
              >
                <input
                  :checked="
                    item[subcampo]
                  "
                  type="checkbox"
                  @change="
                    actualizarItemCampo(
                      campo,
                      index,
                      subcampo,
                      $event.target.checked
                    )
                  "
                />

                <span>
                  {{
                    item[subcampo]
                      ? 'Activo'
                      : 'Inactivo'
                  }}
                </span>
              </label>

              <input
                v-else-if="
                  esNumero(
                    item[subcampo]
                  )
                "
                :value="
                  item[subcampo]
                "
                type="number"
                @input="
                  actualizarItemCampo(
                    campo,
                    index,
                    subcampo,
                    Number(
                      $event.target.value
                    )
                  )
                "
              />

              <textarea
                v-else-if="
                  esArray(
                    item[subcampo]
                  )
                "
                :value="
                  obtenerValorTexto(
                    item[subcampo]
                  )
                "
                rows="4"
                @input="
                  actualizarItemArray(
                    campo,
                    index,
                    subcampo,
                    $event.target.value
                  )
                "
              ></textarea>

              <textarea
                v-else-if="
                  esObjeto(
                    item[subcampo]
                  )
                "
                :value="
                  obtenerObjetoTexto(
                    item[subcampo]
                  )
                "
                rows="7"
                class="admin-secciones__json-field"
                @input="
                  actualizarItemObjeto(
                    campo,
                    index,
                    subcampo,
                    $event.target.value
                  )
                "
              ></textarea>

              <textarea
                v-else-if="
                  esCampoLargo(
                    item[subcampo]
                  )
                "
                :value="
                  obtenerValorInput(
                    item[subcampo]
                  )
                "
                rows="5"
                @input="
                  actualizarItemCampo(
                    campo,
                    index,
                    subcampo,
                    $event.target.value
                  )
                "
              ></textarea>

              <input
                v-else
                :value="
                  obtenerValorInput(
                    item[subcampo]
                  )
                "
                type="text"
                @input="
                  actualizarItemCampo(
                    campo,
                    index,
                    subcampo,
                    $event.target.value
                  )
                "
              />

            </div>

          </div>

        </article>

      </div>

    </template>

    <!-- ================================================
         OBJETO GENÉRICO
         ================================================ -->

    <template
      v-else-if="
        esObjeto(valor)
      "
    >

      <label>
        {{ obtenerLabelCampo(campo) }}
      </label>

      <p class="admin-secciones__hint">
        Objeto de configuración.
      </p>

      <textarea
        :value="
          obtenerObjetoTexto(
            valor
          )
        "
        rows="8"
        class="admin-secciones__json-field"
        @input="
          actualizarObjeto(
            campo,
            $event.target.value
          )
        "
      ></textarea>

    </template>

    <!-- ================================================
         BOOLEAN
         ================================================ -->

    <template
      v-else-if="
        esBooleano(valor)
      "
    >

      <label>
        {{ obtenerLabelCampo(campo) }}
      </label>

      <label
        class="admin-secciones__checkbox"
      >
        <input
          :checked="valor"
          type="checkbox"
          @change="
            actualizarCampo(
              campo,
              $event.target.checked
            )
          "
        />

        <span>
          {{
            valor
              ? 'Activo'
              : 'Inactivo'
          }}
        </span>
      </label>

    </template>

    <!-- ================================================
         NUMBER
         ================================================ -->

    <template
      v-else-if="
        esNumero(valor)
      "
    >

      <label>
        {{ obtenerLabelCampo(campo) }}
      </label>

      <input
        :value="valor"
        type="number"
        @input="
          actualizarCampo(
            campo,
            Number(
              $event.target.value
            )
          )
        "
      />

    </template>

    <!-- ================================================
         TEXTO LARGO
         ================================================ -->

    <template
      v-else-if="
        esCampoLargo(valor)
      "
    >

      <label>
        {{ obtenerLabelCampo(campo) }}
      </label>

      <textarea
        :value="valor"
        rows="6"
        @input="
          actualizarCampo(
            campo,
            $event.target.value
          )
        "
      ></textarea>

    </template>

    <!-- ================================================
         TEXTO
         ================================================ -->

    <template
      v-else
    >

      <label>
        {{ obtenerLabelCampo(campo) }}
      </label>

      <input
        :value="
          obtenerValorInput(
            valor
          )
        "
        type="text"
        @input="
          actualizarCampo(
            campo,
            $event.target.value
          )
        "
      />

    </template>

  </div>

  <!-- ===================================================
       ACCIONES INFERIORES
       =================================================== -->

  <div class="admin-secciones__footer-actions">

    <button
      type="button"
      class="admin-secciones__button admin-secciones__button--primary"
      :disabled="guardando"
      @click="guardar"
    >
      {{
        guardando
          ? 'Guardando...'
          : 'Guardar cambios'
      }}
    </button>

  </div>

</div>


  </section>
</template>
