import { computed, onMounted, onUnmounted, ref } from 'vue'

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const SECCIONES = [
  'header',
  'hero',
  'soluciones',
  'caracteristicas',
  'beneficios',
  'planes',
  'nosotros',
  'faq',
  'contacto',
  'footer',
]

const COLECCIONES = ['planes', 'soluciones', 'caracteristicas', 'beneficios', 'faq']

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
  const beneficios = ref(null)
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
     LOGO BLOB URL
     -------------------------------------------------------
     URL temporal generada a partir de
     configuracion.logoBlob (Firestore Bytes).

     Se expone a través de configuracion.logoBlobUrl
     para que AppHeader y AppFooter la puedan usar
     sin conocer Firestore.
     ------------------------------------------------------- */

  const logoBlobUrl = ref('')

  function convertirLogoBytes(valor) {
    if (!valor) {
      return null
    }

    if (valor instanceof Uint8Array) {
      return valor
    }

    if (valor instanceof ArrayBuffer) {
      return new Uint8Array(valor)
    }

    if (typeof valor.toUint8Array === 'function') {
      try {
        return valor.toUint8Array()
      } catch {
        return null
      }
    }

    if (Array.isArray(valor)) {
      try {
        return new Uint8Array(valor)
      } catch {
        return null
      }
    }

    if (Array.isArray(valor._values)) {
      try {
        return new Uint8Array(valor._values)
      } catch {
        return null
      }
    }

    return null
  }

  function actualizarLogoBlobUrl(data) {
    if (logoBlobUrl.value) {
      try {
        URL.revokeObjectURL(logoBlobUrl.value)
      } catch {
        // noop
      }

      logoBlobUrl.value = ''
    }

    const bytes = convertirLogoBytes(data?.logoBlob)

    if (!bytes || bytes.byteLength <= 0) {
      return
    }

    const mime =
      typeof data?.logoMimeType === 'string' && data.logoMimeType.trim()
        ? data.logoMimeType.trim()
        : 'image/jpeg'

    try {
      logoBlobUrl.value = URL.createObjectURL(new Blob([bytes], { type: mime }))
    } catch (error) {
      console.error('No fue posible generar la vista previa del logo desde Firestore:', error)
    }
  }

  /*
   * configuracionConLogo:
   *
   * Combina la configuración de Firestore con
   * logoBlobUrl listo para usar en <img src>.
   */
  const configuracionConLogo = computed(() => {
    const base = configuracion.value || {}

    return {
      ...base,
      logoBlobUrl: logoBlobUrl.value,
    }
  })

  /* -------------------------------------------------------
     COLECCIONES
     ------------------------------------------------------- */

  const planes = ref([])
  const solucionesItems = ref([])
  const caracteristicasItems = ref([])
  const beneficiosItems = ref([])
  const faqItems = ref([])

  /* -------------------------------------------------------
     BUFFER DE ITEMS PENDIENTES
     -------------------------------------------------------
     Cuando la colección llega antes que el doc de sección,
     guardamos los items aquí. Cuando la sección llegue,
     inyectamos los items del buffer.
     ------------------------------------------------------- */

  const itemsPendientes = {
    soluciones: [],
    caracteristicas: [],
    beneficios: [],
    faq: [],
    planes: [],
  }

  /* -------------------------------------------------------
     ESTADO
     ------------------------------------------------------- */

  const cargando = ref(true)
  const error = ref('')
  const errorPlanes = ref('')

  /* -------------------------------------------------------
     CONTROL DE CARGAS
     ------------------------------------------------------- */

  const cargasIniciales = new Set()

  const unsubscribers = []

  let desmontado = false

  /* -------------------------------------------------------
     REFERENCIAS DE SECCIONES
     ------------------------------------------------------- */

  const referenciasSecciones = {
    header,
    hero,
    soluciones,
    caracteristicas,
    beneficios,
    planes: planesContenido,
    nosotros,
    faq,
    contacto,
    footer,
  }

  /* -------------------------------------------------------
     TOTAL DE CARGAS INICIALES
     ------------------------------------------------------- */

  const totalCargasIniciales = SECCIONES.length + 1

  /* =======================================================
     UTILIDADES
     ======================================================= */

  function numeroSeguro(valor, valorDefecto = ORDEN_POR_DEFECTO) {
    const numero = Number(valor)

    return Number.isFinite(numero) ? numero : valorDefecto
  }

  function ordenarItems(items) {
    if (!Array.isArray(items)) {
      return []
    }

    return [...items].sort((a, b) => numeroSeguro(a?.orden) - numeroSeguro(b?.orden))
  }

  function registrarCarga(id) {
    if (cargasIniciales.has(id)) {
      return
    }

    cargasIniciales.add(id)

    if (cargasIniciales.size >= totalCargasIniciales) {
      cargando.value = false
    }
  }

  function registrarCargaConError(id) {
    registrarCarga(id)
  }

  /* =======================================================
     ERRORES
     ======================================================= */

  function manejarErrorFirebase(errorFirebase) {
    console.error('Error sincronizando Landing:', errorFirebase)

    error.value = 'No fue posible cargar correctamente el contenido de la página.'

    cargando.value = false
  }

  /* =======================================================
     SECCIONES + COLECCIONES
     ======================================================= */

  /*
   * Inyecta items en una sección.
   *
   * IMPORTANTE:
   * Si la sección aún no llegó (seccionRef.value es null),
   * guardamos los items en `itemsPendientes` para que se
   * inyecten cuando el doc de la sección llegue.
   *
   * Esto resuelve la race condition entre:
   *   - snapshot del doc secciones/<nombre>
   *   - snapshot de la colección <nombre>
   */
  function actualizarItemsEnSeccion(seccionRef, items, nombreSeccion) {
    if (!seccionRef) {
      return
    }

    /*
     * Si la sección aún no llegó, guardamos los items
     * en el buffer para inyectarlos después.
     */
    if (!items || items.length === 0) {
      return
    }

    if (!seccionRef.value) {
      if (nombreSeccion) {
        itemsPendientes[nombreSeccion] = items
      }

      return
    }

    /*
     * Preservar TODOS los campos del doc de sección
     * (especialmente `medio`) y solo sobreescribir
     * `items` con los de la colección.
     */
    seccionRef.value = {
      ...seccionRef.value,
      items: ordenarItems(items),
    }
  }

  function obtenerRefColeccion(nombre) {
    switch (nombre) {
      case 'planes':
        return planes

      case 'soluciones':
        return solucionesItems

      case 'caracteristicas':
        return caracteristicasItems

      case 'beneficios':
        return beneficiosItems

      case 'faq':
        return faqItems

      default:
        return null
    }
  }

  function procesarColeccion(nombre, data) {
    const items = ordenarItems(data)

    const coleccionRef = obtenerRefColeccion(nombre)

    if (coleccionRef) {
      coleccionRef.value = items
    }

    switch (nombre) {
      case 'soluciones':
        actualizarItemsEnSeccion(soluciones, items, 'soluciones')
        break

      case 'caracteristicas':
        actualizarItemsEnSeccion(caracteristicas, items, 'caracteristicas')
        break

      case 'beneficios':
        actualizarItemsEnSeccion(beneficios, items, 'beneficios')
        break

      case 'faq':
        actualizarItemsEnSeccion(faq, items, 'faq')
        break

      case 'planes':
        actualizarItemsEnSeccion(planesContenido, items, 'planes')
        break
    }
  }

  /* =======================================================
     SUSCRIBIR SECCIONES
     ======================================================= */

  function suscribirSecciones(contentService) {
    const { subscribeToSection } = contentService

    if (typeof subscribeToSection !== 'function') {
      const errorServicio = new Error('subscribeToSection no está disponible en contentService.')

      console.error(errorServicio)

      error.value = 'El servicio de contenido de la Landing no está disponible.'

      cargando.value = false

      return
    }

    SECCIONES.forEach((nombre) => {
      const seccionRef = referenciasSecciones[nombre]

      if (!seccionRef) {
        console.warn(`Sección no registrada: ${nombre}`)

        registrarCargaConError(`seccion:${nombre}`)

        return
      }

      try {
        const unsubscribe = subscribeToSection(
          nombre,

          (data) => {
            if (desmontado) {
              return
            }

            seccionRef.value = data

            /*
             * Inyectar items pendientes si los hay.
             *
             * Esto resuelve el caso donde la colección
             * llegó ANTES que el doc de sección.
             */
            if (itemsPendientes[nombre] && itemsPendientes[nombre].length > 0) {
              seccionRef.value = {
                ...data,
                items: ordenarItems(itemsPendientes[nombre]),
              }

              itemsPendientes[nombre] = []
            }

            /*
             * Segunda red de seguridad: si la colección
             * ya llegó y tiene datos, inyectarlos.
             *
             * (En la práctica el buffer de arriba ya
             *  cubre este caso, pero se conserva por
             *  robustez.)
             */
            switch (nombre) {
              case 'soluciones':
                if (solucionesItems.value.length > 0) {
                  actualizarItemsEnSeccion(soluciones, solucionesItems.value, 'soluciones')
                }
                break

              case 'caracteristicas':
                if (caracteristicasItems.value.length > 0) {
                  actualizarItemsEnSeccion(
                    caracteristicas,
                    caracteristicasItems.value,
                    'caracteristicas',
                  )
                }
                break

              case 'beneficios':
                if (beneficiosItems.value.length > 0) {
                  actualizarItemsEnSeccion(beneficios, beneficiosItems.value, 'beneficios')
                }
                break

              case 'planes':
                if (planes.value.length > 0) {
                  actualizarItemsEnSeccion(planesContenido, planes.value, 'planes')
                }
                break

              case 'faq':
                if (faqItems.value.length > 0) {
                  actualizarItemsEnSeccion(faq, faqItems.value, 'faq')
                }
                break
            }

            registrarCarga(`seccion:${nombre}`)
          },

          (errorFirebase) => {
            registrarCargaConError(`seccion:${nombre}`)

            manejarErrorFirebase(errorFirebase)
          },
        )

        if (typeof unsubscribe === 'function') {
          unsubscribers.push(unsubscribe)
        }
      } catch (errorFirebase) {
        registrarCargaConError(`seccion:${nombre}`)

        manejarErrorFirebase(errorFirebase)
      }
    })
  }

  /* =======================================================
     SUSCRIBIR COLECCIONES
     ======================================================= */

  function suscribirColecciones(contentService) {
    const { subscribeToActiveCollection } = contentService

    if (typeof subscribeToActiveCollection !== 'function') {
      const errorServicio = new Error(
        'subscribeToActiveCollection no está disponible en contentService.',
      )

      console.error(errorServicio)

      error.value = 'El servicio de contenido de la Landing no está disponible.'

      cargando.value = false

      return
    }

    COLECCIONES.forEach((nombre) => {
      try {
        const unsubscribe = subscribeToActiveCollection(
          nombre,

          (data) => {
            if (desmontado) {
              return
            }

            procesarColeccion(nombre, data)

            registrarCarga(`coleccion:${nombre}`)
          },

          (errorFirebase) => {
            registrarCargaConError(`coleccion:${nombre}`)

            if (nombre === 'planes') {
              console.error('Error sincronizando planes:', errorFirebase)

              errorPlanes.value = 'No fue posible cargar los planes.'
            } else {
              manejarErrorFirebase(errorFirebase)
            }
          },
        )

        if (typeof unsubscribe === 'function') {
          unsubscribers.push(unsubscribe)
        }
      } catch (errorFirebase) {
        registrarCargaConError(`coleccion:${nombre}`)

        manejarErrorFirebase(errorFirebase)
      }
    })
  }

  /* =======================================================
     SUSCRIBIR CONFIGURACIÓN
     ======================================================= */

  function suscribirConfiguracion(contentService) {
    const { subscribeToConfiguration } = contentService

    if (typeof subscribeToConfiguration !== 'function') {
      const errorServicio = new Error(
        'subscribeToConfiguration no está disponible en contentService.',
      )

      console.error(errorServicio)

      error.value = 'El servicio de configuración de la Landing no está disponible.'

      cargando.value = false

      return
    }

    try {
      const unsubscribe = subscribeToConfiguration(
        'general',

        (data) => {
          if (desmontado) {
            return
          }

          configuracion.value = data

          /*
           * Genera la blob URL a partir de logoBlob.
           * El header y el footer la consumen a través
           * de configuracion.logoBlobUrl.
           */
          actualizarLogoBlobUrl(data)

          registrarCarga('configuracion:general')
        },

        (errorFirebase) => {
          registrarCargaConError('configuracion:general')

          manejarErrorFirebase(errorFirebase)
        },
      )

      if (typeof unsubscribe === 'function') {
        unsubscribers.push(unsubscribe)
      }
    } catch (errorFirebase) {
      registrarCargaConError('configuracion:general')

      manejarErrorFirebase(errorFirebase)
    }
  }

  /* =======================================================
     INICIALIZACIÓN
     ======================================================= */

  onMounted(async () => {
    try {
      const contentService = await import('../services/contentService.js')

      if (desmontado) {
        return
      }

      suscribirSecciones(contentService)
      suscribirColecciones(contentService)
      suscribirConfiguracion(contentService)
    } catch (errorFirebase) {
      manejarErrorFirebase(errorFirebase)
    }
  })

  /* =======================================================
     LIMPIEZA
     ======================================================= */

  onUnmounted(() => {
    desmontado = true

    unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe()
      } catch (errorUnsubscribe) {
        console.error('Error cerrando suscripción de Landing:', errorUnsubscribe)
      }
    })

    unsubscribers.length = 0
    cargasIniciales.clear()

    /*
     * Limpiar buffer de items pendientes.
     */
    Object.keys(itemsPendientes).forEach((k) => {
      itemsPendientes[k] = []
    })

    if (logoBlobUrl.value) {
      try {
        URL.revokeObjectURL(logoBlobUrl.value)
      } catch {
        // noop
      }

      logoBlobUrl.value = ''
    }
  })

  /* =======================================================
     API DEL COMPOSABLE
     ======================================================= */

  return {
    header,
    hero,
    soluciones,
    caracteristicas,
    beneficios,
    planesContenido,
    nosotros,
    faq,
    contacto,
    footer,

    planes,

    configuracion: configuracionConLogo,

    cargando,
    error,
    errorPlanes,
  }
}
