import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  setDoc,
} from 'firebase/firestore'

import { db } from '../config/firebase'

/*
 * =========================================================
 * SECCIONES
 * =========================================================
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
  const ref = doc(db, 'secciones', sectionId)

  await updateDoc(ref, {
    ...datos,
  })

  return obtenerSeccionAdmin(sectionId)
}

export async function guardarSeccion(
  sectionId,
  datos
) {
  const ref = doc(db, 'secciones', sectionId)

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
 * =========================================================
 * CONFIGURACIÓN GENERAL
 * =========================================================
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
 * =========================================================
 * PLANES
 * =========================================================
 */

export async function obtenerPlanesAdmin() {
  const planesRef = collection(
    db,
    'planes'
  )

  const consulta = query(
    planesRef,
    orderBy('orden', 'asc')
  )

  const snapshot = await getDocs(consulta)

  return snapshot.docs.map((documento) => {
    const data = documento.data()

    let caracteristicas =
      data.caracteristicas ?? []

    if (
      typeof caracteristicas ===
      'string'
    ) {
      try {
        caracteristicas =
          JSON.parse(caracteristicas)
      } catch {
        caracteristicas = [
          caracteristicas,
        ]
      }
    }

    if (
      !Array.isArray(caracteristicas)
    ) {
      caracteristicas = [
        caracteristicas,
      ]
    }

    return {
      id: documento.id,
      ...data,
      caracteristicas,
    }
  })
}

export async function obtenerPlanAdmin(
  planId
) {
  const ref = doc(
    db,
    'planes',
    planId
  )

  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  let caracteristicas =
    data.caracteristicas ?? []

  if (
    typeof caracteristicas ===
    'string'
  ) {
    try {
      caracteristicas =
        JSON.parse(caracteristicas)
    } catch {
      caracteristicas = [
        caracteristicas,
      ]
    }
  }

  if (
    !Array.isArray(caracteristicas)
  ) {
    caracteristicas = [
      caracteristicas,
    ]
  }

  return {
    id: snapshot.id,
    ...data,
    caracteristicas,
  }
}

export async function crearPlan(datos) {
  const planesRef = collection(
    db,
    'planes'
  )

  const datosNormalizados = {
    ...datos,
    caracteristicas:
      normalizarCaracteristicas(
        datos.caracteristicas
      ),
    activo:
      datos.activo ?? true,
    orden:
      Number(datos.orden ?? 999),
  }

  const documento = await addDoc(
    planesRef,
    datosNormalizados
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

  const datosNormalizados = {
    ...datos,
  }

  if (
    'caracteristicas' in
    datosNormalizados
  ) {
    datosNormalizados.caracteristicas =
      normalizarCaracteristicas(
        datosNormalizados.caracteristicas
      )
  }

  if ('orden' in datosNormalizados) {
    datosNormalizados.orden = Number(
      datosNormalizados.orden
    )
  }

  await updateDoc(
    ref,
    datosNormalizados
  )

  return obtenerPlanAdmin(planId)
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

  return obtenerPlanAdmin(planId)
}

/*
 * =========================================================
 * UTILIDADES
 * =========================================================
 */

function normalizarCaracteristicas(
  caracteristicas
) {
  if (
    Array.isArray(caracteristicas)
  ) {
    return caracteristicas
      .map((item) =>
        String(item).trim()
      )
      .filter(Boolean)
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
          .map((item) =>
            String(item).trim()
          )
          .filter(Boolean)
      }
    } catch {
      return caracteristicas
        .split('\n')
        .map((item) =>
          item.trim()
        )
        .filter(Boolean)
    }

    return caracteristicas
      .split('\n')
      .map((item) =>
        item.trim()
      )
      .filter(Boolean)
  }

  if (
    caracteristicas == null
  ) {
    return []
  }

  return [
    String(caracteristicas),
  ]
}