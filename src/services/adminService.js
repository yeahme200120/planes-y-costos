import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { db } from '../config/firebase'

/*
|--------------------------------------------------------------------------
| SECCIONES
|--------------------------------------------------------------------------
*/

export async function obtenerSeccionAdmin(sectionId) {
  const ref = doc(db, 'secciones', sectionId)

  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export async function actualizarSeccion(
  sectionId,
  datos
) {
  const ref = doc(
    db,
    'secciones',
    sectionId
  )

  await updateDoc(ref, {
    ...datos,
  })

  return obtenerSeccionAdmin(sectionId)
}

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

  return obtenerSeccionAdmin(sectionId)
}

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

export async function obtenerConfiguracionAdmin(
  configId = 'general'
) {
  const ref = doc(
    db,
    'configuracion',
    configId
  )

  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

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

  return obtenerConfiguracionAdmin(configId)
}

/*
|--------------------------------------------------------------------------
| PLANES
|--------------------------------------------------------------------------
*/

function normalizarCaracteristicas(
  caracteristicas
) {
  if (Array.isArray(caracteristicas)) {
    return caracteristicas
  }

  if (
    typeof caracteristicas ===
    'string'
  ) {
    try {
      const parsed =
        JSON.parse(caracteristicas)

      if (Array.isArray(parsed)) {
        return parsed
      }

      return [caracteristicas]
    } catch {
      return caracteristicas
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  if (
    caracteristicas !== null &&
    typeof caracteristicas === 'object'
  ) {
    return Object.values(caracteristicas)
  }

  if (
    caracteristicas !== undefined &&
    caracteristicas !== null
  ) {
    return [String(caracteristicas)]
  }

  return []
}

function prepararPlan(datos) {
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

export async function obtenerPlanesAdmin() {
  const ref = collection(
    db,
    'planes'
  )

  const snapshot =
    await getDocs(ref)

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .sort(
      (a, b) =>
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
    )
}

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

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export async function crearPlan(
  datos
) {
  const ref = collection(
    db,
    'planes'
  )

  const documento =
    await addDoc(
      ref,
      prepararPlan(datos)
    )

  return obtenerPlanAdmin(
    documento.id
  )
}

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
    prepararPlan(datos)
  )

  return obtenerPlanAdmin(
    planId
  )
}

export async function eliminarPlan(
  planId
) {
  const ref = doc(
    db,
    'planes',
    planId
  )

  await deleteDoc(ref)

  return true
}

export async function cambiarEstadoPlan(
  planId,
  activo
) {
  const ref = doc(
    db,
    'planes',
    planId
  )

  await updateDoc(ref, {
    activo: Boolean(activo),
  })

  return obtenerPlanAdmin(
    planId
  )
}

/*
|--------------------------------------------------------------------------
| CONTENIDO
|--------------------------------------------------------------------------
*/

export async function obtenerElementosAdmin(
  coleccion
) {
  const ref = collection(
    db,
    coleccion
  )

  const snapshot =
    await getDocs(ref)

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .sort(
      (a, b) =>
        Number(a.orden ?? 999) -
        Number(b.orden ?? 999)
    )
}

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

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

function prepararElemento(datos) {
  const resultado = {
    ...datos,
  }

  if (
    resultado.orden !== undefined
  ) {
    resultado.orden = Number(
      resultado.orden
    )
  }

  if (
    resultado.activo !== undefined
  ) {
    resultado.activo = Boolean(
      resultado.activo
    )
  }

  return resultado
}

export async function crearElementoAdmin(
  coleccion,
  datos
) {
  const ref = collection(
    db,
    coleccion
  )

  const documento =
    await addDoc(
      ref,
      prepararElemento(datos)
    )

  return obtenerElementoAdmin(
    coleccion,
    documento.id
  )
}

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
    prepararElemento(datos)
  )

  return obtenerElementoAdmin(
    coleccion,
    elementoId
  )
}

export async function eliminarElementoAdmin(
  coleccion,
  elementoId
) {
  const ref = doc(
    db,
    coleccion,
    elementoId
  )

  await deleteDoc(ref)

  return true
}

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

  await updateDoc(ref, {
    activo: Boolean(activo),
  })

  return obtenerElementoAdmin(
    coleccion,
    elementoId
  )
}