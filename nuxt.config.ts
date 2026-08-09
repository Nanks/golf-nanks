// https://nuxt.com
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2026-04-18', 
  future: { compatibilityVersion: 4 },

  runtimeConfig: {
    public: {
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