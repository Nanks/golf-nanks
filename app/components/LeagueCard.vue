<template>
  <div 
    @click="navigateTo(`/leagues/${league.id}/menu`)" 
    class="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-2 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden select-none"
  >
    <div 
      v-if="isAdmin" 
      class="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-md z-10"
    >
      <Icon name="mdi:shield-crown-outline" class="size-3" />
      <span class="text-[8px] font-black uppercase tracking-widest leading-none mt-0.5">Admin</span>
    </div>

    <div class="mb-1">
      <h2 class="text-2xl font-black italic uppercase tracking-tighter leading-none pr-12">
        {{ league.shortName }}
      </h2>
      <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
        {{ league.course }}
      </p>
    </div>

    <div 
      v-if="league.nextRound" 
      @click.stop="handleBadgeAction(league)"
      :class="[
        'inline-flex items-center gap-2 border rounded-lg px-3 py-1 transition-all',
        getActiveRoundForLeague(league.id) 
          // State 1: Active Round (Amber, clickable)
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 cursor-pointer active:scale-95' 
          // State 2: Scheduled for Today (Emerald, clickable)
          : isToday(league.nextRound.iso)
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 cursor-pointer active:scale-95'
            // State 3: Scheduled for the Future (Grey, not clickable)
            : 'bg-slate-500/10 border-slate-500/20 text-slate-400 cursor-default'
      ]"
    >
      <Icon 
        :name="getActiveRoundForLeague(league.id) 
          ? 'mdi:calculator' 
          : isToday(league.nextRound.iso) 
            ? 'mdi:play-circle-outline' 
            : 'mdi:calendar-check'" 
        class="size-3.5" 
      />
      <span class="text-[9px] font-black uppercase tracking-widest">
        {{ 
          getActiveRoundForLeague(league.id) 
            ? 'Resume Round' 
            : isToday(league.nextRound.iso) 
              ? 'Start Round' 
              : `Next: ${league.nextRound.iso} • ${league.nextRound.tees}`
        }}
      </span>
    </div>

    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700">
      <Icon name="mdi:chevron-right" class="size-6" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue' // Added missing import
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'

import { useToast } from '~/composables/useToast'

const props = defineProps({
  league: Object
})

const authStore = useAuthStore()
const dataStore = useData()

const toast = useToast()

// --- ADMIN LOGIC ---
const isAdmin = computed(() => {
  // Ensure the getter we added to auth.js exists and is callable
  if (typeof authStore.isAdminForLeague === 'function') {
    return authStore.isAdminForLeague(props.league.type)
  }
  return false
})

// --- ROUND LOGIC ---
const todayIso = new Date().toISOString().split('T')[0]

const getActiveRoundForLeague = (leagueId) => {
  const myId = authStore.userProfile?.id
  
  return dataStore.liveRounds.find(r => 
    r.leagueId === leagueId && 
    r.iso === todayIso &&
    r.players?.some(p => p.id === myId)
  )?.id || null
}

const isToday = (isoDate) => isoDate === todayIso

const handleBadgeAction = (league) => {
  const activeId = getActiveRoundForLeague(league.id)
  
  if (activeId) {
    // Always allow resuming an active round
    navigateTo(`/rounds/${activeId}`)
  } else if (league.nextRound && isToday(league.nextRound.iso)) {
    // Only allow starting a new round if the calendar date matches today
    navigateTo({
      path: '/rounds/setup',
      query: { leagueId: league.id, isLeague: 'true' }
    })
  } else {
    toast.add({
      title: 'Too Early!',
      description: `This round cannot be started until ${league.nextRound.iso}.`,
      color: 'amber' // Uses your warning color
    })
    console.log('Round cannot be started yet.')
  }
}
</script>