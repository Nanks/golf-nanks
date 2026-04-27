<template>
  <div 
    @click="navigateTo(`/leagues/${league.id}/menu`)" 
    class="card-interactive px-5 py-4 cursor-pointer relative overflow-hidden select-none"
  >
    <div v-if="isAdmin" class="absolute top-2 left-1.5 text-amber-500 z-10">
      <Icon name="mdi:shield-crown-outline" class="size-3.5" />
    </div>

    <div 
      v-if="hasLiveRounds" 
      @click.stop="navigateTo(`/leaderboard/${league.id}/${todayIso}/live?from=home`)"
      class="absolute top-3 right-10 flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm z-20 cursor-pointer active:scale-95 transition-all"
    >
      <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> 
      Live
    </div>

    <div class="mb-3">
      <h2 class="text-2xl text-primary leading-tight">
        {{ league.shortName }}
      </h2>
      <p class="text-secondary text-[10px] uppercase tracking-widest">
        {{ league.course }}
      </p>
    </div>

    <div 
      v-if="nextRoundData" 
      @click.stop="handleBadgeAction"
      :class="[
        'inline-flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all shadow-sm',
        activeRoundId 
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 active:scale-95' 
          : isToday(nextRoundData.iso)
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 active:scale-95'
            : 'bg-stone-500/10 border-stone-500/20 text-stone-500 cursor-default'
      ]"
    >
      <Icon 
        :name="activeRoundId 
          ? 'mdi:calculator' 
          : isToday(nextRoundData.iso) 
            ? 'mdi:play-circle-outline' 
            : 'mdi:calendar-check'" 
        class="size-4" 
      />
      <span class="text-[10px] font-black uppercase tracking-widest">
        {{ 
          activeRoundId 
            ? 'Resume Round' 
            : isToday(nextRoundData.iso) 
              ? 'Start Round' 
              : `Next: ${nextRoundData.iso} • ${nextRoundData.tees || nextRoundData.teeColor || ''}`
        }}
      </span>
    </div>

    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-700">
      <Icon name="mdi:chevron-right" class="size-6" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  league: { type: Object, required: true }
})

const authStore = useAuthStore()
const dataStore = useData()
const toast = useToast()

const todayIso = new Date().toISOString().split('T')[0]

// --- REACTIVE DATA ---

// 1. Reactive Event Logic: Pulls directly from the calendar array in the store
const nextRoundData = computed(() => {
  if (!props.league.calendar?.length) return props.league.nextRound || null
  
  // Find today's event or the next upcoming one
  const events = [...props.league.calendar].sort((a, b) => a.iso.localeCompare(b.iso))
  const todayEvent = events.find(e => e.iso === todayIso)
  
  // If an event is found for today, it prioritizes it (enabling the Start/Resume button)
  if (todayEvent) return todayEvent

  return events.find(e => e.iso > todayIso) || events[0]
})

// 2. Live Badge Logic: Checks specifically for leagueId in live_rounds
const hasLiveRounds = computed(() => {
  return dataStore.liveRounds.some(r => r.leagueId === props.league.id)
})

// 3. User Active Round Logic: Checks if the current user has a round to resume
const activeRoundId = computed(() => {
  const myId = authStore.userProfile?.id
  return dataStore.liveRounds.find(r => 
    r.leagueId === props.league.id && 
    r.iso === todayIso &&
    r.players?.some(p => p.id === myId)
  )?.id || null
})

const isAdmin = computed(() => authStore.isAdminForLeague?.(props.league.id))
const isToday = (isoDate) => isoDate === todayIso

// --- ACTIONS ---
const handleBadgeAction = () => {
  if (activeRoundId.value) {
    navigateTo(`/rounds/${activeRoundId.value}`)
  } else if (nextRoundData.value && isToday(nextRoundData.value.iso)) {
    navigateTo({
      path: '/rounds/setup',
      query: { leagueId: props.league.id, isLeague: 'true' }
    })
  } else {
    toast.add({
      title: 'Too Early!',
      description: `This round cannot be started until ${nextRoundData.value?.iso}.`,
      color: 'amber'
    })
  }
}
</script>