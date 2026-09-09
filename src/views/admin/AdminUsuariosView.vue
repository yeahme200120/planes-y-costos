<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import {
  actualizarUsuarioAdmin,
  cambiarEstadoUsuarioAdmin,
  eliminarUsuarioAdmin,
  suscribirUsuariosAdmin,
} from '../../services/adminService.js'

import { getAuth } from 'firebase/auth'

const auth = getAuth()

/*
 * ============================================================
 * ESTADO
 * ============================================================
 */

const usuarios = ref([])

const cargando = ref(true)
const guardando = ref(false)

const error = ref(null)
const mensaje = ref(null)

const busqueda = ref('')

const usuarioEditando = ref(null)

let unsubscribeUsuarios = null
let timeoutMensaje = null

const formulario = ref({
  nombre: '',
  email: '',
  rol: '',
  activo: true,
  isUser: '',
})

/*
 * ============================================================
 * USUARIO ACTUAL
 * ============================================================
 */

const usuarioActualUid = computed(
  () => auth.currentUser?.uid || null
)

function esUsuarioActual(usuario) {
  if (!usuario || !usuarioActualUid.value) {
    return false
  }

  return (
    String(usuario.isUser || '') ===
    String(usuarioActualUid.value)
  )
}

/*
 * ============================================================
 * FILTRADO
 * ============================================================
 */

const usuariosFiltrados = computed(() => {
  const termino = busqueda.value
    .trim()
    .toLowerCase()

  if (!termino) {
    return usuarios.value
  }

  return usuarios.value.filter((usuario) => {
    const campos = [
      usuario.nombre,
      usuario.email,
      usuario.rol,
      usuario.isUser,
      usuario.id,
    ]

    return campos.some((campo) =>
      String(campo || '')
        .toLowerCase()
        .includes(termino)
    )
  })
})

/*
 * ============================================================
 * ESTADÍSTICAS
 * ============================================================
 */

const totalUsuarios = computed(
  () => usuarios.value.length
)

const usuariosActivos = computed(
  () =>
    usuarios.value.filter(
      (usuario) =>
        usuario.activo !== false
    ).length
)

const usuariosInactivos = computed(
  () =>
    usuarios.value.filter(
      (usuario) =>
        usuario.activo === false
    ).length
)

/*
 * ============================================================
 * MENSAJES
 * ============================================================
 */

function mostrarMensaje(
  texto,
  tipo = 'success'
) {
  mensaje.value = {
    texto,
    tipo,
  }

  if (timeoutMensaje) {
    clearTimeout(timeoutMensaje)
  }

  timeoutMensaje = setTimeout(() => {
    mensaje.value = null
    timeoutMensaje = null
  }, 4000)
}

/*
 * ============================================================
 * FORMULARIO
 * ============================================================
 */

function limpiarFormulario() {
  formulario.value = {
    nombre: '',
    email: '',
    rol: '',
    activo: true,
    isUser: '',
  }

  usuarioEditando.value = null
}

function abrirEditor(usuario) {
  if (!usuario) {
    return
  }

  error.value = null
  mensaje.value = null

  usuarioEditando.value = usuario

  formulario.value = {
    nombre: String(
      usuario.nombre || ''
    ),
    email: String(
      usuario.email || ''
    ),
    rol: String(
      usuario.rol || ''
    ),
    activo:
      usuario.activo !== false,
    isUser: String(
      usuario.isUser || ''
    ),
  }
}

function cerrarEditor() {
  if (guardando.value) {
    return
  }

  limpiarFormulario()
}

/*
 * ============================================================
 * NOMBRE / INICIALES
 * ============================================================
 */

function nombreUsuario(usuario) {
  const nombre = String(
    usuario?.nombre || ''
  ).trim()

  if (nombre) {
    return nombre
  }

  const email = String(
    usuario?.email || ''
  ).trim()

  if (email) {
    return email
  }

  return 'Usuario'
}

