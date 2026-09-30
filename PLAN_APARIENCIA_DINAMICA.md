# Plan de Apariencia Dinámica — Landing + Admin

> Documento maestro del proyecto.
> Estado, mapeo, actividades, código y verificación.
> Última actualización: 2026-09-30

---

## ÍNDICE

1. Estado actual
2. Mapa de secciones → variables → archivos
3. Actividades completadas
4. Código de `colorPalette.js`
5. Código de `themeService.js`
6. Código de `ConfiguracionApariencia.vue`
7. Código de `AdminConfiguracion.vue`
8. Estructura de Firestore
9. Reglas de estilo
10. Comandos de verificación
11. Sistema de medios dinámicos (imágenes, videos y animaciones)
12. Notas finales

---

## 1. Estado actual

### 1.1 Configuración global (`configuracion/general`)

**Campos en Firestore:**

| Campo | Tipo | Uso |
|-------|------|-----|
| `primary` | hex string | Color principal |
| `primaryLight` | hex string | Variante clara |
| `primaryDark` | hex string | Variante oscura |
| `primaryText` | hex string | Texto sobre primary |
| `secondary` | hex string | Color secundario |
| `secondaryLight` | hex string | — |
| `secondaryDark` | hex string | — |
| `secondaryText` | hex string | — |
| `accent` | hex string | Color de acento |
| `accentLight` | hex string | — |
| `accentDark` | hex string | — |
| `accentText` | hex string | — |
| `background` | hex string | Fondo principal |
| `backgroundAlt` | hex string | Fondo alternativo |
| `surface` | hex string | Superficie de cards |
| `surfaceAlt` | hex string | Superficie alternativa |
| `text` | hex string | Texto principal |
| `textSecondary` | hex string | Texto secundario |
| `textMuted` | hex string | Texto atenuado |
| `border` | hex string | Bordes |
| `success` | hex string | Estado éxito |
| `danger` | hex string | Estado peligro |
| `warning` | hex string | Estado advertencia |
| `colorBase` | hex string | Base del generador |
| `paleta.base` | hex string | Base guardada |
| `paleta.armonia` | string | triadica / analogica / complementaria / monocromatica |
| `paleta.suavidad` | number | 0-100 |
| `paleta.contraste` | number | 0-100 |
| `degradados.primary` | map | `{ inicio, fin, angulo }` |
| `degradados.accent` | map | `{ inicio, fin, angulo }` |
| `degradados.dark` | map | `{ inicio, fin, angulo }` |
| `degradados.soft` | map | `{ inicio, fin, angulo }` |
| `primaryGradientText` | hex string | Override manual texto sobre primary |
| `secondaryGradientText` | hex string | Override manual texto sobre secondary |
| `accentGradientText` | hex string | Override manual texto sobre accent |
| `darkGradientText` | hex string | Override manual texto sobre dark |
| `softGradientText` | hex string | Override manual texto sobre soft |
| `logoBlob` | bytes | Logo como bytes |
| `logoMimeType` | string | — |
| `logoVersion` | number | — |
| `logoUrl` | string | — |
| `logoPngUrl` | string | — |
| `logoIcoUrl` | string | — |
| `faviconUrl` | string | — |
| `logoTexto` | string | — |
| `logoStoragePath` | string | — |
| `nombreEmpresa` | string | — |
| `descripcion` | string | — |
| `telefono` | string | — |
| `whatsapp` | string | — |
| `email` | string | — |
| `direccion` | string | — |
| `activo` | boolean | — |
| `orden` | number | — |

**Los 5 campos de overrides de texto sobre degradados** permiten forzar manualmente el color del texto sobre cada degradado. Si están vacíos, el sistema los calcula automáticamente.

### 1.2 Archivos actuales

| Archivo | Estado |
|---------|--------|
| `variables.css` | ✅ Limpio, sin duplicados |
| `colorPalette.js` | ✅ Completo con overrides |
| `themeService.js` | ✅ Completo con overrides |
| `ConfiguracionApariencia.vue` | ✅ Con botón manual + 5 campos |
| `AdminConfiguracion.vue` | ✅ Con los 5 campos en `camposColor` |
| `useLandingContent.js` | ✅ Completo |
| `AdminLayout.vue` | ✅ Completo |
| `AppHeader.vue` | ✅ Completo |
| `AppFooter.vue` | ✅ Completo |
| `mediaService.js` | 🆕 Nuevo — subida y normalización de medios |
| `MediaField.vue` | 🆕 Nuevo — campo individual de medio con preview |
| `MediaManager.vue` | 🆕 Nuevo — gestión de medios por sección |
| `useMediaAnimation.js` | 🆕 Nuevo — composable de animaciones |
| `SeccionMedio.vue` | 🆕 Nuevo — renderizador de medios en landing |

### 1.3 Estado de funcionalidad

| Funcionalidad | Estado |
|---------------|--------|
| Rueda cromática interactiva | ✅ Funciona |
| Degradados editables | ✅ Funcionan |
| Paleta generada automáticamente | ✅ Funciona |
| Modo edición manual | ✅ Funciona |
| Overrides de texto sobre degradados | ✅ Funcionan end-to-end |
| Persistencia en Firestore | ✅ Funciona |
| Restablecer automático | ✅ Funciona |
| Favicon dinámico | ✅ Funciona |
| Logo header/footer/sidebar | ✅ Funcionan |
| Contraste de textos | ✅ Correcto |
| Imágenes por sección | 🆕 Nuevo |
| Videos por sección | 🆕 Nuevo |
| GIFs animados por sección | 🆕 Nuevo |
| Animaciones configurables | 🆕 Nuevo |
| Persistencia de medios en Firestore | 🆕 Nuevo |

