<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-950 pb-32">
    
    <template v-if="round">
      
      <div class="text-center border-b border-stone-200 dark:border-stone-800 mb-1">
        <p class="text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <span class="text-stone-800 dark:text-stone-100">{{ round.type }}</span>
          <span class="text-stone-300 dark:text-stone-700">•</span>
          <span class="text-emerald-600 dark:text-emerald-500">{{ round.course }}</span>
          <span class="text-stone-300 dark:text-stone-700">•</span>
          <span class="text-stone-800 dark:text-stone-100">{{ formatDate(round.iso) }}</span>
        </p>
      </div>

      <div class="px-1 max-w-2xl mx-auto">
        
        <div v-if="round.holes === 18 || !round.holes" class="flex bg-stone-200 dark:bg-stone-800 rounded-lg p-1 mb-3 shadow-inner mx-1">
          <button @click="activeNine = 'front'" :class="activeNine === 'front' ? 'bg-white dark:bg-stone-900 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'" class="flex-1 py-1.5 text-sm font-black uppercase tracking-widest rounded-md transition-all">Front 9</button>
          <button @click="activeNine = 'back'" :class="activeNine === 'back' ? 'bg-white dark:bg-stone-900 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'" class="flex-1 py-1.5 text-sm font-black uppercase tracking-widest rounded-md transition-all">Back 9</button>
        </div>

        <div class="flex w-full px-1 mb-1 justify-between">
          <div v-for="h in displayedHoles" :key="'hdr'+h" class="flex-1 text-center">
            <span 
              class="text-sm font-black uppercase transition-colors leading-none block"
              :class="round.ddHoles?.includes(h) ? 'text-lime-500' : 'text-stone-800 dark:text-stone-100'"
            >
              #{{ h }}
            </span>
          </div>
        </div>

        <div class="space-y-1">
          <div v-for="p in round.players" :key="p.id" class="bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-900 overflow-hidden shadow-sm">
            
            <div class="bg-stone-100 dark:bg-stone-900 px-2 py-1.5 flex justify-between items-center border-b border-stone-200 dark:border-stone-800">
              <div class="flex items-center gap-2">
                <span class="font-black text-lg text-stone-900 dark:text-white uppercase italic tracking-tight leading-none">
                  {{ p.fname }} {{ p.lname }}
                </span>
                <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 shadow-sm leading-none mt-[1px]">
                  {{ isAppManaged ? 'HCP' : 'CH' }}: {{ formatPlayerHcp(p.index) }}
                </span>
              </div>

              <button
                v-if="isAdmin"
                @click="openChangeTeeModal(p)"
                class="flex items-center gap-1 text-stone-400 hover:text-emerald-500 dark:text-stone-500 dark:hover:text-emerald-400 active:scale-90 transition-colors"
              >
                <span class="text-[9px] uppercase font-bold tracking-wide">{{ p.tees }}</span>
                <Icon name="mdi:pencil-circle" class="size-4" />
              </button>
            </div>

            <div class="flex w-full px-1 py-1.5 gap-[3px] justify-between">
              <div v-for="h in displayedHoles" :key="p.id + h" class="flex-1 flex flex-col items-center">
                <div class="relative w-full aspect-square max-w-[2.75rem]">
                  
                  <div v-if="showBirds && getGameStat(p.id, h, 'birds') > 0" class="absolute -top-3 -left-1 text-emerald-600 z-20">
                    <span class="text-xs font-black leading-none">{{ Math.floor(getGameStat(p.id, h, 'birds')) > 0 ? Math.floor(getGameStat(p.id, h, 'birds')) : '' }}</span>
                    <span v-if="getGameStat(p.id, h, 'birds') % 1 !== 0" class="text-[10px] font-black leading-none ml-px">½</span>
                  </div>

                  <div v-if="showDeuces && getGameStat(p.id, h, 'deuces') > 0" class="absolute -bottom-1.5 -right-1 flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full size-3.5 border border-blue-200 dark:border-blue-800 z-20 shadow-sm">
                    <span class="text-[8px] font-black leading-none mt-px">2</span>
                  </div>
                  
                  <button 
                    @click="openKeypad(h)"
                    :class="getScoreClass(p, h)"
                    class="absolute inset-0 w-full h-full rounded font-black text-[22px] transition-all active:scale-75 flex flex-col items-center justify-center border-2 pb-[1px] z-10"
                  >
                    <span class="leading-none" v-html="round.scores[p.id][h-1] || '&nbsp;'"></span>
                    
                    <div v-if="getGameStat(p.id, h, 'pops') > 0" class="absolute bottom-[2px] w-full flex justify-center items-end gap-[2px]">
                      <div v-for="dot in Math.floor(getGameStat(p.id, h, 'pops'))" :key="p.id+h+dot" class="size-1 rounded-full bg-emerald-500"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-stone-50 dark:bg-stone-900 px-2 py-1 flex justify-between items-center border-t border-stone-100 dark:border-stone-800 text-sm font-black tracking-widest uppercase">
              <div class="text-stone-400">
                {{ activeNine === 'front' ? 'OUT' : 'IN' }}: <span class="text-stone-900 dark:text-white text-sm">{{ pStats[p.id]?.activeNineTotal || 0 }}</span>
              </div>
              <div class="flex gap-4">
                <div class="text-stone-400">
                  NET: <span :class="getNetColor(p.id)" class="text-sm italic">
                    {{ getNetDisplay(p.id) }}
                  </span>
                </div>
                <div class="text-stone-400">GROSS: <span class="text-stone-900 dark:text-white text-sm italic">{{ pStats[p.id]?.totalGross || 0 }}</span></div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 mt-5 px-1">
            <button @click="showPlayerPicker = true" class="flex-1 py-3 bg-white dark:bg-stone-900 border-2 border-dashed border-stone-200 dark:border-stone-800 text-stone-400 hover:text-emerald-600 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-sm">
              + Manage Group
            </button>
            <button v-if="!round.leagueId" @click="finishCasualRound" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              <Icon name="mdi:flag-checkered" class="size-4" /> Finish Round
            </button>
          </div>
        </div>
      </div>
      <ClientOnly>
        <LazyPlayerPicker
          v-model:isOpen="showPlayerPicker"
          :selectedPlayers="round.players || []"
          mode="setup"
          @toggle="handlePlayerToggle"
          :leagueId="round.leagueId"
          :roundTeesId="round.teesId"
        />

        <LazyScoreKeypad
          v-model:isOpen="keypad.isOpen"
          :hole="keypad.hole"
          :round="round"
          :pStats="pStats"
          @save="saveHoleScores"
        />

        <LazyCourseTeesModal
          :is-open="changeTeeModal.isOpen"
          :selected-course="round.course"
          :selected-tee="changeTeeModal.player?.tees"
          :league-tees-type="changeTeeModal.player?.tee_type || 'mens'"
          @close="changeTeeModal.isOpen = false"
          @pick="handleTeeChange"
        />

      </ClientOnly>
  
    </template>

    <div v-else class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:golf-tee" class="size-12 text-emerald-500 animate-bounce" />
      <p class="text-secondary text-[10px] uppercase font-black tracking-widest text-stone-400">Loading Round...</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, onSnapshot, updateDoc, writeBatch, collection, serverTimestamp } from "firebase/firestore";
