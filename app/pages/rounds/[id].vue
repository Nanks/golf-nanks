<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 pt-20">
    
    <div class="px-2 mb-2 text-center flex justify-center items-center">
      <p class="text-lg font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
        <Icon v-if="round.leagueId" name="mdi:lock" class="size-3 text-slate-400" />
        <span class="text-slate-800 dark:text-white italic">{{ round.type }}</span>
        <span class="text-slate-300 dark:text-slate-700">•</span>
        <span class="text-emerald-600 dark:text-emerald-500">{{ round.course }}</span>
        <span class="text-slate-300 dark:text-slate-700">•</span>
        <span class="text-slate-500">{{ formatDate(round.iso) }}</span>
      </p>
    </div>

    <div v-if="round" class="px-2 mt-2 max-w-2xl mx-auto">
      
      <div v-if="round.holes === 18 || !round.holes" class="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1 mb-2 shadow-inner mx-1">
        <button @click="activeNine = 'front'" :class="activeNine === 'front' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500'" class="flex-1 py-1 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Front 9</button>
        <button @click="activeNine = 'back'" :class="activeNine === 'back' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500'" class="flex-1 py-1 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Back 9</button>
      </div>

      <div class="flex w-full px-2 justify-between">
        <div v-for="h in displayedHoles" :key="'hdr'+h" class="flex-1 text-center text-[10px] font-black text-slate-400 uppercase">#{{ h }}</div>
      </div>

      <!-- Player card -->
      <div class="space-y-2">
        <div v-for="p in round.players" :key="p.id" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          
          <!-- Name and handicap containter -->
          <div class="bg-slate-100 dark:bg-slate-800/80 px-4 py-1 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-tight">
                {{ p.fname }} {{ p.lname }}</span>
              <span class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">
                CH: {{ showFractionalHandicap ? Number(p.index).toFixed(3) : Math.round(p.index) }}
              </span>
            </div>
          </div>

          <!-- Hole container -->
          <div class="flex w-full px-1.5 py-1.5 gap-1 justify-between">
            <div v-for="h in displayedHoles" :key="p.id + h" class="flex-1 flex justify-center max-w-12">
              <div class="relative w-full h-9 sm:h-10 flex items-center justify-center">
                <!-- Birds badge -->
                <div v-if="showBirds && getGameStat(p.id, h, 'birds') > 0" class="absolute -top-1.5 -left-1 text-emerald-500 flex items-start z-20 pointer-events-none bg-white/80 dark:bg-slate-900/80 rounded-full px-0.5 shadow-sm">
                  <span class="text-[10px] font-black leading-none">
                    {{ Math.floor(getGameStat(p.id, h, 'birds')) || '' }}</span>
                  <span v-if="getGameStat(p.id, h, 'birds') % 1 !== 0" class="text-[7px] font-black leading-none mt-[1px] ml-[0.5px]">
                    ½</span>
                </div>
                <!-- Deuce badge -->
                <div v-if="showDeuces && getGameStat(p.id, h, 'deuces') > 0" class="absolute -top-1.5 -right-1 flex items-center justify-center bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-300 rounded-full size-3.5 border border-blue-200 dark:border-blue-700 z-20 pointer-events-none shadow-sm">
                  <span class="text-[8px] font-black leading-none mt-[1px]">
                    2</span>
                </div>
                
                <!-- Score container -->
                <button 
                  @click="openKeypad(h, p.id)"
                  :class="getScoreClass(round.scores[p.id][h-1], h)"
                  class="w-full h-full rounded-xl font-black text-lg sm:text-xl transition-all active:scale-75 flex flex-col items-center justify-center border-2 z-10 relative pb-1"
                >
                  <span class="mt-1">{{ round.scores[p.id][h-1] === 0 ? '' : round.scores[p.id][h-1] }}</span>
                  
                  <!-- Pops badge -->
                  <div v-if="getGameStat(p.id, h, 'pops') > 0" class="absolute bottom-1 w-full flex justify-center items-end gap-[1.5px] pointer-events-none">
                    <div v-for="dot in Math.floor(getGameStat(p.id, h, 'pops'))" :key="p.id+h+'dot'+dot" class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_2px_rgba(16,185,129,0.5)]"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-900/50 px-4 py-1 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 text-[10px] font-black tracking-widest uppercase">
            <div class="text-slate-500">
              {{ activeNine === 'front' ? 'OUT' : 'IN' }}: <span class="text-slate-800 dark:text-white text-xs">{{ pStats[p.id]?.activeNineTotal || 0 }}</span>
            </div>
            <div class="flex gap-4">
              <div class="text-slate-500">NET: <span :class="getNetColor(p.id)" class="text-xs">{{ getNetDisplay(p.id) }}</span></div>
              <div class="text-slate-500">TOTAL: <span class="text-slate-800 dark:text-white text-xs">{{ pStats[p.id]?.totalGross || 0 }}</span></div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="showPlayerPicker = true" class="flex-1 py-3 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-sm">+ Manage Group</button>
          <button v-if="!round.leagueId" @click="finishCasualRound" class="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            <Icon name="mdi:flag-checkered" class="size-4" /> Finish Round
          </button>
        </div>
      </div>
    </div>

    <PlayerPicker v-model:isOpen="showPlayerPicker" :selectedPlayers="round?.players || []" mode="setup" @toggle="handlePlayerToggle" />

    <ClientOnly>
      <Teleport to="body">
        <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-full" enter-to-class="translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0" leave-to-class="translate-y-full">
          <div v-if="keypad.isOpen" class="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
            <div @click="keypad.isOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
            <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
              <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">Hole {{ keypad.hole }} <span class="text-emerald-500">• Par {{ courseTeeData?.pars[keypad.hole - 1] }}</span></p>
                  <h4 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic leading-none">Score Entry</h4>
                </div>
                <button @click="keypad.isOpen = false" class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm"><Icon name="mdi:close" class="size-5" /></button>
              </div>

              <div class="p-4 overflow-y-auto space-y-2 no-scrollbar">
                <div v-for="p in round.players" :key="'key'+p.id" @click="keypad.activePlayerId = p.id" :class="[ 'p-4 rounded-2xl border-2 flex justify-between items-center transition-all', keypad.activePlayerId === p.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-inner' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50' ]">
                  <div class="flex flex-col">
                    <div class="font-black text-xs uppercase tracking-tight" :class="keypad.activePlayerId === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'">
                      {{ p.fname }} {{ p.lname }}
                    </div>
                    <div class="flex gap-1 mt-1.5">
                      <div v-for="dot in Math.floor(getGameStat(p.id, keypad.hole, 'pops'))" :key="p.id+'k'+dot" class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_2px_rgba(16,185,129,0.5)]"></div>
                    </div>
                  </div>
                  <div class="text-3xl font-black w-14 text-center rounded-xl py-1" :class="keypad.activePlayerId === p.id ? 'bg-white dark:bg-slate-950 text-emerald-600 shadow-sm' : 'text-slate-400'">{{ keypad.tempScores[p.id] || '-' }}</div>
                </div>
              </div>

              <div class="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                <div class="flex gap-2 mb-4">
                  <button v-for="n in [3, 4, 5]" :key="n" @click="setScore(n)" class="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-600 dark:text-white active:scale-95 transition-all shadow-sm">{{ n }}</button>
                </div>
                <div class="flex items-center gap-4 mb-6">
                  <button @click="adjustScore(-1)" class="flex-1 py-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center active:bg-red-500 active:text-white transition-all shadow-sm"><Icon name="mdi:minus" class="size-8" /></button>
                  <button @click="adjustScore(1)" class="flex-1 py-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center active:bg-emerald-500 active:text-white transition-all shadow-sm"><Icon name="mdi:plus" class="size-8" /></button>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <button @click="nextPlayer" class="py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Next Player ⬇</button>
                  <button @click="saveHoleScores" class="py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Hole {{ keypad.hole }}</button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
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

