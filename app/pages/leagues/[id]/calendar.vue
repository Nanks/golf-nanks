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
          :class="selectedYear <= 2016 ? 'border-transparent text-slate-300 dark:text-slate-800 bg-transparent' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm active:scale-95 hover:bg-emerald-500/20'"
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
          :class="selectedYear >= currentYear ? 'border-transparent text-slate-300 dark:text-slate-800 bg-transparent' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm active:scale-95 hover:bg-emerald-500/20'"
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
          <CalendarEventCard 
            v-for="leagueEvent in events" 
            :key="leagueEvent.id"
            :event="leagueEvent"
            :can-rsvp="leagueData?.canRsvp" 
            :is-admin-mode="isAdminMode"
            :today-iso="todayIso"
            :is-player-in-league="isPlayerInLeague"
            :my-active-round-id="myActiveRoundId"
            :league-id="leagueId"
            :total-league-players="totalLeaguePlayers"
            @card-click="handleCardClick"
            @edit="openEditModal"
            @delete="promptDelete"
            @rsvp="updateRSVP(leagueEvent, $event)"
            @nudge="nudgePlayers"
          />
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
import { collection, query, where, orderBy, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getLocalIsoDate } from '~/utils/leagueActions'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { $db } = useNuxtApp()
const route = useRoute()
const ui = useUIStore()
const authStore = useAuthStore()
const dataStore = useData()
const { ask } = useConfirm() 
const toast = useToast()

// --- STATE ---
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const events = ref([])
const isAdminMode = ref(false)
const isModalOpen = ref(false)
const activeEvent = ref(null)
const totalLeaguePlayers = ref(0)
let currentUnsub = null

const todayIso = getLocalIsoDate()
const leagueId = route.params.id 

// --- COMPUTED ---
const leagueData = computed(() => dataStore.leagues.find(l => l.id === leagueId))
const isAdmin = computed(() => leagueData.value ? authStore.isAdminForLeague(leagueData.value) : false)
const isPlayerInLeague = computed(() => (authStore.userProfile?.leagues || []).includes(leagueId))
const isLeagueLive = computed(() => dataStore.liveRounds.some(r => r.leagueId === leagueId && r.iso === todayIso))
const myActiveRoundId = computed(() => {
  const myId = authStore.userProfile?.id
  if (!myId) return null
  const found = dataStore.liveRounds.find(r => r.leagueId === leagueId && r.iso === todayIso && r.players?.some(p => String(p.id) === String(myId)))
  return found?.id || null
})

