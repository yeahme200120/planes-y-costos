import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

import { auth } from '../config/firebase'

export function iniciarSesion(email, password) {
  return signInWithEmailAndPassword(
    auth,
    email,
    password
  )
}

export function cerrarSesion() {
  return signOut(auth)
}

export function observarSesion(callback) {
  return onAuthStateChanged(auth, callback)
}

export function usuarioActual() {
  return auth.currentUser
}