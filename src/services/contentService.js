import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'

import { db } from '../config/firebaseFirestore.js'

/**
 * Obtiene una sección una sola vez.
 */
export async function getSection(sectionId) {
  try {
    const sectionRef = doc(db, 'secciones', sectionId)
    const snapshot = await getDoc(sectionRef)

    if (!snapshot.exists()) {
      console.warn(`La sección "${sectionId}" no existe.`)
      return null
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    }
  } catch (error) {
    console.error(
      `Error obteniendo la sección "${sectionId}":`,
      error
    )

    throw error
  }
}

/**
 * Escucha una sección en tiempo real.
 *
 * Devuelve una función unsubscribe().
 */
export function subscribeToSection(sectionId, callback, onError) {
  const sectionRef = doc(db, 'secciones', sectionId)

  return onSnapshot(
    sectionRef,
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
        `Error escuchando la sección "${sectionId}":`,
        error
      )

      if (onError) {
        onError(error)
      }
    }
  )
}

/**
 * Obtiene todas las secciones activas una sola vez.
 */
export async function getActiveSections() {
  try {
    const sectionsRef = collection(db, 'secciones')

    const q = query(
      sectionsRef,
      where('activo', '==', true)
    )

    const snapshot = await getDocs(q)

    return snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data(),
      }))
      .sort((a, b) => {
        const ordenA = Number(a.orden ?? 999)
        const ordenB = Number(b.orden ?? 999)

        return ordenA - ordenB
      })
  } catch (error) {
    console.error(
      'Error obteniendo las secciones:',
      error
    )

    throw error
  }
}

/**
 * Escucha todas las secciones activas en tiempo real.
 */
export function subscribeToActiveSections(
  callback,
  onError
) {
  const sectionsRef = collection(db, 'secciones')

  const q = query(
    sectionsRef,
    where('activo', '==', true)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const sections = snapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .sort((a, b) => {
          const ordenA = Number(a.orden ?? 999)
          const ordenB = Number(b.orden ?? 999)

          return ordenA - ordenB
        })

      callback(sections)
    },
    (error) => {
      console.error(
        'Error escuchando las secciones:',
        error
      )

      if (onError) {
        onError(error)
      }
    }
  )
}

/**
 * Obtiene una colección completa una sola vez.
 */
export async function getCollection(collectionName) {
  try {
    const collectionRef = collection(db, collectionName)
    const snapshot = await getDocs(collectionRef)

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }))
  } catch (error) {
    console.error(
      `Error obteniendo la colección "${collectionName}":`,
      error
    )

    throw error
  }
}

/**
 * Escucha una colección completa en tiempo real.
 */
export function subscribeToCollection(
  collectionName,
  callback,
  onError
) {
  const collectionRef = collection(db, collectionName)

  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }))

      callback(items)
    },
    (error) => {
      console.error(
        `Error escuchando la colección "${collectionName}":`,
        error
      )

      if (onError) {
        onError(error)
      }
    }
  )
}

/**
 * Obtiene elementos activos una sola vez.
 */
export async function getActiveCollection(collectionName) {
  try {
    const collectionRef = collection(db, collectionName)

    const q = query(
      collectionRef,
      where('activo', '==', true)
    )

    const snapshot = await getDocs(q)

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }))
  } catch (error) {
    console.error(
      `Error obteniendo elementos activos de "${collectionName}":`,
      error
    )

    throw error
  }
}

/**
 * Escucha elementos activos en tiempo real.
 */
export function subscribeToActiveCollection(
  collectionName,
  callback,
  onError
) {
  const collectionRef = collection(db, collectionName)

  const q = query(
    collectionRef,
    where('activo', '==', true)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }))

      callback(items)
    },
    (error) => {
      console.error(
        `Error escuchando la colección "${collectionName}":`,
        error
      )

      if (onError) {
        onError(error)
      }
    }
  )
}

export async function getConfiguration(configId) {
  try {
    const configRef = doc(
      db,
      'configuracion',
      configId
    )

    const snapshot = await getDoc(configRef)

    if (!snapshot.exists()) {
      console.warn(
        `La configuración "${configId}" no existe.`
      )

      return null
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    }
  } catch (error) {
    console.error(
      `Error obteniendo la configuración "${configId}":`,
      error
    )

    throw error
  }
}

export function subscribeToConfiguration(
  configId,
  callback,
  onError
) {
  const configRef = doc(
    db,
    'configuracion',
    configId
  )

  return onSnapshot(
    configRef,
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
        `Error escuchando la configuración "${configId}":`,
        error
      )

      if (onError) {
        onError(error)
      }
    }
  )
}