// --- DATA FETCHING ---
const loadEventsForYear = (year) => {
  if (!leagueId) return
  if (currentUnsub) currentUnsub()
  const q = query(collection($db, "leagues", leagueId, "calendar"), where("iso", ">=", `${year}-01-01`), where("iso", "<=", `${year}-12-31`), orderBy("iso", "asc"))
  currentUnsub = onSnapshot(q, (snap) => { events.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
}

const fetchLeaguePlayerCount = async () => {
  if (!leagueId) return
  try {
    const q = query(collection($db, 'players'), where('leagues', 'array-contains', leagueId))
    const snap = await getDocs(q)
    totalLeaguePlayers.value = snap.size
  } catch (err) {
    console.error("Failed to get player count:", err)
  }
}

// --- RSVP & ACTIONS ---
const updateRSVP = async (leagueEvent, status) => {
  if (!authStore.userProfile?.id) return;
  const playerId = authStore.userProfile.id;
  try {
    const eventRef = doc($db, `leagues/${leagueId}/calendar`, leagueEvent.id);
    await updateDoc(eventRef, { [`rsvps.${playerId}`]: status });
    
    // Explicitly format the status text
    const displayStatus = status === 'in' ? 'IN' : 'OUT';
    toast.add(`Marked as ${displayStatus}`, 'success');
  } catch (error) {
    console.error("RSVP failed:", error);
    toast.add("Failed to update RSVP", 'error');
  }
}

const nudgePlayers = async (leagueEvent) => {
  const confirmed = await ask(
    "Nudge Unanswered Players?", 
    "This will send a push notification to all players who haven't RSVP'd for this event yet.", 
    { 
      confirmText: "Send Nudge", 
      icon: "mdi:bell-ring", 
      iconBg: "bg-blue-50 dark:bg-blue-900/30", 
      iconColor: "text-blue-500", 
      confirmBtnClass: "bg-blue-600 active:bg-blue-700 hover:bg-blue-500" 
    }
  );

  if (!confirmed) return;

  ui.setLoading(true, "Sending Nudges...");
  try {
    const functions = getFunctions();
    const nudgeFn = httpsCallable(functions, 'nudgeUnansweredPlayers');
    
    const result = await nudgeFn({ 
        leagueId: leagueId, 
        eventId: leagueEvent.id 
    });

    if (result.data.count > 0) {
      toast.add(`Nudge sent successfully to ${result.data.count} devices!`, 'success');
    } else {
      toast.add("No players needed a nudge, or no opted-in devices found.", 'info');
    }
  } catch (error) {
    console.error("Nudge failed:", error);
    toast.add("Failed to send nudges.", 'error');
  } finally {
    ui.setLoading(false);
  }
};

const handleCardClick = (leagueEvent) => {
  if (isAdminMode.value) {
    openEditModal(leagueEvent)
    return
  }
  const s = (leagueEvent.status || '').toLowerCase().replace(/^mdi-/, 'mdi:')
  const isFinished = ['complete', 'mdi:check-bold', 'rain', 'handicap', 'practice'].includes(s)
  
  if (isFinished) {
    navigateTo(`/leaderboard/${leagueId}/${leagueEvent.iso}/history`)
    return
  }
  
  if (leagueEvent.iso === todayIso) {
    if (myActiveRoundId.value) navigateTo(`/rounds/${myActiveRoundId.value}`)
    else if (isPlayerInLeague.value) navigateTo({ path: '/rounds/setup', query: { leagueId: leagueId, isLeague: 'true' } })
  } else {
    navigateTo(`/leaderboard/${leagueId}/${leagueEvent.iso}/history`)
  }
}

const nextYear = () => { selectedYear.value = Math.min(selectedYear.value + 1, currentYear) }
const prevYear = () => { selectedYear.value = Math.max(selectedYear.value - 1, 2016) }
const openAddModal = () => { activeEvent.value = null; isModalOpen.value = true }
const openEditModal = (leagueEvent) => { activeEvent.value = { ...leagueEvent }; isModalOpen.value = true }

const handleSaveEvent = async (data) => {
  if (data.status === 'complete' && activeEvent.value?.status !== 'complete') {
    const confirmed = await ask("Complete Event?", "This will archive the round.", { confirmText: 'Complete', confirmBtnClass: 'bg-emerald-600' });
    if (!confirmed) return; 
  }
  ui.setLoading(true, "Saving...")
  try {
    const ref = activeEvent.value?.id ? doc($db, "leagues", leagueId, "calendar", activeEvent.value.id) : collection($db, "leagues", leagueId, "calendar")
    activeEvent.value?.id ? await updateDoc(ref, { ...data, lastUpdated: new Date().toISOString() }) : await addDoc(ref, { ...data, lastUpdated: new Date().toISOString() })
    isModalOpen.value = false
    await dataStore.refreshLeagueCalendar(leagueId)
  } finally { ui.setLoading(false) }
}

const promptDelete = async (leagueEvent) => {
  const confirmed = await ask("Delete Event?", "Are you sure?", { confirmText: "Delete", confirmBtnClass: "bg-red-600" });
  if (!confirmed) return;
  ui.setLoading(true, "Deleting...");
  try { 
    await deleteDoc(doc($db, "leagues", leagueId, "calendar", leagueEvent.id));
    await dataStore.refreshLeagueCalendar(leagueId)
  } finally { ui.setLoading(false); }
};

onMounted(() => { 
  if (leagueId) {
    loadEventsForYear(selectedYear.value)
    fetchLeaguePlayerCount()
    dataStore.startLiveListener({ leagueId }) 
  }
})

onUnmounted(() => { if (currentUnsub) currentUnsub() })
watch(selectedYear, (v) => loadEventsForYear(v))
</script>