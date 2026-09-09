<script setup>
import {
    computed,
    onMounted,
    onUnmounted,
    ref,
} from 'vue'

import {
    actualizarEstadoContacto,
    eliminarContacto,
    suscribirContactos,
} from '../../services/contactosService.js'

const contactos = ref([])
const cargando = ref(true)
const error = ref('')
const mensaje = ref('')

const busqueda = ref('')
const filtroEstado = ref('todos')

const contactoSeleccionado =
    ref(null)

const actualizandoId = ref('')
const eliminandoId = ref('')

let cancelarSuscripcion = null

const estados = [
    {
        valor: 'nuevo',
        etiqueta: 'Nuevo',
    },
    {
        valor: 'atendido',
        etiqueta: 'Atendido',
    },
    {
        valor: 'cerrado',
        etiqueta: 'Cerrado',
    },
]

const contactosFiltrados =
    computed(() => {
        const termino =
            busqueda.value
                .trim()
                .toLowerCase()

        return contactos.value.filter(
            (contacto) => {
                const coincideEstado =
                    filtroEstado.value ===
                        'todos' ||
                    contacto.estado ===
                        filtroEstado.value

                if (
                    !coincideEstado
                ) {
                    return false
                }

                if (!termino) {
                    return true
                }

                const contenido = [
                    contacto.nombre,
                    contacto.email,
                    contacto.telefono,
                    contacto.asunto,
                    contacto.mensaje,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()

                return contenido.includes(
                    termino
                )
            }
        )
    })

const totalContactos =
    computed(
        () =>
            contactos.value.length
    )

const nuevos = computed(
    () =>
        contactos.value.filter(
            (contacto) =>
                contacto.estado ===
                'nuevo'
        ).length
)

const atendidos = computed(
    () =>
        contactos.value.filter(
            (contacto) =>
                contacto.estado ===
                'atendido'
        ).length
)

const cerrados = computed(
    () =>
        contactos.value.filter(
            (contacto) =>
                contacto.estado ===
                'cerrado'
        ).length
)

const hayFiltros =
    computed(() => {
        return (
            busqueda.value.trim() !==
                '' ||
            filtroEstado.value !==
                'todos'
        )
    })

function iniciarSuscripcion() {
    cargando.value = true
    error.value = ''
    mensaje.value = ''

    cancelarSuscripcion =
        suscribirContactos(
            (datos) => {
                contactos.value =
                    datos

                cargando.value =
                    false

                error.value = ''
            },
            (err) => {
                console.error(
                    'Error recibiendo contactos en tiempo real:',
                    err
                )

                error.value =
                    'No fue posible actualizar los mensajes de contacto.'

                cargando.value =
                    false
            }
        )
}

function actualizarLista() {
    if (
        cancelarSuscripcion
    ) {
        cancelarSuscripcion()
        cancelarSuscripcion =
            null
    }

    iniciarSuscripcion()
}

function seleccionarContacto(
    contacto
) {
    contactoSeleccionado.value =
        contacto

    mensaje.value = ''
}

function cerrarDetalle() {
    contactoSeleccionado.value =
        null
}

function limpiarFiltros() {
    busqueda.value = ''
    filtroEstado.value =
        'todos'
}

function obtenerEtiquetaEstado(
    estado
) {
    const encontrado =
        estados.find(
            (item) =>
                item.valor === estado
        )

    return (
        encontrado?.etiqueta ||
        'Sin estado'
    )
}

function obtenerIniciales(
    nombre
) {
    const texto = String(
        nombre || ''
    ).trim()

    if (!texto) {
        return '?'
    }

    const partes = texto
        .split(/\s+/)
        .filter(Boolean)

    if (partes.length === 1) {
        return partes[0]
            .substring(0, 2)
            .toUpperCase()
    }

    return (
        partes[0][0] +
        partes[partes.length - 1][0]
    ).toUpperCase()
}

function obtenerExtracto(
    texto,
    longitud = 140
) {
    const valor = String(
        texto || ''
    ).trim()

    if (!valor) {
        return 'Sin mensaje.'
    }

    if (
        valor.length <= longitud
    ) {
        return valor
    }

    return `${valor
        .substring(0, longitud)
        .trim()}...`
}

function convertirFecha(fecha) {
    if (!fecha) {
        return null
    }

    if (
        typeof fecha.toDate ===
        'function'
    ) {
        return fecha.toDate()
    }

    if (fecha instanceof Date) {
        return fecha
    }

    if (
        typeof fecha === 'string' ||
        typeof fecha === 'number'
    ) {
        const resultado =
            new Date(fecha)

        if (
            !Number.isNaN(
                resultado.getTime()
            )
        ) {
            return resultado
        }
    }

    return null
}

function formatearFecha(fecha) {
    const fechaConvertida =
        convertirFecha(fecha)

    if (!fechaConvertida) {
        return 'Sin fecha'
    }

    return new Intl.DateTimeFormat(
        'es-MX',
        {
            dateStyle: 'medium',
            timeStyle: 'short',
        }
    ).format(fechaConvertida)
}

function formatearFechaCorta(
    fecha
) {
    const fechaConvertida =
        convertirFecha(fecha)

    if (!fechaConvertida) {
        return 'Sin fecha'
    }

    return new Intl.DateTimeFormat(
        'es-MX',
        {
            dateStyle: 'medium',
        }
    ).format(fechaConvertida)
}

function generarWhatsAppUrl(
    telefono
) {
    const numero = String(
        telefono || ''
    ).replace(/\D/g, '')

    if (!numero) {
        return ''
    }

    return `https://wa.me/${numero}`
}

function generarTelefonoUrl(
    telefono
) {
    const numero = String(
        telefono || ''
    ).replace(/\D/g, '')

    if (!numero) {
        return ''
    }

    return `tel:${numero}`
}

function generarEmailUrl(email) {
    const correo = String(
        email || ''
    ).trim()

    if (!correo) {
        return ''
    }

    return `mailto:${correo}`
}

function abrirEnlace(url) {
    if (!url) {
        return
    }

    window.open(
        url,
        '_blank',
        'noopener,noreferrer'
    )
}

async function cambiarEstado(
    contacto,
    nuevoEstado
) {
    if (
        !contacto?.id ||
        contacto.estado === nuevoEstado
    ) {
        return
    }

    actualizandoId.value =
        contacto.id

    error.value = ''
    mensaje.value = ''

    try {
        await actualizarEstadoContacto(
            contacto.id,
            nuevoEstado
        )

        contactos.value =
            contactos.value.map(
                (item) => {
                    if (
                        item.id !==
                        contacto.id
                    ) {
                        return item
                    }

                    return {
                        ...item,
                        estado:
                            nuevoEstado,
                    }
                }
            )

        if (
            contactoSeleccionado
                .value?.id ===
            contacto.id
        ) {
            contactoSeleccionado.value =
                {
                    ...contactoSeleccionado.value,
                    estado:
                        nuevoEstado,
                }
        }

        mensaje.value =
            'Estado actualizado correctamente.'
    } catch (err) {
        console.error(
            'Error actualizando contacto:',
            err
        )

        error.value =
            'No fue posible actualizar el estado del contacto.'
    } finally {
        actualizandoId.value =
            ''
    }
}

async function confirmarEliminar(
    contacto
) {
    if (!contacto?.id) {
        return
    }

    const confirmado =
        window.confirm(
            `¿Deseas eliminar el mensaje de ${
                contacto.nombre ||
                'este contacto'
            }? Esta acción no se puede deshacer.`
        )

    if (!confirmado) {
        return
    }

    eliminandoId.value =
        contacto.id

    error.value = ''
    mensaje.value = ''

    try {
        await eliminarContacto(
            contacto.id
        )

        contactos.value =
            contactos.value.filter(
                (item) =>
                    item.id !==
                    contacto.id
            )

        if (
            contactoSeleccionado
                .value?.id ===
            contacto.id
        ) {
            cerrarDetalle()
        }

        mensaje.value =
            'Contacto eliminado correctamente.'
    } catch (err) {
        console.error(
            'Error eliminando contacto:',
            err
        )

        error.value =
            'No fue posible eliminar el contacto.'
    } finally {
        eliminandoId.value =
            ''
    }
}

onMounted(() => {
    iniciarSuscripcion()
})

onUnmounted(() => {
    cancelarSuscripcion?.()
    cancelarSuscripcion = null
})
</script>

<template>
    <section class="admin-contactos">
        <header
            class="admin-contactos__header"
        >
            <div
                class="admin-contactos__heading"
            >
                <span
                    class="admin-contactos__eyebrow"
                >
                    MENSAJES
                </span>

                <h1
                    class="admin-contactos__title"
                >
                    Contactos
                </h1>

                <p
                    class="admin-contactos__description"
                >
                    Administra los mensajes enviados desde
                    el formulario de contacto de la landing.
                </p>
            </div>

            <button
                type="button"
                class="admin-contactos__refresh"
                :disabled="cargando"
                @click="actualizarLista"
            >
                <span
                    class="admin-contactos__refresh-icon"
                    :class="{
                        'is-spinning':
                            cargando,
                    }"
                    aria-hidden="true"
                >
                    ↻
                </span>

                <span>
                    Actualizar
                </span>
            </button>
        </header>

        <div
            v-if="mensaje"
            class="admin-contactos__notice admin-contactos__notice--success"
            role="status"
        >
            {{ mensaje }}
        </div>

        <div
            v-if="error"
            class="admin-contactos__notice admin-contactos__notice--error"
            role="alert"
        >
            {{ error }}
        </div>

        <div
            class="admin-contactos__stats"
        >
            <article
                class="admin-contactos__stat"
            >
                <div
                    class="admin-contactos__stat-icon admin-contactos__stat-icon--total"
                >
                    ✉
                </div>

                <div>
                    <span
                        class="admin-contactos__stat-label"
                    >
                        Total
                    </span>

                    <strong
                        class="admin-contactos__stat-value"
                    >
                        {{ totalContactos }}
                    </strong>
                </div>
            </article>

            <article
                class="admin-contactos__stat"
            >
                <div
                    class="admin-contactos__stat-icon admin-contactos__stat-icon--new"
                >
                    ●
                </div>

                <div>
                    <span
                        class="admin-contactos__stat-label"
                    >
                        Nuevos
                    </span>

                    <strong
                        class="admin-contactos__stat-value"
                    >
                        {{ nuevos }}
                    </strong>
                </div>
            </article>

            <article
                class="admin-contactos__stat"
            >
                <div
                    class="admin-contactos__stat-icon admin-contactos__stat-icon--attended"
                >
                    ✓
                </div>

                <div>
                    <span
                        class="admin-contactos__stat-label"
                    >
                        Atendidos
                    </span>

                    <strong
                        class="admin-contactos__stat-value"
                    >
                        {{ atendidos }}
                    </strong>
                </div>
            </article>

            <article
                class="admin-contactos__stat"
            >
                <div
                    class="admin-contactos__stat-icon admin-contactos__stat-icon--closed"
                >
                    ✓
                </div>

                <div>
                    <span
                        class="admin-contactos__stat-label"
                    >
                        Cerrados
                    </span>

                    <strong
                        class="admin-contactos__stat-value"
                    >
                        {{ cerrados }}
                    </strong>
                </div>
            </article>
        </div>

        <div
            class="admin-contactos__toolbar"
        >
            <div
                class="admin-contactos__search"
            >
                <span
                    class="admin-contactos__search-icon"
                    aria-hidden="true"
                >
                    ⌕
                </span>

                <input
                    v-model="busqueda"
                    type="search"
                    placeholder="Buscar por nombre, correo, teléfono, asunto o mensaje..."
                    aria-label="Buscar contactos"
                />

                <button
                    v-if="busqueda"
                    type="button"
                    class="admin-contactos__search-clear"
                    aria-label="Limpiar búsqueda"
                    @click="
                        busqueda = ''
                    "
                >
                    ×
                </button>
            </div>

            <div
                class="admin-contactos__filters"
            >
                <button
                    type="button"
                    class="admin-contactos__filter"
                    :class="{
                        'is-active':
                            filtroEstado ===
                            'todos',
                    }"
                    @click="
                        filtroEstado =
                            'todos'
                    "
                >
                    Todos

                    <span>
                        {{ totalContactos }}
                    </span>
                </button>

                <button
                    type="button"
                    class="admin-contactos__filter"
                    :class="{
                        'is-active':
                            filtroEstado ===
                            'nuevo',
                    }"
                    @click="
                        filtroEstado =
                            'nuevo'
                    "
                >
                    Nuevos

                    <span>
                        {{ nuevos }}
                    </span>
                </button>

                <button
                    type="button"
                    class="admin-contactos__filter"
                    :class="{
                        'is-active':
                            filtroEstado ===
                            'atendido',
                    }"
                    @click="
                        filtroEstado =
                            'atendido'
                    "
                >
                    Atendidos

                    <span>
                        {{ atendidos }}
                    </span>
                </button>

                <button
                    type="button"
                    class="admin-contactos__filter"
                    :class="{
                        'is-active':
                            filtroEstado ===
                            'cerrado',
                    }"
                    @click="
                        filtroEstado =
                            'cerrado'
                    "
                >
                    Cerrados

                    <span>
                        {{ cerrados }}
                    </span>
                </button>
            </div>
        </div>

        <div
            v-if="cargando"
            class="admin-contactos__state"
        >
            <div
                class="admin-contactos__spinner"
                aria-hidden="true"
            ></div>

            <strong>
                Cargando contactos...
            </strong>

            <span>
                Estamos consultando los mensajes
                recibidos.
            </span>
        </div>

        <div
            v-else-if="
                contactosFiltrados.length ===
                0
            "
            class="admin-contactos__empty"
        >
            <div
                class="admin-contactos__empty-icon"
                aria-hidden="true"
            >
                ✉
            </div>

            <h2>
                {{
                    hayFiltros
                        ? 'No encontramos contactos'
                        : 'No hay contactos todavía'
                }}
            </h2>

            <p>
                {{
                    hayFiltros
                        ? 'Prueba cambiando la búsqueda o el filtro de estado.'
                        : 'Los mensajes enviados desde la landing aparecerán aquí.'
                }}
            </p>

            <button
                v-if="hayFiltros"
                type="button"
                class="admin-contactos__empty-button"
                @click="limpiarFiltros"
            >
                Limpiar filtros
            </button>
        </div>

        <div
            v-else
            class="admin-contactos__list"
        >
            <article
                v-for="contacto in contactosFiltrados"
                :key="contacto.id"
                class="admin-contactos__item"
                :class="{
                    'is-new':
                        contacto.estado ===
                        'nuevo',
                }"
            >
                <button
                    type="button"
                    class="admin-contactos__item-main"
                    @click="
                        seleccionarContacto(
                            contacto
                        )
                    "
                >
                    <div
                        class="admin-contactos__avatar"
                    >
                        {{
                            obtenerIniciales(
                                contacto.nombre
                            )
                        }}
                    </div>

                    <div
                        class="admin-contactos__item-content"
                    >
                        <div
                            class="admin-contactos__item-top"
                        >
                            <h2>
                                {{
                                    contacto.nombre ||
                                    'Sin nombre'
                                }}
                            </h2>

                            <span
                                class="admin-contactos__status"
                                :class="`admin-contactos__status--${
                                    contacto.estado ||
                                    'nuevo'
                                }`"
                            >
                                {{
                                    obtenerEtiquetaEstado(
                                        contacto.estado
                                    )
                                }}
                            </span>
                        </div>

                        <div
                            class="admin-contactos__item-meta"
                        >
                            <span>
                                {{
                                    contacto.email ||
                                    'Sin correo'
                                }}
                            </span>

                            <span
                                v-if="
                                    contacto.telefono
                                "
                            >
                                {{
                                    contacto.telefono
                                }}
                            </span>

                            <span>
                                {{
                                    formatearFechaCorta(
                                        contacto.fecha
                                    )
                                }}
                            </span>
                        </div>

                        <h3>
                            {{
                                contacto.asunto ||
                                'Sin asunto'
                            }}
                        </h3>

                        <p>
                            {{
                                obtenerExtracto(
                                    contacto.mensaje
                                )
                            }}
                        </p>
                    </div>
                </button>

                <div
                    class="admin-contactos__item-actions"
                >
                    <button
                        type="button"
                        class="admin-contactos__action"
                        title="Ver mensaje"
                        aria-label="Ver mensaje"
                        @click="
                            seleccionarContacto(
                                contacto
                            )
                        "
                    >
                        Ver
                    </button>

                    <button
                        type="button"
                        class="admin-contactos__action admin-contactos__action--danger"
                        title="Eliminar contacto"
                        aria-label="Eliminar contacto"
                        :disabled="
                            eliminandoId ===
                            contacto.id
                        "
                        @click="
                            confirmarEliminar(
                                contacto
                            )
                        "
                    >
                        {{
                            eliminandoId ===
                            contacto.id
                                ? '...'
                                : 'Eliminar'
                        }}
                    </button>
                </div>
            </article>
        </div>

        <div
            v-if="contactoSeleccionado"
            class="admin-contactos__overlay"
            @click.self="
                cerrarDetalle
            "
        >
            <aside
                class="admin-contactos__modal"
            >
                <header
                    class="admin-contactos__modal-header"
                >
                    <div>
                        <span
                            class="admin-contactos__eyebrow"
                        >
                            DETALLE DEL CONTACTO
                        </span>

                        <h2>
                            {{
                                contactoSeleccionado.nombre ||
                                'Sin nombre'
                            }}
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="admin-contactos__modal-close"
                        aria-label="Cerrar detalle"
                        @click="
                            cerrarDetalle
                        "
                    >
                        ×
                    </button>
                </header>

                <div
                    class="admin-contactos__modal-body"
                >
                    <div
                        class="admin-contactos__profile"
                    >
                        <div
                            class="admin-contactos__profile-avatar"
                        >
                            {{
                                obtenerIniciales(
                                    contactoSeleccionado.nombre
                                )
                            }}
                        </div>

                        <div>
                            <strong>
                                {{
                                    contactoSeleccionado.nombre ||
                                    'Sin nombre'
                                }}
                            </strong>

                            <span>
                                {{
                                    formatearFecha(
                                        contactoSeleccionado.fecha
                                    )
                                }}
                            </span>
                        </div>
                    </div>

                    <div
                        class="admin-contactos__detail-grid"
                    >
                        <div
                            class="admin-contactos__detail"
                        >
                            <span>
                                Correo electrónico
                            </span>

                            <strong>
                                {{
                                    contactoSeleccionado.email ||
                                    'No proporcionado'
                                }}
                            </strong>
                        </div>

                        <div
                            class="admin-contactos__detail"
                        >
                            <span>
                                Teléfono
                            </span>

                            <strong>
                                {{
                                    contactoSeleccionado.telefono ||
                                    'No proporcionado'
                                }}
                            </strong>
                        </div>

                        <div
                            class="admin-contactos__detail admin-contactos__detail--full"
                        >
                            <span>
                                Asunto
                            </span>

                            <strong>
                                {{
                                    contactoSeleccionado.asunto ||
                                    'Sin asunto'
                                }}
                            </strong>
                        </div>

                        <div
                            class="admin-contactos__detail admin-contactos__detail--full"
                        >
                            <span>
                                Mensaje
                            </span>

                            <p>
                                {{
                                    contactoSeleccionado.mensaje ||
                                    'Sin mensaje.'
                                }}
                            </p>
                        </div>
                    </div>

                    <div
                        class="admin-contactos__modal-section"
                    >
                        <span
                            class="admin-contactos__modal-label"
                        >
                            Estado
                        </span>

                        <div
                            class="admin-contactos__status-options"
                        >
                            <button
                                v-for="estado in estados"
                                :key="estado.valor"
                                type="button"
                                class="admin-contactos__status-option"
                                :class="{
                                    'is-active':
                                        contactoSeleccionado.estado ===
                                        estado.valor,

                                    [`is-${estado.valor}`]:
                                        true,
                                }"
                                :disabled="
                                    actualizandoId ===
                                    contactoSeleccionado.id
                                "
                                @click="
                                    cambiarEstado(
                                        contactoSeleccionado,
                                        estado.valor
                                    )
                                "
                            >
                                <span>
                                    {{
                                        contactoSeleccionado.estado ===
                                        estado.valor
                                            ? '✓'
                                            : ''
                                    }}
                                </span>

                                {{
                                    estado.etiqueta
                                }}
                            </button>
                        </div>
                    </div>

                    <div
                        class="admin-contactos__modal-section"
                    >
                        <span
                            class="admin-contactos__modal-label"
                        >
                            Acciones
                        </span>

                        <div
                            class="admin-contactos__contact-actions"
                        >
                            <a
                                v-if="
                                    contactoSeleccionado.email
                                "
                                class="admin-contactos__contact-action"
                                :href="
                                    generarEmailUrl(
                                        contactoSeleccionado.email
                                    )
                                "
                            >
                                <span>
                                    ✉
                                </span>

                                Enviar correo
                            </a>

                            <a
                                v-if="
                                    contactoSeleccionado.telefono
                                "
                                class="admin-contactos__contact-action"
                                :href="
                                    generarTelefonoUrl(
                                        contactoSeleccionado.telefono
                                    )
                                "
                            >
                                <span>
                                    ☎
                                </span>

                                Llamar
                            </a>

                            <button
                                v-if="
                                    contactoSeleccionado.telefono
                                "
                                type="button"
                                class="admin-contactos__contact-action"
                                @click="
                                    abrirEnlace(
                                        generarWhatsAppUrl(
                                            contactoSeleccionado.telefono
                                        )
                                    )
                                "
                            >
                                <span>
                                    ◉
                                </span>

                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>

                <footer
                    class="admin-contactos__modal-footer"
                >
                    <button
                        type="button"
                        class="admin-contactos__delete-button"
                        :disabled="
                            eliminandoId ===
                            contactoSeleccionado.id
                        "
                        @click="
                            confirmarEliminar(
                                contactoSeleccionado
                            )
                        "
                    >
                        {{
                            eliminandoId ===
                            contactoSeleccionado.id
                                ? 'Eliminando...'
                                : 'Eliminar contacto'
                        }}
                    </button>

                    <button
                        type="button"
                        class="admin-contactos__close-button"
                        @click="
                            cerrarDetalle
                        "
                    >
                        Cerrar
                    </button>
                </footer>
            </aside>
        </div>
    </section>
</template>