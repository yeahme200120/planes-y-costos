<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'

import { useRoute, useRouter } from 'vue-router'

import {
  guardarSeccion,
  suscribirSeccionAdmin,
} from '../../services/adminService'

import MediaField from '../../components/admin/secciones/MediaField.vue'
import {
  medioVacio,
  normalizarMedio,
} from '../../services/mediaService.js'

/* =========================================================
   CATÁLOGO DE SECCIONES
   ========================================================= */

const CATALOGO = {
  header:          { nombre: 'Header',              icono: '◉', sinMedio: true },
  hero:            { nombre: 'Hero',                icono: '⬡' },
  soluciones:      { nombre: 'Soluciones',          icono: '◈' },
  caracteristicas: { nombre: 'Características',     icono: '◇' },
  beneficios:      { nombre: 'Beneficios',          icono: '✦' },
  planes:          { nombre: 'Planes',              icono: '$' },
  nosotros:        { nombre: 'Nosotros',            icono: '⬤' },
  faq:             { nombre: 'FAQ',                 icono: '?' },
  contacto:        { nombre: 'Contacto',            icono: '✉' },
  footer:          { nombre: 'Footer',              icono: '—', sinMedio: true },
}

const CAMPOS_EXCLUIDOS = new Set([
  'id', 'medio',
  'logoBlob', 'logoVersion', 'logoUrl', 'logoPngUrl',
  'logoIcoUrl', 'faviconUrl', 'logoMimeType', 'logoStoragePath',
  'logoEditor', 'createdAt', 'updatedAt',
])

/* =========================================================
   LABELS LEGIBLES
   ========================================================= */

const LABELS = {
  activo:                'Activo',
  orden:                 'Orden',
  titulo:                'Título',
  tituloResaltado:       'Título resaltado',
  descripcion:           'Descripción',
  eyebrow:               'Etiqueta superior',
  icono:                 'Icono',
  texto:                 'Texto',
  url:                   'URL',
  pregunta:              'Pregunta',
  respuesta:             'Respuesta',
  nombreEmpresa:         'Nombre empresa',
  logoTexto:             'Texto logo',
  subtitulo:             'Subtítulo',
  ctaTexto:              'Texto botón CTA',
  ctaUrl:                'URL botón CTA',
  botonTexto:            'Texto botón',
  botonUrl:              'URL botón',
  botonSecundarioTexto:  'Texto botón secundario',
  botonSecundarioUrl:    'URL botón secundario',
  imagenUrl:             'URL imagen',
  imagenAlt:             'Alt imagen',
  copyright:             'Copyright',
  mensajeVacio:          'Mensaje vacío',
  mensajeCarga:          'Mensaje carga',
  facebook:              'Facebook',
  instagram:             'Instagram',
  linkedin:              'LinkedIn',
  x:                     'X (Twitter)',
  textoEnlace:           'Texto enlace',
}

function label(campo) {
  return LABELS[campo] || campo
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
}

/* =========================================================
   ROUTER
   ========================================================= */

const route = useRoute()
const router = useRouter()

const seccionId = computed(() => route.params.seccionId)
const info = computed(() => CATALOGO[seccionId.value] || { nombre: seccionId.value, icono: '◫' })
const sinMedio = computed(() => info.value.sinMedio === true)

/* =========================================================
   ESTADO
   ========================================================= */

const cargando = ref(true)
const guardando = ref(false)
const error = ref('')
const mensaje = ref('')
const conectado = ref(false)

const datos = reactive({})

const medioLocal = ref(medioVacio())
const medioEditado = ref(false)

let unsubscribe = null

/* =========================================================
   UTILIDADES
   ========================================================= */

function clonar(v) {
  try { return JSON.parse(JSON.stringify(v)) } catch { return v }
}

