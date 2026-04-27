<template>
  <div class="max-w-2xl mx-auto select-none pb-32">
    
    <div v-if="uiStore.isGlobalLoading" class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:golf" class="size-16 text-emerald-500 animate-bounce" />
      <p class="text-secondary text-[10px]">{{ uiStore.loadingMessage }}</p>
    </div>

    <template v-else-if="processedPlayers.length > 0">
      <LeagueHeader 
        :title="leagueData?.shortName || leagueData?.name || (type === 'casual' ? 'Casual' : type)"
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
                class="flex items-center gap-1 bg-emerald-600 active:bg-emerald-700 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg transition-colors"
              >
                <Icon name="mdi:lock-check" class="size-3" /> Lock Event
              </button>

              <div v-if="mode === 'live'" class="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Live
              </div>
            </div>
          </ClientOnly>
        </template>
      </LeagueHeader>

      <div class="px-4 mb-4">
        <p class="text-secondary text-[10px]">
          {{ processedPlayers[0]?.course || 'Loading Course...' }} • {{ getShortDate(iso) }}
        </p>
      </div>

      <div class="sticky top-20 z-40 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 py-2 mb-3">
        <div class="relative">
          <div class="flex bg-stone-100 dark:bg-stone-900 p-1 mx-3 rounded-xl overflow-x-auto no-scrollbar gap-1">
            <button 
              v-for="tab in availableTabs" :key="tab"
              @click="activeTab = tab"
              :class="[
                activeTab === tab 
                  ? 'bg-white dark:bg-stone-800 text-emerald-600 shadow-sm' 
                  : 'text-stone-500 active:text-stone-800 dark:active:text-stone-200',
                'flex-1 px-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-tighter whitespace-nowrap transition-all text-center min-w-[22%] active:scale-[0.98]'
              ]"
            >
              {{ tab.replace('Score', '').replace('Points', '') }}
            </button>
          </div>
        </div>
      </div>

      <div class="px-3">
        <div class="relative">
          
          <div v-if="isPreviewingPairings && activeTab === 'Blind Best Ball'" class="mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 rounded-xl flex items-center justify-between">
            <span class="text-[9px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest flex items-center gap-1.5">
              <Icon name="mdi:eye" class="size-3" /> Previewing Pairings
            </span>
            <button @click="isPreviewingPairings = false; updateLeaderboard(dataStore.liveRounds)" class="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform">
              Hide
            </button>
          </div>

          <TransitionGroup :name="transitionName" tag="div" class="space-y-2">
            <div 
                v-for="(row, index) in activeDisplayList" 
                :key="row.id"
                class="active:scale-[0.98] transition-transform"
            >
              <div 
                v-if="row.isWinnerRow" 
                @click="openTeamModal(row)"
                class="card-base cursor-pointer flex items-center justify-between p-3"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div class="w-6 shrink-0 text-center">
                    <span class="text-primary text-lg opacity-40">
                      {{ index === 0 ? '1' : (row.score === activeDisplayList[index-1].score ? '-' : index + 1) }}
                    </span>
                  </div>
                  <div class="w-px h-8 bg-stone-200 dark:bg-stone-800 shrink-0"></div>
                  <div class="min-w-0 flex flex-col leading-tight">
                    <p class="text-primary text-md font-black">{{ row.player.split(' / ')[0] }}</p>
                    <p class="text-primary text-md opacity-60">{{ row.player.split(' / ')[1] || 'TBD' }}</p>
                  </div>
                </div>
                <div class="flex flex-col items-end shrink-0 pl-4 border-l border-stone-200 dark:border-stone-800">
                  <span class="text-primary text-3xl text-emerald-600 tabular-nums font-black italic">
                    {{ row.score }}
                  </span>
                </div>
              </div>

              <div 
                v-else 
                @click="openPlayerModal(row)" 
                class="card-interactive cursor-pointer p-3 flex flex-col gap-1.5"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div class="w-6 shrink-0 text-center">
                      <span class="text-primary text-md opacity-40 font-black">
                        {{ getRank(index) }}
                      </span>
                    </div>
                    <h3 class="text-lg text-primary font-black uppercase italic">
                      {{ row.name }}
                    </h3>
                  </div>

                  <div class="text-right shrink-0">
                    <span :class="row.scoreColor" class="text-2xl font-black leading-none tabular-nums italic">
                      {{ row.scoreDisplay }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800/60">
                  <div class="flex items-center gap-4">
                    <span class="text-secondary text-[9px] font-black uppercase">
                      HCP: <span class="text-stone-900 dark:text-stone-100 tabular-nums">{{ isYearlyLeague ? Number(row.index).toFixed(3) : Math.round(row.index) }}</span>
                    </span>
                    <span class="text-secondary text-[9px] font-black uppercase">
                      THRU: <span class="text-stone-900 dark:text-stone-100 tabular-nums font-black">{{ row.games.holesPlayed === (row.holes || 18) ? 'F' : (row.games.holesPlayed || '-') }}</span>
                    </span>
                  </div>
                  <span v-if="row.winStats?.totalMoney > 0" class="text-primary text-sm text-emerald-600 italic font-black">
                    ${{ row.winStats.totalMoney.toFixed(2) }}
                  </span>
                </div>

                <div v-if="row.winStats?.individualBadges.length > 0" class="flex gap-1 overflow-x-auto no-scrollbar pt-1.5">
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

          <div 
            v-if="activeTab === 'Blind Best Ball' && activeDisplayList.length === 0" 
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <div class="bg-stone-100 dark:bg-stone-900/50 p-6 rounded-[2.5rem] border border-dashed border-stone-200 dark:border-stone-800">
              <Icon name="mdi:shuffle-variant" class="size-10 text-stone-300 dark:text-stone-700 mb-3" :class="{'animate-pulse': !isAdmin}" />
              <h4 class="text-sm font-black text-stone-400 uppercase tracking-widest italic leading-none">
                Pairings Not Set
              </h4>
              <p class="text-[10px] text-stone-500 mt-2 max-w-[180px] font-medium leading-tight">
                Pairings will appear here once the event is locked.
              </p>
              
              <button 
                v-if="isAdmin && mode === 'live'" 
                @click="isPreviewingPairings = true; updateLeaderboard(dataStore.liveRounds)"
                class="mt-4 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-sm"
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
      <p class="text-secondary">
        {{ mode === 'live' ? 'No Live Rounds Active' : 'No History Found' }}
      </p>
    </div>

    <ClientOnly>
      <ScorecardPlayerModal 
        v-if="selectedPlayer && eventDetails" 
        :is-open="isModalOpen" 
        :player="selectedPlayer" 
        :event="eventDetails"
        @close="isModalOpen = false" 
      />
      <BlindBestBallModal 
        v-if="selectedTeam && eventDetails"
        :is-open="isTeamModalOpen" 
        :team="selectedTeam" 
        :event="eventDetails" 
        @close="isTeamModalOpen = false" 
      />
      <LiveRoundFooter 
        v-if="mode === 'live' && roundId" 
        active-tab="leaderboard" 
        :round-id="roundId" 
        :league-type="type" 
        :iso="iso" 
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { collection, query, where, getDocs, collectionGroup } from "firebase/firestore";
import { useData } from '~/stores/data';
import { useUIStore } from '~/stores/ui';
import { useAuthStore } from '~/stores/auth';
import { calcRounds, runLeaguePass, getTieBreakerValue } from '~/utils/gameLogic';
import { completeLeagueEvent } from '~/utils/leagueActions';

const route = useRoute();
const dataStore = useData();
const uiStore = useUIStore();
const authStore = useAuthStore();
const { $db } = useNuxtApp();

const { type, iso, mode = 'live' } = route.params;

// --- STATE ---
const roundsSource = ref([]);
const eventDetails = ref(null);
const activeTab = ref('Net Score');
const availableTabs = ref(['Net Score']);
const winnersLog = ref({ grossSkins: [], netSkins: [], deuces: [], blindBestBall: [] });

const selectedPlayer = ref(null);
const isModalOpen = ref(false);

const selectedTeam = ref(null);
const isTeamModalOpen = ref(false);

const isPreviewingPairings = ref(false);

// --- COMPUTED ---
const leagueData = computed(() => dataStore.leagues.find(l => l.type === type));
const isYearlyLeague = computed(() => leagueData.value?.cadence === 'yearly');
const isAdmin = computed(() => leagueData.value && authStore.isAdminForLeague(leagueData.value));
const isHoleByHoleTab = computed(() => ['Blind Best Ball'].includes(activeTab.value));

const processedPlayers = computed(() => {
  return (roundsSource.value || []).map(p => ({
    ...p,
    netRel: p.games?.totalNet ?? 0,
    thru: p.games?.holesPlayed ?? 0
  }));
});

const sortedLeaderboard = computed(() => {
  const isChicago = ['Chicago Points', 'Modified Chicago'].includes(activeTab.value);
  const players = [...processedPlayers.value].map(p => {
    let scoreVal = 0;
    let display = '';
    let color = 'text-stone-900 dark:text-white';
    
    if (activeTab.value === 'Net Score') {
      scoreVal = p.netRel;
      const fmt = isYearlyLeague.value ? p.netRel.toFixed(3) : Math.round(p.netRel);
      display = p.netRel === 0 ? 'E' : (p.netRel > 0 ? `+${fmt}` : fmt);
      if (p.netRel < 0) color = 'text-red-500';
    } 
    else if (isChicago) {
      const key = activeTab.value === 'Chicago Points' ? 'totalChicago' : 'totalModChicago';
      const val = p.games?.[key] || 0;
      scoreVal = isYearlyLeague.value ? val.toFixed(3) : Math.round(val);
      display = scoreVal.toString();
    }

    let tieScores = isChicago ? (p.games?.chicago || []) : (p.games?.net || []);
    return { 
      ...p, 
      scoreVal, 
      scoreDisplay: display, 
      scoreColor: color, 
      tieBreaker: getTieBreakerValue(tieScores, isChicago) 
    };
  });

  players.sort((a, b) => {
    if (activeTab.value === 'Net Score') {
      if (a.scoreVal !== b.scoreVal) return a.scoreVal - b.scoreVal;
    } else {
      if (a.scoreVal !== b.scoreVal) return b.scoreVal - a.scoreVal;
    }
    for (let i = 0; i < a.tieBreaker.length; i++) {
      if (a.tieBreaker[i] !== b.tieBreaker[i]) return b.tieBreaker[i] - a.tieBreaker[i];
    }
    return b.games.holesPlayed - a.games.holesPlayed;
  });

  return players;
});

const activeDisplayList = computed(() => {
  if (isHoleByHoleTab.value) {
    const list = activeTab.value === 'Blind Best Ball' ? (winnersLog.value?.blindBestBall || []) : [];
    return list.map(win => ({ ...win, id: `team-${win.id}`, isWinnerRow: true }));
  }
  return (sortedLeaderboard.value || []).map(player => ({ ...player, isWinnerRow: false }));
});

const getRank = (index) => {
  if (isHoleByHoleTab.value) return '';
  const list = sortedLeaderboard.value;
  if (!list[index]) return '';
  if (index === 0) return '1';
  return list[index].scoreVal === list[index - 1].scoreVal ? '-' : (index + 1).toString();
};

const roundId = computed(() => {
  if (mode !== 'live' || !dataStore.liveRounds?.length) return null;
  return dataStore.liveRounds[0].id;
});

const backRoute = computed(() => {
  const calPath = `/leagues/${leagueData.value?.id}/calendar`;
  if (mode !== 'live' || route.query.from === 'calendar') return calPath;
  return roundId.value ? `/rounds/${roundId.value}` : calPath;
});

const backText = computed(() => mode !== 'live' || route.query.from === 'calendar' ? 'Calendar' : 'Scorecard');
const transitionName = computed(() => activeTab.value === 'Blind Best Ball' ? 'card-flip' : 'shuffle-list');

// --- METHODS ---
const openPlayerModal = (row) => { selectedPlayer.value = row; isModalOpen.value = true; };

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
  if (!confirm("Are you sure you want to lock this event? Pairings and results will be permanently set.")) return;
  try {
    uiStore.setLoading(true, "Locking Event...");
    await completeLeagueEvent($db, leagueData.value.id, iso);
    eventDetails.value.status = 'complete';
    isPreviewingPairings.value = false;
    if (mode === 'live') updateLeaderboard(dataStore.liveRounds);
  } catch (err) {
    console.error("Failed to complete event:", err);
    alert("Failed to lock the event.");
  } finally {
    uiStore.setLoading(false);
  }
};

