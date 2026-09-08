import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import {
  onAuthStateChanged,
} from 'firebase/auth'

import { auth } from '../config/firebase'

import LandingView from '../views/LandingView.vue'

import AdminLogin from '../views/admin/AdminLogin.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import AdminPlanesView from '../views/admin/AdminPlanesView.vue'
import AdminSeccionesView from '../views/admin/AdminSeccionesView.vue'
import AdminContenidoView from '../views/admin/AdminContenidoView.vue'
import AdminConfiguracionView from '../views/admin/AdminConfiguracionView.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingView,
  },

  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLogin,
  },

  {
    path: '/admin',
    component: AdminLayout,
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
        component: AdminDashboardView,
      },

      {
        path: 'planes',
        name: 'admin-planes',
        component: AdminPlanesView,
      },

      {
        path: 'secciones',
        name: 'admin-secciones',
        component: AdminSeccionesView,
      },

      {
        path: 'contenido',
        name: 'admin-contenido',
        component: AdminContenidoView,
      },

      {
        path: 'configuracion',
        name: 'admin-configuracion',
        component: AdminConfiguracionView,
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

function esperarAutenticacion() {
  if (authInicializada) {
    return Promise.resolve(auth.currentUser)
  }

  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      const unsubscribe =
        onAuthStateChanged(
          auth,
          (usuario) => {
            authInicializada = true

            unsubscribe()

            resolve(usuario)
          }
        )
    })
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
        redirect: to.fullPath,
      },
    }
  }

  return true
})

export default router