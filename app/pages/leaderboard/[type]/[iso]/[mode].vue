<template>
  <div class="max-w-2xl mx-auto select-none pb-32">
    <div v-if="uiStore.isGlobalLoading" class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:golf" class="size-16 text-emerald-500 animate-bounce" />
      <p class="text-secondary text-[10px]">{{ uiStore.loadingMessage }}</p>
    </div>

    <template v-else-if="processedPlayers.length > 0">
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

      <div class="px-4 mb-4">
        <p class="text-secondary text-[10px]">
          {{ processedPlayers[0]?.course || 'Loading...' }} • {{ getShortDate(iso) }}
        </p>
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
                    <h3 class="text-lg text-primary font-black uppercase italic truncate">{{ row.name }}</h3>
                  </div>
                  <span :class="row.scoreColor" class="text-2xl font-black italic tabular-nums">{{ row.scoreDisplay }}</span>
                </div>
                
                <div class="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800/60">
                  <div class="flex items-center gap-4 text-secondary text-[9px] font-black uppercase">
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

          <div v-if="activeTab === 'Blind Best Ball' && activeDisplayList.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="bg-stone-100 dark:bg-stone-900/50 p-6 rounded-[2.5rem] border border-dashed border-stone-200 dark:border-stone-800">
              <Icon name="mdi:shuffle-variant" class="size-10 text-stone-300 dark:text-stone-700 mb-3" />
              <h4 class="text-sm font-black text-stone-400 uppercase tracking-widest italic">Pairings Not Set</h4>
              <p class="text-[10px] text-stone-500 mt-2 max-w-[180px]">Pairings will appear here once the event is locked.</p>
              <button 
                v-if="isAdmin && mode === 'live'" 
                @click="isPreviewingPairings = true; updateLeaderboard(dataStore.liveRounds)"
                class="mt-4 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                Preview Pairings
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="!uiStore.isGlobalLoading" class="flex flex-col items-center justify-center pt-32 text-stone-400">
      <Icon name="mdi:golf-cart" class="size-20 opacity-10 mb-6" />
      <p class="text-secondary">{{ mode === 'live' ? 'No Live Rounds Active' : 'No History Found' }}</p>
    </div>

    <ClientOnly>
      <ScorecardPlayerModal v-if="selectedPlayer && eventDetails" :is-open="isModalOpen" :player="selectedPlayer" :event="eventDetails" @close="isModalOpen = false" />
      <BlindBestBallModal v-if="selectedTeam && eventDetails" :is-open="isTeamModalOpen" :team="selectedTeam" :event="eventDetails" @close="isTeamModalOpen = false" />
      
      <LiveRoundFooter 
        v-if="mode === 'live' && roundId && route.query.from !== 'menu' && route.query.from !== 'home'" 
        active-tab="leaderboard" 
        :round-id="roundId" 
        :league-type="type" 
        :iso="iso" 
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { collection, query, where, getDocs } from "firebase/firestore";
import { useData } from '~/stores/data';
import { useUIStore } from '~/stores/ui';
import { useAuthStore } from '~/stores/auth';
import { useConfirm } from '~/composables/useConfirm';
import { calcRounds, runLeaguePass, getTieBreakerValue } from '~/utils/gameLogic';
import { completeLeagueEvent } from '~/utils/leagueActions';

const route = useRoute();
const dataStore = useData();
const uiStore = useUIStore();
const authStore = useAuthStore();
const { ask } = useConfirm();
const { $db } = useNuxtApp();

const { type, iso, mode = 'live' } = route.params;

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
const leagueData = computed(() => dataStore.leagues.find(l => l.id === type || l.type === type));
const isYearlyLeague = computed(() => leagueData.value?.cadence === 'yearly');
const isAdmin = computed(() => leagueData.value && authStore.isAdminForLeague(leagueData.value.id));

const processedPlayers = computed(() => (roundsSource.value || []).map(p => ({
  ...p,
  netRel: p.games?.totalNet ?? 0,
  thru: p.games?.holesPlayed ?? 0
})));

