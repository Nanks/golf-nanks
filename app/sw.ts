
/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare let self: ServiceWorkerGlobalScope;

// --- 1. WORKBOX SETUP ---
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// This array is dynamically injected by the Vite PWA plugin during build
precacheAndRoute(self.__WB_MANIFEST);

// --- 2. FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// --- 3. BACKGROUND PUSH HANDLER ---
onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Firebase background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Golf Nanks Update';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon.png',
    data: payload.data, // Allows you to pass custom routing data (e.g., link to a specific round)
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- 4. NOTIFICATION CLICK HANDLER ---
self.addEventListener('notificationclick', (event) => {
  // 1. Close the notification popup on the user's device
  event.notification.close();
  
  // 2. Grab the URL we passed from the Cloud Function (fallback to home)
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      
      // 3. Use a for...of loop (cleaner and TypeScript-friendly)
      for (const client of windowClients) {
        
        // Add a safety check to ensure 'client' is defined before accessing properties
        if (client && client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      
      // 4. If the PWA is completely closed, launch it directly to the target URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});