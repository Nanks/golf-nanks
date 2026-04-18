// https://nuxt.com
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2026-04-18', 
  future: {
    compatibilityVersion: 4,
  },

  // 1. ADD RUNTIME CONFIG
  // This replaces hardcoded strings in 01.firebase.ts
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
      meta: [{ name: 'theme-color', content: '#000000' }],
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon.png' }
      ]
    }
  },

  // Keep sourcemaps off for production performance
  sourcemap: false,

  vite: {
    plugins: [tailwindcss()],
    // Removed specific Firebase includes unless you specifically hit build errors
  },

  css: ['~/assets/css/main.css'],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Golf Nanks',
      short_name: 'Nanks',
      theme_color: '#000000',
      background_color: '#000000',
      display: 'standalone',
      // Update these to your actual icon paths in /public
      icons: [
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
    preference: 'dark', // Given your screenshot, dark is likely your preferred default
    fallback: 'dark'
  },

  nitro: {
    preset: 'firebase-app-hosting'
  },

  ssr: true 
})