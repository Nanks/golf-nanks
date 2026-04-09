<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
    <header v-if="league" class="py-4 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm flex justify-between items-center">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/menu`" class="text-[10px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest flex items-center gap-1 mb-1 transition-colors">
          <Icon name="mdi:arrow-left" class="size-3" /> Back to Menu
        </NuxtLink>
        <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter leading-none">
          {{ league.name }}
        </h1>
      </div>
    </header>

    <div v-if="league" class="px-4 mt-6 max-w-2xl mx-auto">
      
      <div class="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
        <button 
          v-for="year in availableYears" :key="year"
          @click="selectedYear = year"
          :class="selectedYear === year ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'"
          class="px-5 py-2 rounded-xl text-xs font-black transition-all"
        >
          {{ year }}
        </button>
      </div>

      <div class="space-y-4">
        <NuxtLink 
          v-for="event in filteredEvents" 
          :key="event?.id" 
          :to="`/leaderboard/${event.id}`"
          class="block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-emerald-500 transition-all group"
        >
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">
                {{ formatEventDate(event) }}
              </p>
              <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{{ event.course || 'TBD' }}</span>
                <span class="text-slate-200 dark:text-slate-700">•</span>
                <span>{{ event.tees || 'TBD' }}</span>
              </div>
              
              <div class="mt-3 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
                <Icon name="mdi:parking" class="size-3 text-emerald-500" />
                <span class="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                  {{ event.game || 'Stroke Play' }}
                </span>
              </div>
            </div>
            <Icon name="mdi:chevron-right" class="size-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
        </NuxtLink>

        <div v-if="filteredEvents.length === 0" class="text-center py-20">
          <Icon name="mdi:calendar-blank" class="size-12 text-slate-200 dark:text-slate-800 mb-4 mx-auto" />
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No events found for {{ selectedYear }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useData } from '~/stores/data';

const { $db } = useNuxtApp();
const route = useRoute();
const dataStore = useData();

const league = computed(() => dataStore.leagues.get(route.params.id));
const events = ref([]);
const selectedYear = ref(new Date().getFullYear());
const availableYears = [2026, 2025, 2024, 2023, 2022];

onMounted(() => {
  const eventsRef = collection($db, "leagues", route.params.id, "calendar");
  // We'll order by the field you are using, usually 'iso' or 'date'
  const q = query(eventsRef, orderBy("iso", "desc"));

  const unsub = onSnapshot(q, (snap) => {
    events.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
  onUnmounted(() => unsub());
});

const filteredEvents = computed(() => {
  return events.value.filter(e => {
    // 🛡️ Handles Firestore Timestamp objects vs ISO strings
    const dateValue = e.iso || e.date;
    if (!dateValue) return false;

    const yearString = typeof dateValue === 'string' 
      ? dateValue.split('-')[0] 
      : new Date(dateValue.seconds * 1000).getFullYear().toString();

    return yearString === selectedYear.value.toString();
  });
});

const formatEventDate = (event) => {
  const dateValue = event.iso || event.date;
  if (!dateValue) return 'Date TBD';

  // Handle String (YYYY-MM-DD)
  if (typeof dateValue === 'string') {
    const [y, m, d] = dateValue.split('-');
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  }

  // Handle Firestore Timestamp
  return new Date(dateValue.seconds * 1000).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });
};
</script>