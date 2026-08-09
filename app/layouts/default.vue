<template>
  <div class="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased font-sans">
    
    <Transition name="fade">
      <div 
        v-if="!isMounted || !authStore.isInitialized" 
        class="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center"
      >
        <Icon name="mdi:golf" class="size-16 text-emerald-500 animate-bounce mb-4" />
        <p class="text-secondary text-[10px] uppercase tracking-[0.2em]">Syncing Data...</p>
      </div>
    </Transition>

    <AppNavbar />

    <ClientOnly>
      <GlobalAnnouncements /> 
      <AppToast />
      <AppConfirm />
      <AppLoading :active="ui.isGlobalLoading" :message="ui.loadingMessage" />
    </ClientOnly>

    <main class="pt-24 px-2 pb-32 transition-all duration-500">
      <slot /> </main>

    <ClientOnly>
      <LiveRoundFooter 
        v-if="dataStore.activeLiveRound"
        :round-id="dataStore.activeLiveRound.id"
        :league-id="dataStore.activeLiveRound.leagueId" 
        :iso="dataStore.activeLiveRound.iso"
        :active-tab="currentTab"
      />
    </ClientOnly>

    <PwaUpdater />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '~/stores/auth' // Explicitly import to be safe
import { useUIStore } from '~/stores/ui'
import { useData } from '~/stores/data'

// Initialize the stores immediately
const authStore = useAuthStore()
const ui = useUIStore()
const dataStore = useData()
const route = useRoute()

const isMounted = ref(false)

// Logic for navigation state
const currentTab = computed(() => {
  if (route.path.includes('rounds')) return 'scorecard'
  if (route.path.includes('leaderboard')) return 'leaderboard'
  return 'home'
})

onMounted(() => {
  isMounted.value = true
})
</script>

<style scoped>
/* Smooth fade for the splash screen */
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-leave-to {
  opacity: 0;
}
</style>