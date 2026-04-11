<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 pt-20">
    
    <header v-if="round" class="py-2 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">{{ round.course }}</h1>
        <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
          {{ round.type }} • {{ round.tees }} • {{ getShortDate(round.date) }}
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

    <div v-if="round" class="px-2 mt-2 max-w-2xl mx-auto">
      
      <div v-if="round.holes === 18" class="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1 mb-2 shadow-inner mx-1">
        <button @click="activeNine = 'front'" :class="activeNine === 'front' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'" class="flex-1 py-1 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Front 9</button>
        <button @click="activeNine = 'back'" :class="activeNine === 'back' ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'" class="flex-1 py-1 text-xs font-black uppercase tracking-widest rounded-lg transition-all">Back 9</button>
      </div>

      <div class="flex w-full px-2 mb-2 justify-between">
        <div v-for="h in displayedHoles" :key="'hdr'+h" class="flex-1 text-center text-[10px] font-black text-slate-400 uppercase">#{{ h }}</div>
      </div>

      <div class="space-y-4">
        <div v-for="p in round.players" :key="p.id" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          
          <div class="bg-slate-100 dark:bg-slate-800/80 px-4 py-1 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-tight">{{ p.fname }} {{ p.lname }}</span>
              <span class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">
                CH: {{ isYearlyLeague ? Number(p.index).toFixed(3) : Math.round(p.index) }}
              </span>
            </div>
          </div>

          <div class="flex w-full px-1.5 py-1.5 gap-1 justify-between">
            <div v-for="h in displayedHoles" :key="p.id + h" class="flex-1 flex justify-center max-w-[48px]">
              <div class="relative w-full h-[50px] sm:h-[56px] flex items-center justify-center">
                
                <div v-if="isYearlyLeague && getGameStat(p.id, h, 'birds') > 0" class="absolute -top-1.5 -left-1 text-emerald-500 flex items-start z-20 pointer-events-none drop-shadow-sm bg-white/50 dark:bg-slate-900/50 rounded-full px-0.5">
                  <span class="text-[10px] font-black leading-none">{{ Math.floor(getGameStat(p.id, h, 'birds')) || '' }}</span>
                  <span v-if="getGameStat(p.id, h, 'birds') % 1 !== 0" class="text-[7px] font-black leading-none mt-[1px] ml-[0.5px]">1/2</span>
                </div>
                
                <div v-if="isYearlyLeague && (getGameStat(p.id, h, 'deuces') || round.scores[p.id][h-1] === 2)" class="absolute -top-1.5 -right-1 flex items-center justify-center bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-300 rounded-full size-3.5 border border-blue-200 dark:border-blue-700 z-20 pointer-events-none drop-shadow-sm">
                  <span class="text-[8px] font-black leading-none mt-[1px]">2</span>
                </div>
                
                <button 
                  @click="openKeypad(h, p.id)"
                  :class="getScoreClass(round.scores[p.id][h-1], h)"
                  class="w-full h-full rounded-xl font-black text-lg sm:text-xl transition-all active:scale-75 flex flex-col items-center justify-center border-2 z-10 relative pb-1"
                >
                  <span class="mt-1">{{ round.scores[p.id][h-1] === 0 ? '' : round.scores[p.id][h-1] }}</span>
                  <div v-if="getGameStat(p.id, h, 'pops') > 0" class="absolute bottom-0.5 w-full flex justify-center items-end gap-[1px] pointer-events-none">
                    <div v-for="dot in Math.floor(getGameStat(p.id, h, 'pops'))" :key="'pop'+dot" class="w-1.5 h-1.5 rounded-full opacity-80 bg-emerald-500"></div>
                    <div v-if="getGameStat(p.id, h, 'pops') % 1 !== 0" class="w-1 h-1 rounded-full opacity-50 bg-emerald-500 mb-[1px]"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-900/50 px-4 py-1 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 text-[10px] font-black tracking-widest uppercase">
            <div class="text-slate-500">
              {{ activeNine === 'front' ? 'OUT' : 'IN' }}: <span class="text-slate-800 dark:text-white text-xs">{{ getTotals(round.scores[p.id])[activeNine === 'front' ? 0 : 1] }}</span>
            </div>
            <div class="flex gap-4">
              <div class="text-slate-500">
                NET: <span :class="getNetColor(p.id)" class="text-xs">{{ getNetRel(p.id) }}</span>
              </div>
              <div class="text-slate-500">
                TOTAL: <span class="text-slate-800 dark:text-white text-xs">{{ getTotals(round.scores[p.id])[2] }}</span>
              </div>
            </div>
          </div>

        </div>

        <div class="flex gap-3 mt-6">
          <button @click="showPlayerPicker = true" class="flex-1 py-2 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">+ Manage Group</button>
          <button v-if="!round.leagueId" @click="finishCasualRound" class="flex-1 py-2 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Icon name="mdi:flag-checkered" class="size-4" /> Finish Round</button>
        </div>

        <PlayerPicker v-model:isOpen="showPlayerPicker" :selectedPlayers="round.players" :isLeague="!!round.leagueId" :leagueId="round.leagueId" @toggle="handlePlayerToggle" />
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
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">Hole {{ keypad.hole }} <span class="text-emerald-500">Par {{ getHolePar(keypad.hole) }}</span></p>
                  <h4 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Group Entry</h4>
                </div>
                <button @click="keypad.isOpen = false" class="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full"><Icon name="mdi:close" class="size-4" /></button>
              </div>
              <div class="p-4 overflow-y-auto space-y-2">
                <div v-for="p in round.players" :key="p.id" @click="keypad.activePlayerId = p.id" :class="['p-3 rounded-2xl border-2 flex justify-between items-center transition-all cursor-pointer', keypad.activePlayerId === p.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-inner' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50']">
                  <div class="flex items-center gap-3">
                    <div :class="['w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase', keypad.activePlayerId === p.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500']">{{ p.fname[0] }}{{ p.lname[0] }}</div>
                    <div>
                      <div :class="['font-bold text-sm', keypad.activePlayerId === p.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300']">{{ p.fname }} {{ p.lname }}</div>
                      <div class="text-[9px] font-black uppercase text-slate-400">CH: {{ isYearlyLeague ? Number(p.index).toFixed(3) : Math.round(p.index) }}</div>
                    </div>
                  </div>
                  <div :class="['text-3xl font-black w-14 text-center rounded-xl py-1', keypad.activePlayerId === p.id ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400']">{{ keypad.tempScores[p.id] || '-' }}</div>
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
import { doc, onSnapshot, updateDoc, writeBatch, collection } from "firebase/firestore";
// import { useData } from '~/stores/data'; // REMOVED
import { calcPops, calcBirds, calcDeuces, calcChicago, calcNetRelative, getTotals } from '~/utils/gameLogic';
import { calcUSGACourseHandicap } from '~/utils/handicap';

