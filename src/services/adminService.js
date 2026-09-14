import {
  addDoc,
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../config/firebaseFirestore.js'

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

/**
 * Convierte un valor a número seguro.
 *
 * Evita guardar NaN o Infinity en Firestore.
 */
function numeroSeguro(
  valor,
  valorDefecto = 0
) {
  const numero =
    Number(valor)

  return Number.isFinite(
    numero
  )
    ? numero
    : valorDefecto
}

/**
 * Convierte un valor a orden seguro.
 */
function ordenarSeguro(
  valor,
  valorDefecto = 999
) {
  return numeroSeguro(
    valor,
    valorDefecto
  )
}

/**
 * Convierte correctamente
 * diferentes representaciones
 * a boolean.
 */
function booleanoSeguro(
  valor,
  valorDefecto = false
) {
  if (
    typeof valor ===
    'boolean'
  ) {
    return valor
  }

  if (
    typeof valor ===
    'number'
  ) {
    return valor !== 0
  }

  if (
    typeof valor ===
    'string'
  ) {
    const normalizado =
      valor
        .trim()
        .toLowerCase()

    if (
      [
        'true',
        '1',
        'si',
        'sí',
        'yes',
        'activo',
        'on',
      ].includes(
        normalizado
      )
    ) {
      return true
    }

    if (
      [
        'false',
        '0',
        'no',
        'inactivo',
        'off',
        '',
      ].includes(
        normalizado
      )
    ) {
      return false
    }
  }

  return valor ?? valorDefecto
}

/**
 * Normaliza un texto.
 */
function textoSeguro(
  valor,
  valorDefecto = ''
) {
  if (
    valor === undefined ||
    valor === null
  ) {
    return valorDefecto
  }

  return String(valor)
}

/**
 * Prepara recursivamente los datos
 * para que Firestore reciba valores
 * compatibles.
 *
 * En particular:
 *
 * Uint8Array -> Firestore Bytes
 *
 * Esto es necesario para guardar
 * imágenes binarias directamente
 * dentro de un documento Firestore.
 */
function prepararDatosFirestore(
  valor
) {
  /*
   * Ya es un tipo Bytes de Firestore.
   */
  if (
    valor instanceof Bytes
  ) {
    return valor
  }

  /*
   * Uint8Array:
   * convertirlo explícitamente a Bytes.
   */
  if (
    valor instanceof Uint8Array
  ) {
    return Bytes.fromUint8Array(
      new Uint8Array(valor)
    )
  }

  /*
   * ArrayBuffer.
   */
  if (
    valor instanceof ArrayBuffer
  ) {
    return Bytes.fromUint8Array(
      new Uint8Array(valor)
    )
  }

  /*
   * Otros TypedArray / DataView.
   */
  if (
    ArrayBuffer.isView(valor)
  ) {
    return Bytes.fromUint8Array(
      new Uint8Array(
        valor.buffer,
        valor.byteOffset,
        valor.byteLength
      )
    )
  }

  /*
   * Arrays normales.
   */
  if (
    Array.isArray(valor)
  ) {
    return valor.map(
      prepararDatosFirestore
    )
  }

  /*
   * Objetos planos.
   *
   * No hacemos JSON.stringify porque
   * eso destruiría tipos especiales
   * de Firestore.
   */
  if (
    valor !== null &&
    typeof valor === 'object'
  ) {
    const resultado = {}

    Object.entries(valor).forEach(
      ([clave, contenido]) => {
        resultado[clave] =
          prepararDatosFirestore(
            contenido
          )
      }
    )

    return resultado
  }

  /*
   * Strings, números, boolean,
   * null, undefined, etc.
   */
  return valor
}

/*
|--------------------------------------------------------------------------
| SECCIONES
|--------------------------------------------------------------------------
*/

/**
 * Obtiene una sección una sola vez.
 */
export async function obtenerSeccionAdmin(
  sectionId
) {
  const ref = doc(
    db,
    'secciones',
    sectionId
  )

  const snapshot =
    await getDoc(ref)

  if (
    !snapshot.exists()
  ) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

/**
 * Suscripción en tiempo real
 * a una sección.
 */
export function suscribirSeccionAdmin(
  sectionId,
  callback,
  onError
) {
  const ref = doc(
    db,
    'secciones',
    sectionId
  )

  return onSnapshot(
    ref,
    (snapshot) => {
      if (
        !snapshot.exists()
      ) {
        callback(null)
        return
      }

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      })
    },
    (error) => {
      console.error(
        `Error suscribiéndose a la sección "${sectionId}":`,
        error
      )

      onError?.(error)
    }
  )
}

