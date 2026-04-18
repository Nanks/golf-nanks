<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 px-6 h-20">
    <div class="max-w-7xl mx-auto h-full flex items-center justify-between">
      
      <NuxtLink to="/" class="text-xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
        Golf Nanks
      </NuxtLink>

      <div class="relative">
        <button v-if="isMounted" @click="isMenuOpen = !isMenuOpen" class="p-2 text-slate-900 dark:text-white transition-transform active:scale-90">
          <Icon :name="isMenuOpen ? 'mdi:close' : 'mdi:menu'" class="size-9" />
        </button>

        <Transition name="slide-fade">
          <div v-if="isMenuOpen" class="absolute top-20 right-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 z-[60] space-y-4">
            
            <div v-if="authStore.isLoggedIn && authStore.userProfile" class="space-y-4">
              <div class="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Logged in as</p>
                <p class="text-lg font-black text-slate-900 dark:text-white truncate leading-none">
                  {{ authStore.userProfile.fname }} {{ authStore.userProfile.lname }}
                </p>
              </div>

              <button @click="handleNav('/profile')" class="menu-item group">
                <Icon name="mdi:account-circle-outline" class="size-7 text-slate-400 group-hover:text-emerald-500" />
                <span>Update Profile</span>
              </button>
              
              <div class="p-1 bg-slate-100 dark:bg-slate-950 rounded-xl flex relative h-14 items-center border border-slate-200 dark:border-slate-800">
                <div 
                  class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-800 rounded-lg shadow-md transition-all duration-300 ease-out z-0"
                  :class="isDark ? 'left-[calc(50%+2px)]' : 'left-1'"
                ></div>
                
                <button @click="colorMode.preference = 'light'" class="pill-btn" :class="{ 'text-emerald-600 dark:text-emerald-400': !isDark }">
                  <Icon name="mdi:white-balance-sunny" class="size-6" />
                  <span>Light</span>
                </button>
                <button @click="colorMode.preference = 'dark'" class="pill-btn" :class="{ 'text-emerald-600 dark:text-emerald-400': isDark }">
                  <Icon name="mdi:weather-night" class="size-6" />
                  <span>Dark</span>
                </button>
              </div>

              <div v-if="authStore.isAdminForType('super')" class="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button @click="handleNav('/admin/create-league')" class="menu-item group text-emerald-600 dark:text-emerald-400">
                  <Icon name="mdi:plus-circle-outline" class="size-7" />
                  <span>Create League</span>
                </button>
              </div>

              <button @click="handleLogout" class="menu-item text-red-500 mt-2 hover:bg-red-50 dark:hover:bg-red-950/20">
                <Icon name="mdi:logout-variant" class="size-7" />
                <span>Logout</span>
              </button>
            </div>

            <div v-else-if="authStore.isInitialized" class="space-y-4">
              <div class="px-4 py-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <p class="text-md font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Guest Mode</p>
              </div>

              <button @click="handleNav('/login')" class="menu-item group text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10">
                <Icon name="mdi:login-variant" class="size-7" />
                <span>Sign In</span>
              </button>

              <div class="p-1 bg-slate-100 dark:bg-slate-950 rounded-xl flex relative h-10 items-center border border-slate-200 dark:border-slate-800">
                <div 
                  class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-800 rounded-lg shadow-md transition-all duration-300 ease-out z-0"
                  :class="isDark ? 'left-[calc(50%+2px)]' : 'left-1'"
                ></div>
                <button @click="colorMode.preference = 'light'" class="pill-btn" :class="{ 'text-emerald-600 dark:text-emerald-400': !isDark }">
                  <Icon name="mdi:white-balance-sunny" class="size-6" />
                  <span>Light</span>
                </button>
                <button @click="colorMode.preference = 'dark'" class="pill-btn" :class="{ 'text-emerald-600 dark:text-emerald-400': isDark }">
                  <Icon name="mdi:weather-night" class="size-6" />
                  <span>Dark</span>
                </button>
              </div>
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
const isMounted = ref(false)

const isDark = computed(() => colorMode.value === 'dark')

const handleNav = (path) => {
  isMenuOpen.value = false
  navigateTo(path)
}

const handleLogout = async () => {
  isMenuOpen.value = false
  await authStore.logout()
  navigateTo('/')
}

onMounted(() => {
  isMounted.value = true
})
</script>

<style scoped>
@reference "tailwindcss";

.menu-item {
  @apply w-full flex items-center gap-4 px-4 py-4 text-sm font-black uppercase tracking-tight text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all active:scale-95;
}

.pill-btn {
  @apply flex-1 flex items-center justify-center gap-3 h-full text-[11px] font-black uppercase tracking-widest z-10 transition-colors duration-300;
}

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-10px); opacity: 0; }
</style>