const activeDisplayList = computed(() => {
  if (activeTab.value === 'Blind Best Ball') {
    const isLocked = eventDetails.value?.status === 'complete';
    if (!isLocked && !isPreviewingPairings.value) return [];
    return (winnersLog.value?.blindBestBall || []).map(win => ({ ...win, id: `team-${win.id}`, isWinnerRow: true }));
  }

  const isChicago = ['Chicago Points', 'Modified Chicago'].includes(activeTab.value);
  const players = [...processedPlayers.value].map(p => {
    let scoreVal = 0, display = '', color = 'text-stone-900 dark:text-white';
    if (activeTab.value === 'Net Score') {
      scoreVal = p.netRel;
      const fmt = isYearlyLeague.value ? p.netRel.toFixed(3) : Math.round(p.netRel);
      display = p.netRel === 0 ? 'E' : (p.netRel > 0 ? `+${fmt}` : fmt);
      if (p.netRel < 0) color = 'text-red-500';
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
    return b.games.holesPlayed - a.games.holesPlayed;
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
  const myRound = dataStore.liveRounds.find(r => r.leagueId === leagueData.value.id && r.players?.some(p => p.id === myId));
  return myRound?.id || dataStore.liveRounds[0]?.id || null;
});

const backRoute = computed(() => {
  if (route.query.from === 'menu') return `/leagues/${leagueData.value?.id}/menu`;
  if (route.query.from === 'home') return '/';
  if (mode !== 'live' || route.query.from === 'calendar') return `/leagues/${leagueData.value?.id}/calendar`;
  return roundId.value ? `/rounds/${roundId.value}` : `/leagues/${leagueData.value?.id}/menu`;
});

const backText = computed(() => {
  if (route.query.from === 'menu') return 'Menu';
  if (route.query.from === 'home') return 'Home';
  return (mode !== 'live' || route.query.from === 'calendar') ? 'Calendar' : 'Scorecard';
});

// --- METHODS ---
const openPlayerModal = (row) => { 
  selectedPlayer.value = row; 
  isModalOpen.value = true; 
};

const openTeamModal = (pairing) => {
  const rawId = pairing.id.replace('team-', '');
  const [p1Id, p2Id] = rawId.split('-');
  const p1 = processedPlayers.value.find(p => p.id === p1Id);
  const p2 = processedPlayers.value.find(p => p.id === p2Id);
  if (p1 && p2) {
    selectedTeam.value = { p1, p2, totalNet: pairing.score };
    isTeamModalOpen.value = true;
  }
};

const shouldShowBadge = (label) => {
  if (!eventDetails.value?.game) return false;
  const games = eventDetails.value.game;
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('gross skins')) return games.includes('Gross Skins');
  if (lowerLabel.includes('net skins')) return games.includes('Net Skins');
  if (lowerLabel.includes('deuce')) return games.includes('Deuce Pot');
  return true;
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
    await completeLeagueEvent($db, leagueData.value.id, iso);
    eventDetails.value.status = 'complete';
    isPreviewingPairings.value = false;
    if (mode === 'live') updateLeaderboard(dataStore.liveRounds);
  } finally {
    uiStore.setLoading(false);
  }
};

const updateLeaderboard = (liveRounds) => {
  if (!eventDetails.value || !liveRounds?.length) {
    uiStore.setLoading(false);
    return;
  }
  try {
    const flatPlayers = normalizeLiveRounds(liveRounds);
    const simulationEvent = { ...eventDetails.value, status: isPreviewingPairings.value ? 'complete' : eventDetails.value.status };
    const res = runLeaguePass(calcRounds(flatPlayers, simulationEvent), simulationEvent);
    winnersLog.value = res.winnersLog || { blindBestBall: [] };
    roundsSource.value = res.players || [];
  } finally {
    uiStore.setLoading(false);
  }
};

const normalizeLiveRounds = (liveRounds) => {
  return liveRounds
    .filter(r => r.iso === iso && r.courseSnapshot && r.leagueId === leagueData.value?.id)
    .flatMap(r => r.players.map(p => ensureTeeData({
      ...p,
      name: p.name || `${p.fname} ${p.lname}`,
      iso: r.iso,
      course: r.course,
      courseSnapshot: r.courseSnapshot,
      scores: r.scores?.[p.id] || Array(18).fill(0)
    })));
};

const ensureTeeData = (p) => {
  const snap = p.courseSnapshot || { tees: {} };
  const tee = snap.tees[p.teesId] || snap.tees[p.tees] || Object.values(snap.tees)[0] || { pars: Array(18).fill(4), hnds: Array(18).fill(18) };
  return { ...p, teesId: p.teesId || p.tees || "fallback", courseSnapshot: { ...snap, tees: { ...snap.tees, [p.teesId]: tee } } };
};

// --- LIFECYCLE ---
onMounted(async () => {
  uiStore.setLoading(true, "Syncing...");
  try {
    if (!leagueData.value) return;
    const q = query(collection($db, "leagues", leagueData.value.id, "calendar"), where("iso", "==", iso));
    const snap = await getDocs(q);
    eventDetails.value = snap.empty ? { iso, status: 'active', game: [] } : snap.docs[0].data();
    availableTabs.value = ['Net Score', ...(eventDetails.value.game || []).filter(g => ['Modified Chicago', 'Chicago Points', 'Blind Best Ball'].includes(g))];
    if (mode === 'live') {
      dataStore.startLiveListener();
      watch(() => dataStore.liveRounds, updateLeaderboard, { immediate: true, deep: true });
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