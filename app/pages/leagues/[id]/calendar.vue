<template>
  <div class="max-w-2xl mx-auto select-none pb-32">
    <template v-if="leagueData">
      <LeagueHeader 
        :title="leagueData.shortName || leagueData.name" 
        subtitle="Calendar"
        :is-admin="isAdmin"
        :back-to="`/leagues/${leagueId}/menu`"
        back-text="League Menu"
      >
        <template #action>
          <ClientOnly>
            <button 
              v-if="isAdmin"
              @click="isAdminMode = !isAdminMode" 
              :class="isAdminMode 
                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/20 border border-amber-500/50 shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]' 
                : 'text-amber-700 dark:text-amber-500 bg-amber-500/10 border border-amber-500/30'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
              <Icon :name="isAdminMode ? 'mdi:lock-open-variant' : 'mdi:cog'" class="size-3.5" />
              <span>{{ isAdminMode ? 'Finish' : 'Manage' }}</span>
            </button>
          </ClientOnly>
        </template>
      </LeagueHeader>

      <div class="flex items-center justify-center gap-6 mb-8 mt-2">
        <button 
          @click="prevYear" 
          :disabled="selectedYear <= 2016" 
          class="p-2.5 rounded-xl border transition-all flex items-center justify-center"
          :class="selectedYear <= 2016 
            ? 'border-transparent text-slate-300 dark:text-slate-800 bg-transparent' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm active:scale-95 hover:bg-emerald-500/20'"
        >
          <Icon name="mdi:chevron-left" class="size-6" />
        </button>
        
        <div class="text-center min-w-[100px]">
          <span class="text-primary text-4xl tabular-nums">{{ selectedYear }}</span>
        </div>
        
        <button 
          @click="nextYear" 
          :disabled="selectedYear >= currentYear" 
          class="p-2.5 rounded-xl border transition-all flex items-center justify-center"
          :class="selectedYear >= currentYear 
            ? 'border-transparent text-slate-300 dark:text-slate-800 bg-transparent' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm active:scale-95 hover:bg-emerald-500/20'"
        >
          <Icon name="mdi:chevron-right" class="size-6" />
        </button>
      </div>

      <div class="space-y-3 px-1">
        
        <ClientOnly>
          <button v-if="isAdminMode && selectedYear === currentYear" @click="openAddModal" class="w-full p-4 border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 rounded-xl text-secondary text-emerald-600 dark:text-emerald-500 active:bg-emerald-500/10 flex items-center justify-center gap-2 mb-4 transition-all">
            <Icon name="mdi:plus-circle-outline" class="size-4" /> Add Event
          </button>
        </ClientOnly>

        <button 
          v-if="isLeagueLive && !isAdminMode" 
          @click="navigateTo(`/leaderboard/${leagueId}/${todayIso}/live?from=calendar`)"
          class="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 mb-4 relative overflow-hidden"
        >
          <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
          <Icon name="mdi:format-list-numbered" class="size-5 relative z-10" />
          <span class="relative z-10">View Live Leaderboard</span>
        </button>

        <div v-if="events.length === 0" class="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-2xl flex flex-col items-center gap-3 mt-4 mx-1">
          <Icon name="mdi:calendar-blank" class="size-8 text-slate-300 dark:text-slate-700" />
          <p class="text-secondary text-[10px]">No events found for {{ selectedYear }}</p>
        </div>

        <template v-else>
          <div v-for="event in events" :key="event.id" 
            @click="handleCardClick(event)"
            class="flex items-stretch p-3 gap-4 group"
            :class="isClickable(event) ? 'card-interactive' : 'card-base'"
          >
            <div class="w-12 shrink-0 text-center flex flex-col items-center justify-center">
              <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">{{ getEventMonth(event.iso) }}</span>
              <span class="text-primary text-2xl tabular-nums">{{ getEventDay(event.iso) }}</span>
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
                <div v-for="g in event.game.filter(g => g.toLowerCase() !== 'stroke play')" :key="g"
                  class="badge badge-emerald">
                  {{ event.game.length > 2 ? getInitials(g) : g }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <div v-if="getStatusUI(event.status, event.iso)" :class="getStatusUI(event.status, event.iso).color">
                <Icon :name="getStatusUI(event.status, event.iso).icon" class="size-6" />
              </div>
              
              <ClientOnly>
                <div v-if="isAdminMode" class="flex gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button @click.stop="openEditModal(event)" class="p-1.5 text-slate-400 hover:text-amber-500 active:scale-90 transition-all"><Icon name="mdi:pencil-circle" class="size-6" /></button>
                  <button @click.stop="promptDelete(event)" class="p-1.5 text-slate-400 hover:text-red-500 active:scale-90 transition-all"><Icon name="mdi:close-circle-outline" class="size-5" /></button>
                </div>
                
                <Icon v-else-if="isClickable(event)"
                  :name="(event.iso === todayIso && !isFinished(event)) 
                    ? (myActiveRoundId ? 'mdi:golf-cart' : 'mdi:play-circle-outline') 
                    : 'mdi:chevron-right'" 
                  :class="(event.iso === todayIso && !isFinished(event)) ? 'text-emerald-500 animate-pulse' : 'text-slate-300 dark:text-slate-600'"
                  class="size-6 transition-colors group-hover:text-emerald-500" 
                />
              </ClientOnly>
            </div>
          </div>
        </template>
      </div>
    </template>

    <div v-else class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:loading" class="size-12 text-emerald-500 animate-spin" />
      <p class="text-secondary text-[10px]">Syncing Calendar...</p>
    </div>

    <ClientOnly>
      <CalendarEventModal :is-open="isModalOpen" :event="activeEvent" :league="leagueData" @close="isModalOpen = false" @save="handleSaveEvent" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { useUIStore, useAuthStore, useData } from "#imports"
import { getLocalIsoDate } from '~/utils/leagueActions'
import { useConfirm } from '~/composables/useConfirm'

const { $db } = useNuxtApp()
const route = useRoute()
const router = useRouter()
const ui = useUIStore()
const authStore = useAuthStore()
const dataStore = useData()
const { ask } = useConfirm() 

// --- STATE ---
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const events = ref([])
const isAdminMode = ref(false)
const isModalOpen = ref(false)
const activeEvent = ref(null)
let currentUnsub = null

const todayIso = getLocalIsoDate()
const leagueId = route.params.id 

// --- COMPUTED ---
const leagueData = computed(() => dataStore.leagues.find(l => l.id === leagueId))

const isAdmin = computed(() => {
  if (!leagueData.value) return false
  return authStore.isAdminForLeague(leagueData.value)
})

const isLeagueLive = computed(() => {
  return dataStore.liveRounds.some(r => r.leagueId === leagueId && r.iso === todayIso)
})

const myActiveRoundId = computed(() => {
  const myId = authStore.userProfile?.id
  if (!myId) return null
  
  const found = dataStore.liveRounds.find(r => 
    r.leagueId === leagueId && 
    r.iso === todayIso && 
    r.players?.some(p => String(p.id) === String(myId))
  )
  return found?.id || null
})

// --- DATA FETCHING ---
const loadEventsForYear = (year) => {
  if (!leagueId) return
  if (currentUnsub) currentUnsub()
  
  const q = query(
    collection($db, "leagues", leagueId, "calendar"), 
    where("iso", ">=", `${year}-01-01`), 
    where("iso", "<=", `${year}-12-31`), 
    orderBy("iso", "asc")
  )
  currentUnsub = onSnapshot(q, (snap) => { 
    events.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) 
  })
}

