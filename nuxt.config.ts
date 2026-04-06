// https://nuxt.com
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  // Enables Nuxt 4 features and directory structure
  future: {
    compatibilityVersion: 4,
  },

  // Modules
  modules: ['@vite-pwa/nuxt', '@nuxtjs/color-mode', '@pinia/nuxt', '@nuxt/icon'],

  // Combine both into a SINGLE vite block
  vite: {
    plugins: [
      tailwindcss(),
    ],
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

  css: ['~/assets/css/main.css'],

  // PWA Settings
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Golf Nanks',
      short_name: 'Nanks',
      theme_color: '#000000',
      icons: [
        { src: 'pwa-xpng', sizes: 'x', type: 'image/png' },
        { src: 'pwa-xpng', sizes: 'x', type: 'image/png' }
      ]
    }
  },

  colorMode: {
    classSuffix: '', 
    preference: 'system',
    fallback: 'light'
  },

  nitro: {
    preset: 'firebase',
    firebase: {
      gen: 2 
    }
  },

  // Ensure Firebase only runs on the client side
  ssr: false 
})
