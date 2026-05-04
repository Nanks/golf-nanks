<template>
  <div class="max-w-2xl mx-auto select-none pb-32">
    <div v-if="uiStore.isGlobalLoading" class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:golf" class="size-16 text-emerald-500 animate-bounce" />
      <p class="text-secondary text-[10px]">{{ uiStore.loadingMessage }}</p>
    </div>

    <template v-else-if="leagueData && processedPlayers.length > 0">
      <LeagueHeader 
        :title="leagueData?.shortName || leagueData?.name || 'Leaderboard'"
        :is-admin="isAdmin"
        :back-to="backRoute"
        :back-text="backText"
      >
        <template #action>
          <ClientOnly>
            <div class="flex items-center gap-2">
              <button 
                v-if="isAdmin && mode === 'live' && eventDetails?.status !== 'complete'"
                @click="completeEvent"
                class="flex items-center gap-1.5 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 active:bg-emerald-500 active:text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <Icon name="mdi:lock-outline" class="size-3" /> Lock
              </button>

              <div v-if="mode === 'live'" class="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Live
              </div>
            </div>
          </ClientOnly>
        </template>
      </LeagueHeader>

      <div class="px-4 mb-4 flex items-center gap-2 text-secondary text-[10px] font-black uppercase tracking-widest">
        <span>{{ eventDetails?.course || 'Course TBD' }}</span>
        <span class="opacity-30">•</span>
        <span>{{ getShortDate(iso) }}</span>
        <span class="opacity-30">•</span>
        <span :class="eventStatusDisplay.color">
          {{ eventStatusDisplay.text }}
        </span>
      </div>

      <div class="sticky top-20 z-40 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 py-2 mb-3">
        <div class="flex bg-stone-100 dark:bg-stone-900 p-1 mx-3 rounded-xl gap-1 overflow-x-auto no-scrollbar">
          <button 
            v-for="tab in availableTabs" :key="tab"
            @click="activeTab = tab"
            :class="[
              activeTab === tab 
                ? 'bg-white dark:bg-stone-800 text-emerald-600 shadow-sm' 
                : 'text-stone-500 active:text-stone-800 dark:active:text-stone-200',
              'flex-1 px-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-tighter transition-all text-center min-w-[22%] active:scale-[0.98]'
            ]"
          >
            {{ tab.replace('Score', '').replace('Points', '') }}
          </button>
        </div>
      </div>

      <div class="px-3">
        <div class="relative">
          
          <div v-if="activeTab === 'Blind Best Ball' && activeDisplayList.length === 0" 
               class="card-base p-8 flex flex-col items-center justify-center text-center gap-4 border-dashed border-2 mt-4">
            <Icon name="mdi:poker-chip" class="size-12 text-stone-300 dark:text-stone-700" />
            
            <div class="space-y-1">
              <h4 class="text-primary text-lg">Pairings Pending</h4>
              <p class="text-secondary text-[10px] max-w-[200px] mx-auto leading-relaxed">
                Random pairings will be revealed once the round is locked and complete.
              </p>
            </div>

            <button 
              v-if="isAdmin" 
              @click="isPreviewingPairings = true"
              class="mt-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Preview Pairings
            </button>
          </div>

          <TransitionGroup name="shuffle-list" tag="div" class="space-y-2">
            <div v-for="(row, index) in activeDisplayList" :key="row.id" class="active:scale-[0.98] transition-transform">
              
              <div v-if="row.isWinnerRow" @click="openTeamModal(row)" class="card-base cursor-pointer flex items-center justify-between p-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <span class="text-primary text-lg opacity-40 w-6 text-center">{{ index + 1 }}</span>
                  <div class="w-px h-8 bg-stone-200 dark:bg-stone-800"></div>
                  <div class="min-w-0 flex flex-col leading-tight">
                    <p class="text-primary text-md font-black">{{ row.player.split(' / ')[0] }}</p>
                    <p class="text-primary text-md opacity-60">{{ row.player.split(' / ')[1] || 'TBD' }}</p>
                  </div>
                </div>
                <div class="pl-4 border-l border-stone-200 dark:border-stone-800">
                  <span class="text-primary text-3xl text-emerald-600 font-black italic tabular-nums">{{ row.score }}</span>
                </div>
              </div>

              <div v-else @click="openPlayerModal(row)" class="card-interactive cursor-pointer p-3 flex flex-col gap-1.5">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <span class="text-primary text-md opacity-40 font-black w-6 text-center">{{ getRank(index) }}</span>
                    <h3 class="text-lg text-primary font-black uppercase italic">{{ row.name }}</h3>
                  </div>
                  <span :class="row.scoreColor" class="text-2xl font-black italic tabular-nums">{{ row.scoreDisplay }}</span>
                </div>
                
                <div class="flex items-center justify-between border-t border-stone-100 dark:border-stone-800/60">
                  <div class="flex items-center gap-4 text-secondary text-xs font-black uppercase">
                    <span>HCP: <span class="text-stone-900 dark:text-stone-100">{{ isYearlyLeague ? Number(row.index).toFixed(3) : Math.round(row.index) }}</span></span>
                    <span>THRU: <span class="text-stone-900 dark:text-stone-100">{{ row.games.holesPlayed === (row.holes || 18) ? 'F' : row.games.holesPlayed }}</span></span>
                  </div>
                  <span v-if="row.winStats?.totalMoney > 0" class="text-primary text-sm text-emerald-600 font-black italic">${{ row.winStats.totalMoney.toFixed(2) }}</span>
                </div>

                <div v-if="row.winStats?.individualBadges?.length > 0" class="flex gap-1 overflow-x-auto no-scrollbar pt-1.5">
                  <template v-for="(badge, bIdx) in row.winStats.individualBadges" :key="bIdx">
                    <span 
                      v-if="shouldShowBadge(badge.label)"
                      :class="badge.color" 
                      class="badge whitespace-nowrap shrink-0"
                    >
                      {{ badge.label }}
                    </span>
                  </template>
                </div>
              </div>

            </div>
          </TransitionGroup>
        </div>
      </div>
    </template>

    <div v-else-if="!uiStore.isGlobalLoading" class="flex flex-col items-center justify-center pt-32 text-stone-400">
      <Icon name="mdi:golf-cart" class="size-20 opacity-10 mb-6" />
      <p class="text-secondary uppercase font-black tracking-widest">{{ mode === 'live' ? 'No Live Rounds Active' : 'No History Found' }}</p>
    </div>

    <ClientOnly>
      <ScorecardPlayerModal v-if="selectedPlayer && eventDetails" :is-open="isModalOpen" :player="selectedPlayer" :event="eventDetails" @close="isModalOpen = false" />
      <BlindBestBallModal v-if="selectedTeam && eventDetails" :is-open="isTeamModalOpen" :team="selectedTeam" :event="eventDetails" @close="isTeamModalOpen = false" />
      
      <LiveRoundFooter 
        v-if="mode === 'live' && roundId && leagueData && !['calendar', 'menu', 'home'].includes(route.query.from)" 
        active-tab="leaderboard" 
        :round-id="roundId" 
        :league-type="leagueId" 
        :iso="iso" 
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { collection, collectionGroup, query, where, getDocs } from "firebase/firestore";
import { useData } from '~/stores/data';
import { useUIStore } from '~/stores/ui';
import { useAuthStore } from '~/stores/auth';
import { useConfirm } from '~/composables/useConfirm';
import { calcRounds, runLeaguePass, getTieBreakerValue } from '~/utils/gameLogic';