import { calcPops, calcGames, calcCourseHandicap, getTeePar } from '~/utils/gameLogic';
// import { calcUSGACourseHandicap } from '~/utils/handicap';
import { useData, useAuthStore, useUIStore } from '#imports';

const { $db } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const dataStore = useData();
const ui = useUIStore();
const authStore = useAuthStore();

// --- STATE VARIABLES (This is what went missing!) ---
const round = ref(null);
const activeNine = ref('front');
const keypad = ref({ isOpen: false, hole: 1 });
const showPlayerPicker = ref(false);
const changeTeeModal = ref({ isOpen: false, player: null });

// --- LEAGUE & DATA LOOKUPS ---
const currentLeague = computed(() => {
  if (!round.value?.leagueId) return null;
  return dataStore.leagues?.find(l => l.id === round.value.leagueId) || null;
});

const isAppManaged = computed(() => {
  return currentLeague.value?.appHandicap === true;
});

const isAdmin = computed(() => {
  return currentLeague.value ? authStore.isAdminForLeague(currentLeague.value) : authStore.isSuperAdmin;
});

const showBirds = computed(() => {
  const yearlyGames = currentLeague.value?.yearly_games || [];
  const hasYearlyBirds = yearlyGames.includes('birds') || yearlyGames.includes('Birds');
  return hasYearlyBirds || ['vegas', 'mbWed'].includes(round.value?.type);
});

const showDeuces = computed(() => {
  const yearlyGames = currentLeague.value?.yearly_games || [];
  const hasYearlyDeuces = yearlyGames.includes('deuces') || yearlyGames.includes('Deuces');
  return hasYearlyDeuces || ['vegas'].includes(round.value?.type);
});

const displayedHoles = computed(() => {
  if (!round.value) return [];
  if (round.value.holes === 9) return [1,2,3,4,5,6,7,8,9];
  return activeNine.value === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];
});

