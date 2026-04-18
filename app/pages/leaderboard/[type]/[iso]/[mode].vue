<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 pt-24 select-none">
    
    <div v-if="uiStore.isGlobalLoading" class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:golf" class="size-12 text-emerald-600 animate-bounce opacity-50" />
      <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
        {{ uiStore.loadingMessage }}
      </p>
    </div>

    <template v-else-if="processedPlayers.length > 0">
      <LeagueHeader 
        :title="leagueData?.shortName || leagueData?.name || (type === 'casual' ? 'Casual' : type)"
        :isAdmin="isAdmin"
        :backTo="backRoute"
        :backText="backText"
      >
        <template #action>
          <ClientOnly>
            <div v-if="mode === 'live'" class="flex items-center gap-1.5 bg-red-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Live
            </div>
          </ClientOnly>
        </template>
      </LeagueHeader>

      <div class="px-4">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          {{ processedPlayers[0]?.course || 'Loading Course...' }} • {{ getShortDate(iso) }}
        </p>
      </div>

      <div class="sticky top-0 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-2">
        <div class="flex bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-xl overflow-x-auto no-scrollbar gap-1">
          <button 
            v-for="tab in availableTabs" :key="tab"
            @click="activeTab = tab"
            :class="activeTab === tab 
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' 
              : 'text-slate-500 active:text-slate-700 dark:active:text-slate-300'"
            class="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all text-center min-w-[80px]"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <div class="p-2 max-w-2xl mx-auto">
        <div 
          v-if="isHoleByHoleTab && mode === 'live' && eventDetails?.status !== 'complete'" 
          class="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-center gap-2"
        >
          <Icon name="mdi:shuffle-variant" class="size-4 text-amber-500" />
          <span class="text-[9px] font-black text-amber-600 uppercase tracking-widest">
            Live Scramble: Pairs lock at finish
          </span>
        </div>

        <div class="relative">
          <TransitionGroup :name="transitionName" tag="div" class="space-y-3">
            <div v-for="(row, index) in activeDisplayList" :key="row.id">
              
              <div v-if="row.isWinnerRow" class="card-inner flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <div class="flex flex-col items-center justify-center w-6 shrink-0">
                    <span 
                      v-if="['complete', 'mdi-check-bold'].includes(eventDetails?.status?.toLowerCase())" 
                      class="font-black text-xl text-slate-400 group-active:text-emerald-500 leading-none"
                    >
                      {{ index === 0 ? '1' : (row.score === activeDisplayList[index-1].score ? '-' : index + 1) }}
                    </span>
                    <Icon v-else name="mdi:shuffle-variant" class="size-5 text-amber-500/40" />
                  </div>

                  <div class="w-px h-10 bg-slate-100 dark:bg-slate-800 shrink-0"></div>

                  <div class="min-w-0 flex flex-col justify-center gap-1.5 py-1 pr-2">
                    <p class="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none truncate">
                      {{ row.player.split(' / ')[0] }}
                    </p>
                    <p class="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none truncate">
                      {{ row.player.split(' / ')[1] || 'TBD' }}
                    </p>
                  </div>
                </div>

                <div class="flex flex-col items-end justify-center shrink-0 pl-4 border-l border-slate-100 dark:border-slate-800/80 min-w-[10">
                  <p class="text-[8px] font-black text-slate-400 uppercase leading-none mb-1.5">Team Net</p>
                  <span class="font-black text-xl italic tracking-tighter leading-none text-emerald-500">
                    {{ row.score }}
                  </span>
                  <!-- <p v-if="row.money > 0" class="text-[10px] font-black text-emerald-500 mt-1 italic text-center leading-none">
                    +${{ row.money.toFixed(2) }}
                  </p> -->
                </div>

              </div>

              <div v-else @click="openPlayerModal(row)" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all active:scale-[0.98] group overflow-hidden">
                <div class="p-2">

                  <div class="w-full border-b border-slate-100 dark:border-slate-800/50">
                    <h3 class="font-black pl-4 mb-1 text-md text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none truncate">
                      {{ row.name }}
                    </h3>
                  </div>

                  <div class="flex items-center justify-between">
                    
                    <div class="flex flex-col items-start w-8 shrink-0">
                      <span v-if="getRank(index)" class="font-black text-base text-slate-400 group-active:text-emerald-500 transition-colors leading-none">
                        {{ getRank(index) }}
                      </span>
                    </div>

                    <div class="flex flex-col items-start justify-center flex-1 ml-2">
                      <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                        CH: {{ isYearlyLeague ? Number(row.index).toFixed(3) : Math.round(row.index) }}
                      </span>
                      <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight mt-0.5">
                        Gross: <span class="text-slate-600 dark:text-slate-300">{{ row.grossDisplay }}</span>
                      </span>
                    </div>

                    <div class="flex flex-col items-center justify-center shrink-0 border-l border-r border-slate-100 dark:border-slate-800/80">
                      <p class="text-sm font-bold text-slate-500 tabular-nums leading-none">
                        {{ row.games.holesPlayed === (row.holes || 18) ? 'F' : (row.games.holesPlayed === 0 ? '-' : row.games.holesPlayed) }}
                      </p>
                    </div>

                    <div class="flex flex-col items-end justify-center min-w-18 px-2">
                      <span :class="row.scoreColor" class="font-black text-lg italic tracking-tighter leading-none pb-0.5">
                        {{ row.scoreDisplay }}
                      </span>
                      <span v-if="row.winStats?.totalMoney > 0" class="text-[10px] font-black text-emerald-500 mt-1 italic leading-none">
                        +${{ row.winStats.totalMoney.toFixed(2) }}
                      </span>
                    </div>

                  </div>

                  <div v-if="row.winStats?.individualBadges.length > 0" class="pt-1 border-t border-slate-100 dark:border-slate-800/50">
                    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      <span 
                        v-for="(badge, bIdx) in row.winStats.individualBadges" 
                        :key="bIdx" 
                        :class="badge.color" 
                        class="text-[9px] font-black px-1 rounded-sm uppercase border border-current/10 whitespace-nowrap shrink-0"
                      >
                        {{ badge.label }}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </TransitionGroup>
        </div>
        <ClientOnly>
          <LiveRoundFooter 
            v-if="mode === 'live' && roundId"
            activeTab="leaderboard"
            :roundId="roundId"
            :leagueType="type"
            :iso="iso"
          />
        </ClientOnly>
      </div>
    </template>

    <div v-else class="flex flex-col items-center justify-center pt-32 text-slate-400">
      <Icon name="mdi:golf-cart" class="size-20 opacity-10 mb-6" />
      <p class="text-xs font-bold uppercase tracking-widest opacity-50">
        {{ mode === 'live' ? 'No Live Rounds Active' : 'No History Found' }}
      </p>
    </div>

    <ClientOnly>
      <ScorecardPlayerModal 
        v-if="selectedPlayer"
        :isOpen="isModalOpen" 
        :player="selectedPlayer" 
        @close="isModalOpen = false"
      />
    </ClientOnly>

  </div>