const fetchConfig = async () => {
  if (!leagueData.value) return;
  try {
    const qEvent = query(collection($db, "leagues", leagueData.value.id, "calendar"), where("iso", "==", iso));
    const eventSnap = await getDocs(qEvent);
    if (!eventSnap.empty) {
      eventDetails.value = eventSnap.docs[0].data();
      const gameArray = eventDetails.value.game || [];
      let tabs = ['Net Score'];
      if (gameArray.includes('Modified Chicago')) tabs.push('Modified Chicago');
      if (gameArray.includes('Chicago Points')) tabs.push('Chicago Points');
      if (gameArray.includes('Blind Best Ball')) tabs.push('Blind Best Ball');
      availableTabs.value = tabs;
      if (gameArray.includes('Modified Chicago')) activeTab.value = 'Modified Chicago';
      else if (gameArray.includes('Chicago Points')) activeTab.value = 'Chicago Points';
    } else {
      eventDetails.value = { iso, status: 'active', game: [] };
    }
  } catch (err) { console.error("Config Error:", err); }
};

const ensureTeeData = (playerRow) => {
  const safeRow = { ...playerRow };
  const snapshot = safeRow.courseSnapshot || { tees: {} };
  const teesObj = snapshot.tees || {};
  let actualTeeData = teesObj[safeRow.teesId] || teesObj[safeRow.tees] || Object.values(teesObj)[0];

  if (!actualTeeData) {
    actualTeeData = { pars: Array(18).fill(4), hnds: Array(18).fill(18) };
  }

  safeRow.teesId = safeRow.teesId || safeRow.tees || "fallback_id";
  safeRow.courseSnapshot = {
    ...snapshot,
    tees: { ...teesObj, [safeRow.teesId]: actualTeeData }
  };
  return safeRow;
};

