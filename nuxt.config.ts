// https://nuxt.com
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2026-04-18', 
  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID
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
  },

  css: ['~/assets/css/main.css'],

  pwa: {
    registerType: 'prompt',
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600, 
    },
    workbox: {
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'] 
    },
    manifest: {
      name: 'Golf Nanks', 
      short_name: 'Nanks',
      theme_color: '#020617', 
      background_color: '#020617',
      display: 'standalone',
      start_url: '/', // <-- ADDED: Explicitly tell iOS where the app starts
      scope: '/',     // <-- ADDED: Lock iOS inside this root scope
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
    preference: 'dark', 
    fallback: 'dark'
  },

  nitro: {
    preset: 'firebase-app-hosting'
  },

  ssr: true 
})