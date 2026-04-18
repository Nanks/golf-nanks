import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  };

  // Initialize App (Safe for both SSR and Client)
  const app = getApps().length === 0 
    ? initializeApp(firebaseConfig) 
    : getApp();

  const db = getFirestore(app);
  
  // Initialize Auth ONLY on the client
  let auth = null;
  if (import.meta.client) {
    auth = getAuth(app);
  }

  return {
    provide: {
      db,
      auth // This will be null on the server, but the object on the client
    }
  };
});