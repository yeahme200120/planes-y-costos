import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

/*
 * =========================================================
 * PLUGIN LOCAL PARA SOBRESCRIBIR EL LOGO
 * =========================================================
 *
 * Recibe el Blob/JPG enviado desde ConfiguracionIdentidad.vue
 * y lo escribe directamente en:
 *
 * public/img/logo.jpg
 *
 * No utiliza:
 * - Firebase Storage
 * - backend externo
 * - showDirectoryPicker()
 * - selector de carpetas
 */
function logoWriterPlugin() {
  return {
    name: 'logo-writer',

    configureServer(server) {
      server.middlewares.use(
        '/__admin/logo',
        (req, res, next) => {
          if (req.method !== 'POST') {
            next()
            return
          }

          const chunks = []

          req.on(
            'data',
            (chunk) => {
              chunks.push(chunk)
            },
          )

          req.on(
            'end',
            () => {
              try {
                const buffer =
                  Buffer.concat(chunks)

                if (
                  !buffer ||
                  buffer.length === 0
                ) {
                  throw new Error(
                    'No se recibió ninguna imagen.',
                  )
                }

                const publicDir =
                  path.resolve(
                    process.cwd(),
                    'public',
                  )

                const imgDir =
                  path.join(
                    publicDir,
                    'img',
                  )

                const logoPath =
                  path.join(
                    imgDir,
                    'logo.jpg',
                  )

                /*
                 * Crea public/img si no existe.
                 */
                fs.mkdirSync(
                  imgDir,
                  {
                    recursive: true,
                  },
                )

                /*
                 * SOBRESCRIBE el archivo existente.
                 */
                fs.writeFileSync(
                  logoPath,
                  buffer,
                )

                console.log(
                  '[logo-writer] Logo guardado:',
                  logoPath,
                )

                res.statusCode = 200

                res.setHeader(
                  'Content-Type',
                  'application/json',
                )

                res.end(
                  JSON.stringify({
                    ok: true,
                    path: 'img/logo.jpg',
                    url: '/img/logo.jpg',
                  }),
                )
              } catch (error) {
                console.error(
                  '[logo-writer] Error:',
                  error,
                )

                res.statusCode = 500

                res.setHeader(
                  'Content-Type',
                  'application/json',
                )

                res.end(
                  JSON.stringify({
                    ok: false,
                    error:
                      error instanceof Error
                        ? error.message
                        : 'No fue posible guardar el logo.',
                  }),
                )
              }
            },
          )

          req.on(
            'error',
            (error) => {
              console.error(
                '[logo-writer] Error de request:',
                error,
              )

              if (!res.headersSent) {
                res.statusCode = 500

                res.setHeader(
                  'Content-Type',
                  'application/json',
                )

                res.end(
                  JSON.stringify({
                    ok: false,
                    error:
                      'Error al recibir la imagen.',
                  }),
                )
              }
            },
          )
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    logoWriterPlugin(),
  ],

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase-firestore',
              test:
                /node_modules[\/\\]+firebase[\/\\]+firestore[\/\\]/,
            },
            {
              name: 'firebase-auth',
              test:
                /node_modules[\/\\]+firebase[\/\\]+auth[\/\\]/,
            },
            {
              name: 'firebase-app',
              test:
                /node_modules[\/\\]+firebase[\/\\]+app[\/\\]/,
            },
          ],
        },
      },
    },
  },
})