/**
 * Actualiza una sección existente.
 */
export async function actualizarSeccion(
  sectionId,
  datos
) {
  const ref = doc(
    db,
    'secciones',
    sectionId
  )

  await updateDoc(
    ref,
    prepararDatosFirestore(datos)
  )

  return obtenerSeccionAdmin(
    sectionId
  )
}

/**
 * Crea o actualiza una sección.
 */
export async function guardarSeccion(
  sectionId,
  datos
) {
  const ref = doc(
    db,
    'secciones',
    sectionId
  )

  await setDoc(
    ref,
    prepararDatosFirestore(datos),
    {
      merge: true,
    }
  )

  return obtenerSeccionAdmin(
    sectionId
  )
}

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

/**
 * Obtiene la configuración una sola vez.
 */
export async function obtenerConfiguracionAdmin(
  configId = 'general'
) {
  const ref = doc(
    db,
    'configuracion',
    configId
  )

  const snapshot =
    await getDoc(ref)

  if (
    !snapshot.exists()
  ) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

/**
 * Actualiza la configuración.
 *
 * Convierte automáticamente:
 *
 * logoBlob: Uint8Array
 *          ↓
 * Firestore Bytes
 *
 * merge conserva los demás
 * campos existentes.
 */
export async function actualizarConfiguracion(
  configId = 'general',
  datos
) {
  const ref = doc(
    db,
    'configuracion',
    configId
  )

  const datosFirestore =
    prepararDatosFirestore(
      datos
    )

  await setDoc(
    ref,
    datosFirestore,
    {
      merge: true,
    }
  )

  return obtenerConfiguracionAdmin(
    configId
  )
}

/**
 * Suscripción en tiempo real
 * a la configuración.
 */
export function suscribirConfiguracionAdmin(
  configId = 'general',
  callback,
  onError
) {
  const ref = doc(
    db,
    'configuracion',
    configId
  )

  return onSnapshot(
    ref,
    (snapshot) => {
      if (
        !snapshot.exists()
      ) {
        callback(null)
        return
      }

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      })
    },
    (error) => {
      console.error(
        `Error suscribiéndose a la configuración "${configId}":`,
        error
      )

      onError?.(error)
    }
  )
}

/*
|--------------------------------------------------------------------------
| PLANES
|--------------------------------------------------------------------------
*/

/**
 * Normaliza características
 * para garantizar que siempre
 * sean un array de strings.
 */
function normalizarCaracteristicas(
  caracteristicas
) {
  if (
    Array.isArray(
      caracteristicas
    )
  ) {
    return caracteristicas
      .map((item) => {
        if (
          item === null ||
          item === undefined
        ) {
          return ''
        }

        if (
          typeof item ===
          'object'
        ) {
          if (
            item.texto !==
            undefined
          ) {
            return String(
              item.texto
            ).trim()
          }

          if (
            item.nombre !==
            undefined
          ) {
            return String(
              item.nombre
            ).trim()
          }

          return JSON.stringify(
            item
          )
        }

        return String(
          item
        ).trim()
      })
      .filter(Boolean)
  }

  if (
    typeof caracteristicas ===
    'string'
  ) {
    const texto =
      caracteristicas.trim()

    if (!texto) {
      return []
    }

    try {
      const parsed =
        JSON.parse(texto)

      if (
        Array.isArray(
          parsed
        )
      ) {
        return normalizarCaracteristicas(
          parsed
        )
      }
    } catch {
      // Continúa con el formato
      // de texto por líneas.
    }

    return texto
      .split(/\r?\n/)
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean)
  }

  if (
    caracteristicas !== null &&
    typeof caracteristicas ===
      'object'
  ) {
    return Object.values(
      caracteristicas
    )
      .map((item) =>
        typeof item ===
        'string'
          ? item.trim()
          : String(
              item
            ).trim()
      )
      .filter(Boolean)
  }

  if (
    caracteristicas !==
      undefined &&
    caracteristicas !==
      null
  ) {
    return [
      String(
        caracteristicas
      ).trim(),
    ].filter(Boolean)
  }

  return []
}

