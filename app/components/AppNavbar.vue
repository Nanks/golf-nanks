<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 h-20">
    <div class="max-w-7xl mx-auto h-full flex items-center justify-between">
      
      <NuxtLink to="/" class="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white group">
        Golf <span class="text-emerald-500">Nanks</span>
      </NuxtLink>

      <div class="relative z-[70]">
        <button 
          v-if="isMounted" 
          @click="isMenuOpen = !isMenuOpen" 
          class="p-2 transition-all active:scale-90 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-900 dark:text-white"
        >
          <Icon :name="isMenuOpen ? 'mdi:close' : 'mdi:menu'" class="size-8" />
        </button>

        <Transition name="slide-fade">
          <div v-if="isMenuOpen" class="absolute top-16 right-0 w-80 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-[60] space-y-3">
            
            <div v-if="authStore.isLoggedIn && authStore.userProfile" class="space-y-3">
              <div class="px-4 py-3 bg-slate-900 rounded-xl border-l-4 border-emerald-500 shadow-lg">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Authenticated As</p>
                <p class="text-xl text-white truncate text-primary italic uppercase !leading-tight">
                  {{ authStore.userProfile.fname }} {{ authStore.userProfile.lname }}
                </p>
              </div>

              <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div :class="hasNotificationsEnabled ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'" class="p-2 rounded-lg shadow-sm transition-colors">
                    <Icon :name="hasNotificationsEnabled ? 'mdi:bell-ring' : 'mdi:bell-off-outline'" class="size-5" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-black uppercase tracking-widest text-primary leading-none mb-1">Push Alerts</span>
                    <span class="text-[9px] font-bold uppercase tracking-widest text-secondary">
                      {{ hasNotificationsEnabled ? 'Receiving updates' : 'Tap to enable' }}
                    </span>
                  </div>
                </div>

                <button 
                  @click="toggleNotifications"
                  :class="hasNotificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
                  class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                >
                  <span 
                    :class="hasNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'"
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  ></span>
                </button>
              </div>

              <button v-if="authStore.userProfile?.role === 'super' || authStore.isSuperAdmin" @click="handleNav('/admin/create-league')" class="menu-btn group">
                <div class="icon-box bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20">
                  <Icon name="mdi:plus-thick" class="size-5" />
                </div>
                <span class="text-primary !text-[12px]">System Admin</span>
              </button>
            </div>

            <div v-else class="space-y-3">
              <div class="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-l-4 border-slate-400 dark:border-slate-600 shadow-sm">
                <p class="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Welcome</p>
                <p class="text-xl text-slate-800 dark:text-white truncate text-primary italic uppercase !leading-tight">
                  Guest User
                </p>
              </div>

              <button @click="handleNav('/login')" class="menu-btn group">
                <div class="icon-box bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20">
                   <Icon name="mdi:login" class="size-6" />
                </div>
                <span class="text-primary text-slate-900 dark:text-white">Sign In</span>
              </button>
            </div>

            <div class="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex relative h-14 items-center border border-slate-200 dark:border-slate-700 my-4">
              <div 
                class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-900 dark:bg-emerald-500 rounded-lg shadow-md transition-all duration-300 ease-out z-0"
                :class="isDark ? 'left-[calc(50%+2px)]' : 'left-1'"
              ></div>
              
              <button @click="colorMode.preference = 'light'" class="pill-btn" :class="{ 'text-white font-black': !isDark, 'text-slate-500': isDark }">
                <Icon name="mdi:white-balance-sunny" class="size-5" />
                <span>Light</span>
              </button>
              <button @click="colorMode.preference = 'dark'" class="pill-btn" :class="{ 'text-white font-black': isDark, 'text-slate-500': !isDark }">
                <Icon name="mdi:weather-night" class="size-5" />
                <span>Dark</span>
              </button>
            </div>

            <div v-if="authStore.isLoggedIn" class="space-y-3">
              <div class="divider"></div>
              <button @click="handleLogout" class="menu-btn group hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black">
                <div class="icon-box bg-slate-200 dark:bg-slate-800 group-hover:bg-transparent">
                  <Icon name="mdi:power" class="size-6" />
                </div>
                <span class="text-secondary font-black">Sign Out</span>
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue' // Explicitly included to prevent cache issues
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { useToast } from '~/composables/useToast'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

const { $fcm, $db } = useNuxtApp()
const authStore = useAuthStore()
const ui = useUIStore()
const toast = useToast()
const colorMode = useColorMode()

const isMenuOpen = ref(false)
const isMounted = ref(false)
const hasNotificationsEnabled = ref(false)

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

const toggleNotifications = async () => {
  if (!authStore.userProfile?.id) return

  ui.setLoading(true, hasNotificationsEnabled.value ? "Disabling..." : "Enabling...")
  
  try {
    const playerRef = doc($db, 'players', authStore.userProfile.id)

    if (hasNotificationsEnabled.value) {
      // --- OPT OUT ---
      if (Notification.permission === 'granted') {
        const token = await $fcm.requestToken() 
        if (token) {
          // Remove this specific device's token from the database
          await updateDoc(playerRef, {
            fcmTokens: arrayRemove(token)
          })
        }
      }
      hasNotificationsEnabled.value = false
      toast.add("Push alerts disabled for this device", "info")

    } else {
      // --- OPT IN ---
      const token = await $fcm.requestToken()
      if (token) {
        await updateDoc(playerRef, {
          fcmTokens: arrayUnion(token)
        })
        hasNotificationsEnabled.value = true
        toast.add("Push alerts enabled!", "success")
      } else {
        toast.add("Permission denied in browser settings", "error")
      }
    }
  } catch (error) {
    console.error("FCM Toggle Error:", error)
    toast.add("Could not update notification settings", "error")
  } finally {
    ui.setLoading(false)
  }
}

onMounted(async () => { 
  isMounted.value = true 
  
  // Safe check for the Notification API (prevents SSR crash)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      // Silently verify if the token exists in the user profile
      const token = await $fcm.requestToken()
      if (token && authStore.userProfile?.fcmTokens?.includes(token)) {
        hasNotificationsEnabled.value = true
      }
    } catch (error) {
      console.log("Could not verify token state silently.")
    }
  }
})
</script>

<style scoped>
@reference "tailwindcss";

.menu-btn {
  @apply w-full flex items-center gap-4 px-3 py-2 transition-all active:scale-[0.98] rounded-xl;
}

.icon-box {
  @apply size-10 rounded-xl flex items-center justify-center shrink-0 transition-all border border-transparent;
}

.pill-btn {
  @apply flex-1 flex items-center justify-center gap-2 h-full text-[10px] uppercase tracking-widest z-10 transition-all duration-300;
}

.slide-fade-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-fade-leave-active { transition: all 0.2s cubic-bezier(0.7, 0, 0.84, 0); }
.slide-fade-enter-from, .slide-fade-leave-to { 
  transform: translateY(-20px) scale(0.95); 
  opacity: 0; 
  filter: blur(4px);
}
</style>