function esObjeto(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function esBooleano(v) { return typeof v === 'boolean' }
function esNumero(v)   { return typeof v === 'number' && Number.isFinite(v) }
function esString(v)   { return typeof v === 'string' }
function esArray(v)    { return Array.isArray(v) }

function esNavegacion(campo) { return campo === 'navegacion' }
function esRedes(campo)      { return campo === 'redes' }
function esItems(campo)      { return campo === 'items' }

function esCampoLargo(v) {
  return typeof v === 'string' && (v.length > 100 || v.includes('\n'))
}

/* =========================================================
   CAMPOS VISIBLES
   ========================================================= */

const camposVisibles = computed(() =>
  Object.keys(datos).filter((c) => !CAMPOS_EXCLUIDOS.has(c))
)

function valorDe(campo) { return datos[campo] }

/* =========================================================
   NORMALIZACIÓN
   ========================================================= */

function normalizarItems(items) {
  if (!Array.isArray(items)) return []
  return items.map((item, i) => ({
    activo: true,
    orden: i + 1,
    ...( esObjeto(item) ? clonar(item) : { valor: String(item ?? '') }),
  }))
}

function normalizarNavegacion(nav) {
  if (!Array.isArray(nav)) return []
  return nav.map((item, i) => ({
    texto: '', url: '', activo: true, orden: i + 1,
    ...(esObjeto(item) ? clonar(item) : {}),
  }))
}

/* =========================================================
   CARGAR DATOS
   ========================================================= */

function reemplazarDatos(nuevosDatos) {
  Object.keys(datos).forEach((k) => delete datos[k])
  if (!nuevosDatos || typeof nuevosDatos !== 'object') return

  const copia = clonar(nuevosDatos)
  if (copia.items)      copia.items      = normalizarItems(copia.items)
  if (copia.navegacion) copia.navegacion = normalizarNavegacion(copia.navegacion)
  Object.assign(datos, copia)

  // Sincronizar medioLocal si el usuario no está editando
  if (!sinMedio.value && !medioEditado.value) {
    medioLocal.value = normalizarMedio(
      copia.medio && typeof copia.medio === 'object' ? copia.medio : medioVacio()
    )
  }
}

/* =========================================================
   SUSCRIPCIÓN FIREBASE
   ========================================================= */

function iniciarSuscripcion() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null }

  cargando.value = true
  error.value = ''
  medioEditado.value = false
  medioLocal.value = medioVacio()

  unsubscribe = suscribirSeccionAdmin(
    seccionId.value,
    (resultado) => {
      if (guardando.value) return
      reemplazarDatos(resultado || {})
      cargando.value = false
      conectado.value = true
    },
    (err) => {
      cargando.value = false
      conectado.value = false
      error.value = err?.message || 'Error sincronizando sección.'
    }
  )
}

/* =========================================================
   GUARDAR
   ========================================================= */

async function guardar() {
  if (guardando.value) return
  guardando.value = true
  error.value = ''
  mensaje.value = ''

  try {
    const payload = clonar(datos)
    CAMPOS_EXCLUIDOS.forEach((c) => delete payload[c])
    delete payload.id

    if (Array.isArray(payload.items))      payload.items      = normalizarItems(payload.items)
    if (Array.isArray(payload.navegacion)) payload.navegacion = normalizarNavegacion(payload.navegacion)

    if (!sinMedio.value) {
      const medioAGuardar = clonar(medioLocal.value)
      /*
       * Guardar el medio si tiene URL o blob local.
       * Si está completamente vacío guardamos estructura mínima
       * para no crear ruido, pero NUNCA descartamos el blob.
       */
      const tieneContenido = Boolean(
        medioAGuardar.url ||
        medioAGuardar.medioBlob ||
        medioAGuardar.embedUrl
      )
      if (tieneContenido) {
        payload.medio = medioAGuardar
      } else {
        payload.medio = { tipo: '', url: '' }
      }
    }

    await guardarSeccion(seccionId.value, payload)
    medioEditado.value = false
    mensaje.value = 'Guardado correctamente.'
    setTimeout(() => { mensaje.value = '' }, 4000)
  } catch (err) {
    error.value = err?.message || 'Error al guardar.'
  } finally {
    guardando.value = false
  }
}

/* =========================================================
   MEDIO
   ========================================================= */

function actualizarMedio(v) {
  medioLocal.value = normalizarMedio(v)
  medioEditado.value = true
}

/* =========================================================
   CAMPO SIMPLE
   ========================================================= */

function actualizarCampo(campo, valor) { datos[campo] = valor }

/* =========================================================
   ITEMS
   ========================================================= */

function actualizarItemCampo(index, subcampo, valor) {
  if (!Array.isArray(datos.items)) return
  const item = datos.items[index]
  if (!esObjeto(item)) return
  datos.items[index] = { ...item, [subcampo]: valor }
}

