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
  onMessage(messaging, (payload) => {
    const announcementStore = useAnnouncementStore()
    
    announcementStore.push({
      title: payload.notification?.title || 'League Alert',
      body: payload.notification?.body || '',
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