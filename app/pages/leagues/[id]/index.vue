<template>
  <div class="p-6 max-w-2xl mx-auto pt-20">
    <header class="mb-8">
      <NuxtLink to="/leagues" class="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
        ← Back to Leagues
      </NuxtLink>
      <h1 class="text-3xl font-black text-emerald-600 mt-2">{{ leagueName }}</h1>
      <p v-if="calendarItems.length > 0" class="text-slate-400 text-sm font-bold">
        {{ currentYear }} Schedule
      </p>
    </header>

    <div v-if="loading" class="text-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
    </div>

    <div v-else-if="calendarItems.length === 0" class="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
      <p class="text-slate-400 italic">No scheduled dates found for the most recent year.</p>
    </div>

    <div v-else class="space-y-4">
      <!-- Link to the Leaderboard for each specific date -->
      <NuxtLink 
        v-for="item in calendarItems" 
        :key="item.id" 
        :to="`/leagues/${route.params.id}/${item.iso}`"
        class="block p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition group"
      >
        <div class="flex justify-between items-center">
          <div>
            <p class="font-bold text-lg group-hover:text-emerald-600 transition">
              {{ formatDate(item.iso) }}
            </p>
            <p class="text-xs text-slate-400 font-medium">
              {{ item.location || 'Location TBD' }}
            </p>
          </div>
          <div class="text-slate-300 group-hover:text-emerald-500 transition">
            →
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

const route = useRoute();
const { $db } = useNuxtApp();

const leagueName = ref('Loading...');
const calendarItems = ref([]);
const currentYear = ref('');
const loading = ref(true);

onMounted(async () => {
  const leagueId = route.params.id; //

  try {
    // 1. Fetch the main League details
    const leagueSnap = await getDoc(doc($db, "leagues", leagueId));
    if (leagueSnap.exists()) {
      leagueName.value = leagueSnap.data().name;
    }

    // 2. Fetch Calendar entries ordered by date (latest first)
    const calRef = collection($db, "leagues", leagueId, "calendar");
    const q = query(calRef, orderBy("iso", "desc"));
    const querySnapshot = await getDocs(q);
    
    const allItems = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Filter to only show dates from the most recent year found in the data
    if (allItems.length > 0) {
      const latestYear = allItems[0].iso.substring(0, 4); // e.g., "2025" from "2025-05-15"
      currentYear.value = latestYear;
      
      // Sort these specific items ascending (Hole 1 to 18 style) for the list display
      calendarItems.value = allItems
        .filter(item => item.iso.startsWith(latestYear))
        .sort((a, b) => a.iso.localeCompare(b.iso));
    }
  } catch (err) {
    console.error("Error loading league details:", err);
  } finally {
    loading.value = false;
  }
});

const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'long', 
    day: 'numeric' 
  });
};
</script>
