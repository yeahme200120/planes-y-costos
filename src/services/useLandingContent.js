import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

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

export function useLandingContent() {
  const header = ref(null)
  const hero = ref(null)
  const soluciones = ref(null)
  const caracteristicas = ref(null)
  const planesContenido = ref(null)
  const nosotros = ref(null)
  const faq = ref(null)
  const contacto = ref(null)
  const footer = ref(null)

  const configuracion = ref(null)

  const planes = ref([])
  const solucionesItems = ref([])
  const caracteristicasItems = ref([])
  const faqItems = ref([])

  const cargando = ref(true)
  const error = ref('')

  const cargasIniciales = new Set()
  const unsubscribers = []

  const referenciasSecciones = {
    header,
    hero,
    soluciones,
    caracteristicas,
    planes: planesContenido,
    nosotros,
    faq,
    contacto,
    footer,
  }

  const totalCargasIniciales =
    SECCIONES.length +
    COLECCIONES.length +
    1

  function registrarCarga(id) {
    if (cargasIniciales.has(id)) {
      return
    }

    cargasIniciales.add(id)

    if (
      cargasIniciales.size >=
      totalCargasIniciales
    ) {
      cargando.value = false
    }
  }

  function manejarErrorFirebase(errorFirebase) {
    console.error(
      'Error sincronizando Landing:',
      errorFirebase
    )

    error.value =
      'No fue posible cargar correctamente el contenido de la página.'

    cargando.value = false
  }

  function ordenarItems(items) {
    if (!Array.isArray(items)) {
      return []
    }

    return [...items].sort(
      (a, b) =>
        Number(a?.orden ?? 999) -
        Number(b?.orden ?? 999)
    )
  }

  function actualizarItemsEnSeccion(
    seccionRef,
    items
  ) {
    if (!seccionRef?.value) {
      return
    }

    seccionRef.value = {
      ...seccionRef.value,
      items: ordenarItems(items),
    }
  }

  function procesarColeccion(nombre, data) {
    const items = ordenarItems(data)

    switch (nombre) {
      case 'planes':
        planes.value = items
        break

      case 'soluciones':
        solucionesItems.value = items

        actualizarItemsEnSeccion(
          soluciones,
          items
        )
        break

      case 'caracteristicas':
        caracteristicasItems.value = items

        actualizarItemsEnSeccion(
          caracteristicas,
          items
        )
        break

      case 'faq':
        faqItems.value = items

        actualizarItemsEnSeccion(
          faq,
          items
        )
        break
    }
  }

  function suscribirSecciones({
    subscribeToSection,
  }) {
    SECCIONES.forEach((nombre) => {
      const seccionRef =
        referenciasSecciones[nombre]

      if (!seccionRef) {
        console.warn(
          `Sección no registrada: ${nombre}`
        )

        registrarCarga(
          `seccion:${nombre}`
        )

        return
      }

      const unsubscribe =
        subscribeToSection(
          nombre,
          (data) => {
            seccionRef.value = data

            /*
             * Las secciones que utilizan
             * colecciones dinámicas reciben
             * también sus elementos.
             */
            if (nombre === 'soluciones') {
              actualizarItemsEnSeccion(
                soluciones,
                solucionesItems.value
              )
            }

            if (
              nombre ===
              'caracteristicas'
            ) {
              actualizarItemsEnSeccion(
                caracteristicas,
                caracteristicasItems.value
              )
            }

            if (nombre === 'faq') {
              actualizarItemsEnSeccion(
                faq,
                faqItems.value
              )
            }

            registrarCarga(
              `seccion:${nombre}`
            )
          },
          manejarErrorFirebase,
        )

      if (
        typeof unsubscribe ===
        'function'
      ) {
        unsubscribers.push(
          unsubscribe
        )
      }
    })
  }

  function suscribirColecciones({
    subscribeToActiveCollection,
  }) {
    COLECCIONES.forEach((nombre) => {
      const unsubscribe =
        subscribeToActiveCollection(
          nombre,
          (data) => {
            procesarColeccion(
              nombre,
              data
            )

            registrarCarga(
              `coleccion:${nombre}`
            )
          },
          manejarErrorFirebase,
        )

      if (
        typeof unsubscribe ===
        'function'
      ) {
        unsubscribers.push(
          unsubscribe
        )
      }
    })
  }

  function suscribirConfiguracion({
    subscribeToConfiguration,
  }) {
    const unsubscribe =
      subscribeToConfiguration(
        'general',
        (data) => {
          configuracion.value = data

          registrarCarga(
            'configuracion:general'
          )
        },
        manejarErrorFirebase,
      )

    if (
      typeof unsubscribe ===
      'function'
    ) {
      unsubscribers.push(
        unsubscribe
      )
    }
  }

  onMounted(async () => {
    try {
      const contentService =
        await import(
          '../services/contentService.js'
        )

      suscribirSecciones(
        contentService
      )

      suscribirColecciones(
        contentService
      )

      suscribirConfiguracion(
        contentService
      )
    } catch (errorFirebase) {
      manejarErrorFirebase(
        errorFirebase
      )
    }
  })

  onUnmounted(() => {
    unsubscribers.forEach(
      (unsubscribe) => {
        try {
          unsubscribe()
        } catch (errorUnsubscribe) {
          console.error(
            'Error cerrando suscripción de Landing:',
            errorUnsubscribe
          )
        }
      }
    )

    unsubscribers.length = 0
    cargasIniciales.clear()
  })

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