/**
 * Prepara datos de un plan.
 */
function prepararPlan(
  datos
) {
  return prepararDatosFirestore({
    ...datos,

    caracteristicas:
      normalizarCaracteristicas(
        datos.caracteristicas
      ),

    precio:
      numeroSeguro(
        datos.precio,
        0
      ),

    orden:
      ordenarSeguro(
        datos.orden,
        999
      ),

    activo:
      booleanoSeguro(
        datos.activo,
        true
      ),

    destacado:
      booleanoSeguro(
        datos.destacado,
        false
      ),
  })
}

/**
 * Prepara únicamente los campos
 * enviados para actualización.
 */
function prepararPlanActualizacion(
  datos
) {
  const resultado = {
    ...datos,
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'caracteristicas'
    )
  ) {
    resultado.caracteristicas =
      normalizarCaracteristicas(
        datos.caracteristicas
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'precio'
    )
  ) {
    resultado.precio =
      numeroSeguro(
        datos.precio,
        0
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'orden'
    )
  ) {
    resultado.orden =
      ordenarSeguro(
        datos.orden,
        999
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'activo'
    )
  ) {
    resultado.activo =
      booleanoSeguro(
        datos.activo
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'destacado'
    )
  ) {
    resultado.destacado =
      booleanoSeguro(
        datos.destacado
      )
  }

  return prepararDatosFirestore(
    resultado
  )
}

/**
 * Ordena planes por "orden".
 */
function ordenarPlanes(
  planes
) {
  return [
    ...planes,
  ].sort(
    (a, b) =>
      ordenarSeguro(
        a.orden,
        999
      ) -
      ordenarSeguro(
        b.orden,
        999
      )
  )
}

/**
 * Obtiene todos los planes.
 */
export async function obtenerPlanesAdmin() {
  const ref =
    collection(
      db,
      'planes'
    )

  const snapshot =
    await getDocs(ref)

  const planes =
    snapshot.docs.map(
      (documento) => ({
        id:
          documento.id,
        ...documento.data(),
      })
    )

  return ordenarPlanes(
    planes
  )
}

/**
 * Suscripción en tiempo real
 * a todos los planes.
 */
export function suscribirPlanesAdmin(
  callback,
  onError
) {
  const ref =
    collection(
      db,
      'planes'
    )

  return onSnapshot(
    ref,
    (snapshot) => {
      const planes =
        snapshot.docs.map(
          (documento) => ({
            id:
              documento.id,
            ...documento.data(),
          })
        )

      callback(
        ordenarPlanes(
          planes
        )
      )
    },
    (error) => {
      console.error(
        'Error suscribiéndose a planes:',
        error
      )

      onError?.(error)
    }
  )
}

/**
 * Obtiene un plan.
 */
