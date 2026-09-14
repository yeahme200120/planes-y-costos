import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const SECCIONES = [
  'header',
  'hero',
  'soluciones',
  'caracteristicas',
  'planes',
  'nosotros',
  'faq',
  'contacto',
  'footer',
]

const COLECCIONES = [
  'planes',
  'soluciones',
  'caracteristicas',
  'faq',
]

const ORDEN_POR_DEFECTO = 999

/* =========================================================
   COMPOSABLE
   ========================================================= */

export function useLandingContent() {
  /* -------------------------------------------------------
     SECCIONES
     ------------------------------------------------------- */

  const header = ref(null)
  const hero = ref(null)
  const soluciones = ref(null)
  const caracteristicas = ref(null)
  const planesContenido = ref(null)
  const nosotros = ref(null)
  const faq = ref(null)
  const contacto = ref(null)
  const footer = ref(null)

  /* -------------------------------------------------------
     CONFIGURACIÓN
     ------------------------------------------------------- */

  const configuracion = ref(null)

  /* -------------------------------------------------------
     COLECCIONES
     ------------------------------------------------------- */

  const planes = ref([])
  const solucionesItems = ref([])
  const caracteristicasItems = ref([])
  const faqItems = ref([])

  /* -------------------------------------------------------
     ESTADO
     ------------------------------------------------------- */

  const cargando = ref(true)
  const error = ref('')

  /* -------------------------------------------------------
     CONTROL DE CARGAS
     ------------------------------------------------------- */

  const cargasIniciales =
    new Set()

  const unsubscribers =
    []

  let desmontado = false

  /* -------------------------------------------------------
     REFERENCIAS DE SECCIONES
     ------------------------------------------------------- */

  const referenciasSecciones = {
    header,
    hero,
    soluciones,
    caracteristicas,
    planes:
      planesContenido,
    nosotros,
    faq,
    contacto,
    footer,
  }

  /* -------------------------------------------------------
     TOTAL DE CARGAS INICIALES
     ------------------------------------------------------- */

  const totalCargasIniciales =
    SECCIONES.length +
    COLECCIONES.length +
    1

  /* =======================================================
     UTILIDADES
     ======================================================= */

  /**
   * Convierte un valor a número seguro.
   */
  function numeroSeguro(
    valor,
    valorDefecto =
      ORDEN_POR_DEFECTO,
  ) {
    const numero =
      Number(valor)

    return Number.isFinite(
      numero,
    )
      ? numero
      : valorDefecto
  }

  /**
   * Ordena cualquier colección
   * por el campo "orden".
   *
   * Nunca modifica el array original.
   */
  function ordenarItems(
    items,
  ) {
    if (
      !Array.isArray(items)
    ) {
      return []
    }

    return [...items].sort(
      (a, b) =>
        numeroSeguro(
          a?.orden,
        ) -
        numeroSeguro(
          b?.orden,
        ),
    )
  }

  /**
   * Registra que una fuente inicial
   * ya respondió.
   */
  function registrarCarga(
    id,
  ) {
    if (
      cargasIniciales.has(
        id,
      )
    ) {
      return
    }

    cargasIniciales.add(
      id,
    )

    if (
      cargasIniciales.size >=
      totalCargasIniciales
    ) {
      cargando.value =
        false
    }
  }

  /**
   * Si una suscripción falla no debemos
   * dejar indefinidamente la pantalla
   * en estado de carga.
   */
  function registrarCargaConError(
    id,
  ) {
    registrarCarga(id)
  }

  /* =======================================================
     ERRORES
     ======================================================= */

  function manejarErrorFirebase(
    errorFirebase,
  ) {
    console.error(
      'Error sincronizando Landing:',
      errorFirebase,
    )

    error.value =
      'No fue posible cargar correctamente el contenido de la página.'

    /*
     * Una suscripción que falla ya no debe
     * bloquear el estado de carga.
     *
     * No sabemos exactamente qué fuente
     * produjo el error, por lo que además
     * liberamos la pantalla de carga.
     */
    cargando.value =
      false
  }

  /* =======================================================
     SECCIONES + COLECCIONES
     ======================================================= */

  /**
   * Inserta los elementos dinámicos
   * dentro de una sección.
   */
  function actualizarItemsEnSeccion(
    seccionRef,
    items,
  ) {
    if (
      !seccionRef ||
      !seccionRef.value
    ) {
      return
    }

    seccionRef.value = {
      ...seccionRef.value,
      items:
        ordenarItems(
          items,
        ),
    }
  }

  /**
   * Obtiene la referencia de items
   * correspondiente a una colección.
   */
  function obtenerRefColeccion(
    nombre,
  ) {
    switch (nombre) {
      case 'planes':
        return planes

      case 'soluciones':
        return solucionesItems

      case 'caracteristicas':
        return caracteristicasItems

      case 'faq':
        return faqItems

      default:
        return null
    }
  }

  /**
   * Actualiza los elementos de una
   * colección y sincroniza su sección
   * correspondiente.
   */
  function procesarColeccion(
    nombre,
    data,
  ) {
    const items =
      ordenarItems(data)

    const coleccionRef =
      obtenerRefColeccion(
        nombre,
      )

    if (
      coleccionRef
    ) {
      coleccionRef.value =
        items
    }

    switch (nombre) {
      case 'soluciones':
        actualizarItemsEnSeccion(
          soluciones,
          items,
        )
        break

      case 'caracteristicas':
        actualizarItemsEnSeccion(
          caracteristicas,
          items,
        )
        break

      case 'faq':
        actualizarItemsEnSeccion(
          faq,
          items,
        )
        break

      case 'planes':
        actualizarItemsEnSeccion(
          planesContenido,
          items,
        )
        break
    }
  }

  /* =======================================================
     SUSCRIBIR SECCIONES
     ======================================================= */

  function suscribirSecciones(
    contentService,
  ) {
    const {
      subscribeToSection,
    } = contentService

    if (
      typeof subscribeToSection !==
      'function'
    ) {
      const errorServicio =
        new Error(
          'subscribeToSection no está disponible en contentService.',
        )

      console.error(
        errorServicio,
      )

      error.value =
        'El servicio de contenido de la Landing no está disponible.'

      cargando.value =
        false

      return
    }

    SECCIONES.forEach(
      (nombre) => {
        const seccionRef =
          referenciasSecciones[
            nombre
          ]

        if (
          !seccionRef
        ) {
          console.warn(
            `Sección no registrada: ${nombre}`,
          )

          registrarCargaConError(
            `seccion:${nombre}`,
          )

          return
        }

        try {
          const unsubscribe =
            subscribeToSection(
              nombre,

              (data) => {
                if (
                  desmontado
                ) {
                  return
                }

                seccionRef.value =
                  data

                /*
                 * Las secciones que tienen
                 * colecciones dinámicas deben
                 * combinar ambos streams.
                 */
                switch (
                  nombre
                ) {
                  case 'soluciones':
                    actualizarItemsEnSeccion(
                      soluciones,
                      solucionesItems.value,
                    )
                    break

                  case 'caracteristicas':
                    actualizarItemsEnSeccion(
                      caracteristicas,
                      caracteristicasItems.value,
                    )
                    break

                  case 'planes':
                    actualizarItemsEnSeccion(
                      planesContenido,
                      planes.value,
                    )
                    break

                  case 'faq':
                    actualizarItemsEnSeccion(
                      faq,
                      faqItems.value,
                    )
                    break
                }

                registrarCarga(
                  `seccion:${nombre}`,
                )
              },

              (errorFirebase) => {
                registrarCargaConError(
                  `seccion:${nombre}`,
                )

                manejarErrorFirebase(
                  errorFirebase,
                )
              },
            )

          if (
            typeof unsubscribe ===
            'function'
          ) {
            unsubscribers.push(
              unsubscribe,
            )
          }
        } catch (
          errorFirebase
        ) {
          registrarCargaConError(
            `seccion:${nombre}`,
          )

          manejarErrorFirebase(
            errorFirebase,
          )
        }
      },
    )
  }

  /* =======================================================
     SUSCRIBIR COLECCIONES
     ======================================================= */

  function suscribirColecciones(
    contentService,
  ) {
    const {
      subscribeToActiveCollection,
    } = contentService

    if (
      typeof subscribeToActiveCollection !==
      'function'
    ) {
      const errorServicio =
        new Error(
          'subscribeToActiveCollection no está disponible en contentService.',
        )

      console.error(
        errorServicio,
      )

      error.value =
        'El servicio de contenido de la Landing no está disponible.'

      cargando.value =
        false

      return
    }

    COLECCIONES.forEach(
      (nombre) => {
        try {
          const unsubscribe =
            subscribeToActiveCollection(
              nombre,

              (data) => {
                if (
                  desmontado
                ) {
                  return
                }

                procesarColeccion(
                  nombre,
                  data,
                )

                registrarCarga(
                  `coleccion:${nombre}`,
                )
              },

              (errorFirebase) => {
                registrarCargaConError(
                  `coleccion:${nombre}`,
                )

                manejarErrorFirebase(
                  errorFirebase,
                )
              },
            )

          if (
            typeof unsubscribe ===
            'function'
          ) {
            unsubscribers.push(
              unsubscribe,
            )
          }
        } catch (
          errorFirebase
        ) {
          registrarCargaConError(
            `coleccion:${nombre}`,
          )

          manejarErrorFirebase(
            errorFirebase,
          )
        }
      },
    )
  }

  /* =======================================================
     SUSCRIBIR CONFIGURACIÓN
     ======================================================= */

  function suscribirConfiguracion(
    contentService,
  ) {
    const {
      subscribeToConfiguration,
    } = contentService

    if (
      typeof subscribeToConfiguration !==
      'function'
    ) {
      const errorServicio =
        new Error(
          'subscribeToConfiguration no está disponible en contentService.',
        )

      console.error(
        errorServicio,
      )

      error.value =
        'El servicio de configuración de la Landing no está disponible.'

      cargando.value =
        false

      return
    }

    try {
      const unsubscribe =
        subscribeToConfiguration(
          'general',

          (data) => {
            if (
              desmontado
            ) {
              return
            }

            configuracion.value =
              data

            registrarCarga(
              'configuracion:general',
            )
          },

          (errorFirebase) => {
            registrarCargaConError(
              'configuracion:general',
            )

            manejarErrorFirebase(
              errorFirebase,
            )
          },
        )

      if (
        typeof unsubscribe ===
        'function'
      ) {
        unsubscribers.push(
          unsubscribe,
        )
      }
    } catch (
      errorFirebase
    ) {
      registrarCargaConError(
        'configuracion:general',
      )

      manejarErrorFirebase(
        errorFirebase,
      )
    }
  }

  /* =======================================================
     INICIALIZACIÓN
     ======================================================= */

  onMounted(
    async () => {
      try {
        const contentService =
          await import(
            '../services/contentService.js'
          )

        if (
          desmontado
        ) {
          return
        }

        suscribirSecciones(
          contentService,
        )

        suscribirColecciones(
          contentService,
        )

        suscribirConfiguracion(
          contentService,
        )
      } catch (
        errorFirebase
      ) {
        manejarErrorFirebase(
          errorFirebase,
        )
      }
    },
  )

  /* =======================================================
     LIMPIEZA
     ======================================================= */

  onUnmounted(
    () => {
      desmontado = true

      unsubscribers.forEach(
        (unsubscribe) => {
          try {
            unsubscribe()
          } catch (
            errorUnsubscribe
          ) {
            console.error(
              'Error cerrando suscripción de Landing:',
              errorUnsubscribe,
            )
          }
        },
      )

      unsubscribers.length = 0
      cargasIniciales.clear()
    },
  )

  /* =======================================================
     API DEL COMPOSABLE
     ======================================================= */

  return {
    header,
    hero,
    soluciones,
    caracteristicas,
    planesContenido,
    nosotros,
    faq,
    contacto,
    footer,

    planes,

    configuracion,

    cargando,
    error,
  }
}