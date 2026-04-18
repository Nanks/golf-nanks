import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin((nuxtApp) => {
  const firebaseConfig = {
    apiKey: "AIzaSyBBxnVCn08Kl5d2Esr39yWyug0NglG4Wkg",
    authDomain: "golf-nanks.firebaseapp.com",
    projectId: "golf-nanks",
    storageBucket: "golf-nanks.firebasestorage.app",
    messagingSenderId: "581153026597",
    appId: "1:581153026597:web:082e92751c11f3d2ba85cc",
    measurementId: "G-1CJQKKG7YJ"
  };
console.log('🔥 Initializing Firebase... Server side?', import.meta.server)
let app
  // CRITICAL SERVER FIX: Check if Firebase is already initialized
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApp()
  }

  const db = getFirestore(app)

  return {
    provide: {
      db
    }
  }
})