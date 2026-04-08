<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
    
    <header v-if="round" class="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
          {{ round.course }}
        </h1>
        <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
          {{ round.tees }} • {{ round.holes }} Holes • {{ getShortDate(round.date) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="round.eventId" @click="router.push(`/leaderboard/${round.eventId}`)" class="p-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all flex items-center gap-1">
          <Icon name="mdi:format-list-numbered" class="size-5" />
        </button>
        <button @click="router.push('/')" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 active:scale-95 transition-all">
          <Icon name="mdi:close" class="size-5" />
        </button>
      </div>
    </header>

    <div v-if="round" class="px-1 sm:px-2 mt-6 max-w-2xl mx-auto">
      
      <div v-if="round.holes === 18" class="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1 mb-6 shadow-inner mx-2">
        <button @click="activeNine = 'front'" :class="activeNine === 'front' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'" class="flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Front 9</button>
        <button @click="activeNine = 'back'" :class="activeNine === 'back' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'" class="flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Back 9</button>
      </div>

      <div class="flex w-full px-2 mb-2">
        <div v-for="h in displayedHoles" :key="'hdr'+h" class="flex-1 text-center text-[10px] font-black text-slate-400 uppercase">#{{ h }}</div>
        <div class="flex-1 text-center text-[10px] font-black text-emerald-600 uppercase">{{ activeNine === 'front' ? 'OUT' : 'IN' }}</div>
      </div>

      <div class="space-y-4">
        <div v-for="p in round.players" :key="p.id" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          
          <div class="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-tight">{{ p.fname }} {{ p.lname }}</span>
              <span class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                CH: {{ isYearlyLeague ? Number(p.index).toFixed(3) : Math.round(p.index) }}
              </span>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="flex flex-col items-end">
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Net</span>
                <span :class="getNetRelativeColor(p.id)" class="font-black text-sm leading-none">{{ getNetRelativeStr(p.id) }}</span>
              </div>
              <div class="flex flex-col items-end border-l border-slate-200 dark:border-slate-700 pl-4">
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Gross</span>
                <span class="font-black text-base text-slate-800 dark:text-white leading-none">{{ calculateTotal(p.id) }}</span>
              </div>
            </div>
          </div>

          <div class="flex w-full p-2 gap-1.5 sm:gap-2">
            <div v-for="h in displayedHoles" :key="p.id + h" class="flex-1 flex justify-center">
              <div class="relative w-full aspect-square max-w-[50px] flex items-center justify-center">
                
                <div v-if="isYearlyLeague && getGameStat(p.id, h, 'birds') > 0" class="absolute -top-1.5 -left-1 text-emerald-500 flex items-start z-20 pointer-events-none drop-shadow-sm bg-white/50 dark:bg-slate-900/50 rounded-full px-0.5">
                  <span class="text-[10px] font-black leading-none">{{ Math.floor(getGameStat(p.id, h, 'birds')) || '' }}</span>
                  <span v-if="getGameStat(p.id, h, 'birds') % 1 !== 0" class="text-[7px] font-black leading-none mt-[1px] ml-[0.5px]">1/2</span>
                </div>
                
                <div v-if="isYearlyLeague && (getGameStat(p.id, h, 'deuces') || round.scores[p.id][h-1] === 2)" class="absolute -top-1.5 -right-1 flex items-center justify-center bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-300 rounded-full size-3.5 border border-blue-200 dark:border-blue-700 z-20 pointer-events-none drop-shadow-sm">
                  <span class="text-[8px] font-black leading-none mt-[1px]">2</span>
                </div>
                
                <div v-if="getGameStat(p.id, h, 'chicago') !== 0" class="absolute -bottom-1 -right-1.5 bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 px-1 rounded-sm border border-amber-200 dark:border-amber-700 z-20 pointer-events-none drop-shadow-sm">
                  <span class="text-[8px] font-black leading-none">{{ getGameStat(p.id, h, 'chicago') > 0 ? '+' : '' }}{{ getGameStat(p.id, h, 'chicago') }}</span>
                </div>

                <button 
                  @click="openKeypad(h, p.id)"
                  :class="getScoreClass(round.scores[p.id][h-1], h)"
                  class="w-full h-full rounded-xl font-black text-lg sm:text-xl transition-all active:scale-75 flex flex-col items-center justify-center border-2 z-10 relative pb-1"
                >
                  <span class="mt-1">{{ round.scores[p.id][h-1] === 0 ? '' : round.scores[p.id][h-1] }}</span>
                  
                  <div v-if="getGameStat(p.id, h, 'pops') > 0" class="absolute bottom-0.5 w-full flex justify-center items-end gap-[1.5px] pointer-events-none">
                    <div v-for="dot in Math.floor(getGameStat(p.id, h, 'pops'))" :key="'pop'+dot" class="w-1.5 h-1.5 rounded-full opacity-80 bg-emerald-500"></div>
                    <div v-if="getGameStat(p.id, h, 'pops') % 1 !== 0" class="w-1 h-1 rounded-full opacity-50 bg-emerald-500 mb-[1px]"></div>
                  </div>
                </button>
              </div>
            </div>
            
            <div class="flex-1 flex justify-center items-center font-black text-slate-400 text-lg border-l border-slate-100 dark:border-slate-800 ml-1">
              {{ calculateNineTotal(p.id, activeNine) }}
            </div>
          </div>

        </div>
      </div>
    </div>

    <ClientOnly>
      <Teleport to="body">
        <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-full" enter-to-class="translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0" leave-to-class="translate-y-full">
          <div v-if="keypad.isOpen" class="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
            <div @click="keypad.isOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
            <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
              
              <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    Hole {{ keypad.hole }} <span class="text-emerald-500">Par {{ getHolePar(keypad.hole) }}</span>
                  </p>
                  <h4 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Group Entry</h4>
                </div>
                <button @click="keypad.isOpen = false" class="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full">
                  <Icon name="mdi:close" class="size-4" />
                </button>
              </div>

              <div class="p-4 overflow-y-auto space-y-2">
                <div v-for="p in round.players" :key="p.id" @click="keypad.activePlayerId = p.id" :class="['p-3 rounded-2xl border-2 flex justify-between items-center transition-all cursor-pointer', keypad.activePlayerId === p.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-inner' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50']">
                  <div class="flex items-center gap-3">
                    <div :class="['w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase', keypad.activePlayerId === p.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500']">
                      {{ p.fname[0] }}{{ p.lname[0] }}
                    </div>
                    <div>
                      <div :class="['font-bold text-sm', keypad.activePlayerId === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300']">{{ p.fname }} {{ p.lname }}</div>
                      <div class="text-[9px] font-black uppercase text-slate-400">CH: {{ isYearlyLeague ? Number(p.index).toFixed(3) : Math.round(p.index) }}</div>
                    </div>
                  </div>
                  <div :class="['text-3xl font-black w-14 text-center rounded-xl py-1', keypad.activePlayerId === p.id ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400']">
                    {{ keypad.tempScores[p.id] || '-' }}
                  </div>
                </div>
              </div>

              <div class="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                <div class="flex gap-2 mb-4">
                  <button v-for="n in [3, 4, 5]" :key="n" @click="setScore(n)" class="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-600 dark:text-slate-300 shadow-sm active:scale-95 transition-all">{{ n }}</button>
                </div>
                <div class="flex items-center gap-4 mb-6">
                  <button @click="adjustScore(-1)" class="flex-1 py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center active:bg-red-500 active:text-white transition-colors shadow-sm"><Icon name="mdi:minus" class="size-8" /></button>
                  <button @click="adjustScore(1)" class="flex-1 py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center active:bg-blue-500 active:text-white transition-colors shadow-sm"><Icon name="mdi:plus" class="size-8" /></button>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <button @click="nextPlayer" class="py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Next Player ⬇</button>
                  <button @click="saveHoleScores" class="py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all">Save Hole {{ keypad.hole }}</button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useData } from '~/stores/data';
import { calcBirds, calcDeuces, calcChicago } from '~/utils/gameLogic'; // Removed calcPops to use local engine

const { $db } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const dataStore = useData();

const round = ref(null);
const activeNine = ref('front');
const keypad = ref({ isOpen: false, hole: 1, activePlayerId: null, tempScores: {} });

// Is it a Yearly EMGA League?
const isYearlyLeague = computed(() => {
  if (!round.value || !round.value.leagueId) return false;
  const league = dataStore.leagues.get(round.value.leagueId);
  return league && (league.yearly_games !== undefined || league.cadence === 'yearly');
});

// View Logic
const displayedHoles = computed(() => {
  if (!round.value) return [];
  if (round.value.holes === 9) return [1,2,3,4,5,6,7,8,9];
  return activeNine.value === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];
});

