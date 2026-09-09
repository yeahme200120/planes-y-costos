import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase-firestore',
              test: /node_modules[\\/]+firebase[\\/]firestore[\\/]/,
            },
            {
              name: 'firebase-auth',
              test: /node_modules[\\/]+firebase[\\/]auth[\\/]/,
            },
            {
              name: 'firebase-app',
              test: /node_modules[\\/]+firebase[\\/]app[\\/]/,
            },
          ],
        },
      },
    },
  },
})