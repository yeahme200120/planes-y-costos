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

const contactosRef = collection(
    db,
    'contactos'
)

/**
 * Obtiene todos los contactos ordenados
 * del más reciente al más antiguo.
 */
export async function obtenerContactos() {
    const consulta = query(
        contactosRef,
        orderBy('fecha', 'desc')
    )

    const snapshot =
        await getDocs(consulta)

    return snapshot.docs.map(
        (documento) => {
            const data =
                documento.data()

            return {
                id: documento.id,
                ...data,
            }
        }
    )
}

/**
 * Suscripción en tiempo real a todos
 * los contactos.
 */
export function suscribirContactos(
    callback,
    onError
) {
    const consulta = query(
        contactosRef,
        orderBy('fecha', 'desc')
    )

    return onSnapshot(
        consulta,
        (snapshot) => {
            const datos =
                snapshot.docs.map(
                    (documento) => {
                        const data =
                            documento.data()

                        return {
                            id: documento.id,
                            ...data,
                        }
                    }
                )

            callback(datos)
        },
        (error) => {
            console.error(
                'Error suscribiéndose a contactos:',
                error
            )

            onError?.(error)
        }
    )
}

/**
 * Actualiza el estado de un contacto.
 */
export async function actualizarEstadoContacto(
    contactoId,
    estado
) {
    if (!contactoId) {
        throw new Error(
            'El identificador del contacto es requerido.'
        )
    }

    const estadosPermitidos = [
        'nuevo',
        'atendido',
        'cerrado',
    ]

    if (
        !estadosPermitidos.includes(
            estado
        )
    ) {
        throw new Error(
            'Estado de contacto no válido.'
        )
    }

    const contactoRef = doc(
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
}

/**
 * Elimina un contacto.
 */
export async function eliminarContacto(
    contactoId
) {
    if (!contactoId) {
        throw new Error(
            'El identificador del contacto es requerido.'
        )
    }

    const contactoRef = doc(
        db,
        'contactos',
        contactoId
    )

    await deleteDoc(contactoRef)
}

/**
 * Suscripción en tiempo real únicamente
 * para contar contactos nuevos.
 */
export function suscribirContactosNuevos(
    callback,
    onError
) {
    const consulta = query(
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

            onError?.(error)
        }
    )
}