import express from 'express'
import cors from 'cors'
import multer from 'multer'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename =
  fileURLToPath(import.meta.url)

const __dirname =
  path.dirname(__filename)

/* =========================================================
   RUTAS
   ========================================================= */

const ROOT_DIR =
  path.resolve(
    __dirname,
    '../..'
  )

const LOGOS_DIR =
  path.join(
    ROOT_DIR,
    'public',
    'images',
    'logos'
  )

const PORT =
  Number(
    process.env.IMAGE_MANAGER_PORT ||
    8787
  )

const HOST =
  '127.0.0.1'

/* =========================================================
   EXPRESS
   ========================================================= */

const app =
  express()

app.use(
  cors({
    origin: true,
    methods: [
      'GET',
      'POST',
      'OPTIONS',
    ],
  })
)

app.use(
  express.json()
)

/* =========================================================
   MULTER
   ========================================================= */

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        15 * 1024 * 1024,
    },
  })

/* =========================================================
   UTILIDADES
   ========================================================= */

async function asegurarDirectorio() {
  await fs.mkdir(
    LOGOS_DIR,
    {
      recursive: true,
    }
  )
}

function crearVersion() {
  return (
    Date.now()
      .toString() +
    '-' +
    crypto
      .randomBytes(4)
      .toString('hex')
  )
}

function rutaTemporal(
  nombre,
  version
) {
  return path.join(
    LOGOS_DIR,
    `.${nombre}.${version}.tmp`
  )
}

async function escribirArchivoAtomico(
  nombre,
  buffer,
  version
) {
  const temporal =
    rutaTemporal(
      nombre,
      version
    )

  const destino =
    path.join(
      LOGOS_DIR,
      nombre
    )

  await fs.writeFile(
    temporal,
    buffer
  )

  await fs.rename(
    temporal,
    destino
  )
}

/* =========================================================
   HEALTH
   ========================================================= */

app.get(
  '/api/health',
  async (_req, res) => {
    try {
      await asegurarDirectorio()

      res.json({
        ok: true,
        service:
          'image-manager',
        directory:
          '/public/images/logos',
      })
    } catch (error) {
      console.error(
        error
      )

      res.status(500).json({
        ok: false,
        message:
          'No fue posible acceder a la carpeta pública de imágenes.',
      })
    }
  }
)

/* =========================================================
   PROCESAR LOGO
   ========================================================= */

app.post(
  '/api/images/logo',
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          ok: false,
          message:
            'No se recibió ninguna imagen.',
        })
      }

      await asegurarDirectorio()

      /*
       * La imagen ya llega recortada desde Vue.
       *
       * Aquí solamente:
       * - normalizamos
       * - generamos WebP
       * - generamos PNG
       * - generamos ICO
       * - generamos favicon
       */

      let imagen =
        sharp(
          req.file.buffer,
          {
            failOn:
              'none',
          }
        )

      /*
       * Auto-orientación EXIF.
       */
      imagen =
        imagen.rotate()

      const metadata =
        await imagen.metadata()

      if (
        !metadata.width ||
        !metadata.height
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'No fue posible identificar las dimensiones de la imagen.',
        })
      }

      /*
       * Tamaño máximo razonable.
       *
       * Esto evita generar archivos gigantes.
       */
      const anchoMaximo =
        2400

      if (
        metadata.width >
        anchoMaximo
      ) {
        imagen =
          imagen.resize({
            width:
              anchoMaximo,
            withoutEnlargement:
              true,
            fit:
              'inside',
          })
      }

      /*
       * Generar PNG principal.
       */
      const pngBuffer =
        await imagen
          .clone()
          .png({
            compressionLevel:
              9,
          })
          .toBuffer()

      /*
       * WebP.
       */
      const webpBuffer =
        await imagen
          .clone()
          .webp({
            quality:
              92,
            effort:
              6,
          })
          .toBuffer()

      /*
       * Favicon PNG.
       */
      const faviconPng =
        await imagen
          .clone()
          .resize({
            width:
              256,
            height:
              256,
            fit:
              'contain',
            background: {
              r: 255,
              g: 255,
              b: 255,
              alpha: 0,
            },
          })
          .png()
          .toBuffer()

      /*
       * ICO.
       */
      const icoBuffer =
        await pngToIco(
          faviconPng
        )

      const version =
        crearVersion()

      /*
       * Escribimos todos los archivos.
       *
       * Se reemplazan los anteriores.
       */
      await escribirArchivoAtomico(
        'logo.webp',
        webpBuffer,
        version
      )

      await escribirArchivoAtomico(
        'logo.png',
        pngBuffer,
        version
      )

      await escribirArchivoAtomico(
        'logo.ico',
        icoBuffer,
        version
      )

      await escribirArchivoAtomico(
        'favicon.ico',
        icoBuffer,
        version
      )

      /*
       * Limpiar temporales por seguridad.
       */
      const archivos =
        await fs.readdir(
          LOGOS_DIR
        )

      await Promise.all(
        archivos
          .filter(
            (archivo) =>
              archivo.startsWith(
                '.'
              ) &&
              archivo.endsWith(
                '.tmp'
              )
          )
          .map(
            (archivo) =>
              fs
                .unlink(
                  path.join(
                    LOGOS_DIR,
                    archivo
                  )
                )
                .catch(
                  () => {}
                )
          )
      )

      return res.json({
        ok: true,

        version,

        paths: {
          logoUrl:
            '/images/logos/logo.webp',

          logoPngUrl:
            '/images/logos/logo.png',

          logoIcoUrl:
            '/images/logos/logo.ico',

          faviconUrl:
            '/images/logos/favicon.ico',
        },
      })

    } catch (error) {
      console.error(
        'Error procesando logo:',
        error
      )

      return res.status(500).json({
        ok: false,

        message:
          error?.message ||
          'No fue posible procesar la imagen.',
      })
    }
  }
)

/* =========================================================
   MANEJO DE MULTER
   ========================================================= */

app.use(
  (
    error,
    _req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        'LIMIT_FILE_SIZE'
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'La imagen no puede superar los 15 MB.',
        })
      }

      return res.status(400).json({
        ok: false,
        message:
          error.message,
      })
    }

    if (error) {
      return res.status(500).json({
        ok: false,
        message:
          error.message ||
          'Error interno del gestor de imágenes.',
      })
    }

    next()
  }
)

/* =========================================================
   INICIO
   ========================================================= */

async function iniciar() {
  await asegurarDirectorio()

  app.listen(
    PORT,
    HOST,
    () => {
      console.log('')
      console.log(
        '=============================================='
      )
      console.log(
        '   IMAGE MANAGER'
      )
      console.log(
        '=============================================='
      )
      console.log(
        `Servidor: http://${HOST}:${PORT}`
      )
      console.log(
        `Carpeta: ${LOGOS_DIR}`
      )
      console.log(
        '=============================================='
      )
      console.log('')
    }
  )
}

iniciar().catch(
  (error) => {
    console.error(
      'No fue posible iniciar Image Manager:',
      error
    )

    process.exit(1)
  }
)