// Course Data for Pars & Hcp
const courseData = computed(() => {
  if (!round.value) return null;
  const c = dataStore.courses.get(round.value.course) || Array.from(dataStore.courses.values()).find(crs => crs.name === round.value.course);
  return c?.tees?.[round.value.tees] || null;
});

const getHolePar = (h) => {
  if (!courseData.value || !courseData.value.pars) return 4;
  return courseData.value.pars[h - 1] || 4;
};

// --- FRACTIONAL POP ENGINE ---
// Distributes full pops, plus places the decimal fraction exactly on the "Next Highest Handicap" hole.
const calculatePopsArray = (indexVal) => {
  const arr = new Array(round.value.holes).fill(0);
  if (!courseData.value || !courseData.value.hnds) return arr;
  
  const idx = isYearlyLeague.value ? parseFloat(indexVal) || 0 : Math.round(parseFloat(indexVal) || 0);
  const isPlus = idx < 0;
  const absIdx = Math.abs(idx);
  const baseIdx = Math.floor(absIdx);
  const remainder = absIdx - baseIdx;
  
  const loops = Math.floor(baseIdx / 18);
  const remBase = baseIdx % 18;
  
  for (let i = 0; i < round.value.holes; i++) {
      const hHcp = courseData.value.hnds[i];
      if (!hHcp) continue;
      
      let pop = loops;
      if (!isPlus) {
        if (hHcp <= remBase) pop += 1;
        // Decimal allocation logic (e.g. 10.5 allocates 0.5 to Stroke Hole 11)
        if (remainder > 0 && hHcp === remBase + 1) pop += remainder;
        arr[i] = pop;
      } else {
        // Plus Handicap logic
        if (hHcp > 18 - remBase) pop += 1;
        if (remainder > 0 && hHcp === 18 - remBase) pop += remainder;
        arr[i] = -pop; 
      }
  }
  return arr;
};

