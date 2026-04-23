<template>
  <div class="max-w-2xl mx-auto select-none pb-32">
    
    <LeagueHeader 
      :title="game" 
      :back-to="`/leagues/${route.params.id}/menu`"
      back-text="League Menu"
    >
      <template #title>
        <span class="text-primary text-4xl text-emerald-500">{{ game }}</span>
      </template>
    </LeagueHeader>

    <div class="flex items-center justify-center gap-6 mb-6">
      <button 
        @click="adjustYear(-1)" 
        class="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-400 active:scale-90 active:text-emerald-500 transition-all"
      >
        <Icon name="mdi:chevron-left" class="size-6" />
      </button>
      
      <div class="text-center min-w-[80px]">
        <span class="text-primary text-3xl tabular-nums">{{ selectedYear }}</span>
      </div>

      <button 
        @click="adjustYear(1)" 
        :disabled="parseInt(selectedYear) >= currentYear"
        class="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800 disabled:opacity-20 text-slate-400 active:scale-90 active:text-emerald-500 transition-all"
      >
        <Icon name="mdi:chevron-right" class="size-6" />
      </button>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center pt-20 gap-4">
      <Icon name="mdi:loading" class="size-8 text-emerald-500 animate-spin" />
      <p class="text-secondary text-[10px]">Calculating Totals...</p>
    </div>

    <div v-else-if="standings.length > 0" class="space-y-2 px-2">
      <div v-for="(p, i) in standings" 
          :key="p.name" 
          @click="selectedDetails = p"
          class="card-interactive flex items-center justify-between p-4 px-5 group">
        
        <div class="flex items-center gap-5">
          <span class="text-primary text-xl text-slate-700 dark:text-slate-400 w-6">
            {{ i + 1 }}
          </span>
          <div>
            <p class="text-xl text-primary">
              {{ p.name }}
            </p>
            <p class="text-secondary text-xs mt-0.5">
              {{ p.playedCount }} / {{ totalPossibleWeeks }} Weeks Played
            </p>
          </div>
        </div>

        <span class="text-2xl text-primary text-emerald-500 tabular-nums">
          {{ formatPoints(p.totalPoints) }}
        </span>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center pt-20 text-slate-400">
      <Icon name="mdi:calendar-blank" class="size-16 opacity-10 mb-4" />
      <p class="text-secondary text-xs">No data found for {{ selectedYear }}</p>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedDetails" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="selectedDetails = null">
          <div class="w-full max-w-xs card-base overflow-hidden flex flex-col max-h-[60vh] border-slate-200 dark:border-slate-800 shadow-2xl">
            
            <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 class="text-primary text-lg leading-none">{{ selectedDetails.name }}</h3>
                <p class="text-secondary text-[9px] mt-1">
                  Played: <span class="text-emerald-500">{{ selectedDetails.playedCount }}</span> / {{ totalPossibleWeeks }}
                </p>
              </div>
              <button @click="selectedDetails = null" class="text-slate-400 p-1 active:scale-90">
                <Icon name="mdi:close" class="size-5" />
              </button>
            </div>

            <div class="p-2 overflow-y-auto grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950">
              <div v-for="round in selectedDetails.details" :key="round.date" 
                   :class="round.isDropped ? 'opacity-20 border-transparent' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'"
                   class="flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all">
                <span class="text-secondary text-[8px] mb-1">{{ getShortDate(round.date) }}</span>
                <span :class="round.isDropped ? 'text-slate-500' : 'text-emerald-500'" class="text-lg text-primary leading-none tabular-nums">
                  {{ formatPoints(round.points) }}
                </span>
              </div>
            </div>

            <div class="p-4 bg-slate-900 dark:bg-white flex justify-between items-center">
              <span class="text-secondary text-[9px] text-slate-400 dark:text-slate-500">Season Total</span>
              <span class="text-2xl text-primary text-white dark:text-slate-900">
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

const adjustYear = (delta) => {
  const newYear = parseInt(selectedYear.value) + delta;
  if (newYear >= 2016 && newYear <= currentYear) {
    selectedYear.value = newYear.toString();
  }
};

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