const pStats = computed(() => {
  if (!round.value || !round.value?.courseSnapshot || !round.value?.scores) return {};
  const stats = {};
  
  round.value.players.forEach(p => {
    const playerTeeData = round.value.courseSnapshot.tees?.[p.teesId] || round.value.courseSnapshot.tees?.[p.tees];
    const scores = round.value.scores[p.id];

    if (!playerTeeData || !scores) return;

    const pops = calcPops({ index: p.index }, playerTeeData);

    const games = calcGames(
      { scores, index: p.index }, 
      { type: round.value.type, leagueId: round.value.leagueId, appHandicap: round.value.appHandicap }, 
      playerTeeData, 
      pops
    );
    
    const totalGross = scores.reduce((a, b) => a + (parseInt(b) || 0), 0);
    const range = activeNine.value === 'front' ? [0, 9] : [9, 18];
    const activeNineTotal = scores.slice(range[0], range[1]).reduce((a, b) => a + (parseInt(b) || 0), 0);
    
    stats[p.id] = { ...games, pops, activeNineTotal, totalGross };
  });
  return stats;
});

// --- HELPERS ---
const formatPlayerHcp = (index) => {
  if (index === undefined || index === null || isNaN(index)) return '0';
  return isAppManaged.value ? Number(index).toFixed(3) : Math.round(index).toString();
};

const getGameStat = (pid, hole, key) => pStats.value[pid]?.[key]?.[hole - 1] || 0;

const getNetDisplay = (pid) => {
  const score = pStats.value[pid]?.totalNet || 0;
  if (score === 0 || isNaN(score)) return 'E';

  const formatted = isAppManaged.value 
    ? Math.abs(score).toFixed(3) 
    : Math.round(Math.abs(score));

  return score > 0 ? `+${formatted}` : `-${formatted}`;
};

const getNetColor = (pid) => {
  const score = pStats.value[pid]?.totalNet || 0;
  if (score < 0) return 'text-emerald-600 dark:text-emerald-500 font-black';
  if (score > 0) return 'text-stone-900 dark:text-white';
  return 'text-stone-400';
};

const getScoreClass = (player, hole) => {
  const val = round.value.scores[player.id][hole - 1];
  if (!val || val === 0) return 'bg-transparent border-stone-400 dark:border-stone-600 text-transparent'; 
  
  let par = 4;
  const tees = round.value.courseSnapshot?.tees;
  const targetTeeId = player.teesId || player.tees;
  
  if (tees && tees[targetTeeId]) {
    par = Number(tees[targetTeeId].pars[hole - 1]) || 4;
  }

  if (val < par) return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/50 shadow-sm';
  if (val === par) return 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white border-stone-300 dark:border-stone-700 shadow-sm';
  return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/50 shadow-sm';
};

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- CRUD ACTIONS ---
const addPlayerToRound = async (p, teeId) => {
  ui.setLoading(true, "Adding Player...");
  try {
    let updatedPlayers = [...round.value.players];
    let updatedScores = { ...round.value.scores };

    const tees = round.value.courseSnapshot.tees;
    const teeData = Array.isArray(tees) ? tees.find(t => t.id === teeId) : tees[teeId];

    let playingHcp = 0;
    let finalIndex = p.ghin !== undefined ? p.ghin : 0; 

    if (isAppManaged.value && p.leagueHandicaps && p.leagueHandicaps[round.value.leagueId] !== undefined) {
      playingHcp = Number(p.leagueHandicaps[round.value.leagueId]);
    } else if (teeData && p.ghin !== undefined && p.ghin !== null) {
      const ghinNum = Number(p.ghin);
      if (!isNaN(ghinNum)) {
        const teePar = teeData.pars?.reduce((sum, val) => sum + Number(val), 0) || teeData.par || 72;
        // playingHcp = calcUSGACourseHandicap(ghinNum, Number(teeData.slope), Number(teeData.rating), Number(teePar));
      }
    } else {
      playingHcp = Number(p.index) || 0;
    }

    if (isNaN(playingHcp)) playingHcp = 0;

    updatedPlayers.push({
      id: p.id,
      fname: p.fname,
      lname: p.lname,
      ghin: finalIndex,
      index: playingHcp,
      teesId: teeId,
      tees: teeData?.name || teeId,
      tee_type: p.tee_type || 'mens'
    });
    
    updatedScores[p.id] = new Array(round.value.holes || 18).fill(0);
    
    // NEW: Sync the optimized array
    const flatPlayerIds = updatedPlayers.map(player => player.id);

    await updateDoc(doc($db, "live_rounds", route.params.id), { 
      players: updatedPlayers, 
      playerIds: flatPlayerIds,
      scores: updatedScores 
    });
  } finally {
    ui.setLoading(false);
  }
};