// Real-time Game Badges Logic
const gameStats = computed(() => {
  if (!round.value || !courseData.value) return {};
  const stats = {};
  const league = round.value.leagueId ? dataStore.leagues.get(round.value.leagueId) : null;
  
  // Use yearly_games if it's an EMGA major, otherwise normal casual games
  const activeGames = (isYearlyLeague.value && league?.yearly_games) ? league.yearly_games : (round.value.game || []);
  
  const playChicago = activeGames.includes('Chicago Points');
  const playModChicago = activeGames.includes('Modified Chicago');
  const calData = { type: round.value.type };

  round.value.players.forEach(p => {
    const pRound = { scores: round.value.scores[p.id], index: p.index };
    stats[p.id] = {
      pops: calculatePopsArray(p.index), // Use our new fractional engine
      birds: isYearlyLeague.value ? calcBirds(pRound, calData, courseData.value) : new Array(round.value.holes).fill(0),
      deuces: isYearlyLeague.value ? calcDeuces(pRound, courseData.value) : new Array(round.value.holes).fill(0),
      chicago: (playChicago || playModChicago) ? calcChicago(pRound, courseData.value, playModChicago) : new Array(round.value.holes).fill(0)
    };
  });
  return stats;
});

const getGameStat = (playerId, hole, gameType) => {
  if (!gameStats.value[playerId] || !gameStats.value[playerId][gameType]) return 0;
  return gameStats.value[playerId][gameType][hole - 1]; 
};