const { $db } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const round = ref(null);
const activeNine = ref('front');
const keypad = ref({ isOpen: false, hole: 1, activePlayerId: null, tempScores: {} });
const showPlayerPicker = ref(false);

// 1. Logic for Yearly League status (now uses internal document data)
const isYearlyLeague = computed(() => {
  return round.value?.isYearly || round.value?.type === 'yearly';
});

const displayedHoles = computed(() => {
  if (!round.value) return [];
  if (round.value.holes === 9) return [1,2,3,4,5,6,7,8,9];
  return activeNine.value === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];
});

// 2. Simplified Course Data lookup (strictly uses the snapshot you built)
const courseData = computed(() => {
  if (!round.value?.courseSnapshot) return null;
  return round.value.courseSnapshot.tees?.[round.value.tees] || null;
});

const getHolePar = (h) => courseData.value?.pars?.[h - 1] || 4;

const gameStats = computed(() => {
  if (!round.value || !courseData.value) return {};
  const stats = {};
  
  // Use games defined on the round document itself
  const activeGames = round.value.game || [];
  const playChicago = activeGames.includes('Chicago Points') || activeGames.includes('Modified Chicago');
  
  round.value.players.forEach(p => {
    const pRound = { scores: round.value.scores[p.id], index: p.index };
    stats[p.id] = {
      pops: calcPops(pRound.scores, courseData.value.hnds, p.index, isYearlyLeague.value),
      birds: isYearlyLeague.value ? calcBirds(pRound, { type: round.value.type }, courseData.value, isYearlyLeague.value) : new Array(round.value.holes).fill(0),
      deuces: isYearlyLeague.value ? calcDeuces(pRound, courseData.value, isYearlyLeague.value) : new Array(round.value.holes).fill(0),
      chicago: playChicago ? calcChicago(pRound, courseData.value, activeGames.includes('Modified Chicago')) : new Array(round.value.holes).fill(0)
    };
  });
  return stats;
});

const getGameStat = (playerId, hole, gameType) => gameStats.value[playerId]?.[gameType]?.[hole - 1] || 0;

// Net Formatting using shared logic
const getNetRel = (playerId) => {
  if (!round.value || !courseData.value) return 'E';
  const pops = gameStats.value[playerId]?.pops || [];
  const { rel, holesPlayed } = calcNetRelative(round.value.scores[playerId], pops, courseData.value.pars);
  
  if (holesPlayed === 0) return 'E';
  if (isYearlyLeague.value) {
    if (Math.abs(rel) < 0.0001) return 'E';
    return rel > 0 ? `+${rel.toFixed(3)}` : rel.toFixed(3);
  }
  const rounded = Math.round(rel);
  return rounded === 0 ? 'E' : (rounded > 0 ? `+${rounded}` : rounded.toString());
};

const getNetColor = (playerId) => {
  if (!round.value || !courseData.value) return 'text-slate-500';
  const pops = gameStats.value[playerId]?.pops || [];
  const { rel, holesPlayed } = calcNetRelative(round.value.scores[playerId], pops, courseData.value.pars);
  
  if (holesPlayed === 0) return 'text-slate-500';
  if (rel < -0.0001) return 'text-red-500';
  if (rel > 0.0001) return 'text-blue-500 dark:text-blue-400';
  return 'text-slate-800 dark:text-white';
};