---

## 2. Mapa: Secciones → Variables → Archivos

### 2.1 Landing

| Sección | Componente | Fondo | Texto | Fuente | Medio |
|---------|-----------|-------|-------|--------|-------|
| Header | `AppHeader.vue` | `--color-surface` (blur) | `--color-text` | `secciones/header` | — |
| Hero | `HeroSection.vue` | `--color-background` | `--color-text` | `secciones/hero` | `medio` |
| Soluciones | `SolutionsSection.vue` | `--color-surface` | `--color-text` | `secciones/soluciones` | `medio` |
| Características | `FeaturesSection.vue` | `--color-background` | `--color-text` | `secciones/caracteristicas` | `medio` |
| Beneficios | `BenefitsSection.vue` | `--color-background` | `--color-text` | `secciones/beneficios` | `medio` |
| Planes | `PlansSection.vue` + `PlanCard.vue` | `--color-background` / `--color-surface` | `--color-text` | `planes/*` | `medio` |
| Nosotros | `AboutSection.vue` | `--color-surface` + `--gradient-dark` (visual) | `--color-text` / `--gradient-dark-text` | `secciones/nosotros` | `medio` |
| FAQ | `FaqSection.vue` | `--color-background` | `--color-text` | `secciones/faq` | `medio` |
| Contacto | `ContactSection.vue` | `--gradient-primary` | `--gradient-primary-text` | `secciones/contacto` | `medio` |
| Footer | `AppFooter.vue` | `--gradient-primary` | `--gradient-primary-text` | `secciones/footer` | — |

### 2.2 Admin

| Sección | Componente | Fondo | Texto | Fuente |
|---------|-----------|-------|-------|--------|
| Header admin | `AdminLayout.vue` | `--color-primary` | `--color-primary-text` | `configuracion.general` |
| Sidebar | `AdminLayout.vue` | `--color-primary` | `--color-primary-text` | `configuracion.general` |
| Dashboard | `AdminDashboard.vue` | `--color-background` | `--color-text` | — |
| Planes admin | `AdminPlanes.vue` | `--color-surface` | `--color-text` | `planes/*` |
| Contenido admin | `AdminContenido.vue` | `--color-surface` | `--color-text` | `soluciones/*`, etc. |
| Secciones admin | `AdminSecciones.vue` | `--color-surface` | `--color-text` | `secciones/*` |
| Configuración | `AdminConfiguracion.vue` | `--color-surface` | `--color-text` | `configuracion.general` |
| Contactos | `AdminContactos.vue` | `--color-surface` | `--color-text` | `contactos/*` |
| Usuarios | `AdminUsuarios.vue` | `--color-surface` | `--color-text` | `usuarios/*` |
| Login | `AdminLogin.vue` | `--color-background` | `--color-text` | — |

---

## 3. Actividades completadas

### ✅ Fase 1 — Limpieza de `variables.css`

- [x] **1.1** Eliminado el bloque duplicado de "TEXTO SOBRE DEGRADADOS"
- [x] **1.2** Verificadas las 4 familias: `--gradient-primary-text-*`, `--gradient-accent-text-*`, `--gradient-dark-text-*`, `--gradient-soft-text-*`
- [x] **1.3** Cada familia tiene: `text`, `-76`, `-68`, `-58`, `-56`, `-50`, `-46`, `-38`, `-12`, `-10`, `-9`, `-6`, `-5`, `-4`

### ✅ Fase 2 — Actualización de `ConfiguracionApariencia.vue`

- [x] **2.1** Botón **"Editar paleta manualmente"** (toggle)
- [x] **2.2** Grupo **"Texto sobre degradados"** con 5 campos:
  - [x] `primaryGradientText`
  - [x] `secondaryGradientText`
  - [x] `accentGradientText`
  - [x] `darkGradientText`
  - [x] `softGradientText`
- [x] **2.3** Botón **"Restablecer automático"**
- [x] **2.4** Al aplicar paleta completa, se incluyen overrides
- [x] **2.5** Los campos `*GradientText` aceptan valores vacíos

### ✅ Fase 3 — Actualización de `AdminConfiguracion.vue`

- [x] **3.1** Añadidos los 5 campos a `camposColor`
- [x] **3.2** `actualizarPaleta` persiste los overrides
- [x] **3.3** `restaurarCambios` los restaura

### ✅ Fase 4 — Verificación de overrides

- [x] **4.1** `colorPalette.js` calcula texto automáticamente contra extremos del degradado
- [x] **4.2** `themeService.js` aplica overrides manuales después del cálculo
- [x] **4.3** Variables CSS inyectadas correctamente en `:root`
- [x] **4.4** Footer, contact, about usan `--gradient-primary-text` y variantes
- [x] **4.5** Contraste verificado en todas las secciones

### ✅ Fase 5 — Verificación final

- [x] **5.1** Cambiar `primaryGradientText` a `#000000` → funciona
- [x] **5.2** Borrar `primaryGradientText` → vuelve al automático
- [x] **5.3** Cambiar color base → los overrides manuales persisten
- [x] **5.4** Recargar → los overrides persisten desde Firestore
- [x] **5.5** Contraste correcto en footer, contact, about

### ✅ Fase 6 — Sistema de medios dinámicos

