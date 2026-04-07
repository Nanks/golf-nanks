<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
    <header v-if="round" class="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
            {{ round.course }}
          </h1>
          <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
            {{ round.tees }} • {{ round.holes }} Holes • {{ round.date }}
          </p>
        </div>
        <button @click="router.push('/')" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400">
          <Icon name="mdi:close" class="size-5" />
        </button>
      </div>

      <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button 
          v-for="h in round.holes" :key="h"
          @click="scrollToHole(h)"
          class="size-10 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black transition-all active:scale-90 bg-slate-50 dark:bg-slate-800 text-slate-400"
        >
          {{ h }}
        </button>
      </div>
    </header>

    <div v-if="round" class="mt-4 overflow-hidden">
      <div class="overflow-x-auto no-scrollbar px-4">
        <div class="inline-block min-w-full align-middle">
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table class="min-w-full border-separate border-spacing-0">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400">
                  <th class="p-4 text-left sticky left-0 bg-slate-50 dark:bg-slate-800 z-20 border-b border-slate-200 dark:border-slate-800">Player</th>
                  <th v-for="h in round.holes" :key="'th'+h" class="p-4 text-center min-w-[60px] border-b border-slate-200 dark:border-slate-800">#{{ h }}</th>
                  <th class="p-4 text-center sticky right-0 bg-slate-100 dark:bg-slate-800 z-20 border-b border-slate-200 dark:border-slate-800">Tot</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in round.players" :key="p.id" class="group">
                  <td class="p-4 sticky left-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                    <p class="font-bold text-slate-800 dark:text-slate-100 truncate text-sm uppercase tracking-tight">
                      {{ p.fname }} {{ p.lname[0] }}.
                    </p>
                  </td>

                  <td v-for="h in round.holes" :key="p.id + h" class="p-2 text-center border-b border-slate-100 dark:border-slate-800">
                    <button 
                      @click="openKeypad(p, h)"
                      :class="getScoreClass(round.scores[p.id][h-1])"
                      class="size-11 rounded-xl font-black text-base transition-all active:scale-75 flex items-center justify-center mx-auto border-2"
                    >
                      {{ round.scores[p.id][h-1] || '-' }}
                    </button>
                  </td>

                  <td class="p-4 text-center sticky right-0 bg-slate-50 dark:bg-slate-900 z-10 font-black text-emerald-600 text-sm border-b border-slate-100 dark:border-slate-800 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                    {{ calculateTotal(p.id) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
                <div class="text-3xl font-black text-emerald-600 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                  {{ tempScore || '-' }}
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" @click="pressKey(n)" class="py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-slate-600 dark:text-slate-300 active:bg-emerald-600 active:text-white transition-colors">
                  {{ n }}
                </button>
                <button @click="pressKey(0)" class="py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-slate-600 dark:text-slate-300 active:bg-emerald-600 active:text-white">0</button>
                <button @click="tempScore = ''" class="py-5 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest">Clear</button>
                <button @click="saveScore" class="py-5 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">Enter</button>
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

const { $db } = useNuxtApp();
const route = useRoute();
const router = useRouter();

const round = ref(null);
const keypad = ref({ isOpen: false, playerId: null, playerName: '', hole: 1 });
const tempScore = ref('');

// 1. Live Sync with Firestore
onMounted(() => {
  const unsub = onSnapshot(doc($db, "rounds", route.params.id), (snap) => {
    if (snap.exists()) {
      round.value = snap.docs[0] ? { id: snap.id, ...snap.data() } : { id: snap.id, ...snap.data() };
    } else {
      router.push('/');
    }
  });
  onUnmounted(() => unsub());
});

// 2. Keypad Actions
const openKeypad = (player, hole) => {
  keypad.value = {
    isOpen: true,
    playerId: player.id,
    playerName: player.fname,
    hole: hole
  };
  const currentVal = round.value.scores[player.id][hole - 1];
  tempScore.value = currentVal === 0 ? '' : currentVal.toString();
};

const pressKey = (num) => {
  const newScore = `${tempScore.value}${num}`;
  if (parseInt(newScore) <= 15) { // Cap at 15 for sanity
    tempScore.value = newScore;
  }
};

const saveScore = async () => {
  const roundRef = doc($db, "rounds", route.params.id);
  const updatedScores = { ...round.value.scores };
  
  // Update the array for the specific player
  updatedScores[keypad.value.playerId][keypad.value.hole - 1] = parseInt(tempScore.value) || 0;
  
  await updateDoc(roundRef, { scores: updatedScores });
  keypad.value.isOpen = false;
};

// 3. Helpers
const calculateTotal = (playerId) => {
  if (!round.value?.scores[playerId]) return 0;
  return round.value.scores[playerId].reduce((a, b) => a + (parseInt(b) || 0), 0);
};

const getScoreClass = (val) => {
  if (!val || val === 0) return 'bg-slate-50 dark:bg-slate-800 text-slate-300 border-transparent';
  return 'bg-white dark:bg-slate-900 text-emerald-600 border-emerald-500 shadow-sm';
};

const scrollToHole = (h) => {
  // Can implement horizontal scroll logic here if needed
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>