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

      <div class="text-center border-b border-stone-200 dark:border-stone-800 mb-1">
        <p class="text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <span class="text-stone-800 dark:text-stone-100">{{eventDetails?.type}}</span>
          <span class="text-stone-300 dark:text-stone-700">•</span>
          <span class="text-emerald-600 dark:text-emerald-500">{{eventDetails?.course}}</span>
          <span class="text-stone-300 dark:text-stone-700">•</span>
          <span class="text-stone-800 dark:text-stone-100">{{ getShortDate(iso) }}</span>
        </p>
      </div>

      <div class="sticky top-20 z-40 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 py-2 mb-3">
        <div class="flex bg-stone-100 dark:bg-stone-900 p-1 mx-3 rounded-xl gap-1 overflow-x-auto no-scrollbar">
          <button 
            v-for="tab in availableTabs" :key="tab"
            @click="activeTab = tab"
            :class="[
              activeTab === tab 
                ? 'bg-white dark:bg-stone-800 text-emerald-500 shadow-sm' 
                : 'text-stone-600 dark:text-stone-300',
              'flex-1 px-1 py-2 rounded-lg text-sm font-black uppercase tracking-tighter transition-all text-center min-w-[22%] active:scale-[0.98]'
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
            <template v-for="(row, index) in activeDisplayList" :key="row.id">
              
              <LeaderboardTeamCard 
                v-if="row.isWinnerRow" 
                :row="row" 
                :index="index" 
                @click="openTeamModal(row)" 
              />
              
              <LeaderboardPlayerCard 
                v-else 
                :row="row" 
                :rank="getRank(index)" 
                :is-app-managed="isAppManaged" 
                :event-games="eventDetails?.game" 
                @click="openPlayerModal(row)" 
              />

            </template>
          </TransitionGroup>
        </div>
      </div>
    </template>

    <div v-else-if="!uiStore.isGlobalLoading" class="flex flex-col items-center justify-center pt-32 text-stone-400">
      <Icon name="mdi:golf-cart" class="size-20 opacity-10 mb-6" />
      <p class="text-secondary uppercase font-black tracking-widest">{{ mode === 'live' ? 'No Live Rounds Active' : 'No History Found' }}</p>
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
        :is-app-managed="isAppManaged" 
        @close="isTeamModalOpen = false" 
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useData } from '~/stores/data';
import { useUIStore } from '~/stores/ui';
import { useAuthStore } from '~/stores/auth';
import { useConfirm } from '~/composables/useConfirm';
import { useLeaderboardData } from '~/composables/useLeaderboardData';
import { getTieBreakerValue } from '~/utils/gameLogic';

import LeaderboardPlayerCard from '~/components/leaderboard/PlayerCard.vue';
import LeaderboardTeamCard from '~/components/leaderboard/TeamCard.vue';

const route = useRoute();
const dataStore = useData();
const uiStore = useUIStore();
const authStore = useAuthStore();
const { ask } = useConfirm();

const { type: leagueId, iso, mode = 'live' } = route.params;

// --- UI STATE ---
const activeTab = ref('Net Score');
const selectedPlayer = ref(null);
const isModalOpen = ref(false);
const selectedTeam = ref(null);
const isTeamModalOpen = ref(false);
const isPreviewingPairings = ref(false);

// --- LEAGUE CONFIG ---
const leagueData = computed(() => dataStore.leagues.find(l => l.id === leagueId));
const isAppManaged = computed(() => leagueData.value?.appHandicap === true);
const isAdmin = computed(() => !!leagueData.value && authStore.isAdminForLeague(leagueData.value));

// --- COMPOSABLE INJECTION (The Brains) ---
const { 
  eventDetails, 
  roundsSource, 
  winnersLog, 
  availableTabs, 
  initLeaderboard, 
  lockEventAndProcess 
} = useLeaderboardData(leagueId, iso, mode, isAppManaged, isPreviewingPairings);

// --- LIST BUILDERS ---
const processedPlayers = computed(() => (roundsSource.value || []).map(p => ({
  ...p,
  netRel: p.games?.totalNet ?? p.totalNet ?? 0,
  thru: p.games?.holesPlayed ?? p.holes ?? 0
})));

const buildTeamList = () => {
  const isLocked = ['complete', 'mdi-check-bold', 'mdi:check-bold'].includes(eventDetails.value?.status?.toLowerCase() || '');
  if (!isLocked && !isPreviewingPairings.value) return [];

  return (winnersLog.value?.blindBestBall || []).map((win, idx) => {
    const scoreVal = win.score;
    const fmt = isAppManaged.value ? scoreVal.toFixed(3) : Math.round(scoreVal);
    let scoreDisplay = 'E';
    
    if (Math.abs(scoreVal) > 0.001) {
      scoreDisplay = scoreVal > 0 ? `+${fmt}` : fmt.toString();
    }
    
    return { 
      ...win, 
      id: `team-${win.id || idx}`, 
      isWinnerRow: true, 
      scoreDisplay 
    };
  });
};

