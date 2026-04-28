<template>
  <div class="p-6 max-w-lg mx-auto">
    <div class="mb-8">
      <button 
        @click="navigateTo('/')" 
        class="text-stone-500 flex items-center gap-1 text-xs mb-4 uppercase tracking-widest font-bold"
      >
        <Icon name="mdi:arrow-left" />
        Back to Home
      </button>
      <h1 class="text-4xl font-black uppercase italic text-primary leading-none">
        {{ leagueName }}
      </h1>
      <p class="text-secondary text-xs uppercase tracking-[0.2em] mt-1">
        League Menu
      </p>
    </div>

    <div class="grid gap-4">
      <div 
        v-if="activeRoundId" 
        @click="navigateTo(`/rounds/${activeRoundId}`)"
        class="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
      >
        <div class="flex items-center gap-4">
          <div class="bg-amber-500 text-black p-2 rounded-xl shadow-lg shadow-amber-500/20">
            <Icon name="mdi:calculator" class="size-6" />
          </div>
          <div>
            <h3 class="font-black uppercase text-amber-600 dark:text-amber-400">Resume My Round</h3>
            <p class="text-[10px] text-amber-500/70 uppercase font-bold tracking-widest">Active Scorecard Found</p>
          </div>
        </div>
        <Icon name="mdi:chevron-right" class="text-amber-500" />
      </div>

      <div 
        v-if="isLive" 
        @click="navigateTo(`/leaderboard/${leagueId}/${todayIso}/live`)"
        class="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
      >
        <div class="flex items-center gap-4">
          <div class="bg-emerald-500 text-black p-2 rounded-xl shadow-lg shadow-emerald-500/20">
            <Icon name="mdi:trophy-outline" class="size-6" />
          </div>
          <div>
            <h3 class="font-black uppercase text-emerald-600 dark:text-emerald-400">Live Leaderboard</h3>
            <p class="text-[10px] text-emerald-500/70 uppercase font-bold tracking-widest">Real-time Standings</p>
          </div>
        </div>
        <Icon name="mdi:chevron-right" class="text-emerald-500" />
      </div>

      <div 
        @click="navigateTo(`/leagues/${leagueId}/schedule`)"
        class="flex items-center justify-between bg-stone-500/5 border border-stone-500/10 p-5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
      >
        <div class="flex items-center gap-4">
          <div class="bg-stone-200 dark:bg-stone-800 text-primary p-2 rounded-xl">
            <Icon name="mdi:calendar-month-outline" class="size-6" />
          </div>
          <h3 class="font-black uppercase text-primary">Season Schedule</h3>
        </div>
        <Icon name="mdi:chevron-right" class="text-stone-400" />
      </div>

      <div 
        @click="navigateTo(`/leagues/${leagueId}/roster`)"
        class="flex items-center justify-between bg-stone-500/5 border border-stone-500/10 p-5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
      >
        <div class="flex items-center gap-4">
          <div class="bg-stone-200 dark:bg-stone-800 text-primary p-2 rounded-xl">
            <Icon name="mdi:account-group-outline" class="size-6" />
          </div>
          <h3 class="font-black uppercase text-primary">League Roster</h3>
        </div>
        <Icon name="mdi:chevron-right" class="text-stone-400" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'
import { getLocalIsoDate } from '~/utils/leagueActions'

const route = useRoute()
const authStore = useAuthStore()
const dataStore = useData()

const leagueId = route.params.id // Standardized on Document ID (e.g., KqyvWn81FCGEhsRx4tfI)
const todayIso = getLocalIsoDate()

// Find league name from store
const leagueName = computed(() => {
  return dataStore.leagues.find(l => l.id === leagueId)?.shortName || 'League'
})

// Check if ANY live rounds exist for this league today
const isLive = computed(() => {
  return dataStore.liveRounds.some(r => 
    r.leagueId === leagueId && 
    r.iso === todayIso
  )
})

// Check if CURRENT USER has a specific round to resume
const activeRoundId = computed(() => {
  const myId = authStore.userProfile?.id
  if (!myId || !dataStore.liveRounds.length) return null

  const found = dataStore.liveRounds.find(r => 
    r.leagueId === leagueId && 
    r.iso === todayIso &&
    r.players?.some(p => String(p.id) === String(myId))
  )
  
  return found?.id || null
})
</script>