const route = useRoute();
const dataStore = useData();
const uiStore = useUIStore();
const authStore = useAuthStore();
const { ask } = useConfirm();
const { $db } = useNuxtApp();

const { type: leagueId, iso, mode = 'live' } = route.params;

// --- STATE ---
const roundsSource = ref([]);
const eventDetails = ref(null);
const activeTab = ref('Net Score');
const availableTabs = ref(['Net Score']);
const winnersLog = ref({ blindBestBall: [] });
const selectedPlayer = ref(null);
const isModalOpen = ref(false);
const selectedTeam = ref(null);
const isTeamModalOpen = ref(false);
const isPreviewingPairings = ref(false);

// --- COMPUTED ---
const leagueData = computed(() => dataStore.leagues.find(l => l.id === leagueId));
const isYearlyLeague = computed(() => leagueData.value?.cadence === 'yearly');

const eventStatusDisplay = computed(() => {
  const s = eventDetails.value?.status?.toLowerCase() || 'active';
  if (['complete', 'mdi-check-bold', 'mdi:check-bold'].includes(s)) return { text: 'FINAL', color: 'text-emerald-500' };
  if (['rain', 'mdi-weather-pouring', 'mdi:cancel'].includes(s)) return { text: 'RAIN OUT', color: 'text-stone-400' };
  if (['practice', 'mdi-alpha-p-circle-outline'].includes(s)) return { text: 'PRACTICE', color: 'text-blue-500' };
  return { text: 'ACTIVE', color: 'text-amber-500' };
});

