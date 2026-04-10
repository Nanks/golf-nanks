<template>
  <div :key="route.params.id" class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 pt-20 lg:pt-20">
    
    <header class="py-4 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 lg:top-20 z-30 shadow-sm flex justify-between items-center">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/menu`" class="text-[10px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest flex items-center gap-1 mb-1 transition-colors">
          <Icon name="mdi:arrow-left" class="size-3" /> Back to Menu
        </NuxtLink>
        <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter leading-none">
          {{ leagueName }}
        </h1>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          @click="isAdminMode = !isAdminMode" 
          :class="isAdminMode ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
        >
          <Icon :name="isAdminMode ? 'mdi:unlocked' : 'mdi:lock'" class="size-4" />
          <span class="hidden sm:inline">Manage</span>
        </button>
        
        <button v-if="isAdminMode" @click="openAddModal" class="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
          <Icon name="mdi:plus" class="size-5" />
        </button>
      </div>
    </header>

    <div class="px-4 mt-6 max-w-2xl mx-auto">
      <div class="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        <button 
          v-for="year in availableYears" :key="year"
          @click="selectedYear = year"
          :class="selectedYear === year ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'"
          class="px-5 py-2 rounded-xl text-xs font-black transition-all"
        >
          {{ year }}
        </button>
      </div>

      <div class="space-y-4">
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 opacity-50">
          <Icon name="svg-spinners:ring-resize" class="size-8 text-emerald-500 mb-4" />
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Events...</p>
        </div>

        <template v-else>
          <NuxtLink 
            v-for="event in events" :key="event.id" 
            :to="`/leaderboard/${event.id}`"
            class="block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-emerald-500 transition-all group"
          >
            <div class="flex justify-between items-center w-full">
              <div>
                <p class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                  {{ formatEventDate(event) }}
                </p>
                <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{{ event.course || 'TBD' }}</span>
                  <span class="text-slate-200 dark:text-slate-700">•</span>
                  <span>{{ event.tees || 'TBD' }}</span>
                  <template v-if="event.ninePlayed">
                    <span class="text-slate-200 dark:text-slate-700">•</span>
                    <span class="text-emerald-500">{{ event.ninePlayed }}</span>
                  </template>
                </div>
                <div class="mt-3 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
                  <Icon name="mdi:parking" class="size-3 text-emerald-500" />
                  <span class="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                    {{ event.game || 'Stroke Play' }}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <template v-if="isAdminMode">
                  <button @click.prevent="openEditModal(event)" class="p-2 text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-500 rounded-xl transition-all">
                    <Icon name="mdi:pencil-outline" class="size-5" />
                  </button>
                  <button @click.prevent="deleteEvent(event.id)" class="p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 rounded-xl transition-all">
                    <Icon name="mdi:trash-can-outline" class="size-5" />
                  </button>
                </template>
                <Icon name="mdi:chevron-right" class="size-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          </NuxtLink>

          <div v-if="events.length === 0" class="text-center py-20">
            <Icon name="mdi:calendar-blank" class="size-12 text-slate-200 dark:text-slate-800 mb-4 mx-auto" />
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No events found for {{ selectedYear }}</p>
          </div>
        </template>
      </div>
    </div>

    <CalendarEventModal 
      :is-open="isModalOpen" 
      :event="activeEvent"
      :is-weekly="isWeekly"
      @close="isModalOpen = false"
      @save="handleSaveEvent"
    />
  </div>
</template>

<script setup>
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const { $db } = useNuxtApp();
const route = useRoute();

// 1. Dynamic Year Logic
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

// 2. Local State
const leagueData = ref(null);
const leagueName = computed(() => leagueData.value?.name || 'Loading...');
const isWeekly = computed(() => leagueData.value?.cadence === 'weekly' || leagueData.value?.type === 'weekly');
const events = ref([]);
const isLoading = ref(true);
let currentUnsub = null;

// 3. Admin & Modal State
const isAdminMode = ref(false);
const isModalOpen = ref(false);
const activeEvent = ref(null);

const fetchLeagueDetails = async () => {
  try {
    const snap = await getDoc(doc($db, "leagues", route.params.id));
    if (snap.exists()) leagueData.value = snap.data();
  } catch (e) {
    console.error("Error fetching league:", e);
  }
};

const loadEventsForYear = (year) => {
  if (currentUnsub) currentUnsub();
  isLoading.value = true;

  const eventsRef = collection($db, "leagues", route.params.id, "calendar");
  
  // 🔥 DB-Level Sorting (REQUIRES COMPOSITE INDEX in Firestore)
  const q = query(
    eventsRef, 
    where("year", "==", Number(year)),
    orderBy("iso", "asc") 
  );

  currentUnsub = onSnapshot(q, (snap) => {
    // No more JS sorting required
    events.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    isLoading.value = false;
  }, (err) => {
    // If screen is blank, click the link in your console here!
    console.error("Firestore Index Error:", err);
    isLoading.value = false;
  });
};

watch(selectedYear, (newYear) => loadEventsForYear(newYear));

onMounted(() => {
  fetchLeagueDetails();
  loadEventsForYear(selectedYear.value);
});

onUnmounted(() => {
  if (currentUnsub) currentUnsub();
});

// 4. Modal Handlers
const openAddModal = () => {
  activeEvent.value = null;
  isModalOpen.value = true;
};

const openEditModal = (event) => {
  activeEvent.value = { ...event };
  isModalOpen.value = true;
};

const handleSaveEvent = async (eventData) => {
  try {
    const calendarRef = collection($db, "leagues", route.params.id, "calendar");
    const eventYear = Number(eventData.iso.split('-')[0]);
    const finalData = { ...eventData, year: eventYear };

    if (!isWeekly.value) finalData.ninePlayed = '18 Holes';

    if (activeEvent.value?.id) {
      await updateDoc(doc($db, "leagues", route.params.id, "calendar", activeEvent.value.id), finalData);
    } else {
      await addDoc(calendarRef, finalData);
    }
    isModalOpen.value = false;
  } catch (e) {
    console.error("Save Error:", e);
  }
};

const deleteEvent = async (eventId) => {
  if (!confirm("Are you sure you want to delete this event?")) return;
  try {
    await deleteDoc(doc($db, "leagues", route.params.id, "calendar", eventId));
  } catch (e) {
    console.error("Delete Error:", e);
  }
};

const formatEventDate = (event) => {
  const dateValue = event.iso;
  if (!dateValue) return 'Date TBD';
  const [y, m, d] = dateValue.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
};
</script>
<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>