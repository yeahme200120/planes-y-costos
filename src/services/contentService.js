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

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

/**
 * Convierte un valor a un número seguro.
 *
 * Evita que ordenamientos con valores inválidos
 * produzcan NaN.
 */
function numeroSeguro(
  valor,
  valorDefecto = 999
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
 * Normaliza el campo activo.
 *
 * Firebase normalmente almacena boolean,
 * pero permite mantener compatibilidad con
 * datos antiguos que pudieran contener 1/0
 * o strings.
 */
function booleanoSeguro(
  valor,
  valorDefecto = true
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
    const valorNormalizado =
      valor
        .trim()
        .toLowerCase()

    if (
      [
        'true',
        '1',
        'si',
        'sí',
        'activo',
        'activa',
        'on',
      ].includes(
        valorNormalizado
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
        'inactiva',
        'off',
      ].includes(
        valorNormalizado
      )
    ) {
      return false
    }
  }

  return valorDefecto
}

/**
 * Convierte un documento Firestore
 * en un objeto consistente para la aplicación.
 */
function convertirDocumento(
  documento
) {
  const data =
    documento.data()

  return {
    id:
      documento.id,

    ...data,

    activo:
      booleanoSeguro(
        data.activo,
        true
      ),

    orden:
      numeroSeguro(
        data.orden,
        999
      ),
  }
}

/**
 * Ordena elementos por el campo orden.
 *
 * Si dos elementos tienen el mismo orden,
 * conserva el orden recibido por Firestore.
 */
function ordenarPorOrden(
  elementos
) {
  return [
    ...elementos,
  ].sort(
    (a, b) =>
      numeroSeguro(
        a.orden,
        999
      ) -
      numeroSeguro(
        b.orden,
        999
      )
  )
}

/**
 * Ejecuta callback de error únicamente
 * cuando fue proporcionado.
 */
function ejecutarError(
  onError,
  error
) {
  if (
    typeof onError ===
    'function'
  ) {
    onError(error)
  }
}

/*
|--------------------------------------------------------------------------
| SECCIONES
|--------------------------------------------------------------------------
*/

/**
 * Obtiene una sección una sola vez.
 */
export async function getSection(
  sectionId
) {
  if (!sectionId) {
    throw new Error(
      'El identificador de la sección es requerido.'
    )
  }

  try {
    const sectionRef =
      doc(
        db,
        'secciones',
        sectionId
      )

    const snapshot =
      await getDoc(
        sectionRef
      )

    if (
      !snapshot.exists()
    ) {
      console.warn(
        `La sección "${sectionId}" no existe.`
      )

      return null
    }

    return convertirDocumento(
      snapshot
    )
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
export function subscribeToSection(
  sectionId,
  callback,
  onError
) {
  if (!sectionId) {
    throw new Error(
      'El identificador de la sección es requerido.'
    )
  }

  if (
    typeof callback !==
    'function'
  ) {
    throw new Error(
      'El callback de la sección es requerido.'
    )
  }

  const sectionRef =
    doc(
      db,
      'secciones',
      sectionId
    )

  return onSnapshot(
    sectionRef,
    (snapshot) => {
      if (
        !snapshot.exists()
      ) {
        callback(null)
        return
      }

      callback(
        convertirDocumento(
          snapshot
        )
      )
    },
    (error) => {
      console.error(
        `Error escuchando la sección "${sectionId}":`,
        error
      )

      ejecutarError(
        onError,
        error
      )
    }
  )
}

/**
 * Obtiene todas las secciones activas
 * una sola vez.
 */
export async function getActiveSections() {
  try {
    const sectionsRef =
      collection(
        db,
        'secciones'
      )

    const consulta =
      query(
        sectionsRef,
        where(
          'activo',
          '==',
          true
        )
      )

    const snapshot =
      await getDocs(
        consulta
      )

    const sections =
      snapshot.docs.map(
        convertirDocumento
      )

    return ordenarPorOrden(
      sections
    )
  } catch (error) {
    console.error(
      'Error obteniendo las secciones:',
      error
    )

    throw error
  }
}

/**
 * Escucha todas las secciones activas
 * en tiempo real.
 */
export function subscribeToActiveSections(
  callback,
  onError
) {
  if (
    typeof callback !==
    'function'
  ) {
    throw new Error(
      'El callback de las secciones es requerido.'
    )
  }

  const sectionsRef =
    collection(
      db,
      'secciones'
    )

  const consulta =
    query(
      sectionsRef,
      where(
        'activo',
        '==',
        true
      )
    )

  return onSnapshot(
    consulta,
    (snapshot) => {
      const sections =
        snapshot.docs.map(
          convertirDocumento
        )

      callback(
        ordenarPorOrden(
          sections
        )
      )
    },
    (error) => {
      console.error(
        'Error escuchando las secciones:',
        error
      )

      ejecutarError(
        onError,
        error
      )
    }
  )
}

/*
|--------------------------------------------------------------------------
| COLECCIONES
|--------------------------------------------------------------------------
*/

/**
 * Obtiene una colección completa
 * una sola vez.
 */
export async function getCollection(
  collectionName
) {
  if (!collectionName) {
    throw new Error(
      'El nombre de la colección es requerido.'
    )
  }

  try {
    const collectionRef =
      collection(
        db,
        collectionName
      )

    const snapshot =
      await getDocs(
        collectionRef
      )

    return snapshot.docs.map(
      convertirDocumento
    )
  } catch (error) {
    console.error(
      `Error obteniendo la colección "${collectionName}":`,
      error
    )

    throw error
  }
}

/**
 * Escucha una colección completa
 * en tiempo real.
 */
export function subscribeToCollection(
  collectionName,
  callback,
  onError
) {
  if (!collectionName) {
    throw new Error(
      'El nombre de la colección es requerido.'
    )
  }

  if (
    typeof callback !==
    'function'
  ) {
    throw new Error(
      'El callback de la colección es requerido.'
    )
  }

  const collectionRef =
    collection(
      db,
      collectionName
    )

  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items =
        snapshot.docs.map(
          convertirDocumento
        )

      callback(
        items
      )
    },
    (error) => {
      console.error(
        `Error escuchando la colección "${collectionName}":`,
        error
      )

      ejecutarError(
        onError,
        error
      )
    }
  )
}