const { $db } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const round = ref(null);
const activeNine = ref('front');
const keypad = ref({ isOpen: false, hole: 1, activePlayerId: null, tempScores: {} });
const showPlayerPicker = ref(false);

// --- TYPE-BASED UI LOGIC ---
const showBirds = computed(() => ['vegas', 'mbWed'].includes(round.value?.type));
const showDeuces = computed(() => ['vegas'].includes(round.value?.type));
const showFractionalHandicap = computed(() => ['vegas', 'mbWed'].includes(round.value?.type));

const displayedHoles = computed(() => {
  if (!round.value) return [];
  if (round.value.holes === 9) return [1,2,3,4,5,6,7,8,9];
  return activeNine.value === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];
});

const courseTeeData = computed(() => {
  if (!round.value?.courseSnapshot) return null;
  return round.value.courseSnapshot.tees?.[round.value.tees] || null;
});

const pStats = computed(() => {
  if (!round.value?.courseSnapshot) return {};
  const stats = {};
  round.value.players.forEach(p => {
    const playerTeeData = round.value.courseSnapshot.tees?.[p.tees];
    if (!playerTeeData) {
      console.warn(`No tee data found for player ${p.fname} using tee: ${p.teeName}`);
      return;
    }
    const scores = round.value.scores[p.id];
    const pops = calcPops({ index: p.index }, playerTeeData);
    const games = calcGames({ scores, index: p.index, type: round.value.type }, {}, playerTeeData, pops);
    const totalGross = scores.reduce((a, b) => a + (parseInt(b) || 0), 0);
    const range = activeNine.value === 'front' ? [0, 9] : [9, 18];
    const activeNineTotal = scores.slice(range[0], range[1]).reduce((a, b) => a + b, 0);
    stats[p.id] = { ...games, pops, activeNineTotal, totalGross };
  });
  return stats;
});

