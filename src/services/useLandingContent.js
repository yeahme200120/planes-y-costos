import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import {
  subscribeToSection,
  subscribeToActiveCollection,
  subscribeToConfiguration,
} from './contentService'

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

  const unsubscribers = []

  /*
   * Cargas iniciales:
   *
   * 9 documentos de secciones:
   * header
   * hero
   * soluciones
   * caracteristicas
   * planes
   * nosotros
   * faq
   * contacto
   * footer
   *
   * 4 colecciones:
   * planes
   * soluciones
   * caracteristicas
   * faq
   *
   * 1 configuración:
   * configuracion/general
   *
   * TOTAL = 14
   */
  const cargasIniciales = ref(new Set())

  const totalCargasIniciales = 14

  function registrarCargaInicial(id) {
    if (!id) {
      return
    }

    if (cargasIniciales.value.has(id)) {
      return
    }

    const nuevasCargas = new Set(
      cargasIniciales.value
    )

    nuevasCargas.add(id)

    cargasIniciales.value =
      nuevasCargas

    if (
      cargasIniciales.value.size >=
      totalCargasIniciales
    ) {
      cargando.value = false
    }
  }

  function manejarErrorFirebase(err) {
    console.error(
      'Error de sincronización con Firebase:',
      err
    )

    error.value =
      'No fue posible sincronizar el contenido con Firebase.'

    cargando.value = false
  }

  function actualizarSeccionConItems(
    seccionRef,
    itemsRef
  ) {
    if (!seccionRef.value) {
      return
    }

    seccionRef.value = {
      ...seccionRef.value,
      items: Array.isArray(
        itemsRef.value
      )
        ? [...itemsRef.value]
        : [],
    }
  }

  function suscribirSecciones() {
    const secciones = [
      {
        id: 'header',
        ref: header,
      },
      {
        id: 'hero',
        ref: hero,
      },
      {
        id: 'soluciones',
        ref: soluciones,
      },
      {
        id: 'caracteristicas',
        ref: caracteristicas,
      },
      {
        id: 'planes',
        ref: planesContenido,
      },
      {
        id: 'nosotros',
        ref: nosotros,
      },
      {
        id: 'faq',
        ref: faq,
      },
      {
        id: 'contacto',
        ref: contacto,
      },
      {
        id: 'footer',
        ref: footer,
      },
    ]

    secciones.forEach(
      ({
        id,
        ref: contenidoRef,
      }) => {
        const unsubscribe =
          subscribeToSection(
            id,
            (data) => {
              contenidoRef.value =
                data

              if (
                id ===
                'soluciones'
              ) {
                actualizarSeccionConItems(
                  soluciones,
                  solucionesItems
                )
              }

              if (
                id ===
                'caracteristicas'
              ) {
                actualizarSeccionConItems(
                  caracteristicas,
                  caracteristicasItems
                )
              }

              if (
                id === 'faq'
              ) {
                actualizarSeccionConItems(
                  faq,
                  faqItems
                )
              }

              registrarCargaInicial(
                `seccion:${id}`
              )
            },
            manejarErrorFirebase
          )

        unsubscribers.push(
          unsubscribe
        )
      }
    )
  }

  function suscribirPlanes() {
    const unsubscribe =
      subscribeToActiveCollection(
        'planes',
        (data) => {
          planes.value =
            Array.isArray(data)
              ? [...data].sort(
                  (a, b) => {
                    return (
                      Number(
                        a?.orden ??
                          999
                      ) -
                      Number(
                        b?.orden ??
                          999
                      )
                    )
                  }
                )
              : []

          registrarCargaInicial(
            'coleccion:planes'
          )
        },
        manejarErrorFirebase
      )

    unsubscribers.push(
      unsubscribe
    )
  }

  function suscribirSoluciones() {
    const unsubscribe =
      subscribeToActiveCollection(
        'soluciones',
        (data) => {
          solucionesItems.value =
            Array.isArray(data)
              ? [...data].sort(
                  (a, b) => {
                    return (
                      Number(
                        a?.orden ??
                          999
                      ) -
                      Number(
                        b?.orden ??
                          999
                      )
                    )
                  }
                )
              : []

          actualizarSeccionConItems(
            soluciones,
            solucionesItems
          )

          registrarCargaInicial(
            'coleccion:soluciones'
          )
        },
        manejarErrorFirebase
      )

    unsubscribers.push(
      unsubscribe
    )
  }

  function suscribirCaracteristicas() {
    const unsubscribe =
      subscribeToActiveCollection(
        'caracteristicas',
        (data) => {
          caracteristicasItems.value =
            Array.isArray(data)
              ? [...data].sort(
                  (a, b) => {
                    return (
                      Number(
                        a?.orden ??
                          999
                      ) -
                      Number(
                        b?.orden ??
                          999
                      )
                    )
                  }
                )
              : []

          actualizarSeccionConItems(
            caracteristicas,
            caracteristicasItems
          )

          registrarCargaInicial(
            'coleccion:caracteristicas'
          )
        },
        manejarErrorFirebase
      )

    unsubscribers.push(
      unsubscribe
    )
  }

  function suscribirFaq() {
    const unsubscribe =
      subscribeToActiveCollection(
        'faq',
        (data) => {
          faqItems.value =
            Array.isArray(data)
              ? [...data].sort(
                  (a, b) => {
                    return (
                      Number(
                        a?.orden ??
                          999
                      ) -
                      Number(
                        b?.orden ??
                          999
                      )
                    )
                  }
                )
              : []

          actualizarSeccionConItems(
            faq,
            faqItems
          )

          registrarCargaInicial(
            'coleccion:faq'
          )
        },
        manejarErrorFirebase
      )

    unsubscribers.push(
      unsubscribe
    )
  }

  function suscribirConfiguracion() {
    const unsubscribe =
      subscribeToConfiguration(
        'general',
        (data) => {
          configuracion.value =
            data

          registrarCargaInicial(
            'configuracion:general'
          )
        },
        manejarErrorFirebase
      )

    unsubscribers.push(
      unsubscribe
    )
  }

  onMounted(() => {
    suscribirSecciones()
    suscribirPlanes()
    suscribirSoluciones()
    suscribirCaracteristicas()
    suscribirFaq()
    suscribirConfiguracion()
  })

  onUnmounted(() => {
    unsubscribers.forEach(
      (unsubscribe) => {
        if (
          typeof unsubscribe ===
          'function'
        ) {
          unsubscribe()
        }
      }
    )

    unsubscribers.length = 0
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