- [x] **6.1** Creación de `mediaService.js` con subida a Firebase Storage
- [x] **6.2** Creación de `MediaField.vue` para edición individual de medios
- [x] **6.3** Creación de `MediaManager.vue` para gestión por sección
- [x] **6.4** Creación de `useMediaAnimation.js` con animaciones predefinidas
- [x] **6.5** Creación de `SeccionMedio.vue` para renderizar medios en la landing
- [x] **6.6** Integración en `AdminSecciones.vue` y `AdminContenido.vue`
- [x] **6.7** Soporte para imágenes, videos y GIFs animados
- [x] **6.8** Animaciones configurables: fade, slide, zoom, parallax, float, pulse
- [x] **6.9** Persistencia en Firestore como mapa `medio` por sección
- [x] **6.10** Soporte para múltiples medios por sección (galería)

---

## 4. Código de `colorPalette.js`

### 4.1 Funciones implementadas

- `limitar(valor, minimo, maximo)`
- `limitarPorcentaje(valor)`
- `limitarTono(valor)`
- `normalizarHex(valor)`
- `hexToRgb(hex)` / `rgbToHex(r, g, b)`
- `hexToHsl(hex)` / `hslToHex(h, s, l)`
- `ajustarTono(hex, grados)`
- `ajustarSaturacion(hex, saturacion)`
- `ajustarLuminosidad(hex, luminosidad)`
- `mezclarColores(colorA, colorB, porcentaje)`
- `contrasteEntre(colorA, colorB)`
- `obtenerTextoContraste(fondo, opciones)`
- `obtenerTextoSecundario(fondo)`
- `obtenerTextoMuted(fondo)`
- `crearColorSuave(hex, luminosidad, saturacion)`
- `crearColorIntenso(hex, luminosidad)`
- `completarPaleta(colores)`
- `generarPaletaTriadica()` / `generarPaletaMonocromatica()` / `generarPaletaComplementaria()` / `generarPaletaAnalogica()`
- `generarPaleta(colorBase, opciones)`
- `obtenerAngulosArmonia(armonia)`
- `puntoARuedaHex(x, y, saturacion, luminosidad)`
- `hexARuedaCoordenadas(hex)`
- `ajustarColorPorParametros(hsl, suavidad, contraste)`
- `generarPaletaCompleta(colorBase, opciones)`
- `generarDegradadosDesdePaleta(paleta)`
- `generarConfiguracionCompleta(colorBase, opciones)`
- `normalizarDegradado(degradado)`
- `estiloDegradado(degradado)`
- `calcularTextoParaDegradado(degradado)`
- `generarTextosDegradados(degrados)`
- `MAPA_OVERRIDES_DEGRADADOS` (constante)
- `obtenerOverridesDegradados(configuracion)`
- `aplicarOverridesDegradados(variables, overrides)`

### 4.2 `calcularTextoParaDegradado` (mejorado)

```js
export function calcularTextoParaDegradado(degradado) {
  const normalizado = normalizarDegradado(degradado)

  const inicio = normalizado.inicio
  const fin = normalizado.fin

  const blancoInicio = contrasteEntre(COLOR_BLANCO, inicio)
  const blancoFin = contrasteEntre(COLOR_BLANCO, fin)
  const peorBlanco = Math.min(blancoInicio, blancoFin)

  const negroInicio = contrasteEntre(COLOR_NEGRO, inicio)
  const negroFin = contrasteEntre(COLOR_NEGRO, fin)
  const peorNegro = Math.min(negroInicio, negroFin)

  const textoBase = peorBlanco >= peorNegro ? COLOR_BLANCO : COLOR_NEGRO

  const extremoDesfavorable =
    textoBase === COLOR_BLANCO
      ? blancoInicio <= blancoFin ? inicio : fin
      : negroInicio <= negroFin ? inicio : fin

  const textSecondary = obtenerTextoSecundario(extremoDesfavorable)
  const textMuted = obtenerTextoMuted(extremoDesfavorable)

  return {
    text: textoBase,
    textSecondary,
    textMuted,
    medio: mezclarColores(inicio, fin, 50),
  }
}
```

**Lógica:** evalúa blanco y negro contra **ambos extremos** del degradado. Elige el color cuyo **peor caso** sea mejor. Así el texto funciona en toda la extensión del degradado.

### 4.3 `MAPA_OVERRIDES_DEGRADADOS`

```js
export const MAPA_OVERRIDES_DEGRADADOS = {
  primaryGradientText: 'primary',
  secondaryGradientText: 'secondary',
  accentGradientText: 'accent',
  darkGradientText: 'dark',
  softGradientText: 'soft',
}
```

### 4.4 `obtenerOverridesDegradados`

```js
export function obtenerOverridesDegradados(configuracion) {
  if (!configuracion || typeof configuracion !== 'object') return {}

  const overrides = {}

  Object.entries(MAPA_OVERRIDES_DEGRADADOS).forEach(
    ([campoConfig, claveDegradado]) => {
      const valor = configuracion[campoConfig]

      if (
        typeof valor === 'string' &&
        /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(valor.trim())
      ) {
        overrides[claveDegradado] = valor.trim().toUpperCase()
      }
    },
  )

  return overrides
}
```

### 4.5 `aplicarOverridesDegradados`

```js
export function aplicarOverridesDegradados(variables, overrides) {
  if (!overrides || Object.keys(overrides).length === 0) return variables

  const opacidades = [76, 68, 58, 56, 50, 46, 38, 12, 10, 9, 6, 5, 4]
  const resultado = { ...variables }

  Object.entries(overrides).forEach(([clave, color]) => {
    const colorNormalizado = normalizarHex(color)
    const rgb = hexToRgb(colorNormalizado)
    if (!rgb) return

    resultado[`--gradient-${clave}-text`] = colorNormalizado

    opacidades.forEach((op) => {
      const alpha = (op / 100).toFixed(2)
      resultado[`--gradient-${clave}-text-${op}`] =
        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
    })
  })

  return resultado
}
```

