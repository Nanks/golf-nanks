<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 h-20">
    <div class="max-w-7xl mx-auto h-full flex items-center justify-between">
      
      <NuxtLink to="/" class="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white group">
        Golf <span class="text-emerald-500">Nanks</span>
      </NuxtLink>

      <button
        v-if="isMounted"
        @click="isMenuOpen = !isMenuOpen"
        class="p-2 transition-all active:scale-90 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-900 dark:text-white"
      >
        <Icon :name="isMenuOpen ? 'mdi:close' : 'mdi:menu'" class="size-8" />
      </button>

      <Teleport to="body">
        <Transition name="sheet">
          <div v-if="isMenuOpen" class="fixed inset-0 z-[100] flex items-end sm:items-start sm:justify-end p-0 sm:p-4 sm:pt-20 bg-slate-900/60 backdrop-blur-sm">
            <div @click="isMenuOpen = false" class="absolute inset-0"></div>

            <div class="sheet-panel relative bg-white dark:bg-slate-900 w-full sm:w-80 rounded-t-[2rem] sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar">

              <div class="flex justify-end mb-1">
                <button @click="isMenuOpen = false" class="modal-close-btn">
                  <Icon name="mdi:close" class="size-5" />
                </button>
              </div>

              <div v-if="authStore.isLoggedIn && authStore.userProfile" class="space-y-3">
              <div class="card-base p-5 flex items-center gap-4">
                <div class="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Icon name="mdi:account" class="size-6 text-emerald-500" />
                </div>
                <h1 class="text-primary text-xl font-bold uppercase tracking-tight truncate">
                  {{ authStore.userProfile.fname }} {{ authStore.userProfile.lname }}
                </h1>
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
              <div class="card-base p-5 flex items-center gap-4">
                <div class="size-11 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Icon name="mdi:account-outline" class="size-6 text-slate-500" />
                </div>
                <h1 class="text-primary text-xl font-bold uppercase tracking-tight">Guest User</h1>
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
                class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-emerald-500 rounded-lg shadow-md transition-all duration-300 ease-out z-0"
                :class="isDark ? 'left-[calc(50%+2px)]' : 'left-1'"
              ></div>
              
              <button @click="colorMode.preference = 'light'" class="pill-btn" :class="{ 'text-slate-700 font-black': !isDark, 'text-slate-500': isDark }">
                <Icon name="mdi:white-balance-sunny" class="size-5" />
                <span>Light</span>
              </button>
              <button @click="colorMode.preference = 'dark'" class="pill-btn" :class="{ 'text-slate-700 font-black': isDark, 'text-slate-500': !isDark }">
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

            <p class="text-center text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest pt-2">
              v{{ appVersion }} &bull; {{ buildTimeLabel }}
            </p>

            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue' // Explicitly included to prevent cache issues
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { useToast } from '~/composables/useToast'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

const { $fcm, $db } = useNuxtApp()
const authStore = useAuthStore()
const ui = useUIStore()
const toast = useToast()
const colorMode = useColorMode()
const runtimeConfig = useRuntimeConfig()

const appVersion = runtimeConfig.public.appVersion
const buildTimeLabel = new Date(runtimeConfig.public.buildTime).toLocaleString('en-US', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
})

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

onMounted(() => {
  isMounted.value = true
})

// authStore.userProfile loads asynchronously (a Firestore listener resolving
// after Firebase Auth rehydrates), so checking it once in onMounted can run
// before it's populated -- on a cold app start this always read as "not
// enabled" even though the underlying push subscription was fine. Watching
// instead re-runs the check once the profile actually arrives.
watch(
  () => authStore.userProfile,
  async (profile) => {
    if (!profile || !('Notification' in window) || Notification.permission !== 'granted') return
    try {
      // Silently verify if the token exists in the user profile
      const token = await $fcm.requestToken()
      if (token && profile.fcmTokens?.includes(token)) {
        hasNotificationsEnabled.value = true
      }
    } catch (error) {
      console.log("Could not verify token state silently.")
    }
  },
  { immediate: true }
)
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
  @apply flex-1 flex items-center justify-center gap-2 h-full text-sm uppercase tracking-widest z-10 transition-all duration-300;
}

.sheet-enter-active { transition: opacity 0.3s ease; }
.sheet-leave-active { transition: opacity 0.2s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }

.sheet-enter-active .sheet-panel { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.sheet-leave-active .sheet-panel { transition: transform 0.2s cubic-bezier(0.7, 0, 0.84, 0); }
.sheet-enter-from .sheet-panel, .sheet-leave-to .sheet-panel {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .sheet-enter-from .sheet-panel, .sheet-leave-to .sheet-panel {
    transform: translateY(-12px) scale(0.97);
  }
}
</style>