function inicialesUsuario(usuario) {
  const nombre =
    nombreUsuario(usuario)

  const partes = nombre
    .split(/\s+/)
    .filter(Boolean)

  if (!partes.length) {
    return 'U'
  }

  if (partes.length === 1) {
    return partes[0]
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    partes[0].charAt(0) +
    partes[1].charAt(0)
  ).toUpperCase()
}

/*
 * ============================================================
 * FECHAS
 * ============================================================
 */

function formatearFecha(valor) {
  if (!valor) {
    return 'Sin fecha'
  }

  try {
    let fecha = null

    if (
      typeof valor?.toDate ===
      'function'
    ) {
      fecha = valor.toDate()
    } else if (
      valor instanceof Date
    ) {
      fecha = valor
    } else if (
      typeof valor === 'string' ||
      typeof valor === 'number'
    ) {
      fecha = new Date(valor)
    } else if (
      typeof valor?.seconds ===
      'number'
    ) {
      fecha = new Date(
        valor.seconds * 1000
      )
    }

    if (
      !fecha ||
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return 'Sin fecha'
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    ).format(fecha)
  } catch {
    return 'Sin fecha'
  }
}

/*
 * ============================================================
 * GUARDAR USUARIO
 * ============================================================
 */

async function guardarUsuario() {
  if (!usuarioEditando.value) {
    return
  }

  const nombre =
    formulario.value.nombre
      .trim()

  const rol =
    formulario.value.rol
      .trim()

  if (!nombre) {
    error.value =
      'El nombre del usuario es obligatorio.'
    return
  }

  if (!rol) {
    error.value =
      'El rol del usuario es obligatorio.'
    return
  }

  if (
    esUsuarioActual(
      usuarioEditando.value
    ) &&
    formulario.value.activo === false
  ) {
    error.value =
      'No puedes desactivar tu propio usuario.'
    return
  }

  guardando.value = true
  error.value = null

  try {
    await actualizarUsuarioAdmin(
      usuarioEditando.value.id,
      {
        nombre,
        rol,
        activo:
          Boolean(
            formulario.value.activo
          ),
      }
    )

    limpiarFormulario()

    mostrarMensaje(
      'Usuario actualizado correctamente.'
    )
  } catch (e) {
    console.error(
      'Error actualizando usuario:',
      e
    )

    error.value =
      'No fue posible actualizar el usuario.'
  } finally {
    guardando.value = false
  }
}

/*
 * ============================================================
 * CAMBIAR ESTADO
 * ============================================================
 */

async function cambiarEstado(usuario) {
  if (!usuario) {
    return
  }

  if (esUsuarioActual(usuario)) {
    mostrarMensaje(
      'No puedes cambiar el estado de tu propio usuario.',
      'warning'
    )

    return
  }

  const nuevoEstado =
    usuario.activo === false

  const accion = nuevoEstado
    ? 'activar'
    : 'desactivar'

  const confirmado =
    window.confirm(
      `¿Deseas ${accion} a "${nombreUsuario(usuario)}"?`
    )

  if (!confirmado) {
    return
  }

  guardando.value = true
  error.value = null

  try {
    await cambiarEstadoUsuarioAdmin(
      usuario.id,
      nuevoEstado
    )

    mostrarMensaje(
      nuevoEstado
        ? 'Usuario activado correctamente.'
        : 'Usuario desactivado correctamente.'
    )
  } catch (e) {
    console.error(
      'Error cambiando estado del usuario:',
      e
    )

    error.value =
      'No fue posible cambiar el estado del usuario.'
  } finally {
    guardando.value = false
  }
}

/*
 * ============================================================
 * ELIMINAR
 * ============================================================
 */