function agregarItem() {
  if (!Array.isArray(datos.items)) datos.items = []
  const plantilla = datos.items.length > 0
    ? Object.fromEntries(
        Object.entries(clonar(datos.items[datos.items.length - 1]))
          .map(([k, v]) => [k,
            k === 'activo' ? true : k === 'orden' ? datos.items.length + 1
              : esBooleano(v) ? false : esNumero(v) ? 0 : esArray(v) ? [] : esObjeto(v) ? {} : '',
          ])
      )
    : { activo: true, orden: 1, icono: '', titulo: '', descripcion: '' }
  plantilla.orden = datos.items.length + 1
  datos.items.push(plantilla)
}

function eliminarItem(index) {
  if (!Array.isArray(datos.items)) return
  datos.items.splice(index, 1)
  datos.items.forEach((item, i) => { if (esObjeto(item)) item.orden = i + 1 })
}

function moverItem(index, dir) {
  if (!Array.isArray(datos.items)) return
  const dest = index + dir
  if (dest < 0 || dest >= datos.items.length) return
  ;[datos.items[index], datos.items[dest]] = [datos.items[dest], datos.items[index]]
  datos.items.forEach((item, i) => { if (esObjeto(item)) item.orden = i + 1 })
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function actualizarNavCampo(index, campo, valor) {
  if (!Array.isArray(datos.navegacion)) return
  if (!datos.navegacion[index]) return
  datos.navegacion[index] = { ...datos.navegacion[index], [campo]: valor }
}

function agregarNav() {
  if (!Array.isArray(datos.navegacion)) datos.navegacion = []
  datos.navegacion.push({ texto: '', url: '', activo: true, orden: datos.navegacion.length + 1 })
}

function eliminarNav(index) {
  if (!Array.isArray(datos.navegacion)) return
  datos.navegacion.splice(index, 1)
}

function moverNav(index, dir) {
  if (!Array.isArray(datos.navegacion)) return
  const dest = index + dir
  if (dest < 0 || dest >= datos.navegacion.length) return
  ;[datos.navegacion[index], datos.navegacion[dest]] = [datos.navegacion[dest], datos.navegacion[index]]
}

/* =========================================================
   REDES
   ========================================================= */

function actualizarRed(red, valor) {
  if (!esObjeto(datos.redes)) datos.redes = {}
  datos.redes = { ...datos.redes, [red]: String(valor ?? '') }
}

/* =========================================================
   CICLO DE VIDA
   ========================================================= */

onMounted(() => iniciarSuscripcion())
onBeforeUnmount(() => { if (unsubscribe) { unsubscribe(); unsubscribe = null } })
</script>

<template>
  <section class="asv">

    <!-- ENCABEZADO -->
    <header class="asv__header">
      <div class="asv__header-left">
        <button
          type="button"
          class="asv__back"
          @click="router.push('/admin/secciones')"
          aria-label="Volver a secciones"
        >← Secciones</button>

        <div>
          <p class="asv__eyebrow">SECCIÓN</p>
          <h1 class="asv__title">
            <span class="asv__icon" aria-hidden="true">{{ info.icono }}</span>
            {{ info.nombre }}
          </h1>
        </div>
      </div>

      <div class="asv__header-right">
        <div class="asv__realtime" :class="{ 'asv__realtime--on': conectado }">
          <span class="asv__realtime-dot" aria-hidden="true"></span>
          {{ conectado ? 'Tiempo real' : 'Conectando...' }}
        </div>

        <button
          type="button"
          class="asv__save-btn"
          :disabled="guardando || cargando"
          @click="guardar"
        >
          {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </header>

    <!-- ALERTAS -->
    <div v-if="error"   class="asv__alert asv__alert--error"   role="alert">{{ error }}</div>
    <div v-if="mensaje" class="asv__alert asv__alert--success" role="status">{{ mensaje }}</div>

    <!-- CARGANDO -->
    <div v-if="cargando" class="asv__loading">
      <span class="asv__spinner" aria-hidden="true">⟳</span>
      Cargando...
    </div>

    <template v-else-if="Object.keys(datos).length">

      <!-- MEDIO DE SECCIÓN -->
      <div v-if="!sinMedio" class="asv__card">
        <h2 class="asv__card-title">Fondo / Medio de sección</h2>
        <p class="asv__card-hint">
          Imagen, GIF o video que aparece como fondo o elemento visual en la landing.
          Los estilos de contraste se aplican automáticamente.
        </p>
        <MediaField
          :seccion-id="seccionId"
          :model-value="medioLocal"
          :disabled="guardando"
          @update:model-value="actualizarMedio"
        />
      </div>

      <!-- CAMPOS PRINCIPALES -->
      <div class="asv__card">
        <h2 class="asv__card-title">Contenido de la sección</h2>

        <div class="asv__fields">
          <template
            v-for="campo in camposVisibles"
            :key="campo"
          >
            <div
              v-if="!esItems(campo) && !esNavegacion(campo) && !esRedes(campo)"
              class="asv__field"
              :class="{ 'asv__field--full': esCampoLargo(valorDe(campo)) }"
            >
              <label class="asv__label" :for="`campo-${campo}`">
                {{ label(campo) }}
              </label>

              <!-- BOOLEAN -->
              <label v-if="esBooleano(valorDe(campo))" class="asv__toggle">
                <input
                  :id="`campo-${campo}`"
                  type="checkbox"
                  :checked="valorDe(campo)"
                  :disabled="guardando"
                  class="asv__toggle-input"
                  @change="actualizarCampo(campo, $event.target.checked)"
                />
                <span class="asv__toggle-slider"></span>
                <span class="asv__toggle-label">
                  {{ valorDe(campo) ? 'Activo' : 'Inactivo' }}
                </span>
              </label>

              <!-- NUMBER -->
              <input
                v-else-if="esNumero(valorDe(campo))"
                :id="`campo-${campo}`"
                type="number"
                :value="valorDe(campo)"
                class="asv__input"
                :disabled="guardando"
                @input="actualizarCampo(campo, Number($event.target.value))"
              />

              <!-- TEXTAREA -->
              <textarea
                v-else-if="esCampoLargo(valorDe(campo))"
                :id="`campo-${campo}`"
                :value="valorDe(campo)"
                class="asv__textarea"
                rows="4"
                :disabled="guardando"
                @input="actualizarCampo(campo, $event.target.value)"
              ></textarea>

              <!-- TEXT -->
              <input
                v-else-if="esString(valorDe(campo))"
                :id="`campo-${campo}`"
                type="text"
                :value="valorDe(campo)"
                class="asv__input"
                :disabled="guardando"
                @input="actualizarCampo(campo, $event.target.value)"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- ITEMS -->
      <div
        v-if="camposVisibles.includes('items') && esArray(datos.items)"
        class="asv__card"
      >
        <div class="asv__card-header">
          <div>
            <h2 class="asv__card-title">Elementos</h2>
            <p class="asv__card-hint">Items individuales de esta sección.</p>
          </div>
          <button type="button" class="asv__add-btn" :disabled="guardando" @click="agregarItem">
            + Agregar
          </button>
        </div>

        <div v-if="datos.items.length" class="asv__items">
          <article
            v-for="(item, index) in datos.items"
            :key="`item-${index}`"
            class="asv__item"
          >
            <div class="asv__item-header">
              <strong class="asv__item-num">
                {{ index + 1 }}
                <span v-if="esObjeto(item) && item.titulo" class="asv__item-preview">
                  — {{ item.titulo }}
                </span>
              </strong>
              <div class="asv__item-actions">
                <button type="button" :disabled="index === 0" @click="moverItem(index, -1)" title="Subir">↑</button>
                <button type="button" :disabled="index === datos.items.length - 1" @click="moverItem(index, 1)" title="Bajar">↓</button>
                <button type="button" class="asv__item-del" @click="eliminarItem(index)" title="Eliminar">×</button>
              </div>
            </div>

            <div v-if="esObjeto(item)" class="asv__item-fields">
              <div
                v-for="subcampo in Object.keys(item)"
                :key="subcampo"
                class="asv__item-field"
              >
                <label class="asv__label">{{ label(subcampo) }}</label>

                <label v-if="esBooleano(item[subcampo])" class="asv__toggle asv__toggle--sm">
                  <input
                    type="checkbox"
                    :checked="item[subcampo]"
                    :disabled="guardando"
                    class="asv__toggle-input"
                    @change="actualizarItemCampo(index, subcampo, $event.target.checked)"
                  />
                  <span class="asv__toggle-slider"></span>
                  <span class="asv__toggle-label">{{ item[subcampo] ? 'Activo' : 'Inactivo' }}</span>
                </label>

                <input
                  v-else-if="esNumero(item[subcampo])"
                  type="number"
                  :value="item[subcampo]"
                  class="asv__input"
                  :disabled="guardando"
                  @input="actualizarItemCampo(index, subcampo, Number($event.target.value))"
                />

                <textarea
                  v-else-if="esCampoLargo(item[subcampo])"
                  :value="item[subcampo]"
                  class="asv__textarea"
                  rows="3"
                  :disabled="guardando"
                  @input="actualizarItemCampo(index, subcampo, $event.target.value)"
                ></textarea>

                <input
                  v-else-if="esString(item[subcampo])"
                  type="text"
                  :value="item[subcampo]"
                  class="asv__input"
                  :disabled="guardando"
                  @input="actualizarItemCampo(index, subcampo, $event.target.value)"
                />
              </div>
            </div>
          </article>
        </div>

        <p v-else class="asv__empty">Sin elementos. Agrega el primero.</p>
      </div>

      <!-- NAVEGACIÓN (header) -->
      <div
        v-if="camposVisibles.includes('navegacion') && esArray(datos.navegacion)"
        class="asv__card"
      >
        <div class="asv__card-header">
          <div>
            <h2 class="asv__card-title">Navegación</h2>
            <p class="asv__card-hint">Enlaces del menú de navegación.</p>
          </div>
          <button type="button" class="asv__add-btn" :disabled="guardando" @click="agregarNav">
            + Agregar
          </button>
        </div>

        <div v-if="datos.navegacion.length" class="asv__items">
          <article
            v-for="(item, index) in datos.navegacion"
            :key="`nav-${index}`"
            class="asv__item"
          >
            <div class="asv__item-header">
              <strong class="asv__item-num">
                {{ index + 1 }}
                <span v-if="item.texto" class="asv__item-preview"> — {{ item.texto }}</span>
              </strong>
              <div class="asv__item-actions">
                <button type="button" :disabled="index === 0" @click="moverNav(index, -1)">↑</button>
                <button type="button" :disabled="index === datos.navegacion.length - 1" @click="moverNav(index, 1)">↓</button>
                <button type="button" class="asv__item-del" @click="eliminarNav(index)">×</button>
              </div>
            </div>
            <div class="asv__item-fields">
              <div class="asv__item-field">
                <label class="asv__label">Texto</label>
                <input type="text" :value="item.texto" class="asv__input" :disabled="guardando"
                  @input="actualizarNavCampo(index, 'texto', $event.target.value)" />
              </div>
              <div class="asv__item-field">
                <label class="asv__label">URL</label>
                <input type="text" :value="item.url" class="asv__input" :disabled="guardando"
                  @input="actualizarNavCampo(index, 'url', $event.target.value)" />
              </div>
              <div class="asv__item-field">
                <label class="asv__toggle asv__toggle--sm">
                  <input type="checkbox" :checked="item.activo" :disabled="guardando" class="asv__toggle-input"
                    @change="actualizarNavCampo(index, 'activo', $event.target.checked)" />
                  <span class="asv__toggle-slider"></span>
                  <span class="asv__toggle-label">{{ item.activo ? 'Activo' : 'Inactivo' }}</span>
                </label>
              </div>
            </div>
          </article>
        </div>
        <p v-else class="asv__empty">Sin enlaces de navegación.</p>
      </div>

      <!-- REDES SOCIALES -->
      <div v-if="camposVisibles.includes('redes')" class="asv__card">
        <h2 class="asv__card-title">Redes sociales</h2>
        <div class="asv__fields">
          <div v-for="red in ['facebook','instagram','linkedin','x']" :key="red" class="asv__field">
            <label class="asv__label" :for="`red-${red}`">{{ label(red) }}</label>
            <input
              :id="`red-${red}`"
              type="url"
              :value="datos.redes?.[red] ?? ''"
              class="asv__input"
              placeholder="https://..."
              :disabled="guardando"
              @input="actualizarRed(red, $event.target.value)"
            />
          </div>
        </div>
      </div>

      <!-- GUARDAR INFERIOR -->
      <div class="asv__footer-actions">
        <button
          type="button"
          class="asv__save-btn"
          :disabled="guardando || cargando"
          @click="guardar"
        >
          {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>

    </template>

  </section>
</template>

<style scoped>
/* =========================================================
   LAYOUT
   ========================================================= */
.asv {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 2rem 3rem;
  max-width: 900px;
}

/* HEADER */
.asv__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.asv__header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.asv__header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.asv__back {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  transition: color var(--transition-fast);
}
.asv__back:hover { color: var(--color-primary); }

.asv__eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  margin: 0;
}

.asv__title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.asv__icon {
  color: var(--color-primary);
  font-size: 1.2rem;
}

/* REALTIME */
.asv__realtime {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.asv__realtime-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
}

.asv__realtime--on .asv__realtime-dot {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

/* BOTÓN GUARDAR */
.asv__save-btn {
  padding: 0.55rem 1.4rem;
  background: var(--color-primary);
  color: var(--color-primary-text);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--transition-fast);
  white-space: nowrap;
}
.asv__save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.asv__save-btn:hover:not(:disabled) { opacity: 0.88; }

/* ALERTAS */
.asv__alert {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}
.asv__alert--error   { background: var(--color-danger-light); color: var(--color-danger); }
.asv__alert--success { background: color-mix(in srgb, var(--color-success) 10%, transparent); color: var(--color-success); }

/* LOADING */
.asv__loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
.asv__spinner { animation: asvSpin 0.8s linear infinite; display: inline-block; }
@keyframes asvSpin { to { transform: rotate(360deg); } }

/* CARD */
.asv__card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.asv__card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.asv__card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.asv__card-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0.2rem 0 0;
}

/* FIELDS GRID */
.asv__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.asv__field { display: flex; flex-direction: column; gap: 0.3rem; }
.asv__field--full { grid-column: 1 / -1; }

.asv__label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.asv__input,
.asv__textarea {
  width: 100%;
  padding: 0.45rem 0.6rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}
.asv__input:focus,
.asv__textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}
.asv__textarea { resize: vertical; }

