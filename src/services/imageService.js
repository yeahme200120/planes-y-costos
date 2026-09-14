import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'

import { db } from '../config/firebaseFirestore.js'
import { storage } from '../config/firebaseStorage.js'

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN
|--------------------------------------------------------------------------
*/

const IMAGENES_COLLECTION = 'imagenes'

const TIPOS_PERMITIDOS = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]

const TAMANO_MAXIMO =
  15 * 1024 * 1024

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

/**
 * Valida un archivo antes de subirlo.
 */
function validarArchivo(
  archivo
) {
  if (
    !archivo ||
    !(
      archivo instanceof File
    )
  ) {
    throw new Error(
      'El archivo seleccionado no es válido.'
    )
  }

  if (
    !TIPOS_PERMITIDOS.includes(
      archivo.type
    )
  ) {
    throw new Error(
      'Formato no permitido. Usa PNG, JPG, JPEG, WebP o GIF.'
    )
  }

  if (
    archivo.size >
    TAMANO_MAXIMO
  ) {
    throw new Error(
      'La imagen supera el tamaño máximo permitido de 15 MB.'
    )
  }

  return true
}

/**
 * Limpia nombres para utilizarlos
 * de forma segura dentro de Storage.
 */
function limpiarNombre(
  nombre = 'imagen'
) {
  const nombreTexto =
    String(nombre)
      .trim()

  const limpio =
    nombreTexto
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[^a-zA-Z0-9-_]/g,
        '-'
      )
      .replace(
        /-+/g,
        '-'
      )
      .replace(
        /^-|-$/g,
        ''
      )
      .toLowerCase()

  return (
    limpio ||
    'imagen'
  )
}

/**
 * Obtiene la extensión correspondiente
 * al MIME de la imagen.
 */
function extensionDeMime(
  mime
) {
  const extensiones = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/x-icon': 'ico',
  }

  return (
    extensiones[mime] ||
    'bin'
  )
}

/**
 * Genera un identificador único
 * para evitar colisiones en Storage.
 */
function generarIdArchivo() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

/**
 * Normaliza una imagen obtenida
 * desde Firestore.
 */
function normalizarImagen(
  documento
) {
  const data =
    documento.data()

  return {
    id:
      documento.id,

    ...data,

    nombre:
      data.nombre ??
      'imagen',

    tipo:
      data.tipo ??
      'landing',

    urlOriginal:
      data.urlOriginal ??
      null,

    rutaOriginal:
      data.rutaOriginal ??
      null,

    formatoOriginal:
      data.formatoOriginal ??
      null,

    tipoMimeOriginal:
      data.tipoMimeOriginal ??
      null,

    tamanoOriginal:
      Number(
        data.tamanoOriginal ??
          0
      ),

    recursos:
      Array.isArray(
        data.recursos
      )
        ? data.recursos
        : [],

    activo:
      data.activo !== false,
  }
}

/**
 * Normaliza recursos.
 */
function normalizarRecursos(
  recursos
) {
  if (
    !Array.isArray(
      recursos
    )
  ) {
    return []
  }

  return recursos.filter(
    (recurso) =>
      recurso &&
      typeof recurso ===
        'object'
  )
}

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

/**
 * Sube una imagen a Firebase Storage.
 */
export async function subirArchivoImagen({
  archivo,
  carpeta = 'landing/originales',
  nombre = 'imagen',
}) {
  validarArchivo(
    archivo
  )

  const nombreLimpio =
    limpiarNombre(
      nombre
    )

  const extension =
    extensionDeMime(
      archivo.type
    )

  const ruta =
    `${carpeta}/${nombreLimpio}-${generarIdArchivo()}.${extension}`

  const referencia =
    ref(
      storage,
      ruta
    )

  const snapshot =
    await uploadBytes(
      referencia,
      archivo,
      {
        contentType:
          archivo.type,

        cacheControl:
          'public,max-age=31536000',
      }
    )

  const url =
    await getDownloadURL(
      snapshot.ref
    )

  return {
    url,
    ruta,
    nombre:
      nombreLimpio,
    tipoMime:
      archivo.type,
    extension,
    tamano:
      archivo.size,
  }
}

/*
|--------------------------------------------------------------------------
| FIRESTORE — IMÁGENES
|--------------------------------------------------------------------------
*/

/**
 * Crea un registro de imagen
 * y sube su archivo original.
 */
export async function crearImagen({
  nombre,
  tipo = 'landing',
  archivo,
  metadata = {},
}) {
  validarArchivo(
    archivo
  )

  const nombreFinal =
    limpiarNombre(
      nombre
    )

  const carpeta =
    tipo === 'logo'
      ? 'branding/logo/originales'
      : tipo === 'favicon'
        ? 'branding/favicon/originales'
        : 'landing/originales'

  const subida =
    await subirArchivoImagen({
      archivo,
      carpeta,
      nombre:
        nombreFinal,
    })

  const datosImagen = {
    nombre:
      nombreFinal,

    tipo,

    urlOriginal:
      subida.url,

    rutaOriginal:
      subida.ruta,

    formatoOriginal:
      subida.extension,

    tipoMimeOriginal:
      subida.tipoMime,

    tamanoOriginal:
      subida.tamano,

    recursos: [],

    ...(
      metadata &&
      typeof metadata ===
        'object'
        ? metadata
        : {}
    ),

    activo: true,

    creadoEn:
      serverTimestamp(),

    actualizadoEn:
      serverTimestamp(),
  }

  const imagenRef =
    await addDoc(
      collection(
        db,
        IMAGENES_COLLECTION
      ),
      datosImagen
    )

  return {
    id:
      imagenRef.id,

    nombre:
      datosImagen.nombre,

    tipo:
      datosImagen.tipo,

    urlOriginal:
      datosImagen.urlOriginal,

    rutaOriginal:
      datosImagen.rutaOriginal,

    formatoOriginal:
      datosImagen.formatoOriginal,

    tipoMimeOriginal:
      datosImagen.tipoMimeOriginal,

    tamanoOriginal:
      datosImagen.tamanoOriginal,

    recursos: [],

    activo: true,
  }
}