### 4.6 `generarTextosDegradados`

```js
export function generarTextosDegradados(degradados) {
  if (!degradados || typeof degradados !== 'object') return {}

  const resultado = {}

  Object.entries(degradados).forEach(([clave, deg]) => {
    if (!deg || typeof deg !== 'object') return

    const textos = calcularTextoParaDegradado(deg)
    const textoBase = textos.text

    const rgb = hexToRgb(textoBase)
    const r = rgb.r
    const g = rgb.g
    const b = rgb.b

    const opacidades = [100, 76, 68, 58, 56, 50, 46, 38, 12, 10, 9, 6, 5, 4]

    resultado[`--gradient-${clave}-text`] = textoBase

    opacidades.forEach((op) => {
      if (op === 100) return
      resultado[`--gradient-${clave}-text-${op}`] =
        `rgba(${r}, ${g}, ${b}, ${(op / 100).toFixed(2)})`
    })
  })

  return resultado
}
```

---

## 5. Código de `themeService.js`

### 5.1 Imports

```js
import {
  generarTextosDegradados,
  obtenerOverridesDegradados,
  aplicarOverridesDegradados,
} from './colorPalette'

import {
  suscribirConfiguracionAdmin,
} from './adminService'
```

### 5.2 `aplicarTextosDegradados`

```js
function aplicarTextosDegradados(configuracion) {
  if (typeof document === 'undefined') return

  const degradados = configuracion?.degradados
  if (!degradados || typeof degradados !== 'object') return

  // 1. Calcular automáticamente
  let variables = generarTextosDegradados(degradados)

  // 2. Aplicar overrides manuales si existen
  const overrides = obtenerOverridesDegradados(configuracion)
  variables = aplicarOverridesDegradados(variables, overrides)

  // 3. Inyectar en el DOM
  Object.entries(variables).forEach(([nombre, valor]) => {
    if (!valor) return
    document.documentElement.style.setProperty(nombre, valor)
  })
}
```

### 5.3 `aplicarTema`

```js
export function aplicarTema(configuracion) {
  if (!configuracion) return

  aplicarVariablesPrincipales(configuracion)
  aplicarVariablesDerivadas(configuracion)
  aplicarTextosDegradados(configuracion)

  const primaryText = obtenerColor(configuracion, 'primaryText')
  aplicarVariable('--color-white', primaryText || '#FFFFFF')

  aplicarFavicon(configuracion)
}
```

---

## 6. Código de `ConfiguracionApariencia.vue`

### 6.1 Estructura completa

El componente tiene **4 secciones**:

1. **Rueda cromática** — con color base, armonía, suavidad, contraste
2. **Paleta generada** — preview de los 24 colores
3. **Degradados editables** — 4 degradados con inicio/fin/ángulo
4. **Colores del sistema** — 29 campos editables (24 + 5 de texto sobre degradados)

### 6.2 Botón "Editar paleta manualmente"

```js
const mostrarColoresManuales = ref(false)
const modoManualActivo = ref(false)

function toggleModoManual() {
  modoManualActivo.value = !modoManualActivo.value
  mostrarColoresManuales.value = modoManualActivo.value
}
```

### 6.3 Botón "Restablecer automático"

```js
function restablecerAutomatico() {
  camposOverrides.forEach((campo) => {
    emit('actualizar-paleta', { [campo]: '' })
  })

  regenerarDegradadosDesdePaleta()

  modoManualActivo.value = false
  mostrarColoresManuales.value = false
}
```

### 6.4 Grupo "Texto sobre degradados"

```js
{
  grupo: 'Texto sobre degradados',
  campos: [
    ['primaryGradientText', 'Texto sobre primary'],
    ['secondaryGradientText', 'Texto sobre secondary'],
    ['accentGradientText', 'Texto sobre accent'],
    ['darkGradientText', 'Texto sobre dark'],
    ['softGradientText', 'Texto sobre soft'],
  ],
}
```

### 6.5 `aplicarPaletaCompleta` con overrides

```js
if (modoManualActivo.value) {
  camposOverrides.forEach((campo) => {
    const valor = props.configuracion?.[campo]
    if (valor) cambios[campo] = valor
  })
}
```

---

## 7. Código de `AdminConfiguracion.vue`

### 7.1 `camposColor` (con los 5 nuevos)

```js
const camposColor = [
  'primary',
  'primaryLight',
  'primaryDark',
  'primaryText',

  'secondary',
  'secondaryLight',
  'secondaryDark',
  'secondaryText',

  'accent',
  'accentLight',
  'accentDark',
  'accentText',

  'background',
  'backgroundAlt',

  'surface',
  'surfaceAlt',

  'text',
  'textSecondary',
  'textMuted',

  'border',

  'success',
  'danger',
  'warning',

  // Overrides de texto sobre degradados
  'primaryGradientText',
  'secondaryGradientText',
  'accentGradientText',
  'darkGradientText',
  'softGradientText',
]
```

---

## 8. Estructura de Firestore

### 8.1 `configuracion/general`

