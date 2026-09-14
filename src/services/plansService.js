import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import { db } from '../config/firebaseFirestore.js'

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

const PLANES_COLLECTION =
  'planes'

const ORDEN_POR_DEFECTO =
  999

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

/**
 * Convierte un valor a número seguro.
 */
function numeroSeguro(
  valor,
  valorDefecto = ORDEN_POR_DEFECTO
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
 * Normaliza las características
 * de un plan.
 *
 * Soporta:
 *
 * - Array
 * - JSON string
 * - Texto separado por saltos de línea
 * - String individual
 * - Valores simples
 */
function normalizarCaracteristicas(
  valor
) {
  if (
    Array.isArray(valor)
  ) {
    return valor
      .map(
        (item) =>
          typeof item ===
          'string'
            ? item.trim()
            : String(
                item ?? ''
              ).trim()
      )
      .filter(
        Boolean
      )
  }

  if (
    typeof valor ===
    'string'
  ) {
    const texto =
      valor.trim()

    if (!texto) {
      return []
    }

    /*
     * Primero intentamos detectar
     * un array almacenado como JSON.
     */
    try {
      const parsed =
        JSON.parse(
          texto
        )

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
      // No es JSON; continuamos
      // con texto normal.
    }

    /*
     * Si contiene saltos de línea,
     * cada línea representa una
     * característica.
     */
    if (
      texto.includes(
        '\n'
      )
    ) {
      return texto
        .split(/\r?\n/)
        .map(
          (item) =>
            item.trim()
        )
        .filter(
          Boolean
        )
    }

    /*
     * Una característica única.
     */
    return [
      texto,
    ]
  }

  if (
    valor === null ||
    valor === undefined
  ) {
    return []
  }

  return [
    String(
      valor
    ).trim(),
  ].filter(
    Boolean
  )
}

/**
 * Normaliza un plan.
 */
function normalizarPlan(
  documento
) {
  const data =
    documento.data()

  return {
    id:
      documento.id,

    ...data,

    precio:
      numeroSeguro(
        data.precio,
        0
      ),

    orden:
      numeroSeguro(
        data.orden,
        ORDEN_POR_DEFECTO
      ),

    activo:
      data.activo === true,

    destacado:
      data.destacado === true,

    caracteristicas:
      normalizarCaracteristicas(
        data.caracteristicas
      ),
  }
}

/*
|--------------------------------------------------------------------------
| PLANES
|--------------------------------------------------------------------------
*/

/**
 * Obtiene todos los planes activos.
 *
 * Se ordenan en JavaScript para evitar
 * depender de un índice compuesto de
 * Firestore (activo + orden).
 */
export async function obtenerPlanes() {
  try {
    const planesRef =
      collection(
        db,
        PLANES_COLLECTION
      )

    const consulta =
      query(
        planesRef,
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

    const planes =
      snapshot.docs.map(
        normalizarPlan
      )

    return planes.sort(
      (a, b) =>
        a.orden -
        b.orden
    )
  } catch (error) {
    console.error(
      'Error obteniendo los planes:',
      error
    )

    throw error
  }
}