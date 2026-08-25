import { getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { useAnnouncementStore } from '~/stores/announcements'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const { $db } = useNuxtApp()
  
  // Access your toast system
  const toast = useToast()
  const app = getApp()
  const messaging = getMessaging(app)

  // --- Handle Foreground Messages ---
  // Messages are sent data-only (see functions/index.js) so title/body live
  // under payload.data rather than payload.notification.
  onMessage(messaging, (payload) => {
    const announcementStore = useAnnouncementStore()

    announcementStore.push({
      title: payload.data?.title || 'League Alert',
      body: payload.data?.body || '',
      type: (payload.data?.priority as any) || 'info',
      url: payload.data?.url
    })
  })

  return {
    provide: {
      fcm: {
        async requestToken() {
          try {
            const permission = await Notification.requestPermission()
            
            if (permission === 'granted') {
              // Wait for the PWA Service Worker to be ready
              const registration = await navigator.serviceWorker.ready
              
              return await getToken(messaging, {
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