// --- NET SCORE RELATIVE LOGIC ---
const getPlayerNetRelative = (playerId) => {
  if (!round.value || !courseData.value || !courseData.value.pars) return { rel: 0, holesPlayed: 0 };
  let rel = 0;
  let holesPlayed = 0;
  const popsArr = gameStats.value[playerId]?.pops || [];

  round.value.scores[playerId].forEach((score, index) => {
    if (score > 0) {
      holesPlayed++;
      const pop = popsArr[index] || 0;
      const par = courseData.value.pars[index] || 4;
      const netScore = score - pop;
      rel += (netScore - par);
    }
  });
  return { rel, holesPlayed };
};

const getNetRelativeStr = (playerId) => {
  const stats = getPlayerNetRelative(playerId);
  if (stats.holesPlayed === 0) return 'E';
  
  let val = stats.rel;
  if (isYearlyLeague.value) {
    if (Math.abs(val) < 0.0001) return 'E';
    return val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3);
  } else {
    val = Math.round(val);
    if (val === 0) return 'E';
    return val > 0 ? `+${val}` : val.toString();
  }
};

const getNetRelativeColor = (playerId) => {
  const stats = getPlayerNetRelative(playerId);
  if (stats.holesPlayed === 0) return 'text-slate-500 dark:text-slate-400';
  if (stats.rel < -0.0001) return 'text-red-500'; // Under Par
  if (stats.rel > 0.0001) return 'text-blue-500 dark:text-blue-400'; // Over Par
  return 'text-slate-800 dark:text-white'; // Even
};


// Color Logic Based on Par (Gross)
const getScoreClass = (val, hole) => {
  if (!val || val === 0) return 'bg-transparent border-slate-200 dark:border-slate-700 text-transparent'; 
  const par = getHolePar(hole);
  if (val < par) return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500 shadow-sm';
  if (val === par) return 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm';
  return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm';
};

// Data Binding
onMounted(async () => {
  if (!dataStore.isBooted) await dataStore.bootstrap();
  const unsub = onSnapshot(doc($db, "live_rounds", route.params.id), (snap) => {
    if (snap.exists()) {
      round.value = { id: snap.id, ...snap.data() };
    } else router.push('/');
  });
  onUnmounted(() => unsub());
});

// Keypad Actions
const openKeypad = (hole, startingPlayerId) => {
  const currentHoleScores = {};
  const par = getHolePar(hole);
  round.value.players.forEach(p => {
    const score = round.value.scores[p.id][hole - 1];
    currentHoleScores[p.id] = score === 0 ? par.toString() : score.toString();
  });
  keypad.value = { isOpen: true, hole: hole, activePlayerId: startingPlayerId, tempScores: currentHoleScores };
};

const setScore = (val) => keypad.value.tempScores[keypad.value.activePlayerId] = val.toString();

const adjustScore = (mod) => {
  const pid = keypad.value.activePlayerId;
  let current = parseInt(keypad.value.tempScores[pid]) || getHolePar(keypad.value.hole);
  let next = Math.min(Math.max(current + mod, 1), 15);
  keypad.value.tempScores[pid] = next.toString();
};

const nextPlayer = () => {
  const currentIndex = round.value.players.findIndex(p => p.id === keypad.value.activePlayerId);
  keypad.value.activePlayerId = round.value.players[(currentIndex + 1) % round.value.players.length].id;
};

const saveHoleScores = async () => {
  const roundRef = doc($db, "live_rounds", route.params.id);
  const updatedScores = { ...round.value.scores };
  round.value.players.forEach(p => {
    updatedScores[p.id][keypad.value.hole - 1] = parseInt(keypad.value.tempScores[p.id]) || 0;
  });
  try {
    await updateDoc(roundRef, { scores: updatedScores });
  } catch (err) { console.error("Failed to save:", err); }
  keypad.value.isOpen = false;
};

// Utilities
const calculateNineTotal = (playerId, nineStr) => {
  if (!round.value?.scores[playerId]) return 0;
  const scores = round.value.scores[playerId];
  const start = nineStr === 'front' ? 0 : 9;
  const end = nineStr === 'front' ? 9 : 18;
  let total = 0;
  for(let i = start; i < end; i++) total += parseInt(scores[i]) || 0;
  return total;
};

const calculateTotal = (playerId) => {
  if (!round.value?.scores[playerId]) return 0;
  return round.value.scores[playerId].reduce((a, b) => a + (parseInt(b) || 0), 0);
};

const getShortDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
</script>