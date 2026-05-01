<template>
  <div 
    @click="navigateTo(`/leagues/${league.id}/menu`)"
    class="snap-start shrink-0 w-48 flex flex-col items-center cursor-pointer group select-none mt-2"
  >
    <div class="w-40 h-40 relative z-30 flex items-center justify-center mb-[-2.5rem] transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105">
      <div class="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div class="relative flex items-center justify-center overflow-visible drop-shadow-2xl">
        <TheSmssLogo 
          v-if="isSmss" 
          :startColor="league.theme?.startColor || '#1e293b'"
          :endColor="league.theme?.endColor || '#10b981'"
          class="w-auto h-32 transition-colors duration-300" 
        />
        <TheVegasLogo 
          v-else-if="isVegas" 
          :startColor="league.theme?.startColor || '#F59E0B'"
          :endColor="league.theme?.endColor || '#EA580C'"
          class="w-auto h-32 transition-colors duration-300" 
        />
        <TheSSCLogo 
          v-else-if="isSsc" 
          :startColor="league.theme?.startColor || '#2563eb'"
          :endColor="league.theme?.endColor || '#34d399'"
          class="w-auto h-36 transition-colors duration-300" 
        />
        <TheT4gLogo 
          v-else-if="isT4g" 
          :startColor="league.theme?.startColor || 'var(--color-pink-500)'"
          :endColor="league.theme?.endColor || 'var(--color-purple-600)'"
          class="transition-colors duration-300 group-hover:scale-105" 
        />
        <Icon 
          v-else 
          name="mdi:golf-tee" 
          class="size-24 mx-auto text-slate-300 dark:text-slate-700 transition-colors duration-300 group-hover:text-emerald-500" 
        />
      </div>
    </div>

    <div class="w-full bg-slate-200 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl pt-8 pb-3 px-3 flex flex-col items-center relative shadow-sm group-hover:shadow-md group-hover:border-emerald-500/50 transition-all duration-300">
      
      <div v-if="isAdmin" class="absolute top-4 left-3 text-amber-500 z-10">
        <Icon name="mdi:shield-crown-outline" class="size-4" />
      </div>

      <div v-if="hasLiveRounds" class="absolute top-3 right-2 flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm z-20">
        <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Live
      </div>

      <!-- <h3 class="text-lg font-black text-primary uppercase text-center tracking-tight mb-2 w-full truncate px-4">
        {{ league.shortName || league.name }}
      </h3> -->

      <div v-if="activeRoundId || nextRoundData" class="w-full">
        <div 
          @click.stop="handleBadgeAction"
          :class="[
            'w-full flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 border shadow-sm',
            activeRoundId 
              ? 'bg-amber-500/20 border-amber-400 text-amber-800 dark:text-amber-400 hover:scale-[1.02] active:scale-95 shadow-amber-500/20' 
              : isToday(nextRoundData?.iso)
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-800 dark:text-emerald-400 hover:scale-[1.02] active:scale-95 shadow-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-700/40 border-slate-100 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95'
          ]"
        >
          <div class="flex items-center gap-1.5 font-black uppercase tracking-[0.15em] text-[11px]">
            <Icon :name="activeRoundId ? 'mdi:calculator' : isToday(nextRoundData?.iso) ? 'mdi:play-circle' : 'mdi:calendar-check'" class="size-4" />
            <span>{{ activeRoundId ? 'Resume' : isToday(nextRoundData?.iso) ? 'Start' : 'Next Round' }}</span>
          </div>

          <div v-if="nextRoundData" class="flex flex-col items-center mt-0.5 leading-tight">
             <span class="text-sm font-bold uppercase opacity-80">{{ readableDate }}</span>
             <span v-if="nextRoundData.course" class="text-xs font-medium italic opacity-60 truncate max-w-[130px]">
               {{ nextRoundData.tees }} Tees
             </span>
          </div>
        </div>
      </div>
      
      <div v-else class="w-full flex flex-col items-center justify-center py-3 px-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <Icon name="mdi:calendar-remove-outline" class="size-4 text-slate-400 mb-1" />
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center leading-tight">
          No rounds<br/>scheduled
        </span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'
import { getLocalIsoDate } from '~/utils/leagueActions'

const props = defineProps({
  league: { type: Object, required: true }
})

const authStore = useAuthStore()
const dataStore = useData()
const todayIso = getLocalIsoDate()

const lId = props.league.id || ''
const isSmss = computed(() => lId === 'KqyvWn81FCGEhsRx4tfI')
const isVegas = computed(() => lId === 'I7LCsEb1va49YU1lkRmu')
const isSsc = computed(() => lId === 'vcx75B9fY6uqgAuNo0rL')
const isT4g = computed(() => lId === 'XFPsVFZpDcEovzod5oJ0')

const activeRoundId = ref(null)

watch(
  [() => dataStore.liveRounds, () => authStore.isInitialized],
  ([rounds, ready]) => {
    if (!ready || !rounds.length) {
      activeRoundId.value = null
      return
    }
    const myId = authStore.userProfile?.id
    const found = rounds.find(r => {
      const isLeague = r.leagueId === props.league.id
      const isDate = r.iso === todayIso
      const isMe = r.players?.some(p => String(p.id) === String(myId))
      return isLeague && isDate && isMe
    })
    activeRoundId.value = found?.id || null
  },
  { immediate: true, deep: true }
)

const nextRoundData = computed(() => {
  if (!props.league.calendar?.length) return props.league.nextRound || null
  const events = [...props.league.calendar].sort((a, b) => a.iso.localeCompare(b.iso))
  return events.find(e => e.iso === todayIso) || events.find(e => e.iso > todayIso) || null
})

const readableDate = computed(() => {
  if (!nextRoundData.value?.iso) return ''
  const [year, month, day] = nextRoundData.value.iso.split('-')
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
})

const hasLiveRounds = computed(() => dataStore.liveRounds.some(r => r.leagueId === props.league.id && r.iso === todayIso))
const isAdmin = computed(() => authStore.isAdminForLeague?.(props.league))
const isToday = (isoDate) => isoDate === todayIso

// --- UPDATED ACTION LOGIC ---
const handleBadgeAction = () => {
  if (activeRoundId.value) {
    // 1. Resume active round
    navigateTo(`/rounds/${activeRoundId.value}`)
  } else if (nextRoundData.value && isToday(nextRoundData.value.iso)) {
    // 2. Start today's round
    navigateTo({
      path: '/rounds/setup',
      query: { leagueId: props.league.id, isLeague: 'true' }
    })
  } else {
    // 3. Next mode: Navigate to league menu
    navigateTo(`/leagues/${props.league.id}/menu`)
  }
}
</script>