async function eliminarUsuarioRegistro(
  usuario
) {
  if (!usuario) {
    return
  }

  if (esUsuarioActual(usuario)) {
    mostrarMensaje(
      'No puedes eliminar tu propio usuario.',
      'warning'
    )

    return
  }

  const confirmado =
    window.confirm(
      `¿Deseas eliminar a "${nombreUsuario(usuario)}"?\n\nSe eliminará el registro de la colección usuarios.`
    )

  if (!confirmado) {
    return
  }

  guardando.value = true
  error.value = null

  try {
    await eliminarUsuarioAdmin(
      usuario.id
    )

    if (
      usuarioEditando.value?.id ===
      usuario.id
    ) {
      limpiarFormulario()
    }

    mostrarMensaje(
      'Usuario eliminado correctamente.'
    )
  } catch (e) {
    console.error(
      'Error eliminando usuario:',
      e
    )

    error.value =
      'No fue posible eliminar el usuario.'
  } finally {
    guardando.value = false
  }
}

/*
 * ============================================================
 * FIRESTORE REALTIME
 * ============================================================
 */

function suscribirseUsuarios() {
  cargando.value = true
  error.value = null

  if (unsubscribeUsuarios) {
    unsubscribeUsuarios()
    unsubscribeUsuarios = null
  }

  unsubscribeUsuarios =
    suscribirUsuariosAdmin(
      (lista) => {
        usuarios.value = [
          ...lista,
        ].sort((a, b) => {
          const nombreA =
            nombreUsuario(a)
              .toLowerCase()

          const nombreB =
            nombreUsuario(b)
              .toLowerCase()

          return nombreA.localeCompare(
            nombreB,
            'es-MX'
          )
        })

        /*
         * Si el usuario editado fue
         * actualizado/eliminado por otro
         * proceso, mantenemos el editor
         * coherente.
         */
        if (usuarioEditando.value) {
          const actualizado =
            usuarios.value.find(
              (usuario) =>
                usuario.id ===
                usuarioEditando.value.id
            )

          if (!actualizado) {
            limpiarFormulario()
          }
        }

        cargando.value = false
      },
      (e) => {
        console.error(
          'Error suscribiéndose a usuarios:',
          e
        )

        error.value =
          'No fue posible cargar los usuarios.'

        cargando.value = false
      }
    )
}

/*
 * ============================================================
 * CICLO DE VIDA
 * ============================================================
 */

onMounted(() => {
  suscribirseUsuarios()
})

onBeforeUnmount(() => {
  if (unsubscribeUsuarios) {
    unsubscribeUsuarios()
    unsubscribeUsuarios = null
  }

  if (timeoutMensaje) {
    clearTimeout(timeoutMensaje)
    timeoutMensaje = null
  }
})
</script>

