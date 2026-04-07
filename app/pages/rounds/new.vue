<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
    <header class="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
            {{ activeRound.course }}
          </h1>
          <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
            {{ activeRound.tees }} • {{ activeRound.holes }} Holes
          </p>
        </div>
        <button @click="saveAndExit" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
          Save & Exit
        </button>
      </div>

      <div class="flex gap-2 overflow-x-auto no-scrollbar py-2">
        <button 
          v-for="h in totalHoles" :key="h"
          @click="scrollToHole(h)"
          :class="currentHole === h ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'"
          class="size-10 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black transition-all active:scale-90"
        >
          {{ h }}
        </button>
      </div>
    </header>

    <div class="mt-4 px-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
              <th class="p-4 text-left sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 w-32">Player</th>
              <th v-for="h in totalHoles" :key="'h'+h" class="p-4 text-center min-w-[60px]">#{{ h }}</th>
              <th class="p-4 text-center bg-slate-100 dark:bg-slate-800/80 sticky right-0 z-10">Tot</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in activeRound.players" :key="p.id" class="border-b border-slate-100 dark:border-slate-800 last:border-0">
              <td class="p-4 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                <p class="font-bold text-slate-800 dark:text-slate-100 truncate text-sm uppercase tracking-tight">
                  {{ p.fname }} {{ p.lname[0] }}.
                </p>
              </td>

              <td v-for="h in totalHoles" :key="p.id + h" class="p-2 text-center">
                <button 
                  @click="openKeypad(p.id, h)"
                  :class="getScoreClass(scores[p.id][h-1])"
                  class="size-10 rounded-xl font-black text-sm transition-all active:scale-75 flex items-center justify-center mx-auto border-2"
                >
                  {{ scores[p.id][h-1] || '-' }}
                </button>
              </td>

              <td class="p-4 text-center sticky right-0 bg-slate-50 dark:bg-slate-900 z-10 font-black text-emerald-600 text-sm shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                {{ calculateTotal(p.id) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ClientOnly>
      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div v-if="keypad.isOpen" class="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
            <div @click="keypad.isOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
            <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-6">
              <div class="flex justify-between items-center mb-6">
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hole {{ keypad.hole }}</p>
                  <h4 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{{ keypad.playerName }}</h4>
                </div>
                <div class="text-3xl font-black text-emerald-600 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                  {{ tempScore || '-' }}
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" @click="pressKey(n)" class="py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-slate-600 dark:text-slate-300 active:bg-emerald-600 active:text-white transition-colors">
                  {{ n }}
                </button>
                <button @click="pressKey(0)" class="py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-slate-600 dark:text-slate-300 active:bg-emerald-600 active:text-white">0</button>
                <button @click="clearKey" class="py-5 bg-red-50 text-red-600 rounded-2xl text-sm font-black uppercase tracking-widest">Clear</button>
                <button @click="confirmScore" class="py-5 bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest">Enter</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
// This page assumes you pass the round setup via a state management or query
// For this example, let's assume we store the "active" setup in a Pinia store or use default data
const { player } = useAuth();
const router = useRouter();

const totalHoles = ref(18);
const currentHole = ref(1);

// This would be populated from your "Start Round" modal
const activeRound = ref({
  course: 'Elks Lodge',
  tees: 'Blue',
  holes: 18,
  players: [
    { id: 'me', fname: 'Dann', lname: 'Nankivel' },
    { id: 'p2', fname: 'Mike', lname: 'Smith' }
  ]
});

// Initialize scores: { playerId: [0,0,0...] }
const scores = ref({});
activeRound.value.players.forEach(p => {
  scores.value[p.id] = new Array(activeRound.value.holes).fill(0);
});

// Keypad State
const keypad = ref({
  isOpen: false,
  playerId: null,
  playerName: '',
  hole: 1
});
const tempScore = ref('');

const openKeypad = (playerId, hole) => {
  const p = activeRound.value.players.find(p => p.id === playerId);
  keypad.value = {
    isOpen: true,
    playerId,
    playerName: p.fname,
    hole
  };
  tempScore.value = scores.value[playerId][hole-1] || '';
};

const pressKey = (num) => {
  tempScore.value = parseInt(`${tempScore.value}${num}`);
  if (tempScore.value > 15) tempScore.value = 15; // Realistic cap
};

const clearKey = () => tempScore.value = '';

const confirmScore = () => {
  scores.value[keypad.value.playerId][keypad.value.hole - 1] = tempScore.value || 0;
  keypad.value.isOpen = false;
};

const calculateTotal = (playerId) => {
  return scores.value[playerId].reduce((a, b) => a + b, 0);
};

const getScoreClass = (val) => {
  if (!val) return 'bg-slate-50 dark:bg-slate-800 text-slate-300 border-transparent';
  return 'bg-white dark:bg-slate-900 text-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/10';
};

const scrollToHole = (h) => {
  currentHole.value = h;
  // logic to scroll the table horizontally could be added here
};

const saveAndExit = () => {
  alert("Round Progress Saved!");
  router.push('/');
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>