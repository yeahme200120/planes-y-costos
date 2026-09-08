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
  /*
   * =========================================================
   * CONTENIDO DE SECCIONES
   * =========================================================
   */

  const header = ref(null)
  const hero = ref(null)
  const soluciones = ref(null)
  const caracteristicas = ref(null)
  const planesContenido = ref(null)
  const nosotros = ref(null)
  const faq = ref(null)
  const contacto = ref(null)
  const footer = ref(null)

  /*
   * =========================================================
   * CONFIGURACIÓN GENERAL
   * =========================================================
   */

  const configuracion = ref(null)

  /*
   * =========================================================
   * PLANES
   * =========================================================
   */

  const planes = ref([])

  /*
   * =========================================================
   * ESTADO
   * =========================================================
   */

  const cargando = ref(true)
  const error = ref('')

  /*
   * =========================================================
   * SUSCRIPCIONES FIREBASE
   * =========================================================
   */

  const unsubscribers = []

  /*
   * =========================================================
   * CONTROL DE CARGA INICIAL
   *
   * 9 secciones:
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
   * + colección planes
   *
   * = 10 cargas iniciales
   *
   * configuracion/general NO bloquea la carga.
   * =========================================================
   */

  const cargasIniciales = ref(new Set())

  const totalCargasIniciales = 10

  function registrarCargaInicial(id) {
    if (!id) {
      return
    }

    /*
     * Si este listener ya informó su primera respuesta,
     * no volvemos a contarlo.
     */

    if (cargasIniciales.value.has(id)) {
      return
    }

    /*
     * Creamos un nuevo Set para mantener la reactividad
     * de Vue.
     */

    const nuevasCargas = new Set(
      cargasIniciales.value
    )

    nuevasCargas.add(id)

    cargasIniciales.value = nuevasCargas

    /*
     * Cuando las 10 fuentes principales respondieron
     * por primera vez, dejamos de mostrar el estado
     * de carga.
     */

    if (
      cargasIniciales.value.size >=
      totalCargasIniciales
    ) {
      cargando.value = false
    }
  }

  /*
   * =========================================================
   * ERROR FIREBASE
   * =========================================================
   */

  function manejarErrorFirebase(err) {
    console.error(
      'Error de sincronización con Firebase:',
      err
    )

    error.value =
      'No fue posible sincronizar el contenido con Firebase.'

    cargando.value = false
  }

  /*
   * =========================================================
   * SUSCRIBIR SECCIONES
   * =========================================================
   */

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
              /*
               * Actualizamos el contenido
               * cada vez que Firebase cambia.
               */

              contenidoRef.value = data

              /*
               * Solo la primera respuesta
               * cuenta como carga inicial.
               */

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

  /*
   * =========================================================
   * SUSCRIBIR PLANES
   * =========================================================
   */

  function suscribirPlanes() {
    const unsubscribe =
      subscribeToActiveCollection(
        'planes',
        (data) => {
          /*
           * Firebase puede devolver los
           * documentos en cualquier orden.
           *
           * Los ordenamos mediante el campo
           * "orden".
           */

          planes.value = [
            ...data,
          ].sort((a, b) => {
            return (
              Number(a.orden ?? 999) -
              Number(b.orden ?? 999)
            )
          })

          /*
           * La colección cuenta solamente
           * en su primera respuesta.
           */

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

  /*
   * =========================================================
   * SUSCRIBIR CONFIGURACIÓN
   * =========================================================
   */

  function suscribirConfiguracion() {
    const unsubscribe =
      subscribeToConfiguration(
        'general',
        (data) => {
          /*
           * La configuración es independiente
           * del contador de carga inicial.
           *
           * Cualquier cambio en Firebase actualiza
           * inmediatamente la interfaz.
           */

          configuracion.value = data
        },
        manejarErrorFirebase
      )

    unsubscribers.push(
      unsubscribe
    )
  }

  /*
   * =========================================================
   * INICIALIZACIÓN
   * =========================================================
   */

  onMounted(() => {
    suscribirSecciones()
    suscribirPlanes()
    suscribirConfiguracion()
  })

  /*
   * =========================================================
   * LIMPIEZA
   * =========================================================
   */

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

  /*
   * =========================================================
   * API DEL COMPOSABLE
   * =========================================================
   */

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