const getGameStat = (pid, hole, key) => pStats.value[pid]?.[key]?.[hole - 1] || 0;

const getNetDisplay = (pid) => {
  const score = pStats.value[pid]?.totalNet || 0;
  
  // Check if we should show 3 decimals
  const precision = showFractionalHandicap.value ? 3 : 0;
  
  if (score === 0) return 'E';
  
  const formattedScore = Math.abs(score).toFixed(precision);
  return score > 0 ? `+${formattedScore}` : `-${formattedScore}`;
};

const getNetColor = (pid) => {
  const score = pStats.value[pid]?.totalNet || 0;
  if (score < 0) return 'text-red-500';
  if (score > 0) return 'text-blue-500';
  return 'text-slate-800 dark:text-white';
};

const getScoreClass = (val, hole) => {
  if (!val || val === 0) return 'bg-transparent border-slate-200 dark:border-slate-700 text-transparent'; 
  const par = courseTeeData.value?.pars?.[hole - 1] || 4;
  if (val < par) return 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-500';
  if (val === par) return 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm';
  return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-500';
};

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const handlePlayerToggle = async (p) => {
  const isRemoving = round.value.players.some(x => x.id === p.id);
  let updatedPlayers = [...round.value.players];
  let updatedScores = { ...round.value.scores };
  if (isRemoving) {
    if (updatedPlayers.length === 1) return;
    updatedPlayers = updatedPlayers.filter(x => x.id !== p.id);
    delete updatedScores[p.id];
  } else {
    const teeData = courseTeeData.value;
    const playingHcp = teeData ? calcUSGACourseHandicap(p.ghin, teeData.slope, teeData.rating, teeData.par) : Math.round(p.ghin);
    updatedPlayers.push({ ...p, index: playingHcp });
    updatedScores[p.id] = new Array(round.value.holes).fill(0);
  }
  await updateDoc(doc($db, "live_rounds", route.params.id), { players: updatedPlayers, scores: updatedScores });
};

const finishCasualRound = async () => {
  if (!confirm("Finish and archive round?")) return;
  const batch = writeBatch($db);
  round.value.players.forEach(p => {
    const historyRef = doc(collection($db, "players", p.id, "rounds"));
    batch.set(historyRef, {
      course: round.value.course,
      date: round.value.iso || new Date().toISOString().split('T')[0],
      tees: round.value.tees,
      scores: round.value.scores[p.id],
      index: p.index,
      type: 'casual',
      createdAt: serverTimestamp()
    });
  });
  batch.delete(doc($db, "live_rounds", route.params.id));
  await batch.commit();
  router.push('/');
};

const openKeypad = (hole, pid) => {
  const current = {};
  round.value.players.forEach(p => {
    const score = round.value.scores[p.id][hole - 1];
    current[p.id] = (score || courseTeeData.value?.pars[hole - 1] || 4).toString();
  });
  keypad.value = { isOpen: true, hole, activePlayerId: pid, tempScores: current };
};

const setScore = (val) => {
  if (keypad.value.activePlayerId) keypad.value.tempScores[keypad.value.activePlayerId] = val.toString();
};

const adjustScore = (mod) => {
  const pid = keypad.value.activePlayerId;
  const current = parseInt(keypad.value.tempScores[pid]) || 4;
  keypad.value.tempScores[pid] = Math.min(Math.max(current + mod, 1), 15).toString();
};

const nextPlayer = () => {
  const players = round.value.players;
  const idx = players.findIndex(p => p.id === keypad.value.activePlayerId);
  keypad.value.activePlayerId = players[(idx + 1) % players.length].id;
};

const saveHoleScores = async () => {
  const updatedScores = { ...round.value.scores };
  round.value.players.forEach(p => updatedScores[p.id][keypad.value.hole - 1] = parseInt(keypad.value.tempScores[p.id]) || 0);
  await updateDoc(doc($db, "live_rounds", route.params.id), { scores: updatedScores, lastUpdated: serverTimestamp() });
  keypad.value.isOpen = false;
};

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
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>