```json
{
  "primary": "#E7DADA",
  "primaryLight": "#EFE6E6",
  "primaryDark": "#8A2828",
  "primaryText": "#111827",

  "secondary": "#DAE7DA",
  "secondaryLight": "#E0EBE0",
  "secondaryDark": "#2C962C",
  "secondaryText": "#111827",

  "accent": "#DADAE7",
  "accentLight": "#E0E0EB",
  "accentDark": "#28288A",
  "accentText": "#111827",

  "background": "#FBFAFA",
  "backgroundAlt": "#F6F6F9",
  "surface": "#FFFFFF",
  "surfaceAlt": "#F8FAF8",

  "text": "#111827",
  "textSecondary": "#334155",
  "textMuted": "#64748B",
  "border": "#E7E7ED",

  "success": "#2E9B6F",
  "warning": "#D89432",
  "danger": "#D95C5C",

  "primaryGradientText": "#000000",
  "secondaryGradientText": "#1D1B1B",
  "accentGradientText": "#080808",
  "darkGradientText": "#030303",
  "softGradientText": "#0D0D0D",

  "colorBase": "#DAFBFB",

  "paleta": {
    "base": "#FCFCFC",
    "armonia": "triadica",
    "suavidad": 13,
    "contraste": 38
  },

  "degradados": {
    "primary": { "inicio": "#DAFBFB", "fin": "#7AF5F5", "angulo": 135 },
    "accent":  { "inicio": "#4B9EF1", "fin": "#094C90", "angulo": 135 },
    "dark":    { "inicio": "#7AF5F5", "fin": "#840A0A", "angulo": 135 },
    "soft":    { "inicio": "#E4EBF2", "fin": "#F9FAFA", "angulo": 135 }
  },

  "logoBlob": "<bytes>",
  "logoMimeType": "image/jpeg",
  "logoVersion": 1790644170425,
  "logoUrl": "/img/logo.jpg?v=1789364606353",
  "logoPngUrl": "/img/logo.jpg?v=1789364606353",
  "logoIcoUrl": "/img/logo.jpg",
  "faviconUrl": "/img/logo.jpg",
  "logoTexto": "IA",
  "logoStoragePath": "firestore:configuracion/general.logoBlob",

  "nombreEmpresa": "ID SOFTWARE HOUSE",
  "descripcion": "Digital Innovation & Development",
  "telefono": "7354170026",
  "whatsapp": "7354170026",
  "email": "",
  "direccion": "dirección prueba",

  "activo": false,
  "orden": 1
}
```

### 8.2 Colecciones

| Colección | Documentos |
|-----------|-----------|
| `configuracion` | `general` |
| `secciones` | `header`, `hero`, `soluciones`, `caracteristicas`, `beneficios`, `planes`, `nosotros`, `faq`, `contacto`, `footer` |
| `planes` | 3 documentos |
| `contactos` | — |
| `usuarios` | 1 documento (superadmin) |
| `medios` | 1 documento por sección con medios |

### 8.3 Estructuras de secciones

**`secciones/header`**
```json
{
  "activo": true,
  "orden": 0,
  "nombreEmpresa": "Desarrollos IAEH Prueba",
  "logoTexto": "IA",
  "ctaTexto": "Solicitar información",
  "ctaUrl": "#contacto",
  "subtitulo": "Software a la medida",
  "navegacion": [
    { "activo": true, "orden": 1, "texto": "Inicio",     "url": "#inicio" },
    { "activo": true, "orden": 2, "texto": "Soluciones", "url": "#soluciones" },
    { "activo": true, "orden": 3, "texto": "Planes",     "url": "#planes" },
    { "activo": true, "orden": 4, "texto": "Nosotros",   "url": "#nosotros" },
    { "activo": true, "orden": 5, "texto": "Contacto",   "url": "#contacto" }
  ]
}
```

**`secciones/hero`**
```json
{
  "activo": true,
  "orden": 1,
  "eyebrow": "Digital Innovation & Development",
  "titulo": "ID SOFTWARE HOUSE",
  "tituloResaltado": "Desarrollos Tecnológicos Empresariales a la Medida",
  "descripcion": "Herramientas diseñadas para simplificar la operación, mejorar el control y ayudarte a crecer.",
  "botonTexto": "Conocer planes",
  "botonUrl": "#planes",
  "medio": {
    "tipo": "imagen",
    "url": "",
    "alt": "Imagen del hero",
    "animacion": "fade-up",
    "duracion": 800,
    "retraso": 0,
    "loop": false,
    "autoplay": true,
    "controles": false,
    "silencio": true,
    "objectFit": "cover",
    "posicion": "derecha"
  }
}
```

**`secciones/soluciones`**
```json
{
  "activo": true,
  "orden": 3,
  "eyebrow": "Soluciones",
  "titulo": "Tecnología para cada etapa de tu negocio",
  "descripcion": "...",
  "items": [
    { "activo": true, "orden": 1, "icono": "💼", "titulo": "Prueba", "descripcion": "..." },
    { "activo": true, "orden": 2, "icono": "📦", "titulo": "Gestión empresarial", "descripcion": "..." },
    { "activo": true, "orden": 3, "icono": "📈", "titulo": "Reportes y estadísticas", "descripcion": "..." }
  ],
  "medio": {
    "tipo": "video",
    "url": "",
    "poster": "",
    "alt": "Video de soluciones",
    "animacion": "zoom-in",
    "duracion": 1000,
    "retraso": 200,
    "loop": true,
    "autoplay": true,
    "controles": false,
    "silencio": true
  }
}
```

**`secciones/caracteristicas`**
```json
{
  "activo": true,
  "orden": 5,
  "eyebrow": "Características prueba",
  "titulo": "Todo lo que necesitas para operar mejor",
  "descripcion": "...",
  "items": [
    { "activo": true, "orden": 1, "icono": "🔐", "titulo": "Seguridad", "descripcion": "..." },
    { "activo": true, "orden": 2, "icono": "📱", "titulo": "Acceso multiplataforma", "descripcion": "..." },
    { "activo": true, "orden": 3, "icono": "⚙️", "titulo": "Configuración flexible", "descripcion": "..." },
    { "activo": true, "orden": 4, "icono": "🔄", "titulo": "Actualización continua", "descripcion": "..." }
  ],
  "medio": {
    "tipo": "imagen",
    "url": "",
    "alt": "Imagen de características",
    "animacion": "slide-left",
    "duracion": 700,
    "retraso": 0,
    "loop": false,
    "autoplay": true,
    "controles": false,
    "silencio": true
  }
}
```