// --- Update isClickable ---
const isClickable = (event) => {
  if (isAdminMode.value) return true // Make the entire card clickable to edit in Manage Mode!
  return isFinished(event) || event.iso <= todayIso
}

// --- Update handleCardClick ---
const handleCardClick = (event) => {
  if (!isClickable(event)) return
  
  // 1. In Manage Mode: Clicking anywhere opens the Edit Modal
  if (isAdminMode.value) {
    openEditModal(event)
    return
  }
  
  // 2. If the event is officially "finished", always go to Leaderboard History
  if (isFinished(event)) {
    router.push(`/leaderboard/${leagueId}/${event.iso}/history`)
    return
  }
  
  // 3. Active Event (Today & Not Finished)
  if (event.iso === todayIso) {
    if (myActiveRoundId.value) {
      // RESUME: Take them straight to their active scorecard
      router.push(`/rounds/${myActiveRoundId.value}`)
    } else {
      // START: Take them to setup to join/create a foursome
      router.push({
        path: '/rounds/setup',
        query: { leagueId: leagueId, isLeague: 'true' }
      })
    }
  } else {
    // 4. Past event without a specific status
    router.push(`/leaderboard/${leagueId}/${event.iso}/history`)
  }
}

const isFinished = (event) => {
  const status = (event.status || '').toLowerCase().replace(/^mdi-/, 'mdi:')
  return ['complete', 'mdi:check-bold', 'rain', 'handicap', 'practice'].includes(status)
}

