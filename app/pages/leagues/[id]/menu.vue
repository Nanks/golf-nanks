<template>
  <div class="px-2 max-w-lg mx-auto">
    <LeagueHeader 
        :title="leagueName"
        subtitle="Menu" 
        :is-admin="isAdmin"
        :back-to="'/'"
        back-text="Back to Home"
      >
    </LeagueHeader>

    <div class="grid gap-2">
      
      <div 
        v-if="activeRoundId" 
        @click="navigateTo(`/rounds/${activeRoundId}`)"
        class="card-interactive flex items-center justify-between p-5 !border-amber-500/30"
      >
        <div class="flex items-center gap-4">
          <div class="bg-amber-500 text-black p-2 rounded-xl shadow-lg shadow-amber-500/10">
            <Icon name="mdi:calculator" class="size-6" />
          </div>
          <div>
            <h3 class="font-black text-xl italic uppercase text-amber-700 dark:text-amber-500">Resume Round</h3>
          </div>
        </div>
        <Icon name="mdi:chevron-right" class="text-amber-600/50 dark:text-amber-500" />
      </div>

      <div 
        v-else-if="hasEventToday" 
        @click="startRound"
        class="card-interactive flex items-center justify-between p-5 !border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
      >
        <div class="flex items-center gap-4">
          <div class="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20">
            <Icon name="mdi:golf-tee" class="size-6" />
          </div>
          <div class="flex flex-col">
            <h3 class="font-black text-xl italic uppercase text-emerald-700 dark:text-emerald-400 leading-none mb-1">Start Round</h3>
            <p class="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">
              {{ leagueData?.nextRound?.course || 'Course TBD' }} • {{ leagueData?.nextRound?.tees || 'Tees TBD' }}
            </p>
          </div>
        </div>
        <Icon name="mdi:chevron-right" class="text-emerald-600/50 dark:text-emerald-400" />
      </div>

      <div 
        v-if="isLive" 
        @click="navigateTo(`/leaderboard/${leagueId}/${todayIso}/live`)"
        class="card-interactive flex items-center justify-between p-5 !border-emerald-500/30"
      >
        <div class="flex items-center gap-4">
          <div class="bg-emerald-500 text-black p-2 rounded-xl shadow-lg shadow-emerald-500/10">
            <Icon name="mdi:trophy-outline" class="size-6" />
          </div>
          <div>
            <h3 class="font-black text-xl italic uppercase text-emerald-700 dark:text-emerald-500">Live Leaderboard</h3>
          </div>
        </div>
        <Icon name="mdi:chevron-right" class="text-emerald-600/50 dark:text-emerald-400" />
      </div>

      <div 
        v-for="game in yearlyGames" 
        :key="game"
        @click="navigateTo(`/leagues/${leagueId}/${game}`)"
        class="card-interactive flex items-center justify-between p-5"
      >
        <div class="flex items-center gap-4">
          <div class="bg-slate-200 dark:bg-stone-900 text-slate-500 p-2 rounded-xl">
            <Icon name="mdi:medal-outline" class="size-6" />
          </div>
          <h3 class="text-primary text-xl">{{ game }}</h3>
        </div>
        <Icon name="mdi:chevron-right" class="text-slate-400" />
      </div>

      <div 
        @click="navigateTo(`/leagues/${leagueId}/calendar`)"
        class="card-interactive flex items-center justify-between p-5"
      >
        <div class="flex items-center gap-4">
          <div class="bg-slate-200 dark:bg-stone-900 text-slate-500 p-2 rounded-xl">
            <Icon name="mdi:calendar-month-outline" class="size-6" />
          </div>
          <h3 class="text-primary text-xl">Calendar</h3>
        </div>
        <Icon name="mdi:chevron-right" class="text-slate-400" />
      </div>

      <div 
        @click="navigateTo(`/leagues/${leagueId}/roster`)"
        class="card-interactive flex items-center justify-between p-5"
      >
        <div class="flex items-center gap-4">
          <div class="bg-slate-200 dark:bg-stone-900 text-slate-500 p-2 rounded-xl">
            <Icon name="mdi:account-group-outline" class="size-6" />
          </div>
          <h3 class="text-primary text-xl">Roster</h3>
        </div>
        <Icon name="mdi:chevron-right" class="text-slate-400" />
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

const leagueId = route.params.id 
const todayIso = getLocalIsoDate()

// 1. Find the current league object
const leagueData = computed(() => {
  return dataStore.leagues.find(l => l.id === leagueId)
})

const leagueName = computed(() => leagueData.value?.shortName || 'League')

// 2. Pull yearly games array from the league document
const yearlyGames = computed(() => leagueData.value?.yearly_games || [])

const isAdmin = computed(() => authStore.isAdminForLeague?.(leagueData.value))

// --- NEW: Check if there is an event matching today's ISO ---
const hasEventToday = computed(() => {
  return leagueData.value?.nextRound?.iso === todayIso
})

const isLive = computed(() => {
  return dataStore.liveRounds.some(r => 
    r.leagueId === leagueId && 
    r.iso === todayIso
  )
})

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

const startRound = () => {
  navigateTo(`/rounds/setup?leagueId=${leagueId}&isLeague=true&from=menu`) 
}
</script>