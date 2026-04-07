<template>
  <div class="p-6 max-w-3xl mx-auto pb-32">
    <!-- Header -->
    <header class="mb-6 flex justify-between items-end">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/calendar`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
          ← Back to Dates
        </NuxtLink>
        <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-1 leading-none">Scorecard</h1>
        <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">{{ route.params.date }} • Group Scoring</p>
      </div>

      <!-- Toggle Front/Back -->
      <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
        <button 
          v-for="side in ['front', 'back']" 
          :key="side"
          @click="activeSide = side"
          :class="activeSide === side ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'"
          class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
        >
          {{ side }}
        </button>
      </div>
    </header>

    <!-- Scorecard Grid -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <th class="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Player</th>
            <th v-for="h in currentHoles" :key="h" class="p-2 text-center text-[10px] font-black text-slate-400">
              H{{ h }}
              <div class="text-[8px] opacity-50">P{{ teeData.pars[h-1] }}</div>
            </th>
            <th class="p-4 text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">TOT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.id" class="border-b border-slate-100 dark:border-slate-800 last:border-0 group">
            <td class="p-4">
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-tight truncate w-24">
                {{ player.name }}
              </p>
            </td>
            
            <!-- Individual Hole Cells -->
            <td 
              v-for="h in currentHoles" 
              :key="h" 
              @click="openHoleModal(h-1)"
              class="p-1 cursor-pointer"
            >
              <div class="h-10 w-full flex items-center justify-center rounded-lg font-black text-lg transition-all active:scale-90"
                   :class="player.scores[h-1] ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white' : 'bg-slate-50/50 text-slate-300'">
                {{ player.scores[h-1] || '-' }}
              </div>
            </td>

            <!-- Player Total -->
            <td class="p-4 text-center font-black text-emerald-600 tabular-nums">
              {{ calculateTotal(player.scores) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- UPDATE MODAL -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
          
          <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 class="text-xl font-black text-emerald-600 uppercase tracking-tight">Hole {{ editingHoleIdx + 1 }} Score</h3>
            <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase">Par {{ teeData.pars[editingHoleIdx] }}</span>
          </div>

          <div class="p-6 space-y-4">
            <div v-for="(p, idx) in stagedScores" :key="p.playerKey" 
                 class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span class="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs">{{ p.name }}</span>
              
              <div class="flex items-center gap-4">
                <button @click="adjustScore(idx, -1)" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-slate-600 dark:text-white active:bg-emerald-500 transition-colors">-</button>
                <span class="text-2xl font-black tabular-nums w-8 text-center text-emerald-600">{{ p.score }}</span>
                <button @click="adjustScore(idx, 1)" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-slate-600 dark:text-white active:bg-emerald-500 transition-colors">+</button>
              </div>
            </div>
          </div>

          <div class="p-6 pt-0 flex gap-3">
            <button @click="isModalOpen = false" class="flex-1 py-4 bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase tracking-widest rounded-2xl">Cancel</button>
            <button @click="saveHoleScores" class="flex-2 px-8 py-4 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20">Save Group</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";

const route = useRoute();
const { $db } = useNuxtApp();

// State
const activeSide = ref('front');
const isModalOpen = ref(false);
const editingHoleIdx = ref(null);
const stagedScores = ref([]);

// Props / Mock Data Structure (Passed in or fetched)
// In a real app, 'players' would be reactive from your onSnapshot listener
const props = defineProps({
  players: Array, // Array of player objects with { name, playerKey, id (roundId), scores: [] }
  teeData: Object  // { pars: [4,4,3...] }
});

const currentHoles = computed(() => 
  activeSide.value === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18]
);

const calculateTotal = (scores) => scores.reduce((a, b) => a + (b || 0), 0);

// Modal Logic
const openHoleModal = (idx) => {
  editingHoleIdx.value = idx;
  // Deep copy scores into staged state
  stagedScores.value = props.players.map(p => ({
    name: p.name,
    playerKey: p.playerKey,
    roundId: p.id,
    score: p.scores[idx] || 0
  }));
  isModalOpen.value = true;
};

const adjustScore = (idx, delta) => {
  const par = props.teeData.pars[editingHoleIdx.value];
  if (stagedScores.value[idx].score === 0) {
    stagedScores.value[idx].score = par; // Default to par on first click
  } else {
    stagedScores.value[idx].score = Math.max(0, stagedScores.value[idx].score + delta);
  }
};

const saveHoleScores = async () => {
  const batch = writeBatch($db);
  
  stagedScores.value.forEach(item => {
    // Reference: players/{playerKey}/rounds/{roundId}
    const ref = doc($db, "players", item.playerKey, "rounds", item.roundId);
    batch.update(ref, {
      [`scores.${editingHoleIdx.value}`]: item.score,
      updatedAt: serverTimestamp()
    });
  });

  try {
    await batch.commit();
    isModalOpen.value = false;
  } catch (e) {
    console.error("Batch update failed", e);
  }
};
</script>