const normalizeLiveRounds = (liveRounds) => {
  if (!liveRounds || !Array.isArray(liveRounds)) return [];
  return liveRounds
    .filter(roundDoc => roundDoc.iso === iso && roundDoc.courseSnapshot)
    .flatMap(roundDoc => {
      if (!roundDoc.players || !Array.isArray(roundDoc.players)) return [];
      return roundDoc.players.map(player => ensureTeeData({
        ...player,
        name: player.name || `${player.fname} ${player.lname}`,
        iso: roundDoc.iso,
        course: roundDoc.course,
        courseSnapshot: roundDoc.courseSnapshot,
        scores: roundDoc.scores?.[player.id] || Array(18).fill(0)
      }));
    });
};

const updateLeaderboard = (liveRounds) => {
  if (!eventDetails.value || !liveRounds || liveRounds.length === 0) return;
  try {
    const flatPlayers = normalizeLiveRounds(liveRounds);
    if (flatPlayers.length === 0) {
      uiStore.setLoading(false);
      return;
    }
    const simulationEvent = { 
      ...eventDetails.value, 
      status: isPreviewingPairings.value ? 'complete' : eventDetails.value.status 
    };
    const calc = calcRounds(flatPlayers, simulationEvent);
    const res = runLeaguePass(calc, simulationEvent);
    winnersLog.value = res.winnersLog || { grossSkins: [], netSkins: [], deuces: [], blindBestBall: [] };
    roundsSource.value = res.players || [];
  } catch (err) {
    console.error("🔥 Calc Error:", err);
  } finally {
    uiStore.setLoading(false);
  }
};