export async function obtenerPlanAdmin(
  planId
) {
  const ref = doc(
    db,
    'planes',
    planId
  )

  const snapshot =
    await getDoc(ref)

  if (
    !snapshot.exists()
  ) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

/**
 * Crea un nuevo plan.
 */
export async function crearPlan(
  datos
) {
  const ref =
    collection(
      db,
      'planes'
    )

  const documento =
    await addDoc(
      ref,
      prepararPlan(
        datos
      )
    )

  return obtenerPlanAdmin(
    documento.id
  )
}

/**
 * Actualiza un plan.
 */
export async function actualizarPlan(
  planId,
  datos
) {
  const ref = doc(
    db,
    'planes',
    planId
  )

  await updateDoc(
    ref,
    prepararPlanActualizacion(
      datos
    )
  )

  return obtenerPlanAdmin(
    planId
  )
}

/**
 * Elimina un plan.
 */
export async function eliminarPlan(
  planId
) {
  const ref = doc(
    db,
    'planes',
    planId
  )

  await deleteDoc(
    ref
  )

  return true
}

/**
 * Cambia el estado activo
 * de un plan.
 */
export async function cambiarEstadoPlan(
  planId,
  activo
) {
  const ref = doc(
    db,
    'planes',
    planId
  )

  await updateDoc(
    ref,
    {
      activo:
        booleanoSeguro(
          activo
        ),
    }
  )

  return obtenerPlanAdmin(
    planId
  )
}

/*
|--------------------------------------------------------------------------
| CONTENIDO
|--------------------------------------------------------------------------
*/

/**
 * Obtiene todos los elementos
 * de una colección.
 */
export async function obtenerElementosAdmin(
  coleccion
) {
  const ref =
    collection(
      db,
      coleccion
    )

  const snapshot =
    await getDocs(ref)

  return snapshot.docs
    .map(
      (documento) => ({
        id:
          documento.id,
        ...documento.data(),
      })
    )
    .sort(
      (a, b) =>
        ordenarSeguro(
          a.orden,
          999
        ) -
        ordenarSeguro(
          b.orden,
          999
        )
    )
}

/**
 * Suscripción en tiempo real
 * a todos los elementos.
 */
export function suscribirElementosAdmin(
  coleccion,
  callback,
  onError
) {
  const ref =
    collection(
      db,
      coleccion
    )

  return onSnapshot(
    ref,
    (snapshot) => {
      const elementos =
        snapshot.docs
          .map(
            (documento) => ({
              id:
                documento.id,
              ...documento.data(),
            })
          )
          .sort(
            (a, b) =>
              ordenarSeguro(
                a.orden,
                999
              ) -
              ordenarSeguro(
                b.orden,
                999
              )
          )

      callback(
        elementos
      )
    },
    (error) => {
      console.error(
        `Error suscribiéndose a la colección "${coleccion}":`,
        error
      )

      onError?.(error)
    }
  )
}

/**
 * Obtiene un elemento específico.
 */
export async function obtenerElementoAdmin(
  coleccion,
  elementoId
) {
  const ref = doc(
    db,
    coleccion,
    elementoId
  )

  const snapshot =
    await getDoc(ref)

  if (
    !snapshot.exists()
  ) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

/**
 * Normaliza datos genéricos.
 */
function prepararElemento(
  datos
) {
  const resultado = {
    ...datos,
  }

  if (
    resultado.orden !==
    undefined
  ) {
    resultado.orden =
      ordenarSeguro(
        resultado.orden
      )
  }

  if (
    resultado.activo !==
    undefined
  ) {
    resultado.activo =
      booleanoSeguro(
        resultado.activo
      )
  }

  return prepararDatosFirestore(
    resultado
  )
}

/**
 * Crea un elemento.
 */
export async function crearElementoAdmin(
  coleccion,
  datos
) {
  const ref =
    collection(
      db,
      coleccion
    )

  const documento =
    await addDoc(
      ref,
      prepararElemento(
        datos
      )
    )

  return obtenerElementoAdmin(
    coleccion,
    documento.id
  )
}

/**
 * Actualiza un elemento.
 */
export async function actualizarElementoAdmin(
  coleccion,
  elementoId,
  datos
) {
  const ref = doc(
    db,
    coleccion,
    elementoId
  )

  await updateDoc(
    ref,
    prepararElemento(
      datos
    )
  )

  return obtenerElementoAdmin(
    coleccion,
    elementoId
  )
}

/**
 * Elimina un elemento.
 */
export async function eliminarElementoAdmin(
  coleccion,
  elementoId
) {
  const ref = doc(
    db,
    coleccion,
    elementoId
  )

  await deleteDoc(
    ref
  )

  return true
}

/**
 * Cambia el estado activo
 * de un elemento.
 */
export async function cambiarEstadoElementoAdmin(
  coleccion,
  elementoId,
  activo
) {
  const ref = doc(
    db,
    coleccion,
    elementoId
  )

  await updateDoc(
    ref,
    {
      activo:
        booleanoSeguro(
          activo
        ),
    }
  )

  return obtenerElementoAdmin(
    coleccion,
    elementoId
  )
}

/*
|--------------------------------------------------------------------------
| USUARIOS
|--------------------------------------------------------------------------
*/

/**
 * Obtiene todos los usuarios.
 */
export async function obtenerUsuariosAdmin() {
  const ref =
    collection(
      db,
      'usuarios'
    )

  const snapshot =
    await getDocs(ref)

  return snapshot.docs.map(
    (documento) => ({
      id:
        documento.id,
      ...documento.data(),
    })
  )
}

/**
 * Suscripción en tiempo real
 * a usuarios.
 */
export function suscribirUsuariosAdmin(
  callback,
  onError
) {
  const ref =
    collection(
      db,
      'usuarios'
    )

  return onSnapshot(
    ref,
    (snapshot) => {
      const usuarios =
        snapshot.docs.map(
          (documento) => ({
            id:
              documento.id,
            ...documento.data(),
          })
        )

      callback(
        usuarios
      )
    },
    (error) => {
      console.error(
        'Error suscribiéndose a usuarios:',
        error
      )

      onError?.(error)
    }
  )
}

/**
 * Obtiene un usuario.
 */
export async function obtenerUsuarioAdmin(
  usuarioId
) {
  const ref = doc(
    db,
    'usuarios',
    usuarioId
  )

  const snapshot =
    await getDoc(ref)

  if (
    !snapshot.exists()
  ) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

/**
 * Crea un nuevo usuario.
 */
export async function crearUsuarioAdmin(
  datos
) {
  const ref =
    collection(
      db,
      'usuarios'
    )

  const documento =
    await addDoc(
      ref,
      {
        activo:
          datos.activo !== false,

        email:
          textoSeguro(
            datos.email
          ),

        isUser:
          textoSeguro(
            datos.isUser
          ),

        nombre:
          textoSeguro(
            datos.nombre
          ),

        rol:
          textoSeguro(
            datos.rol
          ),

        creadoEn:
          serverTimestamp(),

        actualizadoEn:
          serverTimestamp(),
      }
    )

  return obtenerUsuarioAdmin(
    documento.id
  )
}

/**
 * Actualiza un usuario.
 */
export async function actualizarUsuarioAdmin(
  usuarioId,
  datos
) {
  const ref = doc(
    db,
    'usuarios',
    usuarioId
  )

  const datosActualizados = {
    ...datos,
    actualizadoEn:
      serverTimestamp(),
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'activo'
    )
  ) {
    datosActualizados.activo =
      booleanoSeguro(
        datos.activo
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'email'
    )
  ) {
    datosActualizados.email =
      textoSeguro(
        datos.email
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'isUser'
    )
  ) {
    datosActualizados.isUser =
      textoSeguro(
        datos.isUser
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'nombre'
    )
  ) {
    datosActualizados.nombre =
      textoSeguro(
        datos.nombre
      )
  }

  if (
    Object.prototype.hasOwnProperty.call(
      datos,
      'rol'
    )
  ) {
    datosActualizados.rol =
      textoSeguro(
        datos.rol
      )
  }

  await updateDoc(
    ref,
    prepararDatosFirestore(
      datosActualizados
    )
  )

  return obtenerUsuarioAdmin(
    usuarioId
  )
}

/**
 * Elimina el documento del usuario.
 */
export async function eliminarUsuarioAdmin(
  usuarioId
) {
  const ref = doc(
    db,
    'usuarios',
    usuarioId
  )

  await deleteDoc(
    ref
  )

  return true
}

/**
 * Cambia el estado activo
 * de un usuario.
 */
export async function cambiarEstadoUsuarioAdmin(
  usuarioId,
  activo
) {
  const ref = doc(
    db,
    'usuarios',
    usuarioId
  )

  await updateDoc(
    ref,
    {
      activo:
        booleanoSeguro(
          activo
        ),

      actualizadoEn:
        serverTimestamp(),
    }
  )

  return obtenerUsuarioAdmin(
    usuarioId
  )
}
