import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from '../config/firebaseFirestore.js'

/*
|--------------------------------------------------------------------------
| CONTACTOS
|--------------------------------------------------------------------------
*/

const contactosRef = collection(
  db,
  'contactos'
)

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

/**
 * Estados válidos para un contacto.
 */
const ESTADOS_CONTACTO = [
  'nuevo',
  'atendido',
  'cerrado',
]

/**
 * Normaliza un estado.
 *
 * Los contactos antiguos que no tengan
 * estado se consideran "nuevo".
 */
function normalizarEstado(
  estado
) {
  if (
    ESTADOS_CONTACTO.includes(
      estado
    )
  ) {
    return estado
  }

  return 'nuevo'
}

/**
 * Convierte un documento de contacto
 * en un objeto listo para la interfaz.
 */
function convertirContacto(
  documento
) {
  const data =
    documento.data()

  return {
    id:
      documento.id,

    ...data,

    estado:
      normalizarEstado(
        data.estado
      ),
  }
}

/*
|--------------------------------------------------------------------------
| CONSULTAS
|--------------------------------------------------------------------------
*/

/**
 * Obtiene todos los contactos
 * ordenados del más reciente
 * al más antiguo.
 */
export async function obtenerContactos() {
  const consulta =
    query(
      contactosRef,
      orderBy(
        'fecha',
        'desc'
      )
    )

  const snapshot =
    await getDocs(
      consulta
    )

  return snapshot.docs.map(
    convertirContacto
  )
}

/**
 * Suscripción en tiempo real
 * a todos los contactos.
 *
 * Devuelve la función unsubscribe
 * proporcionada por Firestore.
 */
export function suscribirContactos(
  callback,
  onError
) {
  const consulta =
    query(
      contactosRef,
      orderBy(
        'fecha',
        'desc'
      )
    )

  return onSnapshot(
    consulta,
    (snapshot) => {
      const datos =
        snapshot.docs.map(
          convertirContacto
        )

      callback(
        datos
      )
    },
    (error) => {
      console.error(
        'Error suscribiéndose a contactos:',
        error
      )

      onError?.(
        error
      )
    }
  )
}

/*
|--------------------------------------------------------------------------
| ESTADO
|--------------------------------------------------------------------------
*/

/**
 * Actualiza el estado de un contacto.
 */
export async function actualizarEstadoContacto(
  contactoId,
  estado
) {
  if (
    !contactoId
  ) {
    throw new Error(
      'El identificador del contacto es requerido.'
    )
  }

  if (
    !ESTADOS_CONTACTO.includes(
      estado
    )
  ) {
    throw new Error(
      'Estado de contacto no válido.'
    )
  }

  const contactoRef =
    doc(
      db,
      'contactos',
      contactoId
    )

  await updateDoc(
    contactoRef,
    {
      estado,
    }
  )

  return true
}

/*
|--------------------------------------------------------------------------
| ELIMINACIÓN
|--------------------------------------------------------------------------
*/

/**
 * Elimina un contacto.
 */
export async function eliminarContacto(
  contactoId
) {
  if (
    !contactoId
  ) {
    throw new Error(
      'El identificador del contacto es requerido.'
    )
  }

  const contactoRef =
    doc(
      db,
      'contactos',
      contactoId
    )

  await deleteDoc(
    contactoRef
  )

  return true
}

/*
|--------------------------------------------------------------------------
| CONTACTOS NUEVOS
|--------------------------------------------------------------------------
*/

/**
 * Suscripción en tiempo real
 * únicamente para contar contactos
 * nuevos.
 *
 * No necesita orderBy(), por lo que
 * no requiere índice compuesto.
 */
export function suscribirContactosNuevos(
  callback,
  onError
) {
  const consulta =
    query(
      contactosRef,
      where(
        'estado',
        '==',
        'nuevo'
      )
    )

  return onSnapshot(
    consulta,
    (snapshot) => {
      callback(
        snapshot.size
      )
    },
    (error) => {
      console.error(
        'Error suscribiéndose a contactos nuevos:',
        error
      )

      onError?.(
        error
      )
    }
  )
}