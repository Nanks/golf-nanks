<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 px-2 py-6 pt-22 max-w-2xl mx-auto pb-32 select-none">
    
    <template v-if="leagueData">
      <LeagueHeader 
        :title="leagueData.shortName || leagueData.name" 
        :is-admin="isAdmin"
        :back-to="`/leagues/${route.params.id}/menu`"
        back-text="League Menu"
      >
        <template #action>
          <ClientOnly>
            <button 
              v-if="isAdmin"
              @click="isAdminMode = !isAdminMode" 
              :class="isAdminMode ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
              <Icon :name="isAdminMode ? 'mdi:lock-open-variant' : 'mdi:cog'" class="size-3.5" />
              <span class="hidden xs:inline">{{ isAdminMode ? 'Finish Editing' : 'Manage' }}</span>
            </button>
          </ClientOnly>
        </template>
      </LeagueHeader>

      <div class="flex items-center justify-center gap-6 mb-2">
        <button 
          @click="prevYear" 
          :disabled="selectedYear <= 2016"
          :class="selectedYear <= 2016 ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 active:text-emerald-500 active:scale-90'"
          class="p-2 transition-all rounded-full bg-slate-200/50 dark:bg-slate-900/50"
        >
          <Icon name="mdi:chevron-left" class="size-6" />
        </button>
        
        <div class="text-center min-w-[80px]">
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block leading-none mb-1">Season</span>
          <span class="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{{ selectedYear }}</span>
        </div>

        <button 
          @click="nextYear" 
          :disabled="selectedYear >= currentYear"
          :class="selectedYear >= currentYear ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 active:text-emerald-500 active:scale-90'"
          class="p-2 transition-all rounded-full bg-slate-200/50 dark:bg-slate-900/50"
        >
          <Icon name="mdi:chevron-right" class="size-6" />
        </button>
      </div>

      <ClientOnly>
        <Transition name="fade">
          <div v-if="isAdminMode" class="mb-4">
            <button 
              @click="openAddModal"
              class="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 active:border-emerald-500 active:text-emerald-500 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="mdi:plus-circle-outline" class="size-4" /> 
              Add New Event
            </button>
          </div>
        </Transition>
      </ClientOnly>

      <div class="space-y-2">
        <div v-for="event in events" :key="event.id" 
            class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-all shadow-sm">
          
          <div class="p-2.5 flex items-center justify-between gap-3">
            
            <component 
                :is="event.iso <= todayISO ? 'NuxtLink' : 'div'"
                :to="event.iso <= todayISO ? getEventLink(event) : undefined" 
                class="flex-1 min-w-0 flex items-center gap-3 transition-all duration-300"
                :class="event.iso <= todayISO ? 'cursor-pointer active:scale-[0.98]' : 'cursor-not-allowed'"
              >
              <div class="w-10 shrink-0 text-center flex flex-col items-center justify-center">
                <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-0.5">
                  {{ getEventMonth(event.iso) }}
                </span>
                <span class="text-lg font-black text-slate-900 dark:text-white tabular-nums leading-none">
                  {{ getEventDay(event.iso) }}
                </span>
              </div>

              <div class="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0"></div>

              <div class="flex-1 min-w-0 py-0.5">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-black text-slate-900 dark:text-white uppercase text-sm italic leading-none tracking-tighter truncate">
                    {{ event.course || 'TBD' }}
                  </h3>
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">{{ event.tees || 'TBD' }}</span>
                </div>
                
                <div class="flex gap-1.5 flex-wrap">
                  <template v-for="validGames in [(event.game || []).filter(g => g.toLowerCase() !== 'stroke play')]" :key="event.id + '-games'">
    
                    <div 
                      v-for="g in validGames" 
                      :key="g"
                      class="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-500 flex items-center"
                    >
                      <span class="text-[8px] font-black uppercase tracking-wider leading-none mt-0.5">
                        {{ validGames.length === 1 ? g : getInitials(g) }}
                      </span>
                    </div>
                    
                  </template>
                </div>
              </div>
            </component>

            <div class="flex items-center gap-2 shrink-0 pr-1">
              <div v-if="getStatusUI(event.status)" :class="getStatusUI(event.status).color">
                <Icon :name="getStatusUI(event.status).icon" class="size-5" />
              </div>
              
              <ClientOnly>
                <div v-if="isAdminMode" class="flex gap-1">
                  <button @click="openEditModal(event)" class="p-1.5 text-slate-300 active:text-amber-500 transition-colors">
                    <Icon name="mdi:pencil-circle" class="size-6" />
                  </button>
                  <button @click="promptDelete(event)" class="p-1 text-slate-300 active:text-red-500 transition-colors">
                    <Icon name="mdi:close-circle-outline" class="size-5" />
                  </button>
                </div>
                <template v-else-if="event.iso <= todayISO">
                  <Icon 
                    :name="(event.iso === todayISO && dataStore.isLeagueLiveToday(route.params.id)) ? 'mdi:poker-chip' : 'mdi:chevron-right'" 
                    :class="(event.iso === todayISO && dataStore.isLeagueLiveToday(route.params.id)) ? 'text-emerald-500 animate-pulse' : 'text-slate-300'"
                    class="size-5" 
                  />
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>

        <div v-if="events.length === 0" class="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Icon name="mdi:calendar-blank" class="size-10 text-slate-200 dark:text-slate-800 mb-2 mx-auto" />
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No events for {{ selectedYear }}</p>
        </div>
      </div>
    </template>

    <ClientOnly>
      <CalendarEventModal 
        :is-open="isModalOpen" 
        :event="activeEvent"
        :league="leagueData"
        @close="isModalOpen = false"
        @save="handleSaveEvent"
      />

      <ConfirmModal
        :is-open="isDeleteModalOpen"
        title="Delete Event?"
        confirm-text="Delete"
        icon="mdi:calendar-remove"
        @close="cancelDelete"
        @confirm="executeDelete"
      >
        Are you sure you want to delete the event at <b>{{ eventToDelete?.course }}</b> on <b>{{ formatEventDate(eventToDelete) }}</b>? This action cannot be undone.
      </ConfirmModal>
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { useUIStore } from "~/stores/ui"
import { useAuthStore } from "~/stores/auth"
import { useData } from "~/stores/data"

