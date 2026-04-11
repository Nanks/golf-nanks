<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 pt-20">
    
    <div v-if="loading" class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:golf" class="size-12 text-emerald-600 animate-pulse opacity-50" />
      <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
        Syncing {{ mode }} Leaderboard...
      </p>
    </div>

    <template v-else-if="processedPlayers.length > 0">
      <header class="bg-emerald-600 px-6 py-8 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex justify-between items-start mb-4">
            <button @click="router.back()" class="bg-white/20 p-2 rounded-xl backdrop-blur-md active:scale-95 transition-all">
              <Icon name="mdi:arrow-left" class="size-5" />
            </button>
            <div v-if="mode === 'live'" class="flex items-center gap-1.5 bg-red-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Live Action
            </div>
          </div>
          
          <h1 class="text-4xl font-black uppercase tracking-tighter italic leading-none">
            {{ leagueData?.shortName || leagueData?.name || (type === 'casual' ? 'Casual' : type) }}
          </h1>
          <p class="text-[10px] font-bold opacity-90 uppercase tracking-[0.2em] mt-2">
            {{ processedPlayers[0]?.courseSnapshot?.name }} • {{ getShortDate(iso) }}
          </p>
        </div>
        <Icon name="mdi:trophy" class="absolute -right-6 -bottom-6 size-48 opacity-10 pointer-events-none" />
      </header>

      <div class="sticky top-0 z-40 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
        <div class="flex p-3 gap-2">
          <button 
            v-for="tab in availableTabs" :key="tab"
            @click="activeTab = tab"
            :class="activeTab === tab ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'"
            class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <div class="p-4 max-w-2xl mx-auto mt-4">
        <div class="flex justify-between px-6 mb-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <div class="flex gap-8"><span>Pos</span><span>Player</span></div>
          <div class="flex gap-6"><span>Thru</span><span>Score</span></div>
        </div>

        <TransitionGroup name="shuffle-list" tag="div" class="space-y-3 relative">
          <div 
            v-for="(row, index) in sortedLeaderboard" 
            :key="row.id"
            @click="openPlayerModal(row)"
            class="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm transition-all cursor-pointer active:scale-[0.98] group"
          >
            <div class="flex items-center gap-5">
              <div class="flex flex-col items-center w-6">
                <span class="font-black text-sm text-slate-400 group-hover:text-emerald-500 transition-colors">{{ getRank(index) }}</span>
                <Icon 
                  v-if="row.trend !== 0"
                  :name="row.trend > 0 ? 'mdi:triangle' : 'mdi:triangle-down'"
                  :class="row.trend > 0 ? 'text-emerald-500' : 'text-red-500'"
                  class="size-2 mt-0.5"
                />
              </div>
              
              <div>
                <p class="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight leading-none">{{ row.name }}</p>
                <p v-if="activeTab === 'Net Score'" class="text-[9px] font-black text-slate-400 uppercase mt-1">
                  CH: {{ isYearlyLeague ? Number(row.index).toFixed(3) : Math.round(row.index) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-6">
              <span class="text-xs font-bold text-slate-400 tabular-nums">
                {{ row.games.holesPlayed === (row.holes || 18) ? 'F' : (row.games.holesPlayed === 0 ? '-' : row.games.holesPlayed) }}
              </span>
              <div class="w-12 text-right">
                <span :class="row.scoreColor" class="font-black text-xl italic tracking-tighter">{{ row.scoreDisplay }}</span>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </template>

    <div v-else class="flex flex-col items-center justify-center pt-32 text-slate-400">
      <Icon name="mdi:golf-cart" class="size-20 opacity-10 mb-6" />
      <p class="text-xs font-bold uppercase tracking-widest opacity-50">
        {{ mode === 'live' ? 'No Live Rounds Active' : 'No History Found for this Date' }}
      </p>
    </div>

    <Teleport to="body">
      <ScorecardPlayerModal 
        v-if="selectedPlayer"
        :isOpen="isModalOpen" 
        :player="selectedPlayer" 
        @close="isModalOpen = false"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, collectionGroup, query, where, getDocs, collection } from "firebase/firestore";
import { useData } from '~/stores/data';
import { flattenAndCalculate, calcRounds } from '~/utils/gameLogic';

const route = useRoute();
const router = useRouter();
const dataStore = useData();
const { $db } = useNuxtApp();

// URL Params
const { type, iso, mode = 'live' } = route.params;

// Reactive State
const loading = ref(true);
const roundsSource = ref([]);
const leagueData = ref(null);
const eventDetails = ref(null);
const isYearlyLeague = ref(false);
const activeTab = ref('Net Score');
const availableTabs = ref(['Net Score']);

// UI Helpers
const isModalOpen = ref(false);
const selectedPlayer = ref(null);
const previousRanks = ref(new Map());

// --- 1. THE REFINED COMPUTED LEADERBOARD ---
const processedPlayers = computed(() => {
  return roundsSource.value.map(p => ({
    ...p,
    birdPoints: p.games.totalBirds ?? 0,
    deucePoints: p.games.totalDeuces ?? 0,
    chicagoPoints: (p.index || 0) - 36 + (p.games.totalChicago || 0),
    netRel: p.games.totalNet ?? 0,
    thru: p.games.holesPlayed ?? 0
  }));
});

const sortedLeaderboard = computed(() => {
  const players = [...processedPlayers.value].map(p => {
    let scoreVal = 0;
    let display = '';
    let color = 'text-slate-800 dark:text-white';

    // 1. Determine Values based on Tab
    if (activeTab.value === 'Net Score') {
      scoreVal = p.netRel;
      
      // FIX: Apply 3 decimals for yearly, 0 for standard
      if (isYearlyLeague.value) {
        const formatted = p.netRel.toFixed(3);
        display = p.netRel === 0 ? 'E' : (p.netRel > 0 ? `+${formatted}` : formatted);
      } else {
        const rounded = Math.round(p.netRel);
        display = rounded === 0 ? 'E' : (rounded > 0 ? `+${rounded}` : rounded);
      }
      
      if (p.netRel < 0) color = 'text-red-500';
    } 
    else if (activeTab.value === 'chicago') {
      scoreVal = p.chicagoPoints * -1;
      display = p.chicagoPoints > 0 ? `+${p.chicagoPoints}` : p.chicagoPoints;
      if (p.chicagoPoints > 0) color = 'text-emerald-500';
    }
    else if (activeTab.value === 'birds') {
      scoreVal = p.birdPoints * -1; 
      display = p.birdPoints; // FIX: Ensure display is set
      if (p.birdPoints > 0) color = 'text-emerald-500';
    } 
    else if (activeTab.value === 'deuces') {
      scoreVal = p.deucePoints * -1;
      display = p.deucePoints; // FIX: Ensure display is set
      if (p.deucePoints > 0) color = 'text-emerald-500';
    }

    return { 
      ...p, 
      scoreVal, 
      scoreDisplay: display, 
      scoreColor: color, 
      trend: 0 
    };
  });

  // 2. Sort Logic: primary scoreVal, then tie-breaker (Holes Played)
  players.sort((a, b) => a.scoreVal - b.scoreVal || b.thru - a.thru);

  // 3. Trend Calculation
  return players.map((p, idx) => {
    const prevPos = previousRanks.value.get(p.id);
    if (prevPos !== undefined) {
      if (idx < prevPos) p.trend = 1;      // Moved up
      else if (idx > prevPos) p.trend = -1; // Moved down
    }
    previousRanks.value.set(p.id, idx);
    return p;
  });
});

// --- 2. CONFIG & DATA FETCHING ---
const fetchConfig = async () => {
  try {
    const leaguesRef = collection($db, "leagues");
    const qLeague = query(leaguesRef, where("type", "==", type));
    const leagueSnap = await getDocs(qLeague);

    if (!leagueSnap.empty) {
      const lDoc = leagueSnap.docs[0];
      leagueData.value = lDoc.data();
      isYearlyLeague.value = leagueData.value.cadence === 'yearly';
      availableTabs.value = ['Net Score', ...(leagueData.value.yearly_games || [])];

      // Calendar Fetch for DD Holes (Vegas)
      const calRef = collection($db, "leagues", lDoc.id, "calendar");
      const qEvent = query(calRef, where("iso", "==", iso));
      const eventSnap = await getDocs(qEvent);
      if (!eventSnap.empty) eventDetails.value = eventSnap.docs[0].data();
      console.log(eventDetails.value)
    }
  } catch (err) {
    console.error("Config Fetch Error:", err);
  }
};

onMounted(async () => {
  // A. Always get the rules first
  await fetchConfig();

  // B. Route-based Data Strategy
  if (mode === 'live') {
    dataStore.startLiveListener(type);
    watch(() => dataStore.liveRounds, (newRounds) => {
      roundsSource.value = calcRounds(newRounds, eventDetails.value);
    }, { immediate: true, deep: true });
  } else {
    // History Mode: One-time fetch
    const q = query(
      collectionGroup($db, "rounds"), 
      where("type", "==", type), 
      where("iso", "==", iso)
    );
    const snap = await getDocs(q);
    roundsSource.value = calcRounds(snap.docs.map(d => ({ id: d.id, ...d.data() })), eventDetails.value);
  }
  loading.value = false;
});

onUnmounted(() => {
  if (mode === 'live') dataStore.stopLiveListener();
});

// Utilities
const getRank = (index) => {
  if (index === 0) return '1';
  const isTie = sortedLeaderboard.value[index].scoreVal === sortedLeaderboard.value[index - 1].scoreVal;
  return isTie ? '-' : (index + 1).toString();
};

const openPlayerModal = (p) => {
  console.log(p);
  
  selectedPlayer.value = p;
  isModalOpen.value = true;
};

const getShortDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
</script>

<style scoped>
.shuffle-list-move { transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
.no-scrollbar::-webkit-scrollbar { display: none; }
.shuffle-list-enter-active, .shuffle-list-leave-active { transition: all 0.5s ease; }
.shuffle-list-enter-from, .shuffle-list-leave-to { opacity: 0; transform: scale(0.9); }
</style>