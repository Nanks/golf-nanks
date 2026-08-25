
/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare let self: ServiceWorkerGlobalScope;

// --- 1. WORKBOX SETUP ---
// registerType: 'prompt' (nuxt.config.ts) + PwaUpdater.vue are meant to hold
// a newly-installed worker in the "waiting" state and only activate it once
// the user taps "Refresh Now" -- that button calls $pwa.updateServiceWorker(),
// which posts { type: 'SKIP_WAITING' } to this worker. An unconditional
// self.skipWaiting() here defeats that entirely: the new worker activates
// (and, via clientsClaim() below, takes over every open tab) the moment it
// installs, regardless of what the user chose -- including mid-round, while
// someone's actively entering scores. Only skip waiting when actually asked.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
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
// Messages are sent data-only (no top-level `notification` field) so this is
// the *only* place a background push gets displayed. A `notification` field
// on the FCM payload makes the browser auto-display it in addition to any
// showNotification() call here, which is what was causing every push to
// show up twice on-device.
onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Firebase background message received:', payload);

  const data = payload.data || {};
  const notificationTitle = data.title || 'Golf Nanks Update';

  // RSVP-relevant notifications (a new event, or a nudge to RSVP) get
  // In/Out action buttons right on the notification.
  const actions = (data.type === 'new_event' || data.type === 'rsvp_nudge') && data.eventId && data.leagueId
    ? [
        { action: 'rsvp_in', title: "I'm In" },
        { action: 'rsvp_out', title: "Can't Make It" }
      ]
    : undefined;

  const notificationOptions = {
    body: data.body,
    icon: '/icon.png',
    data, // Custom routing data (url, eventId, leagueId, type, etc.)
    actions
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- 4. NOTIFICATION CLICK HANDLER ---
self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};

  // 1. Close the notification popup on the user's device
  event.notification.close();

  // 2. Figure out where to send them. An In/Out action tap appends an rsvp
  // query param the app watches for on the calendar page (calendar.vue);
  // a plain tap on the notification body just goes to the base url.
  let targetUrl = data.url || '/';
  if ((event.action === 'rsvp_in' || event.action === 'rsvp_out') && data.eventId) {
    const status = event.action === 'rsvp_in' ? 'in' : 'out';
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}rsvp=${status}&eventId=${data.eventId}`;
  }

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