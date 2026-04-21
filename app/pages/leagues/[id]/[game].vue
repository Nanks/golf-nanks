<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-20">
    
    <header class="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
      <button 
        @click="router.back()" 
        class="p-2 -ml-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-emerald-600 transition-all active:scale-90"
      >
        <Icon name="mdi:chevron-left" class="size-6" />
    </button>
      
      <h1 class="text-3xl font-black uppercase italic tracking-tighter leading-none text-slate-800 dark:text-white">
        {{ game }}
      </h1>
      <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
        Season Standings • {{ selectedYear }}
      </p>
    </header>
    <!-- <LeagueHeader 
        :title="leagueData?.shortName || leagueData?.name || (type === 'casual' ? 'Casual' : type)"
        :isAdmin="isAdmin"
        :backTo="router.back()"
        :backText="backText"
      >
        <template #action>
          <ClientOnly>
            <div class="text-3xl font-black uppercase italic tracking-tighter leading-none text-slate-800 dark:text-white">
              {{ game }}
            </div>
            <div class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
              Season Standings • {{ selectedYear }}
            </div>
          </ClientOnly>
        </template>
      </LeagueHeader> -->

    <div class="max-w-2xl mx-auto px-4">
      
      <div class="mt-6 mb-4 flex justify-center">
        <div class="inline-flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar max-w-full">
          <button 
            v-for="year in availableYears" :key="year"
            @click="selectedYear = year"
            :class="selectedYear === year 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'"
            class="px-5 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest flex-shrink-0"
          >
            {{ year }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center pt-20 gap-4">
        <Icon name="mdi:loading" class="size-8 text-emerald-500 animate-spin" />
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Calculating {{ selectedYear }} totals...
        </p>
      </div>

      <div v-else-if="standings.length > 0" class="space-y-3 pb-10">
        <div v-for="(p, i) in standings" 
            :key="p.name" 
            @click="selectedDetails = p"
            class="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
          
          <div class="flex items-center gap-5">
            <span class="font-black text-slate-300 w-6 italic text-lg">{{ i + 1 }}</span>
            <div>
              <p class="text-lg text-primary">
                {{ p.name }}
              </p>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {{ p.playedCount }} / {{ totalPossibleWeeks }} Weeks Played
              </p>
            </div>
          </div>

          <span class="text-2xl font-black italic text-emerald-600 tabular-nums">
            {{ formatPoints(p.totalPoints) }}
          </span>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center pt-20 text-slate-400">
        <Icon name="mdi:calendar-blank" class="size-16 opacity-10 mb-4" />
        <p class="text-[10px] font-black uppercase tracking-widest">No data found for {{ selectedYear }}</p>
      </div>

    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedDetails" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div @click="selectedDetails = null" class="absolute inset-0"></div>

          <div class="relative w-full max-w-xs bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[55vh]">
            
            <div class="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
                  {{ selectedDetails.name }}
                </h3>
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Played: <span class="text-slate-800 dark:text-white">{{ selectedDetails.playedCount }}</span> / {{ totalPossibleWeeks }} Weeks
                </p>
              </div>
              <button @click="selectedDetails = null" class="text-slate-400 p-1">
                <Icon name="mdi:close" class="size-4" />
              </button>
            </div>

            <div class="p-2 overflow-y-auto no-scrollbar grid grid-cols-3 gap-1">
              <div v-for="round in selectedDetails.details" :key="round.date" 
                   :class="round.isDropped ? 'opacity-20 border-transparent' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'"
                   class="flex flex-col items-center justify-center py-2 rounded-xl border transition-all">
                
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">
                  {{ getShortDate(round.date) }}
                </span>
                
                <span :class="round.isDropped ? 'text-slate-800 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'" 
                      class="text-base font-black italic leading-none tabular-nums">
                  {{ formatPoints(round.points) }}
                </span>
              </div>
            </div>

            <div class="px-5 py-3 bg-slate-900 dark:bg-white flex justify-between items-center">
              <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Season Total</span>
              <span class="text-xl font-black italic text-white dark:text-slate-900">
                {{ formatPoints(selectedDetails.totalPoints) }}
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    
  </div>
</template>

<script setup>
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
const route = useRoute(); // <-- Add this line
const { id, game } = route.params; 
const { $db } = useNuxtApp();

const standings = ref([]);
const loading = ref(true);
const selectedDetails = ref(null);
const totalPossibleWeeks = ref(0);

// 1. Year Picker State
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear.toString());

// Generates an array like ["2021", "2022", "2023", "2024", "2025", "2026"]
const availableYears = computed(() => {
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push((currentYear - i).toString());
  }
  return years;
});

const formatPoints = (points) => {
  if (points === undefined || points === null) return '0';
  return points % 1 !== 0 ? points.toFixed(1) : points.toString();
};

const getShortDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso + 'T00:00:00'); // Ensure local timezone
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fetchStandings = async () => {
  if (!id) return;
  loading.value = true;

  try {
    const calRef = collection($db, "leagues", id, "calendar");
    const q = query(calRef, where("year", "==", selectedYear.value)); 
    const snap = await getDocs(q);
    
    const completedWeeks = snap.docs.filter(d => d.data().status === 'mdi-check-bold');
    totalPossibleWeeks.value = completedWeeks.length; // Now accessible to template
    
    const playerMap = {};

    completedWeeks.forEach(doc => {
      const data = doc.data();
      if (data.yearlong) {
        data.yearlong.forEach(entry => {
          const groupKey = entry.name.trim();
          if (!groupKey) return;

          if (!playerMap[groupKey]) {
            playerMap[groupKey] = {
              name: entry.name,
              details: [] 
            };
          }

          playerMap[groupKey].details.push({
            date: data.date,
            points: parseFloat(entry[game]) || 0,
            isDropped: false 
          });
        });
      }
    });

    standings.value = Object.values(playerMap).map(p => {
      // 1. Sort by points (lowest to highest) to find the drops
      const sortedByScore = [...p.details].sort((a, b) => a.points - b.points);
      
      const played = p.details.length;
      const cap = totalPossibleWeeks.value - 2;
      
      // 2. Drop Logic: If they played more than the 'Counted Cap', drop the excess
      // e.g., If 16 possible, cap is 14. If they played 16, drop 2. If they played 15, drop 1.
      if (played > cap) {
        const numToDrop = played - cap;
        for (let i = 0; i < numToDrop; i++) {
          sortedByScore[i].isDropped = true;
        }
      }

      const total = p.details.reduce((acc, r) => acc + (r.isDropped ? 0 : r.points), 0);

      // 3. Final Sort for Modal: Highest score to lowest
      p.details.sort((a, b) => b.points - a.points);

      return {
        ...p,
        totalPoints: total,
        playedCount: played
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 3. Watch for year changes to re-fetch
watch(selectedYear, (newYear) => {
  if (newYear && id) {
    fetchStandings();
  }
});

onMounted(async () => {
  fetchStandings()
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>