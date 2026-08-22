<template>
  <div 
    @click="navigateTo(`/leagues/${league.id}/menu`)" 
    class="card-interactive px-5 py-2 cursor-pointer relative overflow-hidden select-none"
  >
    <div v-if="isAdmin" class="absolute top-2 left-1.5 text-amber-500 z-10">
      <Icon name="mdi:shield-crown-outline" class="size-3.5" />
    </div>

    <div 
      v-if="hasLiveRounds" 
      class="absolute top-3 right-10 flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-black uppercase shadow-sm z-20 cursor-pointer active:scale-95 transition-all"
    >
      <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> 
      Live
    </div>

    <div class="mb-1 flex items-center gap-3">
      <div class="size-12 shrink-0 rounded-xl bg-white border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden p-2">
        <TheSmssLogo
          v-if="isSmss"
          :startColor="league.theme?.startColor || '#1e293b'"
          :endColor="league.theme?.endColor || '#10b981'"
          class="w-full h-full"
        />
        <TheVegasLogo
          v-else-if="isVegas"
          :startColor="league.theme?.startColor || '#F59E0B'"
          :endColor="league.theme?.endColor || '#EA580C'"
          class="w-full h-full"
        />
        <TheSSCLogo
          v-else-if="isSsc"
          :startColor="league.theme?.startColor || '#2563eb'"
          :endColor="league.theme?.endColor || '#34d399'"
          class="w-full h-full"
        />
        <TheT4gLogo
          v-else-if="isT4g"
          :startColor="league.theme?.startColor || 'var(--color-pink-500)'"
          :endColor="league.theme?.endColor || 'var(--color-purple-600)'"
          class="w-full h-full"
        />
        <Icon
          v-else
          name="mdi:golf-tee"
          class="size-6 text-slate-300 dark:text-slate-700"
        />
      </div>

      <div>
        <h2
          class="text-2xl text-primary leading-tight font-black uppercase italic"
          :style="themeEndColor ? { color: themeEndColor } : {}"
        >
          {{ league.shortName }}
        </h2>
        <p class="text-secondary text-xs uppercase tracking-widest font-bold">
          {{ league.course }}
        </p>
      </div>
    </div>

    <!-- <div 
      v-if="isMember && (activeRoundId || nextRoundData)" 
      @click.stop="handleBadgeAction"
      :class="[
        'inline-flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all shadow-sm z-30',
        activeRoundId 
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 active:scale-95' 
          : isToday(nextRoundData.iso)
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 active:scale-95'
            : 'bg-stone-500/10 border-stone-700/20 dark:border-stone-300/20 text-stone-700 dark:text-stone-300 cursor-default'
      ]"
    >
      <Icon 
        :name="activeRoundId ? 'mdi:calculator' : isToday(nextRoundData.iso) ? 'mdi:play-circle-outline' : 'mdi:calendar-check'" 
        class="size-4" 
      />
      <span class="text-xs font-black uppercase tracking-widest">
        {{ activeRoundId ? 'Resume Round' : isToday(nextRoundData.iso) ? 'Start Round' : `Next: ${nextRoundData.iso}` }}
      </span>
    </div> -->

    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-700 dark:text-stone-300">
      <Icon name="mdi:chevron-right" class="size-6" />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'
import { getLocalIsoDate } from '~/utils/leagueActions'

const props = defineProps({
  league: { type: Object, required: true },
  isMember: { type: Boolean, default: true } // New prop to control action button
})

const authStore = useAuthStore()
const dataStore = useData()
const toast = useToast()
const todayIso = getLocalIsoDate()

// --- LOGO DETECTION ---
const { isSmss, isVegas, isSsc, isT4g, themeEndColor } = useLeagueLogo(() => props.league)

// --- ACTIVE ROUND ---
const activeRoundId = computed(() => dataStore.activeRoundIdForLeague(props.league.id))

// --- OTHER COMPUTED ---
const nextRoundData = computed(() => {
  if (!props.league.calendar?.length) return props.league.nextRound || null
  const events = [...props.league.calendar].sort((a, b) => a.iso.localeCompare(b.iso))
  return events.find(e => e.iso === todayIso) || events.find(e => e.iso > todayIso) || events[0]
})

const hasLiveRounds = computed(() => {
  return dataStore.liveRounds.some(r => r.leagueId === props.league.id && r.iso === todayIso)
})

const isAdmin = computed(() => authStore.isAdminForLeague?.(props.league))
const isToday = (isoDate) => isoDate === todayIso

// --- ACTIONS ---
// const handleBadgeAction = () => {
//   if (activeRoundId.value) {
//     navigateTo(`/rounds/${activeRoundId.value}`)
//   } else if (nextRoundData.value && isToday(nextRoundData.value.iso)) {
//     navigateTo({
//       path: '/rounds/setup',
//       query: { leagueId: props.league.id, isLeague: 'true' }
//     })
//   }
// }
</script>