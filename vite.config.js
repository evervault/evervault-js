import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'lib/main.js'),
      name: 'Evervault',
      // the proper extensions will be added
      fileName: (format) => {
        if (format === 'es') {
          return `index.es.mjs`
        } else {
          return `index.js`
        }
      }
    },
  },
})