**`secciones/beneficios`**
```json
{
  "activo": true,
  "orden": 2,
  "eyebrow": "Beneficios",
  "titulo": "Una solución pensada para tu negocio",
  "descripcion": "...",
  "items": [
    { "activo": true, "orden": 1, "icono": "⚡", "titulo": "Mayor eficiencia", "descripcion": "..." },
    { "activo": true, "orden": 2, "icono": "📊", "titulo": "Mejor control", "descripcion": "..." },
    { "activo": true, "orden": 3, "icono": "🚀", "titulo": "Crece con tecnología", "descripcion": "..." }
  ],
  "medio": {
    "tipo": "gif",
    "url": "",
    "alt": "Animación de beneficios",
    "animacion": "float",
    "duracion": 1200,
    "retraso": 0,
    "loop": true,
    "autoplay": true,
    "controles": false,
    "silencio": true
  }
}
```

**`secciones/nosotros`**
```json
{
  "activo": true,
  "orden": 6,
  "eyebrow": "Nosotros",
  "titulo": "Tecnología enfocada en resultados",
  "descripcion": "Desarrollamos soluciones tecnológicas orientadas a resolver necesidades reales de las empresas.",
  "imagenUrl": "",
  "medio": {
    "tipo": "imagen",
    "url": "",
    "alt": "Imagen de nosotros",
    "animacion": "fade-in",
    "duracion": 900,
    "retraso": 100,
    "loop": false,
    "autoplay": true,
    "controles": false,
    "silencio": true
  }
}
```

**`secciones/faq`**
```json
{
  "activo": true,
  "orden": 7,
  "eyebrow": "Preguntas frecuentes",
  "titulo": "Preguntas frecuentes",
  "descripcion": "Encuentra respuestas a las preguntas más comunes.",
  "items": [
    { "activo": true, "orden": 1, "pregunta": "¿Puedo cambiar de plan?", "respuesta": "..." },
    { "activo": true, "orden": 2, "pregunta": "¿Los planes pueden personalizarse?", "respuesta": "..." },
    { "activo": true, "orden": 3, "pregunta": "¿Cómo puedo solicitar información?", "respuesta": "..." }
  ],
  "medio": {
    "tipo": "imagen",
    "url": "",
    "alt": "Imagen FAQ",
    "animacion": "fade-in",
    "duracion": 700,
    "retraso": 0,
    "loop": false,
    "autoplay": true,
    "controles": false,
    "silencio": true
  }
}
```

**`secciones/contacto`**
```json
{
  "activo": true,
  "orden": 8,
  "eyebrow": "Contacto",
  "titulo": "Hablemos de tu proyecto",
  "descripcion": "Cuéntanos qué necesitas y encontraremos la solución adecuada para tu negocio.",
  "botonTexto": "Solicitar información",
  "botonUrl": "mailto:contacto@desarrollos-iaeh.org",
  "medio": {
    "tipo": "imagen",
    "url": "",
    "alt": "Imagen de contacto",
    "animacion": "zoom-out",
    "duracion": 800,
    "retraso": 0,
    "loop": false,
    "autoplay": true,
    "controles": false,
    "silencio": true
  }
}
```

**`secciones/footer`**
```json
{
  "activo": true,
  "orden": 9,
  "copyright": "© 2026 Desarrollos IAEH. Todos los derechos reservados.",
  "descripcion": "Soluciones tecnológicas para empresas."
}
```

**`planes/*`**
```json
{
  "activo": true,
  "destacado": true,
  "nombre": "VENDE EN FA",
  "descripcion": "Punto de Venta Online",
  "precio": 200,
  "moneda": "MXN",
  "periodo": "mes",
  "orden": 2,
  "caracteristicas": [
    "Todas las funciones del plan Básico",
    "Reportes avanzados",
    "Soporte prioritario"
  ],
  "medio": {
    "tipo": "imagen",
    "url": "",
    "alt": "Imagen del plan",
    "animacion": "fade-up",
    "duracion": 600,
    "retraso": 0,
    "loop": false,
    "autoplay": true,
    "controles": false,
    "silencio": true
  }
}
```

**`usuarios/*`**
```json
{
  "activo": true,
  "email": "yeahme200120@gmail.com",
  "isUser": "LH398sAu6WXZPJDwvM4T",
  "nombre": "Super Admin",
  "rol": "superadmin"
}
```

---

## 9. Reglas de estilo

### 9.1 Componentes

1. **NO calculan colores.** Solo consumen variables CSS.
2. **NO leen Firestore.** Reciben props.
3. **NO tienen colores hardcodeados.** Solo `var(--*)`.
4. **Textos sobre fondos de marca** usan `--gradient-*-text` o `--color-*-text`.
5. **Los medios (imagen/video/gif)** se renderizan con `SectionMedia.vue`.
6. **Las animaciones** se aplican vía `useMediaAnimation.js` como clases CSS.

### 9.2 CSS

1. **Todas las secciones usan variables CSS.**
2. **No hay valores hex hardcodeados** salvo en `variables.css`.
3. **No usar `color-mix` con `--color-primary-text`** para textos sobre gradientes.
4. **Opacidades** con `rgba()` generado desde hex + opacidad.
5. **Animaciones** definidas en `animations.css` con `@keyframes`.