/**
 * Obtiene elementos activos
 * una sola vez.
 */
export async function getActiveCollection(
  collectionName
) {
  if (!collectionName) {
    throw new Error(
      'El nombre de la colección es requerido.'
    )
  }

  try {
    const collectionRef =
      collection(
        db,
        collectionName
      )

    const consulta =
      query(
        collectionRef,
        where(
          'activo',
          '==',
          true
        )
      )

    const snapshot =
      await getDocs(
        consulta
      )

    return snapshot.docs.map(
      convertirDocumento
    )
  } catch (error) {
    console.error(
      `Error obteniendo elementos activos de "${collectionName}":`,
      error
    )

    throw error
  }
}

/**
 * Escucha elementos activos
 * en tiempo real.
 */
export function subscribeToActiveCollection(
  collectionName,
  callback,
  onError
) {
  if (!collectionName) {
    throw new Error(
      'El nombre de la colección es requerido.'
    )
  }

  if (
    typeof callback !==
    'function'
  ) {
    throw new Error(
      'El callback de la colección es requerido.'
    )
  }

  const collectionRef =
    collection(
      db,
      collectionName
    )

  const consulta =
    query(
      collectionRef,
      where(
        'activo',
        '==',
        true
      )
    )

  return onSnapshot(
    consulta,
    (snapshot) => {
      const items =
        snapshot.docs.map(
          convertirDocumento
        )

      callback(
        items
      )
    },
    (error) => {
      console.error(
        `Error escuchando la colección "${collectionName}":`,
        error
      )

      ejecutarError(
        onError,
        error
      )
    }
  )
}

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

/**
 * Obtiene una configuración
 * una sola vez.
 *
 * Por defecto utiliza "general".
 */
export async function getConfiguration(
  configId = 'general'
) {
  if (!configId) {
    throw new Error(
      'El identificador de configuración es requerido.'
    )
  }

  try {
    const configRef =
      doc(
        db,
        'configuracion',
        configId
      )

    const snapshot =
      await getDoc(
        configRef
      )

    if (
      !snapshot.exists()
    ) {
      console.warn(
        `La configuración "${configId}" no existe.`
      )

      return null
    }

    return {
      id:
        snapshot.id,

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

/**
 * Escucha una configuración
 * en tiempo real.
 *
 * Por defecto utiliza "general".
 */
export function subscribeToConfiguration(
  configId = 'general',
  callback,
  onError
) {
  if (
    typeof callback !==
    'function'
  ) {
    throw new Error(
      'El callback de configuración es requerido.'
    )
  }

  const configRef =
    doc(
      db,
      'configuracion',
      configId
    )

  return onSnapshot(
    configRef,
    (snapshot) => {
      if (
        !snapshot.exists()
      ) {
        callback(null)
        return
      }

      callback({
        id:
          snapshot.id,

        ...snapshot.data(),
      })
    },
    (error) => {
      console.error(
        `Error escuchando la configuración "${configId}":`,
        error
      )

      ejecutarError(
        onError,
        error
      )
    }
  )
}