</template>

<script setup>
import { collection, query, where, getDocs, collectionGroup } from "firebase/firestore";
import { useData } from '~/stores/data';
import { useUIStore } from '~/stores/ui';
import { useAuthStore } from '~/stores/auth';
import { calcRounds, runLeaguePass } from '~/utils/gameLogic';

const route = useRoute();
const dataStore = useData();
const uiStore = useUIStore();
const authStore = useAuthStore();
const { $db } = useNuxtApp();

const { type, iso, mode = 'live' } = route.params;

// Local State
const roundsSource = ref([]);
const eventDetails = ref(null);
const activeTab = ref('Net Score');
const availableTabs = ref(['Net Score']);
const winnersLog = ref({ grossSkins: [], netSkins: [], deuces: [], blindBestBall: [] });
let shuffleTimer = null;

const isModalOpen = ref(false);
const selectedPlayer = ref(null);

// --- COMPUTED DATA (Instant from store) ---
const leagueData = computed(() => dataStore.leagues.find(l => l.type === type));
const isYearlyLeague = computed(() => leagueData.value?.cadence === 'yearly');
const isAdmin = computed(() => leagueData.value && authStore.isAdminForLeague(leagueData.value.type));

const isHoleByHoleTab = computed(() => ['Blind Best Ball'].includes(activeTab.value));

const processedPlayers = computed(() => {
  return roundsSource.value.map(p => ({
    ...p,
    netRel: p.games.totalNet ?? 0,
    thru: p.games.holesPlayed ?? 0
  }));
});

// ... (activeDisplayList and sortedLeaderboard computed logic remains same as your original) ...

