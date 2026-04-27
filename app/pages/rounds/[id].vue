<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
    
    <div v-if="round" class="px-2 py-3 text-center">
      <p class="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
        <Icon v-if="round.leagueId" name="mdi:lock" class="size-3 text-slate-400" />
        <span class="text-slate-800 dark:text-white italic">{{ round.type }}</span>
        <span class="text-slate-300 dark:text-slate-700">•</span>
        <span class="text-emerald-600 dark:text-emerald-500">{{ round.course }}</span>
        <span class="text-slate-300 dark:text-slate-700">•</span>
        <span class="text-slate-500">{{ formatDate(round.iso) }}</span>
      </p>
    </div>

    <div v-if="round" class="px-2 max-w-2xl mx-auto">
      
      <div v-if="round.holes === 18 || !round.holes" class="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1 mb-3 shadow-inner mx-1">
        <button @click="activeNine = 'front'" :class="activeNine === 'front' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500'" class="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">Front 9</button>
        <button @click="activeNine = 'back'" :class="activeNine === 'back' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500'" class="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">Back 9</button>
      </div>

      <div class="flex w-full px-2 mb-1 justify-between">
        <div v-for="h in displayedHoles" :key="'hdr'+h" class="flex-1 text-center">
          <span 
            class="text-[9px] font-black uppercase transition-colors leading-none block"
            :class="round.ddHoles?.includes(h) ? 'text-lime-500' : 'text-slate-400'"
          >
            #{{ h }}
          </span>
        </div>
      </div>

      <div class="space-y-2.5">
        <div v-for="p in round.players" :key="p.id" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          
          <div class="bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <span class="font-black text-sm text-slate-800 dark:text-white uppercase italic tracking-tight leading-none">
                {{ p.fname }} {{ p.lname }}
              </span>
              <span class="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 shadow-sm leading-none mt-[1px]">
                CH: {{ formatPlayerHcp(p.index) }}
              </span>
            </div>
          </div>

          <div class="flex w-full px-2 py-2 gap-1 justify-between">
            <div v-for="h in displayedHoles" :key="p.id + h" class="flex-1 flex flex-col items-center">
              <div class="relative w-full aspect-square max-w-[2.5rem]">
                
                <div v-if="showBirds && getGameStat(p.id, h, 'birds') > 0" class="absolute -top-1.5 -left-1 text-emerald-600 bg-white dark:bg-slate-900 rounded-full px-0.5 z-20 shadow-sm border border-slate-100 dark:border-slate-800">
                  <span class="text-[10px] font-black leading-none">{{ Math.floor(getGameStat(p.id, h, 'birds')) }}</span>
                  <span v-if="getGameStat(p.id, h, 'birds') % 1 !== 0" class="text-[7px] font-black leading-none ml-[1px]">½</span>
                </div>

                <div v-if="showDeuces && getGameStat(p.id, h, 'deuces') > 0" class="absolute -bottom-1.5 -right-1 flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full size-3.5 border border-blue-200 dark:border-blue-800 z-20 shadow-sm">
                  <span class="text-[8px] font-black leading-none mt-[1px]">2</span>
                </div>
                
                <button 
                  @click="openKeypad(h, p.id)"
                  :class="getScoreClass(p, h)"
                  class="absolute inset-0 w-full h-full rounded-[0.4rem] font-black text-lg transition-all active:scale-75 flex flex-col items-center justify-center border-2 pb-[2px] z-10"
                >
                  <span class="mt-0.5 leading-none" v-html="round.scores[p.id][h-1] || '&nbsp;'"></span>
                  
                  <div v-if="getGameStat(p.id, h, 'pops') > 0" class="absolute bottom-1 w-full flex justify-center items-end gap-[1px]">
                    <div v-for="dot in Math.floor(getGameStat(p.id, h, 'pops'))" :key="p.id+h+dot" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="bg-slate-50/50 dark:bg-slate-800/30 px-3 py-1.5 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 text-[10px] font-black tracking-widest uppercase">
            <div class="text-slate-400">
              {{ activeNine === 'front' ? 'OUT' : 'IN' }}: <span class="text-slate-800 dark:text-white text-xs">{{ pStats[p.id]?.activeNineTotal || 0 }}</span>
            </div>
            <div class="flex gap-4">
              <div class="text-slate-400">NET: <span :class="getNetColor(p.id)" class="text-xs italic">{{ getNetDisplay(p.id) }}</span></div>
              <div class="text-slate-400">GROSS: <span class="text-slate-800 dark:text-white text-xs italic">{{ pStats[p.id]?.totalGross || 0 }}</span></div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="showPlayerPicker = true" class="flex-1 py-3 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-sm">
            + Manage Group
          </button>
          <button v-if="!round.leagueId" @click="finishCasualRound" class="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            <Icon name="mdi:flag-checkered" class="size-4" /> Finish Round
          </button>
        </div>
      </div>
    </div>

    <PlayerPicker v-model:isOpen="showPlayerPicker" :selectedPlayers="round?.players || []" mode="setup" @toggle="handlePlayerToggle" />

    <ClientOnly>
      <ScoreKeypad 
        v-model:isOpen="keypad.isOpen" 
        :hole="keypad.hole" 
        :initialPlayerId="keypad.activePlayerId"
        :round="round" 
        :pStats="pStats" 
        @save="saveHoleScores" 
      />
      
      <LiveRoundFooter 
        v-if="round"
        activeTab="scorecard"
        :roundId="round.id"
        :leagueType="round.type"
        :iso="round.iso"
      />
    </ClientOnly>
    
  </div>