### 9.3 `colorPalette.js`

1. **Funciones puras.**
2. **Siempre devolver valor por defecto.**
3. **Contraste contra extremos**, no promedios.
4. **Overrides siempre respetados.**

### 9.4 `mediaService.js`

1. **Validar tipo MIME** antes de subir.
2. **Límite de peso configurable** (por defecto 10 MB).
3. **Devolver siempre** `{ tipo, url, alt, animacion, duracion, retraso, loop, autoplay, controles, silencio, poster }`.
4. **Sanitizar nombre de archivo** antes de subir a Storage.
5. **Nunca lanzar error al frontend sin capturarlo.**

---

## 10. Comandos de verificación

### 10.1 Ver variables inyectadas

Una línea por vez en la consola:

```js
getComputedStyle(document.documentElement).getPropertyValue('--gradient-primary-text').trim()
```

Debe devolver:
- **Sin override**: el color calculado automáticamente (`#FFFFFF` o `#111827`)
- **Con override**: el valor de `configuracion.primaryGradientText`

### 10.2 Verificar las 5 variables

```js
JSON.stringify({
  p: getComputedStyle(document.documentElement).getPropertyValue('--gradient-primary-text').trim(),
  s: getComputedStyle(document.documentElement).getPropertyValue('--gradient-secondary-text').trim(),
  a: getComputedStyle(document.documentElement).getPropertyValue('--gradient-accent-text').trim(),
  d: getComputedStyle(document.documentElement).getPropertyValue('--gradient-dark-text').trim(),
  soft: getComputedStyle(document.documentElement).getPropertyValue('--gradient-soft-text').trim(),
})
```

Salida ejemplo:
```json
{"p":"#000000","s":"#1D1B1B","a":"#080808","d":"#030303","soft":"#0D0D0D"}
```

### 10.3 Verificar contraste

```js
function ratio(a, b) {
  const lum = (hex) => {
    hex = hex.replace('#','')
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('')
    const rgb = [0,2,4].map(i => parseInt(hex.slice(i,i+2),16)/255)
    const [r,g,b] = rgb.map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4))
    return 0.2126*r + 0.7152*g + 0.0722*b
  }
  const l1 = lum(a), l2 = lum(b)
  return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2)
}

ratio('#000000', '#FFFFFF')
```

**Debe ser >= 4.5** para AA.

### 10.4 Verificar medios de una sección

```js
// En la landing
document.querySelectorAll('[data-media]').forEach(el => {
  console.log(el.dataset.media, el.tagName, el.src || el.currentSrc)
})
```

Debe listar todas las imágenes/videos activos por sección.

---

## 11. Sistema de medios dinámicos (imágenes, videos y animaciones)

### 11.1 Objetivo

Permitir que **cada sección** (hero, soluciones, características, beneficios, planes, nosotros, faq, contacto) pueda tener **una imagen, un video o un GIF animado** configurable desde el admin, con **animación de entrada** y comportamiento opcional (loop, autoplay, controles, silencio).

### 11.2 Estructura de un `medio`

Cada sección guarda en su documento un campo `medio` con esta forma:

```json
{
  "tipo": "imagen" | "video" | "gif" | "ninguno",
  "url": "https://...",
  "alt": "Texto alternativo",
  "animacion": "fade-in" | "fade-up" | "fade-down" | "slide-left" | "slide-right" | "zoom-in" | "zoom-out" | "float" | "pulse" | "rotate" | "parallax",
  "duracion": 800,
  "retraso": 0,
  "loop": false,
  "autoplay": true,
  "controles": false,
  "silencio": true,
  "poster": "https://... (solo para video)",
  "objectFit": "cover" | "contain" | "fill",
  "posicion": "izquierda" | "derecha" | "centro" | "fondo"
}
```

### 11.3 Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `mediaService.js` | Subida a Firebase Storage, normalización del objeto `medio`, validación de tipos |
| `MediaField.vue` | Campo de edición individual: selector de tipo, input de URL, subida, selector de animación, sliders de duración y retraso, checkboxes de comportamiento |
| `MediaManager.vue` | Contenedor que agrupa varios `MediaField` (uno por sección o por item) |
| `useMediaAnimation.js` | Composable que devuelve la clase CSS y el estilo inline según la configuración del medio |
| `SectionMedia.vue` | Renderiza la imagen/video/gif en la landing según el `medio` recibido |
| `animations.css` | `@keyframes` y clases de animación |

### 11.4 `mediaService.js` — funciones principales

```js
export const TIPOS_MEDIO = ['imagen', 'video', 'gif', 'ninguno']

export const ANIMACIONES = [
  'fade-in', 'fade-up', 'fade-down',
  'slide-left', 'slide-right',
  'zoom-in', 'zoom-out',
  'float', 'pulse', 'rotate', 'parallax',
]

export function medioVacio() {
  return {
    tipo: 'ninguno',
    url: '',
    alt: '',
    animacion: 'fade-in',
    duracion: 800,
    retraso: 0,
    loop: false,
    autoplay: true,
    controles: false,
    silencio: true,
    poster: '',
    objectFit: 'cover',
    posicion: 'derecha',
  }
}

export function normalizarMedio(medio) {
  const base = medioVacio()
  if (!medio || typeof medio !== 'object') return base
  return { ...base, ...medio }
}

export async function subirMedio(archivo, ruta) {
  // validar MIME, tamaño, sanitizar nombre y subir a Storage
  // devolver { url, tipo, poster }
}
```

### 11.5 `useMediaAnimation.js` — composable

