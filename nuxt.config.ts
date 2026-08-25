// https://nuxt.com
import { defineNuxtConfig } from 'nuxt/config'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import tailwindcss from "@tailwindcss/vite";

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// A human-readable build number derived from git at build time, so the
// version shown in the app always matches an exact deployed commit with no
// manual bump. `git rev-list --count HEAD` is the number of commits reachable
// from HEAD -- a small, monotonically-increasing integer ("Build #187") that
// reads far better than a raw hash while still ticking up every commit.
// That count is only meaningful against a full clone though -- a shallow
// clone (some CI/build environments fetch only the latest commit or two)
// would report "1" or "2" on every single deploy, which is worse than
// useless. Detect that case and fall back to the short SHA instead, which
// stays correct at any clone depth; fall back further to the package.json
// version if git isn't available in the build environment at all.
function getBuildId() {
  try {
    const isShallow = execSync('git rev-parse --is-shallow-repository').toString().trim() === 'true'
    if (isShallow) return execSync('git rev-parse --short HEAD').toString().trim()
    return execSync('git rev-list --count HEAD').toString().trim()
  } catch {
    return pkg.version
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2026-04-18',
  future: { compatibilityVersion: 4 },

  runtimeConfig: {
    public: {
      // Shown in the navbar menu so users can report what they're running
      // when troubleshooting. buildId is the exact commit deployed;
      // buildTime pinpoints when, in case the same commit gets rebuilt.
      buildId: getBuildId(),
      buildTime: new Date().toISOString(),
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      firebaseVapidKey: process.env.NUXT_PUBLIC_FIREBASE_VAPID_KEY
    }
  },

  modules: [
    '@vueuse/nuxt',
    '@vite-pwa/nuxt', 
    '@nuxtjs/color-mode', 
    '@pinia/nuxt', 
    '@nuxt/icon'
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Golf Nanks',
      meta: [
        { name: 'theme-color', content: '#020617' }, // Tailwind slate-950
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }, 
        { name: 'apple-mobile-web-app-title', content: 'Golf Nanks' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon.png' },
        { rel: 'apple-touch-icon', href: '/icon.png' } 
      ]
    }
  },

  routeRules: {
    '/': { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } },
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  },

  sourcemap: false,

  vite: {
    plugins: [tailwindcss()],
    define: {
      'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.NUXT_PUBLIC_FIREBASE_API_KEY),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
      'process.env.FIREBASE_SENDER_ID': JSON.stringify(process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.NUXT_PUBLIC_FIREBASE_APP_ID),
    }
  },

  css: ['~/assets/css/main.css'],

  pwa: {
    strategies: 'injectManifest',
    srcDir: './',
    filename: 'sw.ts',
    devOptions: {
      enabled: true,
      type: 'module',
      navigateFallback: '/'
    },
    registerType: 'prompt',
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600, 
    },
    manifest: {
      name: 'Golf Nanks', 
      short_name: 'Nanks',
      theme_color: '#020617', 
      background_color: '#020617',
      display: 'standalone',
      start_url: '/', 
      scope: '/',     
      icons: [
        {
          src: '/icon.png',
          sizes: '192x192',
          type: 'image/png'
        },
        { 
          src: '/icon.png', 
          sizes: '512x512', 
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  },

  colorMode: {
    classSuffix: '', 
    preference: 'light', 
    fallback: 'light'
  },

  nitro: {
    preset: 'firebase-app-hosting'
  },

  ssr: true 
})