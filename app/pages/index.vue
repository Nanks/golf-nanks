<template>
  <div class="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-24 px-2 pb-24">

    <ClientOnly>
      <div v-if="!authStore.isInitialized || authStore.loading" 
           class="absolute inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center pt-32">
        <Icon name="mdi:golf" class="size-12 text-emerald-500 animate-bounce mb-4" />
        <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Loading Player...</p>
      </div>
    </ClientOnly>

    <ClientOnly>
      <section v-if="authStore.isLoggedIn && authStore.userProfile" class="mb-2">
        <div class="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <h1 class="text-xl font-black italic uppercase leading-none tracking-tighter">
              {{ authStore.userProfile.fname }} {{ authStore.userProfile.lname }}
            </h1>
          </div>

          <div @click="showGhinModal = true" class="relative active:scale-95 transition-transform cursor-pointer">
            <div class="absolute -top-1.5 -right-1.5 size-5 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-md z-10">
              <Icon name="mdi:pencil" class="size-2" />
            </div>
            
            <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-center min-w-[85px]">
              <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">GHIN</p>
              <p class="text-xl font-black italic tabular-nums leading-none">
                {{ authStore.userProfile.ghin || '—' }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </ClientOnly>

    <section class="mb-2">
      <div class="flex items-center justify-between mb-2 px-3">
        <h2 class="text-2xl font-black tracking-tighter uppercase italic text-emerald-500">Leagues</h2>
        <ClientOnly>
          <button v-if="authStore.isLoggedIn" @click="navigateTo('/rounds/setup')" class="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 active:opacity-70">
            <Icon name="mdi:plus-circle-outline" class="size-4" /> Casual Round
          </button>
        </ClientOnly>
      </div>

      <ClientOnly>
        <div>
          <div v-if="authStore.isLoggedIn && myLeagues.length > 0" class="mb-2">
            <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-3">My Leagues</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 px-1">
              <LeagueCard 
                v-for="league in myLeagues" 
                :key="league.id" 
                :league="league" 
                :is-member="true"
              />
            </div>
          </div>

          <div v-if="otherLeagues.length > 0">
            <h3 v-if="authStore.isLoggedIn" class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-3">Other Leagues</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 px-1">
              <LeagueCard 
                v-for="league in otherLeagues" 
                :key="league.id" 
                :league="league" 
                :is-member="false"
              />
            </div>
          </div>
        </div>

        <template #fallback>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 px-1">
            <LeagueCard 
              v-for="league in dataStore.leagues" 
              :key="league.id" 
              :league="league" 
              :is-member="false" 
            />
          </div>
        </template>
      </ClientOnly>
    </section>

    <ClientOnly>
      <GhinModal 
        :is-open="showGhinModal" 
        :player="authStore.userProfile" 
        @close="showGhinModal = false" 
      />
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

// Computed Data
const myLeagues = computed(() => {
  if (!authStore.isLoggedIn || !authStore.userProfile?.leagues) return []
  return dataStore.leagues.filter(l => authStore.userProfile.leagues.includes(l.id))
})

const otherLeagues = computed(() => {
  if (!authStore.isLoggedIn) return dataStore.leagues
  return dataStore.leagues.filter(l => !authStore.userProfile?.leagues?.includes(l.id))
})

// Lifecycle Hooks
onMounted(() => {
  dataStore.startLiveListener()
})

onUnmounted(() => {
  dataStore.stopLiveListener()
})
</script>