const buildPlayerList = () => {
  const isChicago = ['Chicago Points', 'Modified Chicago'].includes(activeTab.value);
  const isBirdies = activeTab.value === 'birds';
  const isDeuces = activeTab.value === 'deuces';

  const players = [...processedPlayers.value].map(p => {
    let scoreVal = 0, display = '', color = 'text-stone-900 dark:text-white', tieScores = p.games?.net || [];
    
    if (activeTab.value === 'Net Score') {
      scoreVal = p.games?.totalNet ?? 0;
      const fmt = isAppManaged.value ? scoreVal.toFixed(3) : Math.round(scoreVal);
      display = scoreVal === 0 ? 'E' : (scoreVal > 0 ? `+${fmt}` : fmt);
      if (scoreVal < 0) color = 'text-emerald-500'; 
    } 
    else if (isChicago) {
      const key = activeTab.value === 'Chicago Points' ? 'totalChicago' : 'totalModChicago';
      scoreVal = p.games?.[key] || 0;
      display = isAppManaged.value ? scoreVal.toFixed(3) : Math.round(scoreVal).toString();
      tieScores = p.games?.chicago || [];
    } 
    else if (isBirdies || isDeuces) {
      const key = isBirdies ? 'totalBirds' : 'totalDeuces';
      scoreVal = p.games?.[key] || 0;
      display = scoreVal.toString();
      if (scoreVal > 0) color = 'text-emerald-500';
      tieScores = p.games?.[isBirdies ? 'birds' : 'deuces'] || [];
    }

    return { 
      ...p, 
      scoreVal, 
      scoreDisplay: display, 
      scoreColor: color, 
      tieBreaker: getTieBreakerValue(tieScores, !isChicago), 
      isWinnerRow: false 
    };
  });

  return players.sort((a, b) => {
    if (a.scoreVal !== b.scoreVal) {
      return activeTab.value === 'Net Score' ? a.scoreVal - b.scoreVal : b.scoreVal - a.scoreVal;
    }
    for (let i = 0; i < a.tieBreaker.length; i++) {
      if (a.tieBreaker[i] !== b.tieBreaker[i]) return b.tieBreaker[i] - a.tieBreaker[i];
    }
    return (b.games?.holesPlayed ?? 0) - (a.games?.holesPlayed ?? 0);
  });
};

const activeDisplayList = computed(() => {
  return activeTab.value === 'Blind Best Ball' ? buildTeamList() : buildPlayerList();
});

const getRank = (index) => {
  const list = activeDisplayList.value;
  if (!list[index] || index === 0) return '1';
  return list[index].scoreVal === list[index - 1].scoreVal ? '-' : (index + 1).toString();
};

// --- ROUTING COMPUTEDS ---
const roundId = computed(() => {
  if (mode !== 'live' || !dataStore.liveRounds?.length || !leagueData.value) return null;
  const myRound = dataStore.liveRounds.find(r => 
    r.leagueId === leagueId && r.players?.some(p => String(p.id) === String(authStore.userProfile?.id))
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

// --- EVENT HANDLERS ---
const openPlayerModal = (row) => { 
  selectedPlayer.value = row; 
  isModalOpen.value = true; 
};

const openTeamModal = (pairing) => {
  // Reconstruct full objects if missing
  let p1 = pairing.p1 || pairing.team?.[0];
  let p2 = pairing.p2 || pairing.team?.[1];

  if (!p1 || !p2) {
    const rawId = pairing.id?.replace('team-', '') || '';
    const parts = rawId.split('|');
    if (parts.length >= 2) {
      p1 = p1 || processedPlayers.value.find(p => p.id === parts[0]);
      p2 = p2 || processedPlayers.value.find(p => p.id === parts[1]);
    }
  }

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
  
  uiStore.setLoading(true, "Locking Event...");
  isPreviewingPairings.value = false;
  
  lockEventAndProcess();
  
  // Give the UI a beat to catch up and clear the loader
  setTimeout(() => {
    uiStore.setLoading(false);
  }, 300); 
};

const getShortDate = (d) => {
  return d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
};

// --- LIFECYCLE ---
onMounted(() => {
  if (leagueData.value) {
    initLeaderboard(leagueData.value.yearly_games);
  }
});
</script>

<style scoped>
.shuffle-list-move { transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.shuffle-list-enter-active, .shuffle-list-leave-active { transition: all 0.5s ease; }
.shuffle-list-enter-from, .shuffle-list-leave-to { opacity: 0; transform: translateX(30px); }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>