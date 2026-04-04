<template>
  <div :class="{ 'dark': isDarkMode }">
    <div class="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      <!-- Only hide while the VERY FIRST auth check is happening -->
      <AppNavbar v-if="!isInitialLoading" />
      
      <main class="pt-16">
        <NuxtPage />
      </main>

      <!-- Global Loader -->
      <div v-if="isInitialLoading" class="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex items-center justify-center z-[200]">
        <div class="text-emerald-600 font-black animate-pulse uppercase tracking-widest">Golf Nanks...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Assuming your useAuth composable now also manages global theme state
const { isLoggedIn, isInitialLoading, initAuth } = useAuth();
const isDarkMode = useState('darkMode', () => false);

onMounted(() => {
  initAuth();
  // Check local storage or system preference for dark mode
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true;
  }
});
</script>
