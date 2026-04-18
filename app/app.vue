<template>
  <div class="antialiased font-sans selection:bg-emerald-500/30 bg-slate-950 min-h-screen text-slate-200">
    <AppNavbar />
    
    <ClientOnly>
      <AppToast />
      <AppConfirm />
      <AppLoading :active="ui.isGlobalLoading" :message="ui.loadingMessage" />
    </ClientOnly>

    <NuxtLayout>
      <div class="relative transition-all duration-500">
        <NuxtPage />
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup>
// Removed unused useAuthStore
import { useData } from '~/stores/data'
import { useUIStore } from '~/stores/ui'

const dataStore = useData()
const ui = useUIStore()
const { hook } = useNuxtApp()

/**
 * 1. SSR HYDRATION
 */
const { data } = await useAsyncData('initial-data-hydration', async () => {
  await dataStore.hydrateStore()
  return true
})

/**
 * 2. VISIBILITY MANAGEMENT (Phone in Pocket)
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
 * 3. PAGE LOADING HOOKS
 * These automatically trigger your global AppLoading component during route changes!
 */
hook('page:start', () => ui.setLoading(true, 'Loading...'))
hook('page:finish', () => {
  setTimeout(() => ui.setLoading(false), 300)
})
</script>

<style>
/* Disable text selection and tap highlights globally */
body {
  -webkit-tap-highlight-color: transparent; /* Removes the grey flash on Android/iOS taps */
  -webkit-touch-callout: none; /* Disables the iOS popup when you long-press */
  user-select: none; /* Prevents text from being highlighted when tapping quickly */
}

/* Re-enable selection and cursors ONLY for actual input fields */
input, textarea {
  user-select: auto;
  caret-color: auto; /* Ensures the cursor comes back when typing in a form */
}

/* If you ever have a specific card that still shows a cursor, you can force it */
button, a, .cursor-pointer {
  caret-color: transparent; 
}

/* Smooth Page Transitions */
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

/* Custom Scrollbar */
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