</template>

<script setup>
import { doc, onSnapshot, updateDoc, writeBatch, collection, serverTimestamp } from "firebase/firestore";
import { calcPops, calcGames } from '~/utils/gameLogic';
import { calcUSGACourseHandicap } from '~/utils/handicap';
import { useData } from '~/stores/data';

const { $db } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const dataStore = useData();

const round = ref(null);
const activeNine = ref('front');
const keypad = ref({ isOpen: false, hole: 1, activePlayerId: null });
const showPlayerPicker = ref(false);

// --- LEAGUE & DATA LOOKUPS ---
const currentLeague = computed(() => {
  if (!round.value?.leagueId) return null;
  return dataStore.leagues?.find(l => l.id === round.value.leagueId) || null;
});

// --- TYPE-BASED UI LOGIC ---
const isYearlyLeague = computed(() => {
  return currentLeague.value?.cadence === 'yearly';
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
  if (!round.value?.courseSnapshot) return {};
  const stats = {};
  round.value.players.forEach(p => {
    const playerTeeData = round.value.courseSnapshot.tees?.[p.teesId] || round.value.courseSnapshot.tees?.[p.tees];
    if (!playerTeeData) return;

    const scores = round.value.scores[p.id];
    const pops = calcPops({ index: p.index }, playerTeeData);
    const games = calcGames({ scores, index: p.index, type: round.value.type }, {}, playerTeeData, pops);
    
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
  return isYearlyLeague.value ? Number(index).toFixed(3) : Math.round(index).toString();
};

const getGameStat = (pid, hole, key) => pStats.value[pid]?.[key]?.[hole - 1] || 0;

const getNetDisplay = (pid) => {
  const score = pStats.value[pid]?.totalNet || 0;
  if (score === 0 || isNaN(score)) return 'E';
  
  const formatted = isYearlyLeague.value ? Math.abs(score).toFixed(3) : Math.round(Math.abs(score));
  return score > 0 ? `+${formatted}` : `-${formatted}`;
};

const getNetColor = (pid) => {
  const score = pStats.value[pid]?.totalNet || 0;
  if (score < 0) return 'text-red-500';
  if (score > 0) return 'text-blue-500';
  return 'text-slate-800 dark:text-white';
};

const getScoreClass = (player, hole) => {
  const val = round.value.scores[player.id][hole - 1];
  if (!val || val === 0) return 'bg-transparent border-slate-100 dark:border-slate-800 text-transparent'; 
  
  let par = 4;
  const tees = round.value.courseSnapshot?.tees;
  const targetTeeId = player.teesId || player.tees;
  
  if (tees && tees[targetTeeId]) {
    par = Number(tees[targetTeeId].pars[hole - 1]) || 4;
  }

  if (val < par) return 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-500 shadow-sm';
  if (val === par) return 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700 shadow-sm';
  return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-500 shadow-sm';
};

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- CRUD ACTIONS ---
const addPlayerToRound = async (p, teeId) => {
  let updatedPlayers = [...round.value.players];
  let updatedScores = { ...round.value.scores };

  const tees = round.value.courseSnapshot.tees;
  const teeData = Array.isArray(tees) ? tees.find(t => t.id === teeId) : tees[teeId];

  let playingHcp = 0;
  
  // Capture original GHIN to save directly to the snapshot
  let finalIndex = p.ghin !== undefined ? p.ghin : 0; 

  // 1. Check for Yearly League exact decimal FIRST
  if (isYearlyLeague.value && p.leagueHandicaps && p.leagueHandicaps[round.value.leagueId] !== undefined) {
    playingHcp = Number(p.leagueHandicaps[round.value.leagueId]);
  } 
  // 2. Fall back to GHIN calculation if missing league data or casual round
  else if (teeData && p.ghin !== undefined && p.ghin !== null) {
    const ghinNum = Number(p.ghin);
    if (!isNaN(ghinNum)) {
      const teePar = teeData.pars?.reduce((sum, val) => sum + Number(val), 0) || teeData.par || 72;
      playingHcp = calcUSGACourseHandicap(ghinNum, Number(teeData.slope), Number(teeData.rating), Number(teePar));
    }
  } 
  // 3. Ultimate failsafe
  else {
    playingHcp = Number(p.index) || 0;
  }

  if (isNaN(playingHcp)) playingHcp = 0;

  // Push ONLY the necessary fields, exactly matching setup.vue
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

  await updateDoc(doc($db, "live_rounds", route.params.id), { players: updatedPlayers, scores: updatedScores });
};

const handlePlayerToggle = async (p) => {
  const isRemoving = round.value.players.some(x => x.id === p.id);
  
  if (isRemoving) {
    if (round.value.players.length === 1) return;
    const updatedPlayers = round.value.players.filter(x => x.id !== p.id);
    const updatedScores = { ...round.value.scores };
    delete updatedScores[p.id];
    await updateDoc(doc($db, "live_rounds", route.params.id), { players: updatedPlayers, scores: updatedScores });
  } else {
    // Rely on document root for official tees
    if (round.value.leagueId && round.value.teesId && round.value.tees !== 'Mixed') {
      await addPlayerToRound(p, round.value.teesId);
    } else {
      // Logic for opening Tee Selection Modal goes here if needed later
      await addPlayerToRound(p, round.value.teesId || Object.keys(round.value.courseSnapshot.tees)[0]);
    }
  }
};

// Keypad Actions
const openKeypad = (hole, pid) => {
  keypad.value.hole = hole;
  keypad.value.activePlayerId = pid;
  keypad.value.isOpen = true;
};

const saveHoleScores = async (newScores) => {
  const updatedScores = { ...round.value.scores };
  round.value.players.forEach(p => {
    updatedScores[p.id][keypad.value.hole - 1] = parseInt(newScores[p.id]) || 0;
  });
  await updateDoc(doc($db, "live_rounds", route.params.id), { scores: updatedScores, lastUpdated: serverTimestamp() });
  keypad.value.isOpen = false;
};

const finishCasualRound = async () => {
  if (!confirm("Finish and archive round?")) return;
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
};

// --- LIFECYCLE ---
onMounted(() => {
  const unsub = onSnapshot(doc($db, "live_rounds", route.params.id), (snap) => {
    if (snap.exists()) round.value = { id: snap.id, ...snap.data() };
    else router.push('/');
  });
  onUnmounted(() => unsub());
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>