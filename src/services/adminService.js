import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { db } from '../config/firebaseFirestore.js'

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

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

/**
 * Suscripción en tiempo real a una sección.
 *
 * Escucha directamente:
 *
 * secciones/{sectionId}
 *
 * Devuelve la función unsubscribe
 * proporcionada por Firestore.
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
      if (!snapshot.exists()) {
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
    {
      ...datos,
    }
  )

  return obtenerSeccionAdmin(
    sectionId
  )
}

/**
 * Crea o actualiza una sección.
 *
 * Utiliza merge para no eliminar
 * campos existentes que no formen
 * parte de los datos enviados.
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
    {
      ...datos,
    },
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

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

/**
 * Actualiza la configuración.
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

  await setDoc(
    ref,
    {
      ...datos,
    },
    {
      merge: true,
    }
  )

  return obtenerConfiguracionAdmin(
    configId
  )
}

/**
 * Suscripción en tiempo real a una configuración.
 *
 * Escucha:
 *
 * configuracion/{configId}
 *
 * Devuelve la función unsubscribe.
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
      if (!snapshot.exists()) {
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
 * Normaliza el campo características
 * de un plan para garantizar que
 * siempre se almacene como array.
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
  }

  if (
    typeof caracteristicas ===
    'string'
  ) {
    try {
      const parsed =
        JSON.parse(
          caracteristicas
        )

      if (
        Array.isArray(parsed)
      ) {
        return parsed
      }

      return [
        caracteristicas,
      ]
    } catch {
      return caracteristicas
        .split('\n')
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    }
  }

  if (
    caracteristicas !== null &&
    typeof caracteristicas ===
      'object'
  ) {
    return Object.values(
      caracteristicas
    )
  }

  if (
    caracteristicas !==
      undefined &&
    caracteristicas !== null
  ) {
    return [
      String(
        caracteristicas
      ),
    ]
  }

  return []
}

/**
 * Prepara los datos de un plan
 * antes de guardarlos en Firestore.
 */
function prepararPlan(
  datos
) {
  return {
    ...datos,

    caracteristicas:
      normalizarCaracteristicas(
        datos.caracteristicas
      ),

    precio: Number(
      datos.precio ?? 0
    ),

    orden: Number(
      datos.orden ?? 999
    ),

    activo: Boolean(
      datos.activo
    ),

    destacado: Boolean(
      datos.destacado
    ),
  }
}

/**
 * Ordena planes por el campo orden.
 *
 * Se hace en JavaScript para evitar
 * depender de índices compuestos
 * de Firestore.
 */
function ordenarPlanes(
  planes
) {
  return [...planes].sort(
    (a, b) =>
      Number(
        a.orden ?? 999
      ) -
      Number(
        b.orden ?? 999
      )
  )
}

/**
 * Obtiene todos los planes
 * una sola vez.
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
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    )

  return ordenarPlanes(
    planes
  )
}

/**
 * Suscripción en tiempo real
 * a todos los planes.
 *
 * Devuelve unsubscribe.
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
          (document) => ({
            id: document.id,
            ...document.data(),
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
    prepararPlan(
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
      activo: Boolean(
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
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    )
    .sort(
      (a, b) =>
        Number(
          a.orden ?? 999
        ) -
        Number(
          b.orden ?? 999
        )
    )
}

/**
 * Suscripción en tiempo real a todos los elementos
 * de una colección.
 *
 * Escucha:
 *
 * soluciones
 * caracteristicas
 * faq
 *
 * Los elementos se ordenan localmente por "orden"
 * para evitar depender de índices compuestos
 * de Firestore.
 *
 * Devuelve la función unsubscribe.
 */
export function suscribirElementosAdmin(
  coleccion,
  callback,
  onError
) {
  const ref = collection(
    db,
    coleccion
  )

  return onSnapshot(
    ref,
    (snapshot) => {
      const elementos = snapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .sort(
          (a, b) =>
            Number(a.orden ?? 999) -
            Number(b.orden ?? 999)
        )

      callback(elementos)
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
 * Normaliza datos genéricos
 * antes de guardarlos.
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
      Number(
        resultado.orden
      )
  }

  if (
    resultado.activo !==
    undefined
  ) {
    resultado.activo =
      Boolean(
        resultado.activo
      )
  }

  return resultado
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
      activo: Boolean(
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
|
| Colección:
|
| usuarios/{documentId}
|
| Campos:
|
| activo
| email
| isUser
| nombre
| rol
|
| El documentId es generado por Firebase.
|
| isUser contiene el UID relacionado
| con Firebase Authentication.
|
|--------------------------------------------------------------------------
*/

/**
 * Obtiene todos los usuarios una sola vez.
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
      id: documento.id,
      ...documento.data(),
    })
  )
}

/**
 * Suscripción en tiempo real
 * a la colección usuarios.
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
            id: documento.id,
            ...documento.data(),
          })
        )

      callback(usuarios)
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
 * Obtiene un usuario por el ID
 * del documento de Firestore.
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
 *
 * Firestore genera automáticamente
 * el ID del documento.
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
          datos.email || '',

        isUser:
          datos.isUser || '',

        nombre:
          datos.nombre || '',

        rol:
          datos.rol || '',

        creadoEn:
          new Date(),

        actualizadoEn:
          new Date(),
      }
    )

  return obtenerUsuarioAdmin(
    documento.id
  )
}

/**
 * Actualiza un usuario.
 *
 * No modifica isUser ni email
 * a menos que se envíen explícitamente.
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

  await updateDoc(
    ref,
    {
      ...datos,

      actualizadoEn:
        new Date(),
    }
  )

  return obtenerUsuarioAdmin(
    usuarioId
  )
}

/**
 * Elimina el documento del usuario
 * de la colección usuarios.
 *
 * IMPORTANTE:
 *
 * Esto NO elimina la cuenta de
 * Firebase Authentication.
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
        Boolean(activo),

      actualizadoEn:
        new Date(),
    }
  )

  return obtenerUsuarioAdmin(
    usuarioId
  )
}
