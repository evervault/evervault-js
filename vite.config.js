import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      headless: true,
    }
  },
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