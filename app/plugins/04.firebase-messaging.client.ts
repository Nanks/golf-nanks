import { getApp } from 'firebase/app'
import type { Messaging } from 'firebase/messaging'
import { useAnnouncementStore } from '~/stores/announcements'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public

  let messaging: Messaging | null = null
  let modulePromise: Promise<typeof import('firebase/messaging')> | null = null

  // Very few visitors ever touch push notifications, so there's no reason to
  // pull the messaging SDK into every page load's bundle and register a
  // listener for everyone. Loaded (and memoized) lazily instead -- either
  // right away if the user already granted permission in an earlier session
  // (so foreground alerts work this session too), or on the first
  // requestToken() call when they opt in via the navbar toggle.
  const loadMessaging = async () => {
    if (!modulePromise) modulePromise = import('firebase/messaging')
    const mod = await modulePromise

    if (!messaging) {
      messaging = mod.getMessaging(getApp())

      // --- Handle Foreground Messages ---
      // Messages are sent data-only (see functions/index.js) so title/body
      // live under payload.data rather than payload.notification.
      mod.onMessage(messaging, (payload) => {
        const announcementStore = useAnnouncementStore()
        announcementStore.push({
          title: payload.data?.title || 'League Alert',
          body: payload.data?.body || '',
          type: (payload.data?.priority as any) || 'info',
          url: payload.data?.url
        })
      })
    }

    return { mod, messaging }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    loadMessaging()
  }

  return {
    provide: {
      fcm: {
        async requestToken() {
          try {
            const permission = await Notification.requestPermission()

            if (permission === 'granted') {
              const { mod, messaging } = await loadMessaging()
              // Wait for the PWA Service Worker to be ready
              const registration = await navigator.serviceWorker.ready

              return await mod.getToken(messaging, {
                vapidKey: config.firebaseVapidKey,
                serviceWorkerRegistration: registration
              })
            }
          } catch (error) {
            console.error('FCM Token generation failed:', error)
          }
        }
      }
    }
  }
})
