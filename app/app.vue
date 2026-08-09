<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useData } from '~/stores/data'
import { useUIStore } from '~/stores/ui'
import { useAuthStore } from '~/stores/auth'

const { initAuth } = useAuth()
const dataStore = useData()
const ui = useUIStore()
const authStore = useAuthStore()
const { hook } = useNuxtApp()

/**
 * 1. APP-WIDE INITIALIZATION
 * These run exactly once when the app first loads.
 */
onMounted(() => {
  if (import.meta.client) {
    initAuth();

    // NEW: Wait for the user profile to load before starting the query
    watch(() => authStore.userProfile, (newProfile) => {
      if (newProfile?.id) {
        dataStore.startLiveListener({ myRoundsOnly: true });
      } else {
        dataStore.stopLiveListener(); // Clean up if they log out
      }
    }, { immediate: true });
  }
});

/**
 * 2. DATA HYDRATION
 * Pre-fetches essential league/player data for SSR/Hydration.
 */
const { data } = await useAsyncData('initial-data-hydration', async () => {
  await dataStore.hydrateStore()
  return true
})

/**
 * 3. VISIBILITY MANAGEMENT (Phone in Pocket)
 * Automatically cleans up or resumes Firestore listeners based on app focus.
 */
if (import.meta.client) {
  useEventListener(document, 'visibilitychange', () => {
    if (document.hidden) {
      console.log('⛳️ App backgrounded: Cleaning up listeners...')
      dataStore.stopLiveListener()
    } else {
      console.log('⛳️ App foregrounded: Resuming live data...')
      dataStore.resumeListener()
    }
  })
}

/**
 * 4. GLOBAL PAGE LOADING HOOKS
 * Controls the GlobalLoading component in default.vue during route changes.
 */
hook('page:start', () => ui.setLoading(true, 'Loading...'))
hook('page:finish', () => {
  // Short delay for a smoother "reveal" of the new page
  setTimeout(() => ui.setLoading(false), 300)
})
</script>

<style>
/* GLOBAL STYLES 
  This is the best place for transitions and scrollbar overrides 
*/
body {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
}

input, textarea {
  user-select: auto;
  caret-color: auto;
}

/* Page Transition Animations */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease-out;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #020617; 
}
::-webkit-scrollbar-thumb {
  background: #1e293b; 
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #10b981; 
}
</style>