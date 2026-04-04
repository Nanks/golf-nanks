// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  // Enables Nuxt 4 features and directory structure
  future: {
    compatibilityVersion: 4,
  },

  // Modules
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt', '@nuxtjs/color-mode'],

  // PWA Settings
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Golf Nanks',
      short_name: 'Nanks',
      theme_color: '#000000',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    }
  },

  colorMode: {
    classSuffix: '', // Important: Tailwind v3/v4 expects 'dark' not 'dark-mode'
    preference: 'system',
    fallback: 'light'
  },

  nitro: {
    preset: 'firebase',
    firebase: {
      gen: 2 // Use 2nd generation functions (faster, better)
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
      ]
    }
  },

  // Ensure Firebase only runs on the client side
  ssr: false 
})