<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24 max-w-2xl mx-auto">
    <header class="mb-8">
      <NuxtLink :to="`/leagues/${route.params.id}/menu`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
        ← Back to Menu
      </NuxtLink>
      <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-2 leading-none">
        {{ gameTitle }} Leaderboard
      </h1>
      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
        Season {{ selectedYear }} • Best {{ maxCountedWeeks }} Weeks
      </p>
    </header>

    <!-- Year Selector Chips -->
    <div v-if="availableYears.length > 1" class="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
      <button 
        v-for="year in availableYears" :key="year"
        @click="changeYear(year)"
        :class="selectedYear === year ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200'"
        class="px-5 py-2 rounded-full border text-[10px] font-black uppercase transition-all whitespace-nowrap"
      >
        {{ year }}
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 10" :key="i" class="h-14 bg-white dark:bg-slate-900 animate-pulse rounded-2xl"></div>
    </div>

    <div v-else class="space-y-2">
      <div v-for="(stat, index) in leaderboard" :key="stat.playerId" class="flex flex-col">
        <!-- Main Row -->
        <button 
          @click="togglePlayer(stat.playerId)"
          class="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm z-10 relative text-left active:scale-[0.99] transition-transform"
        >
          <div class="flex items-center gap-4">
            <span class="text-xs font-black text-slate-300 w-4">{{ index + 1 }}</span>
            <div>
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm tracking-tight">{{ stat.playerName }}</p>
              <p class="text-[9px] font-bold text-slate-400 uppercase">
                {{ stat.weeksPlayed }} Played • {{ stat.dropped }} Dropped
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-xl font-black text-emerald-600 leading-none">
                {{ gameType === 'birds' ? stat.total.toFixed(1) : stat.total }}
              </p>
            </div>
            <Icon name="mdi:chevron-down" :class="{ 'rotate-180': activePlayerId === stat.playerId }" class="text-slate-300 transition-transform" />
          </div>
        </button>

        <!-- Weekly Breakdown Dropdown -->
        <div v-if="activePlayerId === stat.playerId" class="mx-3 -mt-2 pt-6 pb-4 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-b-2xl border-x border-b border-slate-200 dark:border-slate-800">
          <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Weekly Performance (Gray = Dropped)</p>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="week in stat.allWeeks" :key="week.iso" 
                 :class="week.isDropped ? 'opacity-40 bg-slate-200 dark:bg-slate-700' : 'bg-white dark:bg-slate-900 border-emerald-500/30'"
                 class="flex justify-between items-center p-2 rounded-lg border text-[10px] font-bold">
              <span class="text-slate-400 font-mono">{{ formatDateShort(week.iso) }}</span>
              <span :class="!week.isDropped ? 'text-emerald-600' : 'text-slate-500'">
                {{ gameType === 'birds' ? week.score.toFixed(1) : week.score }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

const route = useRoute();
const { $db } = useNuxtApp();

const gameType = computed(() => route.params.game as 'birds' | 'deuces');
const gameTitle = computed(() => gameType.value === 'birds' ? 'Birds' : 'Deuces');

const loading = ref(true);
const selectedYear = ref('');
const activePlayerId = ref<string | null>(null);
const allYearsData = ref<any[]>([]); 
const currentYearStats = ref<any[]>([]);
const validWeeksCount = ref(0);

const maxCountedWeeks = computed(() => Math.max(0, validWeeksCount.value - 2));

const availableYears = computed(() => {
  const years = allYearsData.value.map(item => item.iso.substring(0, 4));
  return [...new Set(years)].sort((a, b) => b.localeCompare(a));
});

const leaderboard = computed(() => {
  const playerGroups = currentYearStats.value.reduce((acc, curr) => {
    if (!acc[curr.playerId]) {
      acc[curr.playerId] = { playerId: curr.playerId, playerName: curr.playerName, rawWeeks: [] };
    }
    acc[curr.playerId].rawWeeks.push({ iso: curr.iso, score: curr[gameType.value] || 0 });
    return acc;
  }, {} as Record<string, any>);

  return Object.values(playerGroups).map((player: any) => {
    // Sort raw weeks by score DESC to identify which ones to drop
    const sortedWeeks = [...player.rawWeeks].sort((a, b) => b.score - a.score);
    
    // Determine which weeks are counted vs dropped
    const allWeeksWithStatus = player.rawWeeks.map((w: any) => {
      // A week is dropped if its score isn't among the top X scores
      // Note: We use an index check on the sorted array to handle ties correctly
      const rank = sortedWeeks.findIndex(sw => sw.iso === w.iso);
      return { ...w, isDropped: rank >= maxCountedWeeks.value };
    });

    const total = allWeeksWithStatus
      .filter(w => !w.isDropped)
      .reduce((sum, w) => sum + w.score, 0);

    return {
      playerId: player.playerId,
      playerName: player.playerName,
      weeksPlayed: player.rawWeeks.length,
      dropped: Math.max(0, player.rawWeeks.length - maxCountedWeeks.value),
      total,
      allWeeks: allWeeksWithStatus.sort((a, b) => a.iso.localeCompare(b.iso)) // Sort dropdown by date
    };
  }).sort((a, b) => b.total - a.total);
});

const togglePlayer = (id: string) => {
  activePlayerId.value = activePlayerId.value === id ? null : id;
};

const fetchYearData = async (year: string) => {
  loading.value = true;
  activePlayerId.value = null;
  try {
    const leagueId = route.params.id as string;
    
    const calRef = collection($db, "leagues", leagueId, "calendar");
    const calSnap = await getDocs(query(
      calRef, 
      where("iso", ">=", `${year}-01-01`), 
      where("iso", "<=", `${year}-12-31`),
      where("status", "==", "mdi-check-bold")
    ));
    validWeeksCount.value = calSnap.size;

    const statsRef = collection($db, "leagues", leagueId, "weeklyStats");
    const statsSnap = await getDocs(query(
      statsRef,
      where("iso", ">=", `${year}-01-01`),
      where("iso", "<=", `${year}-12-31`),
      orderBy("iso", "desc")
    ));
    
    currentYearStats.value = statsSnap.docs.map(d => d.data());
  } catch (err) {
    console.error("Error loading year data:", err);
  } finally {
    loading.value = false;
  }
};

const changeYear = (year: string) => {
  selectedYear.value = year;
  fetchYearData(year);
};

const formatDateShort = (iso: string) => {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
};

onMounted(async () => {
  const leagueId = route.params.id as string;
  const calSnap = await getDocs(collection($db, "leagues", leagueId, "calendar"));
  allYearsData.value = calSnap.docs.map(d => d.data()).filter(d => d.iso);
  
  if (availableYears.value.length > 0) {
    selectedYear.value = availableYears.value[0];
    await fetchYearData(selectedYear.value);
  } else {
    loading.value = false;
  }
});
</script>