const fetchConfig = async () => {
  if (!leagueData.value) return;
  
  try {
    // Only fetch the calendar event info, since leagueData is already in Pinia
    const calRef = collection($db, "leagues", leagueData.value.id, "calendar");
    const qEvent = query(calRef, where("iso", "==", iso));
    const eventSnap = await getDocs(qEvent);
    
    if (!eventSnap.empty) {
      eventDetails.value = eventSnap.docs[0].data();
      const tabs = ['Net Score'];
      const gameArray = eventDetails.value.game || [];

      // Add special tabs based on league type
      if (['vegas', 'mbWed'].includes(type)) tabs.push('Birds');
      if (type === 'vegas') tabs.push('Deuces');

      // Add tabs from the calendar entry
      gameArray.forEach(g => {
        const isIntegrated = ['Gross Skins', 'Net Skins', 'Deuce Pot', 'Stroke Play'].includes(g);
        if (!isIntegrated && !tabs.includes(g)) tabs.push(g);
      });
      availableTabs.value = tabs;
    }
  } catch (err) {
    console.error("Config Error:", err);
  }
};

// --- LIVE ROUND NORMALIZER ---
// Converts group-based live_rounds into flat, individual player rounds for the game logic
const normalizeLiveRounds = (liveGroups) => {
  const normalized = [];
  
  if (!liveGroups) return normalized;

  liveGroups.forEach(group => {
    if (!group.players || !group.scores) return;

    group.players.forEach(player => {
      normalized.push({
        id: player.id, // Player ID
        name: `${player.fname} ${player.lname}`,
        fname: player.fname,
        lname: player.lname,
        index: player.index,
        ghin: player.ghin,
        tees: player.tees,
        course: group.course,
        iso: group.iso,
        courseSnapshot: group.courseSnapshot,
        // The scores map uses the player's ID as the key
        scores: group.scores[player.id] || Array(18).fill(0) 
      });
    });
  });

  return normalized;
};

onMounted(async () => {
  uiStore.setLoading(true, `Syncing Leaderboard...`);
  
  await fetchConfig();

  const processWithWins = (calc) => {
    const winners = runLeaguePass(calc, eventDetails.value);
    winnersLog.value = winners;

    const winMap = {};
    const categories = [
      { key: 'grossSkins', label: 'Gross', color: 'bg-amber-500/10 text-amber-600' },
      { key: 'netSkins', label: 'Net', color: 'bg-emerald-500/10 text-emerald-600' },
      { key: 'deuces', label: 'Deuce', color: 'bg-blue-500/10 text-blue-600' }
    ];

    categories.forEach(({ key, label, color }) => {
      (winners[key] || []).forEach(win => {
        if (!winMap[win.id]) winMap[win.id] = { individualBadges: [], totalMoney: 0 };
        winMap[win.id].individualBadges.push({ label: `${label} ${win.score} (${win.hole})`, color });
        winMap[win.id].totalMoney += (win.money || 0);
      });
    });

    return calc.map(p => ({
      ...p,
      winStats: winMap[p.id] || { individualBadges: [], totalMoney: 0 }
    }));
  };

  // 2. Fetch Round Data
  if (mode === 'live') {
    dataStore.startLiveListener(type);
    watch(() => dataStore.liveRounds, (newRounds) => {
      const flattenedRounds = normalizeLiveRounds(newRounds);
      const calc = calcRounds(flattenedRounds, eventDetails.value);
      roundsSource.value = processWithWins(calc);  
    }, { immediate: true, deep: true });

    const isRoundFinished = ['complete', 'mdi-check-bold'].includes(eventDetails.value?.status?.toLowerCase());
    
    if (!isRoundFinished) {
      shuffleTimer = setInterval(() => {
        // Only run the math if they are actively watching the BBB tab
        if (activeTab.value === 'Blind Best Ball') {
          const flattened = normalizeLiveRounds(dataStore.liveRounds);
          roundsSource.value = processWithWins(calcRounds(flattened, eventDetails.value));
        }
      }, 5000);
    }
  } else {
    const q = query(collectionGroup($db, "rounds"), where("type", "==", type), where("iso", "==", iso));
    const snap = await getDocs(q);
    const calc = calcRounds(snap.docs.map(d => ({ id: d.id, ...d.data() })), eventDetails.value);
    roundsSource.value = processWithWins(calc);
  }

  uiStore.setLoading(false);
});

onUnmounted(() => {
  if (mode === 'live') dataStore.stopLiveListener();
  if (shuffleTimer) clearInterval(shuffleTimer);
});

// --- LEADERBOARD LOGIC ---

