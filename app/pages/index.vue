<template>
  <div class="max-w-2xl mx-auto">
    <section v-if="authStore.isLoggedIn && authStore.userProfile" class="mb-6">
      <div class="card-base p-5 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-primary text-xl">
            {{ authStore.userProfile.fname }} {{ authStore.userProfile.lname }}
          </h1>
        </div>

        <div @click="showGhinModal = true" class="relative active:scale-95 transition-transform cursor-pointer">
          <div class="absolute -top-1.5 -right-1.5 size-5 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-md z-10">
            <Icon name="mdi:pencil" class="size-2" />
          </div>
          
          <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-center min-w-[85px]">
            <p class="text-secondary text-[9px] mb-1">GHIN</p>
            <p class="text-primary text-xl tabular-nums">
              {{ authStore.userProfile.ghin || '—' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="flex items-center justify-between mb-4 px-2">
        <h2 class="text-primary text-2xl text-emerald-500">Leagues</h2>
        <button v-if="authStore.isLoggedIn" @click="navigateTo('/rounds/setup')" class="text-secondary text-[10px] text-emerald-500 flex items-center gap-1.5 active:opacity-70">
          <Icon name="mdi:plus-circle-outline" class="size-4" /> Casual Round
        </button>
      </div>

      <div class="space-y-6 mb-4">
        <div v-if="myLeagues.length > 0">
          <h3 class="text-secondary text-[10px] mb-3 px-2">My Leagues</h3>
          <div class="grid grid-cols-1 gap-3">
            <LeagueCard v-for="league in myLeagues" :key="league.id" :league="league" :is-member="true" />
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div v-if="otherLeagues.length > 0">
          <h3 class="text-secondary text-[10px] mb-3 px-2">Other Leagues</h3>
          <div class="grid grid-cols-1 gap-3">
            <LeagueCard v-for="league in otherLeagues" :key="league.id" :league="league" :is-member="false" />
          </div>
        </div>
      </div>
    </section>

    <ClientOnly>
      <GhinModal :is-open="showGhinModal" :player="authStore.userProfile" @close="showGhinModal = false" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'

const authStore = useAuthStore()
const dataStore = useData()

// UI State
const showGhinModal = ref(false)
const isMounted = ref(false)

// Computed Data
const myLeagues = computed(() => {
  // Wait until we are mounted and auth is fully ready
  if (!isMounted.value || !authStore.isInitialized || !authStore.isLoggedIn || !authStore.userProfile?.leagues) {
    return []
  }
  return dataStore.leagues.filter(l => authStore.userProfile.leagues.includes(l.id))
})

const otherLeagues = computed(() => {
  // Prevent hydration mismatches by returning empty until mounted
  if (!isMounted.value || !authStore.isInitialized) return []

  // If logged out, show everything
  if (!authStore.isLoggedIn) return dataStore.leagues

  // If logged in, show leagues user hasn't joined
  return dataStore.leagues.filter(l => !authStore.userProfile?.leagues?.includes(l.id))
})

// Lifecycle Hooks
onMounted(() => {
  isMounted.value = true 
  dataStore.startLiveListener()
})

onUnmounted(() => {
  dataStore.stopLiveListener()
})
</script>