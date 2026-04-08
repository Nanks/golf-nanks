<template>
  <div :class="{ 'dark': isDarkMode }">
    <div class="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      
      <NuxtLoadingIndicator color="#10b981" :height="3" />

      <template v-if="!isInitialLoading && dataStore.isBooted">
        <AppNavbar />
        <main class="pt-16">
          <NuxtPage />
        </main>
      </template>

      <div v-else class="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex items-center justify-center z-[200]">
        <div class="text-emerald-600 font-black animate-pulse uppercase tracking-widest flex flex-col items-center gap-4">
          <Icon name="mdi:golf" class="size-12 opacity-50" />
          <span>Syncing Data...</span>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { useData } from '~/stores/data';

const { isLoggedIn, isInitialLoading, initAuth, player } = useAuth();
const dataStore = useData();
const isDarkMode = useState('darkMode', () => false);

onMounted(() => {
  initAuth();
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true;
  }
});

// NEW: Global Boot Sequence
// Watches the player object. The second they log in, it fetches all courses and leagues globally.
watch(player, async (newPlayer) => {
  if (newPlayer && !dataStore.isBooted) {
    await dataStore.bootstrap(newPlayer.leagues || []);
  }
}, { immediate: true });
</script>