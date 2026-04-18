import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const auth = getAuth()

  // We use nuxtApp.$auth which we provided universally in firebase.ts
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('🔐 Auth: User session restored', user.uid)
      authStore.setUser(user) // This triggers your fetchUserProfile logic!
    } else {
      console.log('🔐 Auth: No active session')
      authStore.setUser(null)
    }
  })
})