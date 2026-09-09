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

const IMAGENES_COLLECTION = 'imagenes'

const TIPOS_PERMITIDOS = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]

const TAMANO_MAXIMO = 15 * 1024 * 1024

function validarArchivo(archivo) {
  if (!(archivo instanceof File)) {
    throw new Error('El archivo seleccionado no es válido.')
  }

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new Error(
      'Formato no permitido. Usa PNG, JPG, JPEG, WebP o GIF.'
    )
  }

  if (archivo.size > TAMANO_MAXIMO) {
    throw new Error(
      'La imagen supera el tamaño máximo permitido de 15 MB.'
    )
  }

  return true
}

function limpiarNombre(nombre = 'imagen') {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function extensionDeMime(mime) {
  const extensiones = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/x-icon': 'ico',
  }

  return extensiones[mime] || 'bin'
}

function generarIdArchivo() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

export async function subirArchivoImagen({
  archivo,
  carpeta = 'landing/originales',
  nombre = 'imagen',
}) {
  validarArchivo(archivo)

  const nombreLimpio = limpiarNombre(nombre)
  const extension = extensionDeMime(archivo.type)

  const ruta = `${carpeta}/${nombreLimpio}-${generarIdArchivo()}.${extension}`

  const referencia = ref(storage, ruta)

  const snapshot = await uploadBytes(
    referencia,
    archivo,
    {
      contentType: archivo.type,
      cacheControl: 'public,max-age=31536000',
    }
  )

  const url = await getDownloadURL(snapshot.ref)

  return {
    url,
    ruta,
    nombre: nombreLimpio,
    tipoMime: archivo.type,
    extension,
    tamano: archivo.size,
  }
}

export async function crearImagen({
  nombre,
  tipo = 'landing',
  archivo,
  metadata = {},
}) {
  validarArchivo(archivo)

  const subida = await subirArchivoImagen({
    archivo,
    carpeta:
      tipo === 'logo'
        ? 'branding/logo/originales'
        : tipo === 'favicon'
          ? 'branding/favicon/originales'
          : 'landing/originales',
    nombre,
  })

  const imagenRef = await addDoc(
    collection(db, IMAGENES_COLLECTION),
    {
      nombre,
      tipo,
      urlOriginal: subida.url,
      rutaOriginal: subida.ruta,
      formatoOriginal: subida.extension,
      tipoMimeOriginal: subida.tipoMime,
      tamanoOriginal: subida.tamano,

      recursos: [],

      ...metadata,

      activo: true,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    }
  )

  return {
    id: imagenRef.id,
    nombre,
    tipo,
    urlOriginal: subida.url,
    rutaOriginal: subida.ruta,
    formatoOriginal: subida.extension,
    tipoMimeOriginal: subida.tipoMime,
    tamanoOriginal: subida.tamano,
    recursos: [],
    activo: true,
  }
}

export function suscribirImagenesAdmin(
  callback,
  onError = () => {},
) {
  const referencia = collection(
    db,
    IMAGENES_COLLECTION
  )

  return onSnapshot(
    referencia,
    (snapshot) => {
      const imagenes = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data(),
        }))
        .sort((a, b) => {
          const fechaA =
            a.creadoEn?.seconds || 0

          const fechaB =
            b.creadoEn?.seconds || 0

          return fechaB - fechaA
        })

      callback(imagenes)
    },
    onError
  )
}

export async function actualizarImagen(
  imagenId,
  datos,
) {
  if (!imagenId) {
    throw new Error(
      'No se recibió el identificador de la imagen.'
    )
  }

  const referencia = doc(
    db,
    IMAGENES_COLLECTION,
    imagenId
  )

  await setDoc(
    referencia,
    {
      ...datos,
      actualizadoEn: serverTimestamp(),
    },
    {
      merge: true,
    }
  )
}

export async function agregarRecursoImagen(
  imagenId,
  recurso,
) {
  if (!imagenId) {
    throw new Error(
      'No se recibió el identificador de la imagen.'
    )
  }

  const referencia = doc(
    db,
    IMAGENES_COLLECTION,
    imagenId
  )

  await setDoc(
    referencia,
    {
      recursos: [
        ...(recurso.recursosActuales || []),
        recurso,
      ],
      actualizadoEn: serverTimestamp(),
    },
    {
      merge: true,
    }
  )
}

export async function eliminarArchivoStorage(
  ruta,
) {
  if (!ruta) return

  try {
    const referencia = ref(storage, ruta)
    await deleteObject(referencia)
  } catch (error) {
    if (error?.code === 'storage/object-not-found') {
      return
    }

    throw error
  }
}

export async function eliminarImagen(
  imagen,
) {
  if (!imagen?.id) {
    throw new Error(
      'No se recibió el identificador de la imagen.'
    )
  }

  if (imagen.rutaOriginal) {
    await eliminarArchivoStorage(
      imagen.rutaOriginal
    )
  }

  if (Array.isArray(imagen.recursos)) {
    for (const recurso of imagen.recursos) {
      if (recurso.ruta) {
        await eliminarArchivoStorage(
          recurso.ruta
        )
      }
    }
  }

  await deleteDoc(
    doc(
      db,
      IMAGENES_COLLECTION,
      imagen.id
    )
  )
}