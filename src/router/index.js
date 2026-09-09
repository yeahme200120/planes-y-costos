import {
  createRouter,
  createWebHistory,
} from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () =>
      import('../views/LandingView.vue'),
  },

  {
    path: '/admin/login',
    name: 'admin-login',
    component: () =>
      import('../views/admin/AdminLogin.vue'),
  },

  {
    path: '/admin',
    component: () =>
      import('../views/admin/AdminLayout.vue'),

    meta: {
      requiresAuth: true,
    },

    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },

      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () =>
          import(
            '../views/admin/AdminDashboardView.vue'
          ),
      },

      {
        path: 'planes',
        name: 'admin-planes',
        component: () =>
          import(
            '../views/admin/AdminPlanesView.vue'
          ),
      },

      {
        path: 'secciones',
        name: 'admin-secciones',
        component: () =>
          import(
            '../views/admin/AdminSeccionesView.vue'
          ),
      },

      {
        path: 'contenido',
        name: 'admin-contenido',
        component: () =>
          import(
            '../views/admin/AdminContenidoView.vue'
          ),
      },

      {
        path: 'configuracion',
        name: 'admin-configuracion',
        component: () =>
          import(
            '../views/admin/AdminConfiguracionView.vue'
          ),
      },

      {
        path: 'contactos',
        name: 'admin-contactos',
        component: () =>
          import(
            '../views/admin/ContactosAdmin.vue'
          ),
      },

      {
        path: 'usuarios',
        name: 'admin-usuarios',
        component: () =>
          import(
            '../views/admin/AdminUsuariosView.vue'
          ),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),

  routes,

  scrollBehavior() {
    return {
      top: 0,
    }
  },
})

let authInicializada = false
let authPromise = null

async function esperarAutenticacion() {
  const {
    onAuthStateChanged,
  } = await import('firebase/auth')

  const {
    auth,
  } = await import(
    '../config/firebaseAuth.js'
  )

  if (authInicializada) {
    return auth.currentUser
  }

  if (!authPromise) {
    authPromise = new Promise(
      (resolve) => {
        const unsubscribe =
          onAuthStateChanged(
            auth,
            (usuario) => {
              authInicializada = true

              unsubscribe()

              resolve(usuario)
            }
          )
      }
    )
  }

  return authPromise
}

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) {
    return true
  }

  const usuario =
    await esperarAutenticacion()

  if (!usuario) {
    return {
      name: 'admin-login',

      query: {
        redirect:
          to.fullPath,
      },
    }
  }

  return true
})

export default router