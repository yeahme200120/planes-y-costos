import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'

import {
  suscribirContactosNuevos,
} from '../services/contactosService.js'

export function useContactosNuevos() {
  const cantidad = ref(0)
  const cargando = ref(true)
  const error = ref(null)

  let unsubscribe = null

  onMounted(() => {
    unsubscribe =
      suscribirContactosNuevos(
        (total) => {
          cantidad.value = total
          cargando.value = false
          error.value = null
        },
        (err) => {
          console.error(
            'Error al obtener contactos nuevos:',
            err
          )

          error.value = err
          cargando.value = false
        }
      )
  })

  onUnmounted(() => {
    unsubscribe?.()
    unsubscribe = null
  })

  return {
    cantidad,
    cargando,
    error,
  }
}