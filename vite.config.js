import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
// import { configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { transformSync } from '@babel/core'

import UnoCSS from 'unocss/vite'

// Custom Babel plugin for decorators
const babelDecorators = () => {
  return {
    name: 'babel-decorators',
    transform(code, id) {
      if (/\.js$/.test(id) && !id.includes('node_modules')) {
        // Check if the file contains decorators to avoid unnecessary processing
        if (!code.includes('@')) return

        const result = transformSync(code, {
          filename: id,
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-transform-class-properties', { loose: true }],
          ],
          babelrc: false,
          configFile: false,
          sourceMaps: true,
        })
        return {
          code: result.code,
          map: result.map,
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    UnoCSS(),
    babelDecorators(),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('-'),
        },
      },
      script: {
        babelParserPlugins: ['decorators-legacy', 'classProperties'],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
      },
      manifest: {
        name: 'D.E.V.I Pharmacy Management',
        short_name: 'DEVI',
        description: 'An offline-first pharmacy management system.',
        theme_color: '#1a202c',
        background_color: '#1a202c',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        // FIX: Including an empty or placeholder icons array prevents build errors.
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Vitest configuration: run unit tests in a Node-like environment
  // with manual polyfills, and exclude Playwright E2E specs
  // (they are run separately via `npm run test:e2e`).
  test: {
    environment: 'node',
    setupFiles: ['tests/unit/setup.ts'],
    exclude: ['node_modules', 'dist', 'tests/e2e'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
})