const isAdmin = computed(() => {
  if (!leagueData.value) return false;
  return authStore.isAdminForLeague(leagueData.value);
});

const processedPlayers = computed(() => (roundsSource.value || []).map(p => ({
  ...p,
  netRel: p.games?.totalNet ?? p.totalNet ?? 0,
  thru: p.games?.holesPlayed ?? p.holes ?? 0
})));

const activeDisplayList = computed(() => {
  if (activeTab.value === 'Blind Best Ball') {
    const currentStatus = eventDetails.value?.status?.toLowerCase() || '';
    const isLocked = ['complete', 'mdi-check-bold', 'mdi:check-bold'].includes(currentStatus);
    
    if (!isLocked && !isPreviewingPairings.value) return [];
    // FIX 1: Safely map index to ID if win.id is missing so Vue keys don't break
    return (winnersLog.value?.blindBestBall || []).map((win, idx) => ({ ...win, id: `team-${win.id || idx}`, isWinnerRow: true }));
  }

  const isChicago = ['Chicago Points', 'Modified Chicago'].includes(activeTab.value);
  const players = [...processedPlayers.value].map(p => {
    let scoreVal = 0, display = '', color = 'text-stone-900 dark:text-white';
    if (activeTab.value === 'Net Score') {
      scoreVal = p.netRel;
      const fmt = isYearlyLeague.value ? p.netRel.toFixed(3) : Math.round(p.netRel);
      display = p.netRel === 0 ? 'E' : (p.netRel > 0 ? `+${fmt}` : fmt);
      if (p.netRel < 0) color = 'text-emerald-500'; 
    } else if (isChicago) {
      const key = activeTab.value === 'Chicago Points' ? 'totalChicago' : 'totalModChicago';
      scoreVal = p.games?.[key] || 0;
      display = (isYearlyLeague.value ? scoreVal.toFixed(3) : Math.round(scoreVal)).toString();
    }
    const tieScores = isChicago ? (p.games?.chicago || []) : (p.games?.net || []);
    return { ...p, scoreVal, scoreDisplay: display, scoreColor: color, tieBreaker: getTieBreakerValue(tieScores, isChicago), isWinnerRow: false };
  });

  return players.sort((a, b) => {
    if (activeTab.value === 'Net Score') {
      if (a.scoreVal !== b.scoreVal) return a.scoreVal - b.scoreVal;
    } else if (a.scoreVal !== b.scoreVal) return b.scoreVal - a.scoreVal;

    for (let i = 0; i < a.tieBreaker.length; i++) {
      if (a.tieBreaker[i] !== b.tieBreaker[i]) return b.tieBreaker[i] - a.tieBreaker[i];
    }

    const aHoles = a.games?.holesPlayed ?? a.holes ?? 0;
    const bHoles = b.games?.holesPlayed ?? b.holes ?? 0;
    
    return bHoles - aHoles;
  });
});