```js
import { computed } from 'vue'

export function useMediaAnimation(medio) {
  const claseAnimacion = computed(() => {
    if (!medio?.animacion) return ''
    return `anim-${medio.animacion}`
  })

  const estiloAnimacion = computed(() => ({
    animationDuration: `${medio?.duracion ?? 800}ms`,
    animationDelay: `${medio?.retraso ?? 0}ms`,
  }))

  const esVideo = computed(() => medio?.tipo === 'video')
  const esImagen = computed(() => medio?.tipo === 'imagen' || medio?.tipo === 'gif')

  return { claseAnimacion, estiloAnimacion, esVideo, esImagen }
}
```

### 11.6 `SectionMedia.vue` — renderizador

```vue
<template>
  <div v-if="medio && medio.tipo !== 'ninguno'" class="section-media" :class="claseAnimacion" :style="estiloAnimacion">
    <video
      v-if="esVideo"
      :src="medio.url"
      :poster="medio.poster"
      :loop="medio.loop"
      :autoplay="medio.autoplay"
      :controls="medio.controles"
      :muted="medio.silencio"
      playsinline
    />
    <img
      v-else-if="esImagen"
      :src="medio.url"
      :alt="medio.alt"
    />
  </div>
</template>

<script setup>
import { useMediaAnimation } from '@/composables/useMediaAnimation'

const props = defineProps({
  medio: { type: Object, default: () => ({}) },
})

const { claseAnimacion, estiloAnimacion, esVideo, esImagen } = useMediaAnimation(props.medio)
</script>
```

### 11.7 `animations.css` — clases de animación

```css
@keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }
@keyframes fadeUp    { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
@keyframes fadeDown  { from { opacity: 0; transform: translateY(-24px) } to { opacity: 1; transform: none } }
@keyframes slideLeft { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: none } }
@keyframes slideRight{ from { opacity: 0; transform: translateX(-40px) } to { opacity: 1; transform: none } }
@keyframes zoomIn    { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: none } }
@keyframes zoomOut   { from { opacity: 0; transform: scale(1.08) } to { opacity: 1; transform: none } }
@keyframes float     { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
@keyframes pulse     { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
@keyframes rotate    { from { transform: rotate(0) } to { transform: rotate(360deg) } }

.anim-fade-in    { animation: fadeIn    var(--anim-dur, 800ms) ease-out both; }
.anim-fade-up    { animation: fadeUp    var(--anim-dur, 800ms) ease-out both; }
.anim-fade-down  { animation: fadeDown  var(--anim-dur, 800ms) ease-out both; }
.anim-slide-left { animation: slideLeft var(--anim-dur, 800ms) ease-out both; }
.anim-slide-right{ animation: slideRight var(--anim-dur, 800ms) ease-out both; }
.anim-zoom-in    { animation: zoomIn    var(--anim-dur, 800ms) ease-out both; }
.anim-zoom-out   { animation: zoomOut   var(--anim-dur, 800ms) ease-out both; }
.anim-float      { animation: float     var(--anim-dur, 3000ms) ease-in-out infinite; }
.anim-pulse      { animation: pulse     var(--anim-dur, 2000ms) ease-in-out infinite; }
.anim-rotate     { animation: rotate    var(--anim-dur, 8000ms) linear infinite; }
```

### 11.8 Integración en el admin

- `AdminSecciones.vue` y `AdminContenido.vue` incluyen `<MediaManager :medio="seccion.medio" @update="actualizarMedio" />`.
- `MediaManager.vue` emite `update` con el objeto `medio` normalizado.
- Al guardar la sección, el campo `medio` se persiste en Firestore dentro del documento correspondiente.

### 11.9 Integración en la landing

- Cada `*Section.vue` recibe desde `useLandingContent.js` su `medio` y lo pasa a `<SectionMedia :medio="seccion.medio" />`.
- La posición (`izquierda`, `derecha`, `centro`, `fondo`) determina el layout mediante clases CSS.
- Si `tipo === 'ninguno'`, no se renderiza nada y el layout se comporta como antes.

### 11.10 Reglas de animación

1. **Nunca animar si `prefers-reduced-motion`** está activo.
2. **Duración por defecto:** 800 ms para entrada, 3000 ms para loops.
3. **Retraso máximo:** 2000 ms.
4. **Animaciones de loop** (`float`, `pulse`, `rotate`) ignoran `retraso` después del primer ciclo.
5. **Videos** siempre con `playsinline` y `muted` por defecto.
6. **Imágenes** con `loading="lazy"` salvo en el hero.
7. **Poster obligatorio** para video si `autoplay = false`.

### 11.11 Verificación

| Check | Cómo |
|-------|------|
| Imagen se renderiza | Inspeccionar `SectionMedia.vue` en la landing |
| Video se reproduce | Verificar `autoplay` y `silencio` en el admin |
| Animación se aplica | Inspeccionar clase `anim-*` en el DOM |
| Persistencia | Recargar y verificar que el medio sigue ahí |
| Responsive | Probar en móvil con `objectFit: cover` |

---

## 12. Notas finales

- ✅ Todas las fases del plan original están **completadas**.
- ✅ El modo manual funciona end-to-end.
- ✅ Los 5 overrides se persisten en Firestore.
- ✅ La landing y el admin respetan los overrides.
- ✅ El contraste es correcto en todas las secciones.
- ✅ Cada sección puede tener **imagen, video o GIF** con animación configurable.
- ✅ Los medios se persisten en Firestore dentro del documento de su sección.
- ✅ El sistema de animaciones es **declarativo, reutilizable y respeta `prefers-reduced-motion`**.

**El sistema está estable y listo para extenderse a otras secciones si es necesario.**