<template>
  <section class="admin-usuarios">

    <!-- =====================================================
         HEADER
    ====================================================== -->

    <header class="admin-usuarios__header">

      <div class="admin-usuarios__heading">

        <div class="admin-usuarios__eyebrow">
          Administración
        </div>

        <h1 class="admin-usuarios__title">
          Usuarios
        </h1>

        <p class="admin-usuarios__description">
          Administra los usuarios registrados
          en el sistema.
        </p>

      </div>

      <div class="admin-usuarios__stats">

        <article class="admin-usuarios__stat">
          <span class="admin-usuarios__stat-label">
            Total
          </span>

          <strong class="admin-usuarios__stat-value">
            {{ totalUsuarios }}
          </strong>
        </article>

        <article class="admin-usuarios__stat">
          <span class="admin-usuarios__stat-label">
            Activos
          </span>

          <strong class="admin-usuarios__stat-value">
            {{ usuariosActivos }}
          </strong>
        </article>

        <article class="admin-usuarios__stat">
          <span class="admin-usuarios__stat-label">
            Inactivos
          </span>

          <strong class="admin-usuarios__stat-value">
            {{ usuariosInactivos }}
          </strong>
        </article>

      </div>

    </header>

    <!-- =====================================================
         MENSAJE
    ====================================================== -->

    <div
      v-if="mensaje"
      class="admin-usuarios__alert"
      :class="{
        'admin-usuarios__alert--warning':
          mensaje.tipo === 'warning',

        'admin-usuarios__alert--error':
          mensaje.tipo === 'error',
      }"
      role="status"
      aria-live="polite"
    >
      {{ mensaje.texto }}
    </div>

    <div
      v-if="error"
      class="admin-usuarios__alert admin-usuarios__alert--error"
      role="alert"
    >
      <span>
        {{ error }}
      </span>

      <button
        type="button"
        aria-label="Cerrar mensaje"
        @click="error = null"
      >
        ×
      </button>
    </div>

    <!-- =====================================================
         TOOLBAR
    ====================================================== -->

    <div class="admin-usuarios__toolbar">

      <label class="admin-usuarios__search">

        <span
          class="admin-usuarios__search-icon"
          aria-hidden="true"
        >
          🔎
        </span>

        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por nombre, correo, rol o UID..."
          autocomplete="off"
          aria-label="Buscar usuarios"
        />

        <button
          v-if="busqueda"
          type="button"
          class="admin-usuarios__search-clear"
          aria-label="Limpiar búsqueda"
          @click="busqueda = ''"
        >
          ×
        </button>

      </label>

      <div class="admin-usuarios__realtime">

        <span
          class="admin-usuarios__realtime-dot"
          aria-hidden="true"
        ></span>

        <span>
          Actualización en tiempo real
        </span>

      </div>

    </div>

    <!-- =====================================================
         CONTENIDO
    ====================================================== -->

    <div class="admin-usuarios__content">

      <!-- LOADING -->

      <div
        v-if="cargando"
        class="admin-usuarios__loading"
      >
        <div
          class="admin-usuarios__spinner"
          aria-hidden="true"
        ></div>

        <p>
          Cargando usuarios...
        </p>
      </div>

      <!-- =================================================
           DESKTOP / TABLET
      ================================================== -->

      <div
        v-else-if="usuariosFiltrados.length"
        class="admin-usuarios__table-wrapper"
      >

        <table class="admin-usuarios__table">

          <thead>
            <tr>

              <th>
                Usuario
              </th>

              <th>
                Rol
              </th>

              <th>
                Estado
              </th>

              <th>
                Identificador
              </th>

              <th>
                Acciones
              </th>

            </tr>
          </thead>

          <tbody>

            <tr
              v-for="usuario in usuariosFiltrados"
              :key="usuario.id"
            >

              <!-- USUARIO -->

              <td>

                <div class="admin-usuarios__user">

                  <div class="admin-usuarios__avatar">
                    {{ inicialesUsuario(usuario) }}
                  </div>

                  <div class="admin-usuarios__user-info">

                    <strong>
                      {{ nombreUsuario(usuario) }}
                    </strong>

                    <span>
                      {{ usuario.email || 'Sin correo' }}
                    </span>

                    <small>
                      ID:
                      {{ usuario.id }}
                    </small>

                  </div>

                </div>

              </td>

              <!-- ROL -->

              <td>

                <span class="admin-usuarios__role">
                  {{ usuario.rol || 'Sin rol' }}
                </span>

              </td>

              <!-- ESTADO -->

              <td>

                <span
                  class="admin-usuarios__status"
                  :class="{
                    'admin-usuarios__status--inactive':
                      usuario.activo === false,
                  }"
                >

                  <span
                    class="admin-usuarios__status-dot"
                    aria-hidden="true"
                  ></span>

                  {{
                    usuario.activo === false
                      ? 'Inactivo'
                      : 'Activo'
                  }}

                </span>

              </td>

              <!-- IDENTIFICADOR -->

              <td>

                <span
                  class="admin-usuarios__date"
                  :title="usuario.isUser || ''"
                >
                  {{ usuario.isUser || 'Sin identificador' }}
                </span>

              </td>

              <!-- ACCIONES -->

              <td>

                <div class="admin-usuarios__actions">

                  <button
                    type="button"
                    class="admin-usuarios__button"
                    :disabled="guardando"
                    @click="abrirEditor(usuario)"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    class="admin-usuarios__button"
                    :disabled="
                      guardando ||
                      esUsuarioActual(usuario)
                    "
                    :title="
                      esUsuarioActual(usuario)
                        ? 'No puedes cambiar tu propio estado'
                        : ''
                    "
                    @click="cambiarEstado(usuario)"
                  >
                    {{
                      usuario.activo === false
                        ? 'Activar'
                        : 'Desactivar'
                    }}
                  </button>

                  <button
                    type="button"
                    class="admin-usuarios__button admin-usuarios__button--danger"
                    :disabled="
                      guardando ||
                      esUsuarioActual(usuario)
                    "
                    :title="
                      esUsuarioActual(usuario)
                        ? 'No puedes eliminar tu propio usuario'
                        : ''
                    "
                    @click="
                      eliminarUsuarioRegistro(usuario)
                    "
                  >
                    Eliminar
                  </button>

                </div>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

      <!-- =================================================
           MOBILE
           Las mismas clases permiten que CSS convierta
           cada registro en una tarjeta.
      ================================================== -->

      <div
        v-if="
          !cargando &&
          usuariosFiltrados.length
        "
        class="admin-usuarios__mobile-list"
      >

        <article
          v-for="usuario in usuariosFiltrados"
          :key="`mobile-${usuario.id}`"
          class="admin-usuarios__mobile-card"
        >

          <div class="admin-usuarios__mobile-header">

            <div class="admin-usuarios__user">

              <div class="admin-usuarios__avatar">
                {{ inicialesUsuario(usuario) }}
              </div>

              <div class="admin-usuarios__user-info">

                <strong>
                  {{ nombreUsuario(usuario) }}
                </strong>

                <span>
                  {{ usuario.email || 'Sin correo' }}
                </span>

              </div>

            </div>

            <span
              class="admin-usuarios__status"
              :class="{
                'admin-usuarios__status--inactive':
                  usuario.activo === false,
              }"
            >

              <span
                class="admin-usuarios__status-dot"
                aria-hidden="true"
              ></span>

              {{
                usuario.activo === false
                  ? 'Inactivo'
                  : 'Activo'
              }}

            </span>

          </div>

          <div class="admin-usuarios__mobile-details">

            <div class="admin-usuarios__mobile-detail">

              <span>
                Rol
              </span>

              <strong>
                {{ usuario.rol || 'Sin rol' }}
              </strong>

            </div>

            <div class="admin-usuarios__mobile-detail">

              <span>
                UID
              </span>

              <strong
                :title="usuario.isUser || ''"
              >
                {{ usuario.isUser || 'Sin identificador' }}
              </strong>

            </div>

            <div class="admin-usuarios__mobile-detail">

              <span>
                Documento
              </span>

              <strong
                :title="usuario.id"
              >
                {{ usuario.id }}
              </strong>

            </div>

          </div>

          <div class="admin-usuarios__mobile-actions">

            <button
              type="button"
              class="admin-usuarios__button"
              :disabled="guardando"
              @click="abrirEditor(usuario)"
            >
              Editar
            </button>

            <button
              type="button"
              class="admin-usuarios__button"
              :disabled="
                guardando ||
                esUsuarioActual(usuario)
              "
              @click="cambiarEstado(usuario)"
            >
              {{
                usuario.activo === false
                  ? 'Activar'
                  : 'Desactivar'
              }}
            </button>

            <button
              type="button"
              class="admin-usuarios__button admin-usuarios__button--danger"
              :disabled="
                guardando ||
                esUsuarioActual(usuario)
              "
              @click="
                eliminarUsuarioRegistro(usuario)
              "
            >
              Eliminar
            </button>

          </div>

        </article>

      </div>

      <!-- =================================================
           EMPTY
      ================================================== -->

      <div
        v-if="
          !cargando &&
          !usuariosFiltrados.length
        "
        class="admin-usuarios__empty"
      >

        <div
          class="admin-usuarios__empty-icon"
          aria-hidden="true"
        >
          👥
        </div>

        <h2>
          {{
            busqueda
              ? 'No se encontraron usuarios'
              : 'No hay usuarios'
          }}
        </h2>

        <p>
          {{
            busqueda
              ? 'Prueba con otro nombre, correo, rol o identificador.'
              : 'La colección usuarios no contiene registros.'
          }}
        </p>

        <button
          v-if="busqueda"
          type="button"
          class="admin-usuarios__button admin-usuarios__button--primary"
          @click="busqueda = ''"
        >
          Limpiar búsqueda
        </button>

      </div>

    </div>

    <!-- =====================================================
         EDITOR
    ====================================================== -->

    <aside
      v-if="usuarioEditando"
      class="admin-usuarios__editor"
      aria-label="Editar usuario"
    >

      <div class="admin-usuarios__editor-header">

        <div>

          <span>
            Administración
          </span>

          <h2>
            Editar usuario
          </h2>

        </div>

        <button
          type="button"
          class="admin-usuarios__close"
          :disabled="guardando"
          aria-label="Cerrar editor"
          @click="cerrarEditor"
        >
          ×
        </button>

      </div>

      <!-- NOMBRE -->

      <div class="admin-usuarios__field">

        <label for="usuario-nombre">
          Nombre
        </label>

        <input
          id="usuario-nombre"
          v-model="formulario.nombre"
          type="text"
          maxlength="100"
          autocomplete="name"
          placeholder="Nombre del usuario"
          :disabled="guardando"
        />

      </div>

      <!-- EMAIL -->

      <div class="admin-usuarios__field">

        <label for="usuario-email">
          Correo electrónico
        </label>

        <input
          id="usuario-email"
          v-model="formulario.email"
          type="email"
          readonly
          disabled
        />

      </div>

      <!-- ROL -->

      <div class="admin-usuarios__field">

        <label for="usuario-rol">
          Rol
        </label>

        <input
          id="usuario-rol"
          v-model="formulario.rol"
          type="text"
          maxlength="50"
          placeholder="superadmin"
          :disabled="guardando"
        />

      </div>

      <!-- UID -->

      <div class="admin-usuarios__field">

        <label for="usuario-is-user">
          isUser
        </label>

        <input
          id="usuario-is-user"
          :value="formulario.isUser"
          type="text"
          readonly
          disabled
        />

      </div>

      <!-- ID DOCUMENTO -->

      <div class="admin-usuarios__field">

        <label for="usuario-document-id">
          ID del documento
        </label>

        <input
          id="usuario-document-id"
          :value="usuarioEditando.id"
          type="text"
          readonly
          disabled
        />

      </div>

      <!-- ESTADO -->

      <label class="admin-usuarios__switch">

        <input
          v-model="formulario.activo"
          type="checkbox"
          :disabled="
            guardando ||
            esUsuarioActual(usuarioEditando)
          "
        />

        <span
          class="admin-usuarios__switch-control"
          aria-hidden="true"
        ></span>

        <span>

          <strong>
            Usuario activo
          </strong>

          <small>
            Mantiene habilitado el registro
            administrativo.
          </small>

        </span>

      </label>

      <!-- ADVERTENCIA -->

      <p
        v-if="
          esUsuarioActual(usuarioEditando)
        "
        class="admin-usuarios__editor-warning"
      >
        Este es tu usuario actual. No puedes
        desactivarlo ni eliminarlo.
      </p>

      <!-- ACCIONES -->

      <div class="admin-usuarios__editor-actions">

        <button
          type="button"
          class="admin-usuarios__button"
          :disabled="guardando"
          @click="cerrarEditor"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="admin-usuarios__button admin-usuarios__button--primary"
          :disabled="
            guardando ||
            !formulario.nombre.trim() ||
            !formulario.rol.trim()
          "
          @click="guardarUsuario"
        >
          {{
            guardando
              ? 'Guardando...'
              : 'Guardar cambios'
          }}
        </button>

      </div>

    </aside>

  </section>
</template>
