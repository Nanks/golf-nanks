import { 
  getAuth, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence, 
  inMemoryPersistence 
} from 'firebase/auth'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // getAuth() doesn't usually throw the SecurityError, setPersistence does.
  // We can safely declare it out here to fix the "let auth" scoping warning.
  const auth = getAuth()

  try {
    // Explicitly attempt to set standard persistence.
    await setPersistence(auth, browserLocalPersistence)

    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('🔐 Auth: User session restored', user.uid)
        authStore.setUser(user)
      } else {
        console.log('🔐 Auth: No active session')
        authStore.setUser(null)
      }
    })

  } catch (err: unknown) {
    // Tell TypeScript this is a standard Error object
    const error = err as Error;
    console.error('🚨 Auth Initialization Error:', error.name, error.message)
    
    // Catch the specific iOS Safari "Block All Cookies" crash
    if (error.name === 'SecurityError' || error.message.includes('insecure')) {
      console.warn('⚠️ Safari blocked local storage. Falling back to memory persistence.')
      
      try {
        await setPersistence(auth, inMemoryPersistence)
        
        onAuthStateChanged(auth, (user) => {
          authStore.setUser(user || null)
        })
        
        // Ensure you add `authError: null` to your auth store state!
        authStore.authError = "Please disable 'Block All Cookies' in Safari settings to log in.";

      } catch (fallbackErr: unknown) {
        const fallbackError = fallbackErr as Error;
        console.error('🚨 Fallback failed:', fallbackError)
        authStore.setUser(null)
      }
    } else {
      // For any other normal auth errors, just set user to null so the app loads
      authStore.setUser(null)
    }
  }
})