const getScoreClass = (val, hole) => {
  if (!val || val === 0) return 'bg-transparent border-slate-200 dark:border-slate-700 text-transparent'; 
  const par = getHolePar(hole);
  if (val < par) return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500 shadow-sm';
  if (val === par) return 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm';
  return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm';
};

const handlePlayerToggle = async (p) => {
  if (!round.value) return;
  const roundRef = doc($db, "live_rounds", route.params.id);
  const isRemoving = round.value.players.some(x => x.id === p.id);
  let updatedPlayers = [...round.value.players];
  let updatedScores = { ...round.value.scores };

  if (isRemoving) {
    if (updatedPlayers.length === 1) return alert("You cannot remove the last player.");
    updatedPlayers = updatedPlayers.filter(x => x.id !== p.id);
    delete updatedScores[p.id];
  } else {
    if (updatedPlayers.length >= 5) return alert("Maximum 5 players.");
    
    // Pull tee data from snapshot instead of store
    const assignedTee = round.value.tees || Object.keys(round.value.courseSnapshot.tees)[0];
    const teeData = round.value.courseSnapshot.tees[assignedTee];
    
    const rawGhin = parseFloat(p.ghin) || 0;
    let playingHcp = Math.round(rawGhin);
    
    if (teeData) {
      playingHcp = calcUSGACourseHandicap(rawGhin, teeData.slope, teeData.rating, teeData.par);
    }
    
    updatedPlayers.push({ ...p, ghin: rawGhin, index: playingHcp, tee: assignedTee });
    updatedScores[p.id] = new Array(round.value.holes).fill(0);
  }
  await updateDoc(roundRef, { players: updatedPlayers, scores: updatedScores });
};

const finishCasualRound = async () => {
  if (!confirm("Are you sure you want to finish and archive this round?")) return;
  
  try {
    const batch = writeBatch($db);
    // Use the round date or fallback to today's ISO string
    const finalDate = round.value.date || new Date().toISOString().split('T')[0];

    round.value.players.forEach(p => {
      const historyRef = doc(collection($db, "players", p.id, "rounds"));
      
      batch.set(historyRef, {
        course: round.value.course,
        courseID: round.value.courseID || null,
        // Ensure we save the specific tee data used for handicap calc
        courseSnapshot: round.value.courseSnapshot || courseData.value || null,
        date: finalDate,
        tees: round.value.tees,
        holes: round.value.holes,
        type: 'casual',
        scores: round.value.scores[p.id],
        index: p.index,
        playedTee: p.tee || round.value.tees
      });
    });

    batch.delete(doc($db, "live_rounds", route.params.id));
    await batch.commit();
    
    router.push('/');
  } catch (err) {
    console.error("Archive Error:", err);
    alert("There was an error archiving the round.");
  }
};

onMounted(() => {
  // No store bootstrap needed!
  const unsub = onSnapshot(doc($db, "live_rounds", route.params.id), (snap) => {
    if (snap.exists()) {
      round.value = { id: snap.id, ...snap.data() };
    } else {
      router.push('/');
    }
  });
  onUnmounted(() => unsub());
});

const openKeypad = (hole, startingPlayerId) => {
  const currentHoleScores = {};
  round.value.players.forEach(p => currentHoleScores[p.id] = (round.value.scores[p.id][hole - 1] || getHolePar(hole)).toString());
  keypad.value = { isOpen: true, hole, activePlayerId: startingPlayerId, tempScores: currentHoleScores };
};
const setScore = (val) => keypad.value.tempScores[keypad.value.activePlayerId] = val.toString();
const adjustScore = (mod) => {
  const pid = keypad.value.activePlayerId;
  keypad.value.tempScores[pid] = Math.min(Math.max((parseInt(keypad.value.tempScores[pid]) || getHolePar(keypad.value.hole)) + mod, 1), 15).toString();
};
const nextPlayer = () => keypad.value.activePlayerId = round.value.players[(round.value.players.findIndex(p => p.id === keypad.value.activePlayerId) + 1) % round.value.players.length].id;
const saveHoleScores = async () => {
  const updatedScores = { ...round.value.scores };
  round.value.players.forEach(p => updatedScores[p.id][keypad.value.hole - 1] = parseInt(keypad.value.tempScores[p.id]) || 0);
  try { await updateDoc(doc($db, "live_rounds", route.params.id), { scores: updatedScores }); } catch (err) {}
  keypad.value.isOpen = false;
};

const getShortDate = (iso) => iso ? new Date(iso.split('-')[0], iso.split('-')[1] - 1, iso.split('-')[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }

/* 🛡️ Responsive grid for hole boxes */
.flex.w-full.px-1\.5 {
  display: flex;
  gap: 4px !important; /* Tight gap for mobile */
  justify-content: space-between;
}

/* Ensure boxes scale down on tiny screens */
.flex-1.flex.justify-center.max-w-\[48px\] {
  min-width: 0; 
  flex-basis: 11%; /* Roughly 1/9th of the row */
}

/* Make score text slightly smaller on mobile to prevent clipping */
@media (max-width: 400px) {
  .text-lg { font-size: 1rem; }
  .size-3.5 { width: 0.75rem; height: 0.75rem; }
}
</style>