const sortedLeaderboard = computed(() => {
  const players = [...processedPlayers.value].map(p => {
    let scoreVal = 0;
    let display = '';
    let color = 'text-slate-800 dark:text-white';

    let grossDisplay = '-';
    // Use the totalGrossUnder you already calculated
    const grossUnder = p.games?.totalGrossUnder; 
    
    if (grossUnder !== undefined && grossUnder !== null) {
      if (grossUnder === 0) {
        grossDisplay = 'E';
      } else if (grossUnder > 0) {
        grossDisplay = `+${grossUnder}`;
      } else {
        grossDisplay = `${grossUnder}`; // Negative numbers already have a minus sign
      }
    }

    if (activeTab.value === 'Net Score') {
      scoreVal = p.netRel;
      const fmt = isYearlyLeague.value ? p.netRel.toFixed(3) : Math.round(p.netRel);
      display = p.netRel === 0 ? 'E' : (p.netRel > 0 ? `+${fmt}` : fmt);
      if (p.netRel < 0) color = 'text-red-500';
    } 
    else if (activeTab.value === 'Birds') {
      scoreVal = p.games?.totalBirds || 0;
      display = scoreVal.toString();
    }
    else if (activeTab.value === 'Deuces') {
      scoreVal = p.games?.totalDeuces || 0;
      display = scoreVal.toString();
    }
    else if (['Chicago Points', 'Modified Chicago'].includes(activeTab.value)) {
      const key = activeTab.value === 'Chicago Points' ? 'totalChicago' : 'totalModChicago';
      const val = p.games?.[key] || 0;
      scoreVal = isYearlyLeague.value ? val.toFixed(3) : Math.round(val);
      display = scoreVal.toString();
    }

    return { ...p, scoreVal, scoreDisplay: display, scoreColor: color, grossDisplay };
  });

  // Sort logic
  players.sort((a, b) => {
    if (activeTab.value === 'Net Score') {
      return a.scoreVal - b.scoreVal || b.thru - a.thru;
    } else {
      return b.scoreVal - a.scoreVal;
    }
  });

  return players; // Just return the sorted array directly
});

const activeDisplayList = computed(() => {
  // 1. Guard against missing winnersLog
  if (isHoleByHoleTab.value) {
    // Add the optional chaining (?.) and a fallback empty array ([])
    const list = activeTab.value === 'Blind Best Ball' 
      ? (winnersLog.value?.blindBestBall || []) 
      : [];
      
    return list.map(win => ({
      ...win,
      id: `team-${win.id}`, 
      isWinnerRow: true
    }));
  }
  
  // 2. Guard against missing sortedLeaderboard
  return (sortedLeaderboard.value || []).map(player => ({
    ...player,
    isWinnerRow: false
  }));
});

const getRank = (index) => {
  if (isHoleByHoleTab.value) return '';
  const list = sortedLeaderboard.value;
  if (!list[index]) return '';
  if (index === 0) return '1';
  const currentScore = list[index]?.scoreVal;
  const prevScore = list[index - 1]?.scoreVal;
  return currentScore === prevScore ? '-' : (index + 1).toString();
};

const roundId = computed(() => {
  if (mode !== 'live' || !dataStore.liveRounds || dataStore.liveRounds.length === 0) return null;
  // Grab the first live group's ID
  return dataStore.liveRounds[0].id;
});

const backRoute = computed(() => {
  if (mode !== 'live') return `/leagues/${leagueData.value?.id}/calendar`;
  
  // If they came from the calendar, send them back there
  if (route.query.from === 'calendar') return `/leagues/${leagueData.value?.id}/calendar`;
  
  // Otherwise, send them to the scorecard (if roundId exists)
  return roundId.value ? `/rounds/${roundId.value}` : `/leagues/${leagueData.value?.id}/calendar`;
});

const backText = computed(() => {
  if (mode !== 'live') return 'Calendar';
  return route.query.from === 'calendar' ? 'Calendar' : 'Scorecard';
});

const transitionName = computed(() => {
  return activeTab.value === 'Blind Best Ball' ? 'card-flip' : 'shuffle-list';
});

const openPlayerModal = (row) => { selectedPlayer.value = row; isModalOpen.value = true; };
const getShortDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
</script>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

/* --- OPTION A: SHUFFLE LIST (Net Score Tab) --- */
.shuffle-list-move {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.shuffle-list-enter-active, .shuffle-list-leave-active {
  transition: all 0.5s ease;
}
.shuffle-list-enter-from, .shuffle-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* --- OPTION B: CARD FLIP (Blind Best Ball Tab) --- */
.card-flip-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-flip-leave-active {
  transition: all 0.4s ease-in;
  position: absolute;
  width: 100%;
}
.card-flip-enter-from {
  opacity: 0;
  transform: rotateX(-90deg) translateY(20px);
}
.card-flip-leave-to {
  opacity: 0;
  transform: rotateX(90deg) translateY(-20px);
}
.card-flip-move {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.shuffle-list-leave-active, .card-flip-leave-active {
  position: absolute;
  width: 100%;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>