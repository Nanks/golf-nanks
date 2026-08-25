<template>
  <div 
    @click="$emit('card-click', event)"
    class="flex flex-col group overflow-hidden transition-all"
    :class="isClickable ? 'card-interactive cursor-pointer' : 'card-base'"
  >
    <div class="flex items-stretch p-3 gap-4">
      <div class="w-12 shrink-0 text-center flex flex-col items-center justify-center">
        <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">{{ eventMonth }}</span>
        <span class="text-primary text-2xl tabular-nums">{{ eventDay }}</span>
      </div>

      <div class="w-px bg-slate-200 dark:bg-slate-700 shrink-0 my-1"></div>

      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <h3 class="text-primary text-xl">
          <template v-if="event.teesId === 'mixed'">
            <span class="text-emerald-600 dark:text-emerald-500 text-[10px] tracking-widest">M:</span> {{ event.mensTees }}
            <span class="text-slate-300 dark:text-slate-700 mx-1.5">•</span>
            <span class="text-amber-500 text-[10px] tracking-widest">L:</span> {{ event.ladiesTees }}
          </template>
          <template v-else>
            {{ event.tees || 'TBD' }}
          </template>
        </h3>

        <div v-if="event.game?.length" class="flex gap-1.5 flex-wrap mt-2">
          <div v-for="g in event.game.filter(g => g.toLowerCase() !== 'stroke play')" :key="g" class="badge badge-emerald">
            {{ event.game.length > 2 ? getInitials(g) : g }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <div v-if="statusUI" :class="statusUI.color">
          <Icon :name="statusUI.icon" class="size-6" />
        </div>
        
        <ClientOnly>
          <div v-if="isAdminMode" class="flex gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button @click.stop="$emit('edit', event)" class="p-1.5 text-slate-400 hover:text-amber-500 active:scale-90 transition-all"><Icon name="mdi:pencil-circle" class="size-6" /></button>
            <button @click.stop="$emit('delete', event)" class="p-1.5 text-slate-400 hover:text-red-500 active:scale-90 transition-all"><Icon name="mdi:close-circle-outline" class="size-5" /></button>
          </div>
          
          <Icon v-else-if="isClickable"
            :name="eventIcon" 
            :class="eventIconClass"
            class="size-6 transition-colors group-hover:text-emerald-500" 
          />
        </ClientOnly>
      </div>
    </div>

    <div v-if="canRsvp && event.iso >= todayIso && !isFinished" class="border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 p-2 px-3 flex items-center justify-between gap-3 cursor-default" @click.stop>
      
      <template v-if="!isAdminMode && isPlayerInLeague">
        <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">RSVP:</span>
        <div class="flex gap-2 flex-1 max-w-[200px]">
          <button 
            @click.stop="$emit('rsvp', 'in')"
            :class="userRsvp === 'in' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'"
            class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >In</button>
          <button 
            @click.stop="$emit('rsvp', 'out')"
            :class="userRsvp === 'out' ? 'bg-red-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'"
            class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >Out</button>
        </div>
      </template>

      <template v-else-if="isAdminMode">
        <button
          @click.stop="$emit('view-rsvps', event)"
          class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest active:opacity-60 transition-opacity"
        >
          <span class="text-emerald-600 dark:text-emerald-500">{{ countIn }} In</span>
          <span class="text-red-600 dark:text-red-500">{{ countOut }} Out</span>
          <span class="text-slate-400">{{ countUnanswered }} Unanswered</span>
          <Icon name="mdi:chevron-right" class="size-3.5 text-slate-300 dark:text-slate-600" />
        </button>
        <button
          v-if="countUnanswered > 0"
          @click.stop="$emit('nudge', event)" 
          class="bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all shadow-sm"
        >
          <Icon name="mdi:bell-ring" class="size-3" /> Nudge
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { isEventFinished } from '~/utils/leagueActions'

const props = defineProps({
  event: { type: Object, required: true },
  canRsvp: { type: Boolean, default: false },
  isAdminMode: { type: Boolean, default: false },
  todayIso: { type: String, required: true },
  isPlayerInLeague: { type: Boolean, default: false },
  myActiveRoundId: { type: String, default: null },
  totalLeaguePlayers: { type: Number, default: 0 }
})

defineEmits(['card-click', 'edit', 'delete', 'rsvp', 'nudge', 'view-rsvps'])

const authStore = useAuthStore()

// --- UI Helpers ---
const eventMonth = computed(() => props.event.iso ? new Date(props.event.iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD')
const eventDay = computed(() => props.event.iso ? new Date(props.event.iso + 'T12:00:00').getDate() : '-')
const getInitials = (s) => s ? s.split(' ').map(w => w[0]).join('').toUpperCase() : ''

const isFinished = computed(() => isEventFinished(props.event.status))

const isClickable = computed(() => {
  if (props.isAdminMode) return true 
  if (isFinished.value || props.event.iso < props.todayIso) return true
  if (props.event.iso === props.todayIso && (props.isPlayerInLeague || props.myActiveRoundId)) return true
  return false
})

const eventIcon = computed(() => {
  if (props.event.iso === props.todayIso && !isFinished.value) {
    if (props.myActiveRoundId) return 'mdi:golf-cart'
    if (props.isPlayerInLeague) return 'mdi:play-circle-outline'
  }
  return 'mdi:chevron-right'
})

const eventIconClass = computed(() => {
  if (props.event.iso === props.todayIso && !isFinished.value && (props.myActiveRoundId || props.isPlayerInLeague)) {
    return 'text-emerald-500 animate-pulse'
  }
  return 'text-slate-300 dark:text-slate-600'
})

const statusUI = computed(() => {
  const { status, iso } = props.event
  if (!status) return iso < props.todayIso ? { icon: 'mdi:check-circle-outline', color: 'text-slate-400' } : null
  const s = status.toLowerCase()
  if (s === 'complete') return { icon: 'mdi:check-circle', color: 'text-emerald-500' }
  if (s === 'practice') return { icon: 'mdi:flag-triangle', color: 'text-blue-500' }
  if (s === 'rain') return { icon: 'mdi:weather-pouring', color: 'text-slate-400' }
  if (s === 'handicap') return { icon: 'mdi:calculator', color: 'text-amber-500' }
  return iso < props.todayIso ? { icon: 'mdi:check-circle-outline', color: 'text-slate-400' } : null
})

// --- RSVP Helpers ---
const userRsvp = computed(() => props.event.rsvps?.[authStore.userProfile?.id])
const countIn = computed(() => Object.values(props.event.rsvps || {}).filter(v => v === 'in').length)
const countOut = computed(() => Object.values(props.event.rsvps || {}).filter(v => v === 'out').length)
const countUnanswered = computed(() => Math.max(0, props.totalLeaguePlayers - (countIn.value + countOut.value)))
</script>