const getRank = (index) => {
  const list = activeDisplayList.value;
  if (!list[index] || index === 0) return '1';
  return list[index].scoreVal === list[index - 1].scoreVal ? '-' : (index + 1).toString();
};

const roundId = computed(() => {
  if (mode !== 'live' || !dataStore.liveRounds?.length || !leagueData.value) return null;
  const myId = authStore.userProfile?.id;
  const myRound = dataStore.liveRounds.find(r => 
    r.leagueId === leagueId && 
    r.players?.some(p => String(p.id) === String(myId))
  );
  return myRound?.id || dataStore.liveRounds[0]?.id || null;
});

const backRoute = computed(() => {
  if (route.query.from === 'menu') return `/leagues/${leagueId}/menu`;
  if (route.query.from === 'home') return '/';
  if (mode !== 'live' || route.query.from === 'calendar') return `/leagues/${leagueId}/calendar`;
  return roundId.value ? `/rounds/${roundId.value}` : `/leagues/${leagueId}/menu`;
});

const backText = computed(() => {
  if (route.query.from === 'menu') return 'Menu';
  if (route.query.from === 'home') return 'Home';
  return (mode !== 'live' || route.query.from === 'calendar') ? 'Calendar' : 'Scorecard';
});

// --- METHODS ---
const shouldShowBadge = (label) => {
  // 1. If no games are defined for the event, show nothing
  if (!eventDetails.value?.game) return false;
  
  const games = eventDetails.value.game;
  const lowerLabel = label.toLowerCase();

  // 2. Check for "Gross" badges (Gross Skins)
  if (lowerLabel.startsWith('gross')) {
    return games.includes('Gross Skins');
  }

  // 3. Check for "Net" badges (Net Skins)
  if (lowerLabel.startsWith('net')) {
    return games.includes('Net Skins');
  }

  // 4. Check for "Deuce" badges (Deuce Pot)
  if (lowerLabel.startsWith('deuce')) {
    return games.includes('Deuce Pot');
  }

  // 5. Default to true for any badges that don't match the side-game categories
  return true;
};

const openPlayerModal = (row) => { 
  selectedPlayer.value = row; 
  isModalOpen.value = true; 
};

// FIX 2: Bulletproof team modal opener
const openTeamModal = (pairing) => {
  // 1. Try to grab the exact player objects if they are attached to the pairing
  let p1 = pairing.p1 || pairing.team?.[0];
  let p2 = pairing.p2 || pairing.team?.[1];

  // 2. Fallback: If objects aren't attached, try splitting the ID to find them in processedPlayers
  if (!p1 || !p2) {
    const rawId = pairing.id?.replace('team-', '') || '';
    const parts = rawId.split('|');
    if (parts.length >= 2) {
      p1 = p1 || processedPlayers.value.find(p => p.id === parts[0]);
      p2 = p2 || processedPlayers.value.find(p => p.id === parts[1]);
    }
  }

  // 3. Ultimate Fallback: Force the modal open by creating mock objects with the parsed names
  // This guarantees the modal opens even if the player lookup fails completely.
  selectedTeam.value = { 
    p1: p1 || { name: pairing.player?.split(' / ')[0] || 'Player 1' }, 
    p2: p2 || { name: pairing.player?.split(' / ')[1] || 'Player 2' }, 
    totalNet: pairing.score,
    ...pairing
  };
  
  isTeamModalOpen.value = true;
};

