<template>
  <div class="p-6 max-w-3xl mx-auto pb-32">
    <!-- Header -->
    <header class="mb-6 flex justify-between items-end">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/calendar`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
          ← Back to Dates
        </NuxtLink>
        <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-1 leading-none">Scorecard</h1>
        <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">{{ route.params.date }}</p>
      </div>

      <!-- Nine Toggle -->
      <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
        <button 
          v-for="side in ['front', 'back']" :key="side"
          @click="activeSide = side"
          :class="activeSide === side ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'"
          class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
        >
          {{ side }}
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl"></div>
    </div>

    <!-- Main Scorecard Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm overflow-x-auto">
      <table class="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <th class="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Player</th>
            <th v-for="h in currentHoleNumbers" :key="h" class="p-2 text-center text-[10px] font-black text-slate-400">
              H{{ h }}
              <div class="text-[8px] opacity-50">P{{ mockPars[h-1] }}</div>
            </th>
            <th class="p-4 text-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">TOT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="round in groupRounds" :key="round.id" class="border-b border-slate-100 dark:border-slate-800 last:border-0">
            <td class="p-4">
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-tight truncate">
                {{ round.name }}
              </p>
            </td>
            
            <td v-for="h in currentHoleNumbers" :key="h" @click="openHoleModal(h-1)" class="p-1 cursor-pointer">
              <div class="h-12 w-full flex items-center justify-center rounded-xl font-black text-lg transition-all active:scale-90"
                   :class="round.scores[h-1] ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700' : 'bg-slate-50/50 text-slate-300 italic text-sm'">
                {{ round.scores[h-1] || '-' }}
              </div>
            </td>

            <td class="p-4 text-center font-black text-emerald-600 tabular-nums">
              {{ round.scores.reduce((a, b) => a + (b || 0), 0) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- UPDATE MODAL -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
          
          <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 class="text-xl font-black text-emerald-600 uppercase tracking-tight">Hole {{ editingHoleIdx + 1 }}</h3>
            <span class="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-[10px] font-black text-emerald-600 uppercase">Par {{ mockPars[editingHoleIdx] }}</span>
          </div>

          <div class="p-6 space-y-3">
            <div v-for="(p, idx) in stagedScores" :key="p.playerKey" 
                 class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span class="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs">{{ p.name }}</span>
              
              <div class="flex items-center gap-4">
                <button @click="adjustScore(idx, -1)" class="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-xl text-slate-600 dark:text-white active:bg-red-500 active:text-white transition-colors">-</button>
                <span class="text-3xl font-black tabular-nums w-10 text-center text-emerald-600">{{ p.score }}</span>
                <button @click="adjustScore(idx, 1)" class="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center font-black text-xl text-slate-600 dark:text-white active:bg-emerald-500 active:text-white transition-colors">+</button>
              </div>
            </div>
          </div>

          <div class="p-6 pt-0 flex gap-3">
            <button @click="isModalOpen = false" class="flex-1 py-4 bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase tracking-widest rounded-2xl text-slate-400">Cancel</button>
            <button @click="saveHoleScores" class="flex-[2] py-4 bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform">Update Group</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { collectionGroup, query, where, onSnapshot, doc, writeBatch, serverTimestamp } from "firebase/firestore";

const route = useRoute();
const { $db } = useNuxtApp();

// State
const loading = ref(true);
const activeSide = ref('front');
const groupRounds = ref([]);
const isModalOpen = ref(false);
const editingHoleIdx = ref(0);
const stagedScores = ref([]);

// Mock Par Data (Ideally you'd fetch this from your courses collection)
const mockPars = [4,4,3,5,4,4,3,4,5, 4,4,3,5,4,4,3,4,5];

const currentHoleNumbers = computed(() => 
  activeSide.value === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18]
);

// 1. Listen for only the rounds in this specific group/league/date
let unsubscribe;
onMounted(() => {
  const q = query(
    collectionGroup($db, "rounds"),
    where("leagueID", "==", route.params.id), // Or however you filter league
    where("iso", "==", route.params.date)
    // Add where("roundKeys", "array-contains", ...) if you have a specific group ID
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    groupRounds.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    loading.value = false;
  });
});

onUnmounted(() => unsubscribe?.());

// 2. Modal Logic
const openHoleModal = (idx) => {
  editingHoleIdx.value = idx;
  stagedScores.value = groupRounds.value.map(r => ({
    name: r.name,
    playerKey: r.playerKey,
    roundId: r.id,
    score: r.scores[idx] || 0
  }));
  isModalOpen.value = true;
};

const adjustScore = (idx, delta) => {
  const current = stagedScores.value[idx].score;
  const par = mockPars[editingHoleIdx.value];
  
  if (current === 0) {
    stagedScores.value[idx].score = par;
  } else {
    stagedScores.value[idx].score = Math.max(0, current + delta);
  }
};

// 3. Batch Update
const saveHoleScores = async () => {
  const batch = writeBatch($db);
  
  stagedScores.value.forEach(item => {
    const roundRef = doc($db, "players", item.playerKey, "rounds", item.roundId);
    batch.update(roundRef, {
      [`scores.${editingHoleIdx.value}`]: item.score,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
  isModalOpen.value = false;
};
</script>