const handlePlayerToggle = async (p) => {
  const isRemoving = round.value.players.some(x => x.id === p.id);
  
  if (isRemoving) {
    if (round.value.players.length === 1) return;
    ui.setLoading(true, "Removing Player...");
    try {
      const updatedPlayers = round.value.players.filter(x => x.id !== p.id);
      const updatedScores = { ...round.value.scores };
      delete updatedScores[p.id];
      
      // NEW: Sync the optimized array when someone leaves
      const flatPlayerIds = updatedPlayers.map(player => player.id);

      await updateDoc(doc($db, "live_rounds", route.params.id), { 
        players: updatedPlayers, 
        playerIds: flatPlayerIds,
        scores: updatedScores 
      });
    } finally {
      ui.setLoading(false);
    }
  } else {
    if (round.value.leagueId && round.value.teesId && round.value.tees !== 'Mixed') {
      await addPlayerToRound(p, round.value.teesId);
    } else {
      await addPlayerToRound(p, round.value.teesId || Object.keys(round.value.courseSnapshot.tees)[0]);
    }
  }
};

const openChangeTeeModal = (player) => {
  changeTeeModal.value = { isOpen: true, player };
};

const handleTeeChange = async (picked) => {
  const player = changeTeeModal.value.player;
  changeTeeModal.value.isOpen = false;
  if (!player || !picked?.teesId) return;

  ui.setLoading(true, "Updating Tee...");
  try {
    const tees = round.value.courseSnapshot?.tees || {};
    const teeData = Array.isArray(tees) ? tees.find(t => t.id === picked.teesId) : tees[picked.teesId];

    // App-managed leagues use a fixed league handicap regardless of tee;
    // only a raw GHIN-based course handicap actually depends on the tee played.
    let newIndex = player.index;
    if (!isAppManaged.value && teeData) {
      newIndex = calcCourseHandicap(player.ghin ?? 0, Number(teeData.slope) || 113, Number(teeData.rating) || 72, getTeePar(teeData));
    }

    const updatedPlayers = round.value.players.map(p =>
      p.id === player.id ? { ...p, teesId: picked.teesId, tees: teeData?.name || picked.tees, index: newIndex } : p
    );

    await updateDoc(doc($db, "live_rounds", route.params.id), { players: updatedPlayers });
  } finally {
    ui.setLoading(false);
  }
};

const openKeypad = (hole) => {
  keypad.value.hole = hole;
  keypad.value.isOpen = true;
};

const saveHoleScores = async (newScores) => {
  ui.setLoading(true, "Saving Score...");
  try {
    const updatedScores = { ...round.value.scores };
    round.value.players.forEach(p => {
      updatedScores[p.id][keypad.value.hole - 1] = parseInt(newScores[p.id]) || 0;
    });
    await updateDoc(doc($db, "live_rounds", route.params.id), { scores: updatedScores, lastUpdated: serverTimestamp() });
    keypad.value.isOpen = false;
  } finally {
    ui.setLoading(false);
  }
};

const finishCasualRound = async () => {
  if (!confirm("Finish and archive round?")) return;
  
  ui.setLoading(true, "Archiving Round...");
  try {
    const batch = writeBatch($db);
    round.value.players.forEach(p => {
      const historyRef = doc(collection($db, "players", p.id, "rounds"));
      batch.set(historyRef, {
        course: round.value.course,
        date: round.value.iso || new Date().toISOString().split('T')[0],
        tees: p.tees,
        scores: round.value.scores[p.id],
        index: p.index,
        type: 'casual',
        courseSnapshot: round.value.courseSnapshot,
        createdAt: serverTimestamp()
      });
    });
    batch.delete(doc($db, "live_rounds", route.params.id));
    await batch.commit();
    router.push('/');
  } finally {
    ui.setLoading(false);
  }
};

// --- LIFECYCLE ---
onMounted(() => {
  ui.setLoading(true, 'Syncing Scorecard...');
  
  const unsub = onSnapshot(doc($db, "live_rounds", route.params.id), (snap) => {
    if (snap.exists()) {
      round.value = { id: snap.id, ...snap.data() };
    } else {
      router.push('/');
    }
    ui.setLoading(false);
  }, (error) => {
    console.error("Error syncing scorecard:", error);
    ui.setLoading(false);
  });
  
  onUnmounted(() => unsub());
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>