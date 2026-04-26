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
            <div v-if="mode === 'live'" class="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Live
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
          <div class="absolute right-3 top-1 bottom-1 w-8 pointer-events-none bg-linear-to-l from-stone-100/80 dark:from-stone-900/80 to-transparent rounded-r-xl"></div>
        </div>
      </div>

      <div class="px-3">
        <div class="relative">
          <TransitionGroup :name="transitionName" tag="div" class="space-y-2">
            <div v-for="(row, index) in activeDisplayList" :key="row.id">
              
              <div v-if="row.isWinnerRow" class="card-base flex items-center justify-between p-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div class="w-6 shrink-0 text-center">
                    <span class="text-primary text-lg opacity-40">
                      {{ index === 0 ? '1' : (row.score === activeDisplayList[index-1].score ? '-' : index + 1) }}
                    </span>
                  </div>
                  <div class="w-px h-8 bg-stone-200 dark:bg-stone-800 shrink-0"></div>
                  <div class="min-w-0 flex flex-col leading-tight">
                    <p class="text-primary text-md">{{ row.player.split(' / ')[0] }}</p>
                    <p class="text-primary text-md opacity-60">{{ row.player.split(' / ')[1] || 'TBD' }}</p>
                  </div>
                </div>
                <div class="flex flex-col items-end shrink-0 pl-4 border-l border-stone-200 dark:border-stone-800">
                  <span class="text-primary text-3xl text-emerald-600 tabular-nums">
                    {{ row.score }}
                  </span>
                </div>
              </div>

              <div v-else @click="openPlayerModal(row)" class="card-interactive p-3 flex flex-col gap-1.5">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div class="w-6 shrink-0 text-center">
                      <span class="text-primary text-md opacity-40">
                        {{ getRank(index) }}
                      </span>
                    </div>
                    <h3 class="text-lg text-primary">
                      {{ row.name }}
                    </h3>
                  </div>

                  <div class="text-right shrink-0">
                    <span :class="row.scoreColor" class="text-2xl text-primary leading-none tabular-nums italic">
                      {{ row.scoreDisplay }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800/60">
                  <div class="flex items-center gap-4">
                    <span class="text-secondary text-[9px]">
                      CH: <span class="text-stone-900 dark:text-stone-100 tabular-nums">{{ isYearlyLeague ? Number(row.index).toFixed(3) : Math.round(row.index) }}</span>
                    </span>
                    
                    <span class="text-secondary text-[9px] flex items-center gap-1">
                      GROSS: 
                      <span class="text-primary text-[11px] bg-stone-200/50 dark:bg-stone-900 px-1.5 py-0.5 rounded">
                        {{ row.grossDisplay }}
                      </span>
                    </span>

                    <span class="text-secondary text-[9px]">
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
        </div>
      </div>
    </template>

    <div v-else class="flex flex-col items-center justify-center pt-32 text-stone-400">
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
let shuffleTimer = null;

// --- COMPUTED ---
const leagueData = computed(() => dataStore.leagues.find(l => l.type === type));
const isYearlyLeague = computed(() => leagueData.value?.cadence === 'yearly');
const isAdmin = computed(() => leagueData.value && authStore.isAdminForLeague(leagueData.value));
const isHoleByHoleTab = computed(() => ['Blind Best Ball'].includes(activeTab.value));

const processedPlayers = computed(() => {
  return roundsSource.value.map(p => ({
    ...p,
    netRel: p.games.totalNet ?? 0,
    thru: p.games.holesPlayed ?? 0
  }));
});

const sortedLeaderboard = computed(() => {
  const isChicago = ['Chicago Points', 'Modified Chicago'].includes(activeTab.value);
  
  const players = [...processedPlayers.value].map(p => {
    let scoreVal = 0;
    let display = '';
    let color = 'text-stone-900 dark:text-white';
    let grossDisplay = '-';
    
    // 1. Calculate Primary Score (Existing Logic)
    const grossUnder = p.games?.totalGrossUnder; 
    if (grossUnder !== undefined && grossUnder !== null) {
      grossDisplay = grossUnder === 0 ? 'E' : (grossUnder > 0 ? `+${grossUnder}` : grossUnder);
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
    else if (isChicago) {
      const key = activeTab.value === 'Chicago Points' ? 'totalChicago' : 'totalModChicago';
      const val = p.games?.[key] || 0;
      scoreVal = isYearlyLeague.value ? val.toFixed(3) : Math.round(val);
      display = scoreVal.toString();
    }

    // 2. Generate Tie Breaker Array (Countback)
    // We use Chicago arrays for Chicago tabs, otherwise default to Net scores
    let tieScores = [];
    if (isChicago) {
      tieScores = activeTab.value === 'Chicago Points' ? (p.games?.chicago || []) : (p.games?.modChicago || []);
    } else {
      tieScores = p.games?.net || [];
    }

    return { 
      ...p, 
      scoreVal, 
      scoreDisplay: display, 
      scoreColor: color, 
      grossDisplay,
      // Pass the tieScores to the utility (assumes getTieBreakerValue is imported/available)
      tieBreaker: getTieBreakerValue(tieScores, isChicago) 
    };
  });

  // 3. Perform the Sort
  players.sort((a, b) => {
    // Primary Sort: Net Score is Low-to-High, others are High-to-Low
    if (activeTab.value === 'Net Score') {
      if (a.scoreVal !== b.scoreVal) return a.scoreVal - b.scoreVal;
    } else {
      if (a.scoreVal !== b.scoreVal) return b.scoreVal - a.scoreVal;
    }

    // Secondary Sort: USGA Countback
    // For Live rounds, we only tie-break if both players are finished (thru F)
    if (a.games.holesPlayed === 18 && b.games.holesPlayed === 18) {
      for (let i = 0; i < a.tieBreaker.length; i++) {
        if (a.tieBreaker[i] !== b.tieBreaker[i]) {
          // Tie-breaker array is pre-negated for Net, so higher value always wins
          return b.tieBreaker[i] - a.tieBreaker[i];
        }
      }
    }
    
    // Tertiary Sort: Holes Played (Thru status)
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
const shouldShowBadge = (label) => {
  if (!eventDetails.value?.game) return false;
  const games = eventDetails.value.game;
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('gross')) return games.includes('Gross Skins');
  if (lowerLabel.includes('net')) return games.includes('Net Skins');
  if (lowerLabel.includes('deuce')) return games.includes('Deuce Pot');
  return true;
};

const fetchConfig = async () => {
  if (!leagueData.value) return;
  try {
    const qEvent = query(collection($db, "leagues", leagueData.value.id, "calendar"), where("iso", "==", iso));
    const eventSnap = await getDocs(qEvent);
    if (!eventSnap.empty) {
      eventDetails.value = eventSnap.docs[0].data();
      const gameArray = eventDetails.value.game || [];
      
      // Dynamic Tab Sorting: Prioritize Chicago
      let tabs = ['Net Score'];
      if (gameArray.includes('Modified Chicago')) tabs.push('Modified Chicago');
      if (gameArray.includes('Chicago Points')) tabs.push('Chicago Points');
      
      if (['vegas', 'mbWed'].includes(type)) tabs.push('Birds');
      if (type === 'vegas') tabs.push('Deuces');

      gameArray.forEach(g => {
        const skip = ['Gross Skins', 'Net Skins', 'Deuce Pot', 'Stroke Play', 'Chicago Points', 'Modified Chicago'];
        if (!skip.includes(g) && !tabs.includes(g)) tabs.push(g);
      });

      availableTabs.value = tabs;
      // Set Chicago as active if present
      if (gameArray.includes('Modified Chicago')) activeTab.value = 'Modified Chicago';
      else if (gameArray.includes('Chicago Points')) activeTab.value = 'Chicago Points';
    }
  } catch (err) { console.error("Config Error:", err); }
};

const normalizeLiveRounds = (liveGroups) => {
  if (!liveGroups) return [];
  return liveGroups.flatMap(group => {
    if (!group.players) return [];
    return group.players.map(player => ({
      id: player.id,
      name: `${player.fname} ${player.lname}`,
      fname: player.fname,
      lname: player.lname,
      index: player.index,
      ghin: player.ghin,
      teesId: player.teesId,
      tees: player.tees,
      course: group.course,
      iso: group.iso,
      courseSnapshot: group.courseSnapshot,
      scores: group.scores[player.id] || Array(18).fill(0) 
    }));
  });
};

onMounted(async () => {
  uiStore.setLoading(true, `Syncing Leaderboard...`);
  await fetchConfig();

  if (mode === 'live') {
    dataStore.startLiveListener(type);
    watch(() => dataStore.liveRounds, (newRounds) => {
      const calc = calcRounds(normalizeLiveRounds(newRounds), eventDetails.value);
      const res = runLeaguePass(calc, eventDetails.value);
      winnersLog.value = res.winnersLog;
      roundsSource.value = res.players;
    }, { immediate: true, deep: true });

    if (!['complete', 'mdi-check-bold'].includes(eventDetails.value?.status?.toLowerCase())) {
      shuffleTimer = setInterval(() => {
        if (activeTab.value === 'Blind Best Ball') {
          const res = runLeaguePass(calcRounds(normalizeLiveRounds(dataStore.liveRounds), eventDetails.value), eventDetails.value);
          winnersLog.value = res.winnersLog;
          roundsSource.value = res.players;
        }
      }, 5000);
    }
  } else {
    const q = query(collectionGroup($db, "rounds"), where("type", "==", type), where("iso", "==", iso));
    const snap = await getDocs(q);
    const calc = calcRounds(snap.docs.map(d => ({ id: d.id, ...d.data() })), eventDetails.value);
    if (calc?.length) {
      const res = runLeaguePass(calc, eventDetails.value);
      winnersLog.value = res.winnersLog;
      roundsSource.value = res.players;
    }
  }
  uiStore.setLoading(false);
});

onUnmounted(() => {
  if (mode === 'live') dataStore.stopLiveListener();
  if (shuffleTimer) clearInterval(shuffleTimer);
});

const openPlayerModal = (row) => { selectedPlayer.value = row; isModalOpen.value = true; };
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
.shuffle-list-leave-active, .card-flip-leave-active { position: absolute; width: 100%; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>