const completeEvent = async () => {
  const confirmed = await ask("Complete Event?", "Pairings and results will be permanently set for this round.", {
    confirmText: "Complete",
    icon: "mdi:lock-check",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    confirmBtnClass: "bg-emerald-600 active:bg-emerald-700"
  });
  if (!confirmed) return;
  try {
    uiStore.setLoading(true, "Locking Event...");
    eventDetails.value.status = 'complete';
    isPreviewingPairings.value = false;
    
    if (mode === 'live') {
      const normalized = normalizeLiveRounds(dataStore.liveRounds);
      processLeaderboard(normalized);
    }
  } finally {
    uiStore.setLoading(false);
  }
};

// --- UNIFIED CALCULATION ENGINE ---
const processLeaderboard = (flatPlayersArray) => {
  if (!eventDetails.value || !flatPlayersArray?.length) {
    roundsSource.value = flatPlayersArray || [];
    return;
  }
  
  const simulationEvent = { 
    ...eventDetails.value, 
    status: isPreviewingPairings.value ? 'complete' : eventDetails.value.status 
  };
  
  const calculatedRounds = calcRounds(flatPlayersArray, simulationEvent);
  const res = runLeaguePass(calculatedRounds, simulationEvent);
  
  winnersLog.value = res.winnersLog || { blindBestBall: [] };
  roundsSource.value = res.players || [];
};

// --- DATA PIPELINE: LIVE ---
const normalizeLiveRounds = (liveRounds) => {
  return liveRounds
    .filter(r => r.iso === iso && r.leagueId === leagueId)
    .flatMap(r => r.players.map(p => ({
      ...p,
      name: p.name || `${p.fname} ${p.lname}`,
      iso: r.iso,
      course: r.course,
      courseSnapshot: r.courseSnapshot,
      scores: r.scores?.[p.id] || Array(18).fill(0)
    })));
};

// --- DATA PIPELINE: HISTORY ---
const fetchHistoryRounds = async () => {
  try {
    const roundsRef = collectionGroup($db, "rounds");
    const q = query(
      roundsRef, 
      where("leagueId", "==", leagueId), 
      where("iso", "==", iso)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) {
      processLeaderboard([]);
      return;
    }

    const flatHistoryPlayers = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.playerKey || doc.ref.parent.parent?.id || doc.id,
        name: data.name || "Unknown Player",
        iso: data.iso,
        course: data.course || "Course TBD",
        courseSnapshot: data.courseSnapshot || { tees: {} },
        teesId: data.teesId || data.tees || "fallback",
        scores: data.scores || Array(18).fill(0),
        index: data.index || 0,
        ...data
      };
    });
    
    processLeaderboard(flatHistoryPlayers);
  } catch (err) {
    console.error("History Fetch Error:", err);
  }
};

// --- LIFECYCLE ---
onMounted(async () => {
  uiStore.setLoading(true, "Syncing...");
  try {
    if (!leagueData.value) return;
    
    const q = query(collection($db, "leagues", leagueId, "calendar"), where("iso", "==", iso));
    const snap = await getDocs(q);
    eventDetails.value = snap.empty ? { iso, status: 'active', game: [] } : snap.docs[0].data();
    
    availableTabs.value = ['Net Score', ...(eventDetails.value.game || []).filter(g => 
      ['Modified Chicago', 'Chicago Points', 'Blind Best Ball'].includes(g)
    )];

    if (mode === 'live') {
      dataStore.startLiveListener({ leagueId });
      
      watch(() => dataStore.liveRounds, (newLiveRounds) => {
        const normalized = normalizeLiveRounds(newLiveRounds);
        processLeaderboard(normalized);
      }, { immediate: true, deep: true });
      
    } else {
      await fetchHistoryRounds();
    }
  } finally {
    uiStore.setLoading(false);
  }
});

onUnmounted(() => mode === 'live' && dataStore.stopLiveListener());

const getShortDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
</script>

<style scoped>
.shuffle-list-move { transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.shuffle-list-enter-active, .shuffle-list-leave-active { transition: all 0.5s ease; }
.shuffle-list-enter-from, .shuffle-list-leave-to { opacity: 0; transform: translateX(30px); }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>