<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Header -->
    <header class="mb-8 flex justify-between items-end">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/calendar`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
          ← Back to Dates
        </NuxtLink>
        <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-1 leading-none">Leaderboard</h1>
        <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">{{ formatDate(route.params.date) }}</p>
      </div>
      
      <!-- Status Badge (Optional replacement for the picker) -->
      <div v-if="isWeekFinal" class="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded text-[8px] font-black text-emerald-600 uppercase tracking-widest">
        Official Results
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i" class="h-16 bg-white dark:bg-slate-900 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800"></div>
    </div>

    <!-- Results List -->
    <div v-else class="space-y-1.5">
      <div 
        v-for="(entry, index) in sortedLeaderboard" 
        :key="entry.id" 
        @click="openRecap(entry)"
        class="group flex items-center justify-between p-2.5 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all active:scale-[0.99] cursor-pointer"
      >
        <div class="flex items-center gap-4">
          <!-- Rank Badge: Highlight Top 6 -->
          <div class="w-8 h-8 flex items-center justify-center rounded-full font-black text-[12px]" 
               :class="index < 6 ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'">
            {{ index + 1 }}
          </div>

          <div>
            <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-s tracking-tight">
              {{ entry.playerName }}
            </p>
            <!-- Subtitle with Gross and Index -->
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Gross: {{ entry.totalScore }} • Index: {{ entry.hcpIndex.toFixed(3) }}
            </p>
          </div>
        </div>

        <!-- Net Score (Primary Value) -->
        <div class="text-right flex items-center gap-3">
          <div>
            <p class="text-xl font-black text-emerald-600 tabular-nums leading-none">
              {{ entry.netScore.toFixed(3) }}
            </p>
            <p class="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Net</p>
          </div>
          <Icon name="mdi:chevron-right" class="text-slate-300 group-hover:text-emerald-500 size-4" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div v-click-outside="() => isModalOpen = false" class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
          
          <!-- Modal Header -->
          <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
            <div>
              <h3 class="text-xl font-black text-emerald-600 uppercase tracking-tight">{{ selectedRound.playerName }}</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ selectedRound.courseName }}</p>
            </div>
            <button @click="isModalOpen = false" class="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
          </div>
          <!-- Scorecard Grid -->
          <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div v-for="side in ['front', 'back']" :key="side">
              <div class="flex justify-between items-center mb-3">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ side }} 9</span>
                <span class="text-xs font-bold text-emerald-600">Total: {{ side === 'front' ? modalFront : modalBack }}</span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div v-for="n in 9" :key="n" class="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                  <div class="text-[8px] text-slate-400 font-bold">H{{ side === 'front' ? n : n + 9 }}</div>
                  <div class="text-lg font-black text-slate-800 dark:text-slate-100">
                    {{ selectedRound.scores[(side === 'front' ? n : n + 9) - 1] || '-' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary Bar -->
            <div class="flex gap-3 pt-2">
              <div class="flex-1 bg-emerald-600 p-4 rounded-2xl text-white text-center">
                <p class="text-[8px] font-black uppercase opacity-70">Gross</p>
                <p class="text-2xl font-black">{{ selectedRound.totalScore }}</p>
              </div>
              <div class="flex-1 bg-slate-900 p-4 rounded-2xl text-white text-center">
                <p class="text-[8px] font-black uppercase opacity-70">Net</p>
                <p class="text-2xl font-black">{{ selectedRound.netScore.toFixed(3) }}</p>
              </div>
            </div>
          </div>

          <button @click="isModalOpen = false" class="w-full py-4 bg-slate-100 dark:bg-slate-800 font-bold text-xs uppercase tracking-widest">Close</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { collectionGroup, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const route = useRoute();
const { $db } = useNuxtApp();

const viewMode = ref('net');
const leaderboard = ref([]);
const loading = ref(true);

const selectedRound = ref(null); // Tracks the round for the modal
const selectedCourseData = ref(null);
const selectedTeeData = ref(null);
const isModalOpen = ref(false);

const openRecap = async (round) => {
  selectedRound.value = round;
  isModalOpen.value = true;
};

// Subtotals for the modal
const modalFront = computed(() => selectedRound.value?.scores?.slice(0, 9).reduce((a, b) => a + (b || 0), 0) || 0);
const modalBack = computed(() => selectedRound.value?.scores?.slice(9, 18).reduce((a, b) => a + (b || 0), 0) || 0);

const fetchLeaderboard = async () => {
  try {
    loading.value = true;
    
    // 1. Fetch coursesMap once at the start
    const coursesMap = await fetchFullCourseData($db);

    const leagueSnap = await getDoc(doc($db, "leagues", route.params.id));
    const leagueIDString = leagueSnap.data()?.leagueID;

    const calSnap = await getDocs(query(
      collection($db, "leagues", route.params.id, "calendar"), 
      where("iso", "==", route.params.date)
    ));
    
    if (calSnap.empty) return;
    const isWeekFinal = calSnap.docs[0].data().status === 'mdi-check-bold';

    const roundsSnap = await getDocs(query(
      collectionGroup($db, "rounds"),
      where("type", "==", leagueIDString),
      where("iso", "==", route.params.date)
    ));

    const rawResults = roundsSnap.docs.map((rDoc) => {
      const roundData = rDoc.data();
      const pData = roundData.playerData || {}; // Assuming you have player names in the round or fetching separately
      
      const scores = roundData.scores || [];
      const grossScore = scores.reduce((a, b) => a + b, 0);
      const hcpIndex = roundData.index || 0;
      
      // Calculate Net: Gross - Index
      const netScore = grossScore - hcpIndex;

      return {
        id: rDoc.id,
        playerName: roundData.name || "Unknown", // Adjust based on your data structure
        scores,
        totalScore: grossScore,
        hcpIndex: hcpIndex,
        netScore: netScore, 
        courseName: roundData.course,
      };
    });

    // Apply the mdi-check-bold filter
    if (isWeekFinal) {
      leaderboard.value = rawResults.filter(entry => 
        entry.scores.length > 0 && !entry.scores.includes(0)
    )};

  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Handle sorting toggle between Net and Gross
const sortedLeaderboard = computed(() => {
  return [...leaderboard.value].sort((a, b) => {
    return viewMode.value === 'net' 
      ? a.netScore - b.netScore 
      : a.totalScore - b.totalScore;
  });
});

onMounted(fetchLeaderboard);

const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });
};
</script>

<style>
@reference "../assets/css/main.css";
</style>