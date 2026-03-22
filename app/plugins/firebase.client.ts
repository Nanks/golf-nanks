import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export default defineNuxtPlugin(() => {
  const config = {
    apiKey: "AIzaSyBBxnVCn08Kl5d2Esr39yWyug0NglG4Wkg",
    authDomain: "golf-nanks.firebaseapp.com",
    projectId: "golf-nanks",
    storageBucket: "golf-nanks.firebasestorage.app",
    messagingSenderId: "581153026597",
    appId: "1:581153026597:web:082e92751c11f3d2ba85cc",
    measurementId: "G-1CJQKKG7YJ"
  };

  const app = initializeApp(config);
  
  return {
    provide: {
      auth: getAuth(app),
      db: getFirestore(app)
    }
  };
});