/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import pkg from '../package.json' with { type: 'json' }

// Date the question banks last changed (weekly news merges don't bump the semver).
// Falls back to the build date when git history isn't available.
const contentDate = (() => {
  try {
    const d = execSync('git log -1 --format=%cs -- questions', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    if (d) return d
  } catch {
    // no git or shallow clone: fall through
  }
  return new Date().toISOString().slice(0, 10)
})()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __CONTENT_DATE__: JSON.stringify(contentDate),
  },
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        name: 'Quizzy 🥴 — Road Trip Quiz',
        short_name: 'Quizzy',
        description: 'A single or multiplayer (local) quiz game for the road.',
        theme_color: '#5CDB80',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
})