/* TOGGLE */
.asv__toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.asv__toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.asv__toggle-slider {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--color-border);
  border-radius: 20px;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}
.asv__toggle-input:checked + .asv__toggle-slider { background: var(--color-primary); }
.asv__toggle-slider::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--transition-fast);
}
.asv__toggle-input:checked + .asv__toggle-slider::after { transform: translateX(16px); }
.asv__toggle-label { font-size: 0.8rem; color: var(--color-text-secondary); }
.asv__toggle--sm .asv__toggle-slider { width: 28px; height: 16px; }
.asv__toggle--sm .asv__toggle-slider::after { width: 10px; height: 10px; }
.asv__toggle--sm .asv__toggle-input:checked + .asv__toggle-slider::after { transform: translateX(12px); }

/* ITEMS */
.asv__items { display: flex; flex-direction: column; gap: 0.75rem; }

.asv__item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.asv__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: var(--color-background-alt);
  border-bottom: 1px solid var(--color-border);
}

.asv__item-num { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
.asv__item-preview { font-weight: 400; color: var(--color-text-muted); font-size: 0.8rem; }

.asv__item-actions {
  display: flex;
  gap: 0.25rem;
}
.asv__item-actions button {
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-text-secondary);
}
.asv__item-actions button:disabled { opacity: 0.4; cursor: not-allowed; }
.asv__item-del { color: var(--color-danger) !important; border-color: var(--color-danger) !important; }

.asv__item-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 0.75rem;
}
.asv__item-field { display: flex; flex-direction: column; gap: 0.25rem; }

/* ADD BTN */
.asv__add-btn {
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  background: var(--color-primary);
  color: var(--color-primary-text);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
}
.asv__add-btn:disabled { opacity: 0.6; }

/* EMPTY */
.asv__empty {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 1.5rem;
  margin: 0;
}

/* FOOTER */
.asv__footer-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

/* RESPONSIVE */
@media (max-width: 640px) {
  .asv { padding: 1rem; }
  .asv__fields, .asv__item-fields { grid-template-columns: 1fr; }
  .asv__header { flex-direction: column; }
}
</style>