// --- UI HELPERS ---
const getStatusUI = (status, iso) => {
  if (!status) return iso < todayIso ? { icon: 'mdi:check-circle-outline', color: 'text-slate-400' } : null
  const s = status.toLowerCase().replace(/^mdi-/, 'mdi:')
  if (['complete', 'mdi:check-bold'].includes(s)) return { icon: 'mdi:check-circle', color: 'text-emerald-500' }
  if (['practice', 'mdi:alpha-p-circle-outline'].includes(s)) return { icon: 'mdi:flag-triangle', color: 'text-blue-500' }
  if (['rain', 'mdi:weather-pouring', 'mdi:cancel'].includes(s)) return { icon: 'mdi:weather-pouring', color: 'text-slate-400' }
  if (s === 'handicap') return { icon: 'mdi:calculator', color: 'text-amber-500' }
  return s.startsWith('mdi:') ? { icon: s, color: 'text-slate-400' } : (iso < todayIso ? { icon: 'mdi:check-circle-outline', color: 'text-slate-400' } : null)
}

const getInitials = (s) => s ? s.split(' ').map(w => w[0]).join('').toUpperCase() : ''
const nextYear = () => { selectedYear.value = Math.min(selectedYear.value + 1, currentYear) }
const prevYear = () => { selectedYear.value = Math.max(selectedYear.value - 1, 2016) }
const getEventMonth = (iso) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD'
const getEventDay = (iso) => iso ? new Date(iso + 'T12:00:00').getDate() : '-'

// --- MODAL / CRUD ACTIONS ---
const openAddModal = () => { activeEvent.value = null; isModalOpen.value = true }
const openEditModal = (event) => { activeEvent.value = { ...event }; isModalOpen.value = true }

const handleSaveEvent = async (data) => {
  // Intercept the status change before hitting Firebase
  if (data.status === 'complete' && activeEvent.value?.status !== 'complete') {
    const confirmed = await ask(
      "Complete Event & Archive Rounds?", 
      "This will close the event and permanently archive all player scores from the active live rounds. This action cannot be undone.",
      { 
        confirmText: 'Complete & Archive', 
        icon: 'mdi:archive-arrow-down', 
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', 
        iconColor: 'text-emerald-500',
        confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700'
      }
    );
    
    // Stop the save entirely if they click cancel
    if (!confirmed) return; 
  }

  ui.setLoading(true, "Saving...")
  try {
    const ref = activeEvent.value?.id 
      ? doc($db, "leagues", leagueId, "calendar", activeEvent.value.id) 
      : collection($db, "leagues", leagueId, "calendar")
    
    activeEvent.value?.id 
      ? await updateDoc(ref, { ...data, lastUpdated: new Date().toISOString() }) 
      : await addDoc(ref, { ...data, lastUpdated: new Date().toISOString() })
    
    isModalOpen.value = false
    
    // Updates the Pinia cache instantly for the rest of the app
    await dataStore.refreshLeagueCalendar(leagueId)

  } finally { ui.setLoading(false) }
}

const promptDelete = async (event) => {
  const confirmed = await ask(
    "Delete Event?", 
    "Are you sure you want to delete this event?", 
    {
      confirmText: "Delete",
      icon: "mdi:calendar-remove",
      iconBg: "bg-red-50 dark:bg-red-950/30",
      iconColor: "text-red-600 dark:text-red-400",
      confirmBtnClass: "bg-red-600 active:bg-red-700"
    }
  );

  if (!confirmed) return;

  ui.setLoading(true, "Deleting...");
  try { 
    await deleteDoc(doc($db, "leagues", leagueId, "calendar", event.id));
    await dataStore.refreshLeagueCalendar(leagueId)
  } catch (err) {
    console.error("Error deleting event:", err);
  } finally { 
    ui.setLoading(false);
  }
};

// --- LIFECYCLE ---
onMounted(() => { 
  if (leagueId) {
    loadEventsForYear(selectedYear.value)
    dataStore.startLiveListener({ leagueId }) 
  }
})

onUnmounted(() => { if (currentUnsub) currentUnsub() })

// Reload events when year toggle changes
watch(selectedYear, (v) => loadEventsForYear(v))
</script>