<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 px-6 h-20">
    <div class="max-w-7xl mx-auto h-full flex items-center justify-between">
      
      <NuxtLink to="/" class="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
        Golf Nanks
      </NuxtLink>

      <div class="relative">
        <button @click="isMenuOpen = !isMenuOpen" class="p-2 text-slate-900 dark:text-white transition-transform active:scale-90">
          <Icon :name="isMenuOpen ? 'mdi:close' : 'mdi:menu'" class="w-8 h-8" />
        </button>

        <Transition name="slide-fade">
          <div v-if="isMenuOpen" class="absolute top-14 right-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl p-4 z-[60] space-y-4">
            
            <div v-if="authStore.userProfile">
              <div class="px-4 py-3 mb-2 bg-slate-50 dark:bg-slate-950/50 rounded-2xl">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Logged in as</p>
                <p class="font-black text-slate-900 dark:text-white truncate">{{ authStore.userProfile.fname }} {{ authStore.userProfile.lname }}</p>
              </div>

              <button @click="navigateTo('/profile')" class="menu-item group">
                <Icon name="mdi:account-circle-outline" class="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                <span>Update Profile</span>
              </button>
              
              <div class="p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl flex relative">
                <div 
                  class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-all duration-300 ease-out"
                  :class="isDark ? 'left-[calc(50%+2px)]' : 'left-1'"
                ></div>
                
                <button @click="colorMode.preference = 'light'" class="pill-btn" :class="{ 'text-emerald-600 dark:text-emerald-400': !isDark }">
                  <Icon name="mdi:white-balance-sunny" class="w-4 h-4" />
                  <span>Light</span>
                </button>
                <button @click="colorMode.preference = 'dark'" class="pill-btn" :class="{ 'text-emerald-600 dark:text-emerald-400': isDark }">
                  <Icon name="mdi:weather-night" class="w-4 h-4" />
                  <span>Dark</span>
                </button>
              </div>

              <div v-if="authStore.isSuperAdmin" class="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button @click="navigateTo('/admin/create-league')" class="menu-item group text-emerald-600 dark:text-emerald-400">
                  <Icon name="mdi:plus-circle-outline" class="w-5 h-5" />
                  <span>Create New League</span>
                </button>
              </div>

              <button @click="handleLogout" class="menu-item text-red-500 mt-2">
                <Icon name="mdi:logout-variant" class="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const isMenuOpen = ref(false)
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const handleLogout = () => {
  isMenuOpen.value = false
  authStore.logout()
  navigateTo('/login')
}
</script>

<style scoped>
@reference "tailwindcss";

.menu-item {
  @apply w-full flex items-center gap-4 px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all;
}

.pill-btn {
  @apply flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest z-10 transition-colors duration-300;
}

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-10px); opacity: 0; }
</style>