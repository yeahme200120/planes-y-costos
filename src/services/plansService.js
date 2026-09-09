import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'

import { db } from '../config/firebaseFirestore.js'

export async function obtenerPlanes() {
  const planesRef = collection(db, 'planes')

  const consulta = query(planesRef, where('activo', '==', true), orderBy('orden', 'asc'))

  const snapshot = await getDocs(consulta)

  return snapshot.docs.map((doc) => {
    const data = doc.data()

    let caracteristicas = data.caracteristicas ?? []

    if (typeof caracteristicas === 'string') {
      try {
        caracteristicas = JSON.parse(caracteristicas)
      } catch {
        caracteristicas = [caracteristicas]
      }
    }

    return {
      id: doc.id,
      ...data,
      caracteristicas,
    }
  })
}
