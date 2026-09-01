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
                v-if="isAdmin && isLive"
                @click="isSendAlertModalOpen = true"
                title="Send Alert"
                class="flex items-center justify-center p-1.5 rounded-lg transition-all active:scale-95 shadow-sm text-red-600 dark:text-red-500 bg-red-500/10 border border-red-500/30"
              >
                <Icon name="mdi:alert-decagram-outline" class="size-4" />
              </button>

              <button
                v-if="isAdmin"
                @click="isManageOpen = true"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm text-amber-700 dark:text-amber-500 bg-amber-500/10 border border-amber-500/30"
              >
                <Icon name="mdi:cog" class="size-3.5" />
                <span>Manage</span>
              </button>

              <button
                v-if="isAdmin && isLive"
                @click="completeEvent"
                class="flex items-center gap-1.5 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 active:bg-emerald-500 active:text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <Icon name="mdi:lock-outline" class="size-3" /> Lock
              </button>

              <div v-if="isLive" class="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
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
          <span class="text-stone-800 dark:text-stone-100">{{ getShortDate(eventDetails?.iso) }}</span>
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

          <LeaderboardSkinsDeucesList v-if="activeTab === 'Skins'" :holes="holeByHoleSkins" />

          <template v-else>
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
          </template>
        </div>
      </div>
    </template>

    <div v-else-if="!uiStore.isGlobalLoading" class="flex flex-col items-center justify-center pt-32 text-stone-400">
      <Icon name="mdi:golf-cart" class="size-20 opacity-10 mb-6" />
      <p class="text-secondary uppercase font-black tracking-widest">
        {{ !eventDetails ? 'Event Not Found' : (isLive ? 'No Live Rounds Active' : 'No History Found') }}
      </p>
    </div>

    <ClientOnly>
      <LazyScorecardPlayerModal
        v-if="selectedPlayer && eventDetails"
        :is-open="isModalOpen"
        :player="selectedPlayer"
        :event="eventDetails"
        :is-admin="isAdmin"
        @close="isModalOpen = false"
        @change-tee="handleHistoryTeeChange"
      />
      <LazyBlindBestBallModal
        v-if="selectedTeam && eventDetails"
        :is-open="isTeamModalOpen"
        :team="selectedTeam"
        :event="eventDetails"
        :is-app-managed="isAppManaged"
        @close="isTeamModalOpen = false"
      />

      <LazySendAlertModal
        v-if="isAdmin"
        :is-open="isSendAlertModalOpen"
        @close="isSendAlertModalOpen = false"
        @send="handleSendAlert"
      />

      <!-- Admin: manage rounds panel -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="isManageOpen" class="fixed inset-0 z-[150] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
            <div @click="isManageOpen = false" class="absolute inset-0"></div>
            <div class="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh]">
              <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>
              <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Manage Rounds</h3>
                <button @click="isManageOpen = false" class="modal-close-btn">
                  <Icon name="mdi:close" class="size-5" />
                </button>
              </div>

              <div class="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar">
                <div
                  v-for="p in processedPlayers" :key="p.id"
                  class="flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl"
                >
                  <span class="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate pr-2">{{ playerDisplayName(p) }}</span>
                  <div class="flex items-center gap-1 shrink-0">
                    <button @click="openEditScores(p)" class="p-2 text-slate-400 hover:text-emerald-500 active:scale-90 transition-all">
                      <Icon name="mdi:pencil-circle" class="size-5" />
                    </button>
                    <button @click="promptRemovePlayer(p)" class="p-2 text-slate-400 hover:text-red-500 active:scale-90 transition-all">
                      <Icon name="mdi:close-circle-outline" class="size-5" />
                    </button>
                  </div>
                </div>

                <div v-if="processedPlayers.length === 0" class="py-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  No players yet
                </div>
              </div>

              <div class="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
                <button
                  @click="isManageOpen = false; isPlayerPickerOpen = true"
                  class="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="mdi:account-plus" class="size-4" /> Add Player
                </button>

                <button
                  v-if="hasBlindBestBall && eventDetails?.bbb_pairings?.length > 0"
                  @click="resetPairings"
                  class="w-full py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-500 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="mdi:shuffle-variant" class="size-3.5" /> Reset Blind Best Ball Pairings
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <LazyPlayerPicker
        v-model:isOpen="isPlayerPickerOpen"
        :selectedPlayers="playersAlreadyOnBoard"
        :leagueId="leagueId"
        @toggle="handleAddPlayerPick"
      />

      <LazyCourseTeesModal
        :is-open="addFlow.teeModalOpen"
        :selected-course="eventDetails?.course"
        :league-tees-type="addFlow.pendingPlayer?.tee_type || 'mens'"
        @close="addFlow.teeModalOpen = false"
        @pick="handleAddPlayerTeePick"
      />

      <LazyRoundScoresModal
        :is-open="scoresModal.isOpen"
        :player="scoresModal.player"
        :holes="eventDetails?.holes || 18"
        @close="scoresModal.isOpen = false"
        @save="handleScoresSave"
      />

      <!-- Rare case: multiple simultaneous live_rounds groups for this event -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="groupPicker.isOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div @click="groupPicker.isOpen = false" class="absolute inset-0"></div>
            <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h4 class="text-sm font-black uppercase text-slate-800 dark:text-white mb-3">Which Group?</h4>
              <div class="space-y-2">
                <button
                  v-for="g in groupPicker.candidates" :key="g.id"
                  @click="chooseGroupForAdd(g)"
                  class="w-full p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-left font-bold text-sm text-slate-700 dark:text-slate-200"
                >
                  {{ g.players.map(p => p.fname).join(', ') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { doc, updateDoc, addDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useData } from '~/stores/data';
import { useUIStore } from '~/stores/ui';
import { useAuthStore } from '~/stores/auth';
import { useConfirm } from '~/composables/useConfirm';
import { useToast } from '~/composables/useToast';
import { useLeaderboardData } from '~/composables/useLeaderboardData';
import { getTieBreakerValue, calcCourseHandicap, getTeePar, createPlayerSnapshot } from '~/utils/gameLogic';

import LeaderboardPlayerCard from '~/components/leaderboard/PlayerCard.vue';
import LeaderboardTeamCard from '~/components/leaderboard/TeamCard.vue';

const { $db } = useNuxtApp();
const route = useRoute();
const dataStore = useData();
const uiStore = useUIStore();
const authStore = useAuthStore();
const { ask } = useConfirm();
const toast = useToast();

const { leagueId, eventId } = route.params;

// --- UI STATE ---
const activeTab = ref('Net Score');
const selectedPlayer = ref(null);
const isModalOpen = ref(false);
const selectedTeam = ref(null);
const isTeamModalOpen = ref(false);
const isPreviewingPairings = ref(false);

// --- ADMIN ROUND MANAGEMENT STATE ---
const isManageOpen = ref(false);
const isSendAlertModalOpen = ref(false);
const isPlayerPickerOpen = ref(false);
const addFlow = ref({ teeModalOpen: false, pendingPlayer: null });
const scoresModal = ref({ isOpen: false, mode: null, player: null, pendingTeeId: null, pendingTeeName: null });
const groupPicker = ref({ isOpen: false, candidates: [], pendingSnapshot: null, pendingScores: null });

// --- LEAGUE CONFIG ---
const leagueData = computed(() => dataStore.leagues.find(l => l.id === leagueId));
const isAppManaged = computed(() => leagueData.value?.appHandicap === true);
const isAdmin = computed(() => !!leagueData.value && authStore.isAdminForLeague(leagueData.value));
const hasBlindBestBall = computed(() => eventDetails.value?.game?.includes('Blind Best Ball') ?? false);

// --- COMPOSABLE INJECTION (The Brains) ---
const {
  eventDetails,
  roundsSource,
  winnersLog,
  availableTabs,
  isLive,
  initLeaderboard
} = useLeaderboardData(leagueId, eventId, isAppManaged, isPreviewingPairings);

// --- LIST BUILDERS ---
const processedPlayers = computed(() => (roundsSource.value || []).map(p => ({
  ...p,
  netRel: p.games?.totalNet ?? p.totalNet ?? 0,
  thru: p.games?.holesPlayed ?? p.holes ?? 0
})));

const buildTeamList = () => {
  if (isLive.value && !isPreviewingPairings.value) return [];

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

// Skins tab: a per-hole breakdown rather than a ranked player list --
// winnersLog's grossSkins/netSkins are already single-winner-or-nothing per
// hole (ties are excluded upstream in runLeaguePass), deuces can have
// multiple winners on the same hole.
const holeByHoleSkins = computed(() => {
  const totalHoles = eventDetails.value?.holes || 18;
  const gross = winnersLog.value?.grossSkins || [];
  const net = winnersLog.value?.netSkins || [];
  const deuces = winnersLog.value?.deuces || [];

  return Array.from({ length: totalHoles }, (_, i) => {
    const hole = i + 1;
    return {
      hole,
      gross: gross.find(w => w.hole === hole) || null,
      net: net.find(w => w.hole === hole) || null,
      deuces: deuces.filter(w => w.hole === hole)
    };
  });
});

const getRank = (index) => {
  const list = activeDisplayList.value;
  if (!list[index] || index === 0) return '1';
  return list[index].scoreVal === list[index - 1].scoreVal ? '-' : (index + 1).toString();
};

// --- ROUTING COMPUTEDS ---
const roundId = computed(() => {
  if (!isLive.value || !dataStore.liveRounds?.length || !leagueData.value) return null;
  const myRound = dataStore.liveRounds.find(r =>
    r.leagueId === leagueId && r.players?.some(p => String(p.id) === String(authStore.userProfile?.id))
  );
  return myRound?.id || dataStore.liveRounds[0]?.id || null;
});

const backRoute = computed(() => {
  if (route.query.from === 'menu') return `/leagues/${leagueId}/menu`;
  if (route.query.from === 'home') return '/';
  if (!isLive.value || route.query.from === 'calendar') return `/leagues/${leagueId}/calendar`;
  return roundId.value ? `/rounds/${roundId.value}` : `/leagues/${leagueId}/menu`;
});

const backText = computed(() => {
  if (route.query.from === 'menu') return 'Menu';
  if (route.query.from === 'home') return 'Home';
  return (!isLive.value || route.query.from === 'calendar') ? 'Calendar' : 'Scorecard';
});

// --- EVENT HANDLERS ---
const openPlayerModal = (row) => {
  selectedPlayer.value = row;
  isModalOpen.value = true;
};

// Fixes the tee on an already-archived round (players/{id}/rounds/{roundDocId}).
// The archived courseSnapshot only carries the originally-played tee, so pull
// the full tee data from dataStore.courses and merge it in.
const handleHistoryTeeChange = async (payload) => {
  const { player, teesId, tees: teesName } = payload;
  if (!player?.id || !player?.roundDocId || !teesId) return;

  uiStore.setLoading(true, "Updating Tee...");
  try {
    const course = dataStore.courses.find(c => c.name === player.course);
    const teeData = course?.tees?.[teesId];
    if (!teeData) throw new Error("Could not find tee data for the selected tee");

    // App-managed leagues use a fixed league handicap regardless of tee;
    // only a raw GHIN-based course handicap actually depends on the tee played.
    let newIndex = player.index;
    if (!isAppManaged.value) {
      newIndex = calcCourseHandicap(player.ghin ?? 0, Number(teeData.slope) || 113, Number(teeData.rating) || 72, getTeePar(teeData));
    }

    const roundRef = doc($db, "players", player.id, "rounds", player.roundDocId);
    await updateDoc(roundRef, {
      teesId,
      tees: teeData.name || teesName,
      index: newIndex,
      [`courseSnapshot.tees.${teesId}`]: teeData
    });

    isModalOpen.value = false;
    await initLeaderboard(leagueData.value?.yearly_games);
  } catch (err) {
    console.error("Tee change failed:", err);
    toast.add("Failed to update tee -- please try again.", 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

// ============================================================
// Admin round management: add / edit-scores / remove a player
// ============================================================

// PlayerPicker is built for toggling a multi-select group; here we only want
// a single pick to start the add flow, so ignore taps on anyone already on
// the leaderboard (that's what the Manage panel's remove icon is for).
const handleAddPlayerPick = (p) => {
  const alreadyOnBoard = processedPlayers.value.some(pl => pl.id === p.id);
  if (alreadyOnBoard) return;

  isPlayerPickerOpen.value = false;
  addFlow.value.pendingPlayer = p;
  addFlow.value.teeModalOpen = true;
};

const handleAddPlayerTeePick = (picked) => {
  addFlow.value.teeModalOpen = false;
  scoresModal.value = {
    isOpen: true,
    mode: 'add',
    player: { fname: addFlow.value.pendingPlayer.fname, lname: addFlow.value.pendingPlayer.lname },
    pendingTeeId: picked.teesId,
    pendingTeeName: picked.tees
  };
};

const openEditScores = (row) => {
  isManageOpen.value = false;
  scoresModal.value = { isOpen: true, mode: 'edit', player: row, pendingTeeId: null, pendingTeeName: null };
};

const handleScoresSave = async (scores) => {
  const { mode, player } = scoresModal.value;
  const teeId = scoresModal.value.pendingTeeId;
  const teeName = scoresModal.value.pendingTeeName;
  scoresModal.value.isOpen = false;

  uiStore.setLoading(true, "Saving...");
  try {
    if (mode === 'add') {
      await addPlayerRound(addFlow.value.pendingPlayer, teeId, teeName, scores);
    } else {
      await editPlayerScores(player, scores);
    }
    await initLeaderboard(leagueData.value?.yearly_games);
  } catch (err) {
    console.error("Save failed:", err);
    toast.add("Failed to save scores -- please try again.", 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const addPlayerRound = async (player, teeId, teeName, scores) => {
  const course = dataStore.courses.find(c => c.name === eventDetails.value?.course);
  const teeData = course?.tees?.[teeId];
  if (!course || !teeData) throw new Error("Could not find tee data for the selected tee");

  const snapshot = createPlayerSnapshot(player, teeId, course, isAppManaged.value, leagueId, eventDetails.value?.holes || 18);

  if (isLive.value) {
    await addPlayerToLiveRound(course, snapshot, teeData, scores);
  } else {
    await addArchivedRound(player, course, snapshot, teeData, scores);
  }

  await clearStalePairings();
};

// Adding/removing a player invalidates any already-generated official Blind
// Best Ball pairings (they'd silently exclude the new player, or reference
// someone who's now gone -- gameLogic.js's runLeaguePass uses the official
// list exclusively when it's non-empty, never falling back for the rest of
// the roster). Clear them so the leaderboard regenerates fresh random
// pairings covering everyone currently on it.
const clearStalePairings = async () => {
  if (!hasBlindBestBall.value || !eventDetails.value?.bbb_pairings?.length) return;
  await updateDoc(doc($db, "events", eventId), { bbb_pairings: [] });
};

const resetPairings = async () => {
  const confirmed = await ask("Reset Pairings?", "This clears the current Blind Best Ball pairings and generates new random ones from the current roster.", {
    confirmText: "Reset",
    confirmBtnClass: "bg-amber-600"
  });
  if (!confirmed) return;

  isManageOpen.value = false;
  uiStore.setLoading(true, "Resetting Pairings...");
  try {
    await updateDoc(doc($db, "events", eventId), { bbb_pairings: [] });
    await initLeaderboard(leagueData.value?.yearly_games);
  } catch (err) {
    console.error("Reset pairings failed:", err);
    toast.add("Failed to reset pairings -- please try again.", 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

const appendToLiveRound = async (liveRound, snapshot, scores) => {
  const updatedPlayers = [...liveRound.players, snapshot];
  const updatedScores = { ...liveRound.scores, [snapshot.id]: scores };
  await updateDoc(doc($db, "live_rounds", liveRound.id), {
    players: updatedPlayers,
    playerIds: updatedPlayers.map(p => p.id),
    scores: updatedScores
  });
};

const addPlayerToLiveRound = async (course, snapshot, teeData, scores) => {
  const candidates = dataStore.liveRounds.filter(r => r.eventId === eventId);

  if (candidates.length > 1) {
    groupPicker.value = { isOpen: true, candidates, pendingSnapshot: snapshot, pendingScores: scores };
    return;
  }

  if (candidates.length === 1) {
    await appendToLiveRound(candidates[0], snapshot, scores);
    return;
  }

  // No live_rounds doc exists yet for this event -- start one.
  const holes = eventDetails.value.holes || 18;
  await addDoc(collection($db, "live_rounds"), {
    courseId: course.id,
    course: course.name,
    courseSnapshot: { id: course.id, name: course.name, holes, tees: course.tees || {} },
    tees: teeData.name,
    teesId: snapshot.teesId,
    leagueId,
    eventId,
    appHandicap: isAppManaged.value,
    type: leagueData.value?.type || 'league',
    createdAt: new Date().toISOString(),
    iso: eventDetails.value.iso,
    players: [snapshot],
    playerIds: [snapshot.id],
    scores: { [snapshot.id]: scores },
    currentHole: 1,
    status: 'active'
  });
};

const chooseGroupForAdd = async (group) => {
  groupPicker.value.isOpen = false;
  uiStore.setLoading(true, "Adding Player...");
  try {
    await appendToLiveRound(group, groupPicker.value.pendingSnapshot, groupPicker.value.pendingScores);
    await initLeaderboard(leagueData.value?.yearly_games);
  } catch (err) {
    console.error("Add player failed:", err);
    toast.add("Failed to add player -- please try again.", 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

// Archived events have no live_rounds group to join, so a missing player's
// round is created directly in the same shape the archiveLeagueRound cloud
// function writes (minimized courseSnapshot -- just the tee they played).
const addArchivedRound = async (player, course, snapshot, teeData, scores) => {
  await addDoc(collection($db, "players", player.id, "rounds"), {
    course: course.name,
    courseId: course.id,
    courseSnapshot: { holes: eventDetails.value.holes || 18, id: course.id, name: course.name, tees: { [snapshot.teesId]: teeData } },
    leagueId,
    eventId,
    iso: eventDetails.value.iso,
    date: eventDetails.value.iso,
    type: leagueData.value?.type || null,
    name: `${player.fname} ${player.lname}`.trim(),
    playerKey: player.id,
    index: snapshot.index,
    ghin: snapshot.ghin,
    tee_type: snapshot.tee_type,
    tees: teeData.name,
    teesId: snapshot.teesId,
    scores,
    status: "end",
    createdAt: serverTimestamp()
  });
};

const editPlayerScores = async (row, scores) => {
  if (isLive.value) {
    if (!row.liveRoundId) throw new Error("Missing liveRoundId");
    await updateDoc(doc($db, "live_rounds", row.liveRoundId), { [`scores.${row.id}`]: scores });
  } else {
    if (!row.roundDocId) throw new Error("Missing roundDocId");
    await updateDoc(doc($db, "players", row.id, "rounds", row.roundDocId), { scores });
  }
};

const promptRemovePlayer = async (row) => {
  const confirmed = await ask("Remove Player?", `Remove ${playerDisplayName(row)} from this event? This cannot be undone.`, {
    confirmText: "Remove",
    confirmBtnClass: "bg-red-600"
  });
  if (!confirmed) return;

  uiStore.setLoading(true, "Removing...");
  try {
    if (isLive.value) {
      if (!row.liveRoundId) throw new Error("Missing liveRoundId");
      const liveRound = dataStore.liveRounds.find(r => r.id === row.liveRoundId);
      if (!liveRound) throw new Error("Live round not found");
      if (liveRound.players.length === 1) {
        alert("Can't remove the last player in a group.");
        return;
      }
      const updatedPlayers = liveRound.players.filter(p => p.id !== row.id);
      const updatedScores = { ...liveRound.scores };
      delete updatedScores[row.id];
      await updateDoc(doc($db, "live_rounds", row.liveRoundId), {
        players: updatedPlayers,
        playerIds: updatedPlayers.map(p => p.id),
        scores: updatedScores
      });
    } else {
      if (!row.roundDocId) throw new Error("Missing roundDocId");
      await deleteDoc(doc($db, "players", row.id, "rounds", row.roundDocId));
    }
    await clearStalePairings();
    isManageOpen.value = false;
    await initLeaderboard(leagueData.value?.yearly_games);
  } catch (err) {
    console.error("Remove failed:", err);
    toast.add("Failed to remove player -- please try again.", 'error');
  } finally {
    uiStore.setLoading(false);
  }
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

const handleSendAlert = async ({ message, severity }) => {
  uiStore.setLoading(true, "Sending Alert...");
  try {
    await addDoc(collection($db, "alerts"), {
      eventId,
      leagueId,
      message,
      severity,
      postedBy: authStore.userProfile.id,
      postedByName: `${authStore.userProfile.fname} ${authStore.userProfile.lname}`,
      postedAt: serverTimestamp()
    });

    toast.add("Alert sent!", "success");
    isSendAlertModalOpen.value = false;
  } catch (error) {
    console.error("Failed to send alert:", error);
    toast.add("Failed to send alert", "error");
  } finally {
    uiStore.setLoading(false);
  }
};

const completeEvent = async () => {
  const confirmed = await ask("Complete Event?", "Pairings and results will be permanently set for this round, and live rounds will be archived.", {
    confirmText: "Complete",
    icon: "mdi:lock-check",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    confirmBtnClass: "bg-emerald-600 active:bg-emerald-700"
  });
  if (!confirmed) return;

  uiStore.setLoading(true, "Locking Event...");
  isPreviewingPairings.value = false;

  try {
    // This is what actually needs to happen: flip the calendar event's real
    // status, which is what the archiveLeagueRound cloud function triggers
    // on (it moves each player's live_rounds entry into players/{id}/rounds
    // and deletes the live_rounds doc). Previously this only mutated the
    // local eventDetails ref, so nothing was ever persisted or archived.
    await updateDoc(doc($db, "events", eventId), { status: 'complete' });
  } catch (err) {
    console.error("Failed to lock event:", err);
    toast.add("Failed to lock event -- please try again.", 'error');
    uiStore.setLoading(false);
    return;
  }

  uiStore.setLoading(true, "Archiving Rounds...");
  try {
    await waitForArchival();
    await initLeaderboard(leagueData.value?.yearly_games);
  } catch (err) {
    // The event is already locked at this point (the write above succeeded)
    // -- archival itself runs server-side regardless, but re-fetching the
    // leaderboard here can still fail (permission hiccup, network blip). Say
    // so rather than leaving the admin looking at a stale/empty board with
    // no explanation, and guarantee the loading overlay clears either way.
    console.error("Failed to refresh leaderboard after locking:", err);
    toast.add("Event locked, but the leaderboard couldn't be refreshed -- reload to see results.", 'error');
  } finally {
    uiStore.setLoading(false);
  }
};

// The cloud function runs server-side after our write above, on its own
// schedule -- there's no direct callback for "it's done." But it deletes
// each live_rounds doc for this event as part of the same batch that
// archives it, and we already have a live listener on dataStore.liveRounds,
// so watching those docs disappear is a reliable, event-driven signal that
// archival has actually finished (rather than guessing with a fixed delay).
const waitForArchival = () => {
  return new Promise((resolve) => {
    const stillLive = () => dataStore.liveRounds.some(r => r.eventId === eventId);
    if (!stillLive()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      stopWatching();
      resolve();
    }, 15000);

    const stopWatching = watch(() => dataStore.liveRounds, () => {
      if (!stillLive()) {
        clearTimeout(timeoutId);
        stopWatching();
        resolve();
      }
    }, { deep: true });
  });
};

const getShortDate = (d) => {
  return d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
};

// Live rows carry separate fname/lname; archived rows only carry a combined
// `name` string (that's all the archive cloud function writes), so fall back.
const playerDisplayName = (p) => {
  if (p?.fname || p?.lname) return `${p.fname || ''} ${p.lname || ''}`.trim();
  return p?.name || 'Unknown Player';
};

// PlayerPicker's "In Your Group" list reads fname/lname directly -- archived
// rows only have a combined `name`, so split it out here rather than
// teaching the shared picker about this leaderboard-specific data shape.
const playersAlreadyOnBoard = computed(() => processedPlayers.value.map(p => {
  if (p.fname || p.lname) return p;
  const [fname, ...rest] = (p.name || '').trim().split(' ');
  return { ...p, fname: fname || '', lname: rest.join(' ') };
}));

// --- LIFECYCLE ---
onMounted(async () => {
  if (leagueData.value) {
    try {
      await initLeaderboard(leagueData.value.yearly_games);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      toast.add("Failed to load the leaderboard -- please try reloading.", 'error');
    }
  }
});
</script>

<style scoped>
.shuffle-list-move { transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.shuffle-list-enter-active, .shuffle-list-leave-active { transition: all 0.5s ease; }
.shuffle-list-enter-from, .shuffle-list-leave-to { opacity: 0; transform: translateX(30px); }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