/*
|--------------------------------------------------------------------------
| SUSCRIPCIÓN ADMIN
|--------------------------------------------------------------------------
*/

/**
 * Suscripción en tiempo real
 * a todas las imágenes.
 */
export function suscribirImagenesAdmin(
  callback,
  onError = () => {}
) {
  if (
    typeof callback !==
    'function'
  ) {
    throw new Error(
      'El callback de imágenes es requerido.'
    )
  }

  const referencia =
    collection(
      db,
      IMAGENES_COLLECTION
    )

  return onSnapshot(
    referencia,
    (snapshot) => {
      const imagenes =
        snapshot.docs
          .map(
            normalizarImagen
          )
          .sort(
            (a, b) => {
              const fechaA =
                a.creadoEn
                  ?.seconds ||
                0

              const fechaB =
                b.creadoEn
                  ?.seconds ||
                0

              return (
                fechaB -
                fechaA
              )
            }
          )

      callback(
        imagenes
      )
    },
    (error) => {
      console.error(
        'Error escuchando imágenes:',
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
| ACTUALIZACIÓN
|--------------------------------------------------------------------------
*/

/**
 * Actualiza información de una imagen.
 */
export async function actualizarImagen(
  imagenId,
  datos
) {
  if (!imagenId) {
    throw new Error(
      'No se recibió el identificador de la imagen.'
    )
  }

  if (
    !datos ||
    typeof datos !==
      'object'
  ) {
    throw new Error(
      'Los datos de la imagen no son válidos.'
    )
  }

  const referencia =
    doc(
      db,
      IMAGENES_COLLECTION,
      imagenId
    )

  await setDoc(
    referencia,
    {
      ...datos,

      actualizadoEn:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  )

  return true
}

/*
|--------------------------------------------------------------------------
| RECURSOS
|--------------------------------------------------------------------------
*/

/**
 * Agrega un recurso a una imagen.
 *
 * Se mantiene compatible con el diseño
 * actual, donde el recurso puede traer
 * recursosActuales.
 */
export async function agregarRecursoImagen(
  imagenId,
  recurso
) {
  if (!imagenId) {
    throw new Error(
      'No se recibió el identificador de la imagen.'
    )
  }

  if (
    !recurso ||
    typeof recurso !==
      'object'
  ) {
    throw new Error(
      'El recurso de imagen no es válido.'
    )
  }

  const referencia =
    doc(
      db,
      IMAGENES_COLLECTION,
      imagenId
    )

  const recursosActuales =
    normalizarRecursos(
      recurso.recursosActuales
    )

  const nuevoRecurso = {
    ...recurso,
  }

  delete nuevoRecurso.recursosActuales

  await setDoc(
    referencia,
    {
      recursos: [
        ...recursosActuales,
        nuevoRecurso,
      ],

      actualizadoEn:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  )

  return true
}

/*
|--------------------------------------------------------------------------
| STORAGE — ELIMINACIÓN
|--------------------------------------------------------------------------
*/

/**
 * Elimina un archivo de Firebase Storage.
 *
 * Si el archivo ya no existe, se considera
 * una eliminación exitosa.
 */
export async function eliminarArchivoStorage(
  ruta
) {
  if (!ruta) {
    return
  }

  try {
    const referencia =
      ref(
        storage,
        ruta
      )

    await deleteObject(
      referencia
    )
  } catch (error) {
    if (
      error?.code ===
      'storage/object-not-found'
    ) {
      return
    }

    throw error
  }
}

/*
|--------------------------------------------------------------------------
| ELIMINACIÓN DE IMAGEN
|--------------------------------------------------------------------------
*/

/**
 * Elimina:
 *
 * 1. Archivo original de Storage.
 * 2. Recursos derivados de Storage.
 * 3. Documento de Firestore.
 */
export async function eliminarImagen(
  imagen
) {
  if (
    !imagen?.id
  ) {
    throw new Error(
      'No se recibió el identificador de la imagen.'
    )
  }

  if (
    imagen.rutaOriginal
  ) {
    await eliminarArchivoStorage(
      imagen.rutaOriginal
    )
  }

  const recursos =
    normalizarRecursos(
      imagen.recursos
    )

  for (
    const recurso of recursos
  ) {
    if (
      recurso.ruta
    ) {
      await eliminarArchivoStorage(
        recurso.ruta
      )
    }
  }

  await deleteDoc(
    doc(
      db,
      IMAGENES_COLLECTION,
      imagen.id
    )
  )

  return true
}