const { $db } = useNuxtApp();
const route = useRoute();
const ui = useUIStore();
const authStore = useAuthStore();
const dataStore = useData();

// --- STATE ---
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const events = ref([]);
const isAdminMode = ref(false);
const isModalOpen = ref(false);
const activeEvent = ref(null);

const isDeleteModalOpen = ref(false);
const eventToDelete = ref(null);

let currentUnsub = null;

// --- COMPUTED DATA ---
const leagueData = computed(() => {
  return dataStore.leagues.find(l => l.id === route.params.id)
})

const isAdmin = computed(() => {
  return leagueData.value && authStore.isAdminForLeague(leagueData.value.type)
})

// --- DATA FETCHING ---
const loadEventsForYear = (year) => {
  if (currentUnsub) currentUnsub();
  
  const eventsRef = collection($db, "leagues", route.params.id, "calendar");
  const q = query(
    eventsRef, 
    where("iso", ">=", `${year}-01-01`),
    where("iso", "<=", `${year}-12-31`),
    orderBy("iso", "asc")
  );

  currentUnsub = onSnapshot(q, (snap) => {
    events.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
};

// --- EVENT HANDLERS ---
const openAddModal = () => {
  activeEvent.value = null;
  isModalOpen.value = true;
};

const openEditModal = (event) => {
  activeEvent.value = { ...event };
  isModalOpen.value = true;
};

const handleSaveEvent = async (eventData) => {
  ui.setLoading(true, "Saving Event...");
  try {
    const calendarRef = collection($db, "leagues", route.params.id, "calendar");
    const finalData = { ...eventData, lastUpdated: new Date().toISOString() };

    if (activeEvent.value?.id) {
      await updateDoc(doc($db, "leagues", route.params.id, "calendar", activeEvent.value.id), finalData);
    } else {
      await addDoc(calendarRef, finalData);
    }
    isModalOpen.value = false;
  } catch (e) {
    console.error("Save Error:", e);
  } finally {
    ui.setLoading(false);
  }
};

const promptDelete = (event) => {
  eventToDelete.value = event;
  isDeleteModalOpen.value = true;
};

const cancelDelete = () => {
  isDeleteModalOpen.value = false;
  eventToDelete.value = null;
};

const executeDelete = async () => {
  if (!eventToDelete.value) return;
  ui.setLoading(true, "Deleting...");
  try {
    await deleteDoc(doc($db, "leagues", route.params.id, "calendar", eventToDelete.value.id));
    isDeleteModalOpen.value = false;
    eventToDelete.value = null;
  } catch (e) {
    console.error("Delete Error:", e);
  } finally {
    ui.setLoading(false);
  }
};

// --- HELPERS ---
const getInitials = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w[0]).join('').toUpperCase();
};

const nextYear = () => {
  selectedYear.value = Math.min(selectedYear.value + 1, currentYear);
};

const prevYear = () => {
  selectedYear.value = Math.max(selectedYear.value - 1, 2016);
};

const todayISO = [
  new Date().getFullYear(),
  String(new Date().getMonth() + 1).padStart(2, '0'),
  String(new Date().getDate()).padStart(2, '0')
].join('-');

const getEventMonth = (iso) => {
  if (!iso) return 'TBD';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
};

const getEventDay = (iso) => {
  if (!iso) return '-';
  return new Date(iso + 'T12:00:00').getDate();
};

const formatEventDate = (event) => {
  if (!event?.iso) return 'TBD';
  return new Date(event.iso + 'T12:00:00').toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
};

const getEventLink = (event) => {
  // Use leagueData instead of the undefined props
  const type = leagueData.value?.type || 'casual'; 
  const iso = event.iso;
  
  const isFinished = ['complete', 'rain', 'handicap', 'practice'].includes(event.status?.toLowerCase());

  return isFinished 
    ? `/leaderboard/${type}/${iso}/history` 
    : `/leaderboard/${type}/${iso}/live?from=calendar`;
};

const getStatusUI = (status) => {
  if (!status) return null; // null = planned (no icon)

  // Normalize the string so we don't have to worry about case sensitivity
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    // 1. COMPLETE
    case 'complete':
    case 'mdi:check-bold':
      return { icon: 'mdi:check-circle', color: 'text-emerald-500' };

    // 2. PRACTICE
    case 'practice':
    case 'mdi:alpha-p-circle-outline':
      return { icon: 'mdi:flag-triangle', color: 'text-blue-500' };

    // 3. RAIN / CANCELLED
    case 'rain':
    case 'mdi:weather-pouring':
    case 'mdi:cancel':
      return { icon: 'mdi:weather-pouring', color: 'text-slate-400' };

    // 4. HANDICAP
    case 'handicap':
      return { icon: 'mdi:calculator', color: 'text-amber-500' };

    // Fallback for anything else
    default:
      return null;
  }
};

// --- LIFECYCLE ---
onMounted(() => {
  loadEventsForYear(selectedYear.value);
  dataStore.startLiveListener(route.params.id);
});

onUnmounted(() => {
  if (currentUnsub) currentUnsub();
});

watch(selectedYear, (newYear) => loadEventsForYear(newYear));
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>