onMounted(async () => {
  uiStore.setLoading(true, `Syncing Leaderboard...`);
  await fetchConfig();
  if (mode === 'live') {
    dataStore.startLiveListener(type);
    watch(() => dataStore.liveRounds, (newRounds) => {
      if (newRounds && newRounds.length > 0) {
        updateLeaderboard(newRounds);
      } else if (newRounds?.length === 0) {
        uiStore.setLoading(false);
      }
    }, { immediate: true, deep: true });
  } else {
    try {
      const q = query(collectionGroup($db, "rounds"), where("type", "==", type), where("iso", "==", iso));
      const snap = await getDocs(q); 
      const rawRounds = snap.docs.map(d => {
        const data = d.data();
        return ensureTeeData({ 
          id: d.id, 
          ...data, 
          name: data.name || `${data.fname} ${data.lname}` 
        });
      });
      if (rawRounds.length > 0) {
        const calc = calcRounds(rawRounds, eventDetails.value);
        const res = runLeaguePass(calc, eventDetails.value);
        winnersLog.value = res.winnersLog;
        roundsSource.value = res.players;
      }
    } catch (err) {
      console.error("Historical Error:", err);
    } finally {
      uiStore.setLoading(false);
    }
  }
});

onUnmounted(() => { if (mode === 'live') dataStore.stopLiveListener(); });

const getShortDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
</script>

<style scoped>
.shuffle-list-move { transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.shuffle-list-enter-active, .shuffle-list-leave-active { transition: all 0.5s ease; }
.shuffle-list-enter-from, .shuffle-list-leave-to { opacity: 0; transform: translateX(30px); }
.card-flip-enter-active { transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.card-flip-leave-active { transition: all 0.4s ease-in; position: absolute; width: 100%; }
.card-flip-enter-from { opacity: 0; transform: rotateX(-90deg) translateY(20px); }
.card-flip-leave-to { opacity: 0; transform: rotateX(90deg) translateY(-20px); }
.card-flip-move { transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>