import {
  getStorage,
} from 'firebase/storage'

import app from './firebaseApp.js'

export const storage = getStorage(app)