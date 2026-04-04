<template>
  <div class="p-6 max-w-3xl mx-auto pt-20">
    <!-- Header -->
    <header class="mb-8">
      <NuxtLink :to="`/leagues/${route.params.id}`" class="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
        ← Back to Dates
      </NuxtLink>
      <div class="flex justify-between items-end mt-2">
        <div>
          <h1 class="text-3xl font-black text-emerald-600 tracking-tighter uppercase">Leaderboard</h1>
          <p class="text-slate-500 font-medium">{{ formatDate(route.params.date) }}</p>
        </div>
        
        <!-- Gross/Net Toggle -->
        <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            @click="viewMode = 'gross'" 
            :class="viewMode === 'gross' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'" 
            class="px-4 py-2 rounded-lg font-bold text-xs uppercase transition"
          >
            Gross
          </button>
          <button 
            @click="viewMode = 'net'" 
            :class="viewMode === 'net' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'" 
            class="px-4 py-2 rounded-lg font-bold text-xs uppercase transition"
          >
            Net
          </button>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-20 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-2xl"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="leaderboard.length === 0" class="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
      <p class="text-slate-400 italic">No rounds recorded for this date yet.</p>
    </div>

    <!-- Results List -->
    <div v-else class="space-y-3">
      <div 
        v-for="(entry, index) in sortedLeaderboard" 
        :key="entry.id" 
        @click.stop="openRecap(entry)"
        class="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <!-- Rank Badge -->
        <div class="w-10 h-10 flex items-center justify-center rounded-full font-black text-sm" 
             :class="index < 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'">
          {{ index + 1 }}
        </div>

        <!-- Player Info -->
        <div class="flex-1">
          <p class="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            {{ entry.playerName }}
          </p>
          <p class="text-[10px] text-slate-400 font-bold uppercase">
            HCP Index: {{ entry.hcpIndex.toFixed(3) }} • {{ entry.courseName }}
          </p>
        </div>

        <!-- Score Display -->
        <div class="text-right">
          <p class="text-2xl font-black text-emerald-600 tabular-nums">
            {{ viewMode === 'net' ? entry.netScore.toFixed(3) : entry.totalScore }}
          </p>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {{ viewMode }}
          </p>
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
    // 1. Get League Data (for leagueID string)
    const leagueSnap = await getDoc(doc($db, "leagues", route.params.id));
    if (!leagueSnap.exists()) return;
    const leagueIDString = leagueSnap.data().leagueID;

    // 2. Fetch the specific Calendar event status for this date
    let isChecked = false;
    const calRef = collection($db, "leagues", route.params.id, "calendar");
    const calQuery = query(calRef, where("iso", "==", route.params.date));
    const calSnap = await getDocs(calQuery);
    
    if (calSnap.empty) {
      console.warn("No calendar entry found for this date.");
      loading.value = false;
      return;
    }

    const scheduledEvent = calSnap.docs[0].data();
    // These fields in your calendar must match the IDs in your 'courses' collection
    const scheduledCourseName = scheduledEvent.course; 
    const scheduledTeeName = scheduledEvent.tees;

    const courseRef = collection($db, "courses")
    const courseQuery = query(courseRef, where("name", "==", scheduledCourseName)) 
    const courseSnap = await getDocs(courseQuery);
    if (!courseSnap.empty) {
      selectedCourseData.value = { id: courseSnap.docs[0].id, ...courseSnap.docs[0].data() };
      
      const teesRef = collection($db, "courses", courseSnap.docs[0].id, "tees");
      const teeQuery = query(teesRef, where("name", "==", scheduledTeeName));
      const teeSnap = await getDocs(teeQuery);
      if (!teeSnap.empty) {
        selectedTeeData.value = teeSnap.docs[0].data();
      }
    }

    // 3. Query Rounds
    const roundsRef = collectionGroup($db, "rounds");
    const q = query(
      roundsRef, 
      where("type", "==", leagueIDString), 
      where("iso", "==", route.params.date)
    );

    const querySnapshot = await getDocs(q);
    
    const rawRounds = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const scores = Array.isArray(data.scores) ? data.scores : [];
      
      // Calculate total
      const gross = scores.reduce((a, b) => a + (b || 0), 0);
      const hcp = parseFloat(data.index || 0);

      return {
        roundId: doc.id,
        playerName: data.name || 'Unknown',
        courseName: data.course || '',
        course: selectedCourseData,
        tees: selectedTeeData,
        scores: data.scores,
        totalScore: gross,
        hcpIndex: hcp,
        netScore: gross - hcp,
        hasZeroScore: scores.some(s => s === 0) // Check if any hole is 0
      };
    });

    // 4. Apply the conditional filter
    if (isChecked) {
      // If status is mdi-check-bold, remove players with any 0 scores
      leaderboard.value = rawRounds.filter(r => !r.hasZeroScore);
    } else {
      leaderboard.value = rawRounds;
    }

  } catch (err) {
    console.error("Leaderboard error:", err);
  } finally {
    loading.value = false;
  }
};

// Handle sorting toggle between Net and Gross
const sortedLeaderboard = computed(() => {
  const field = viewMode.value === 'net' ? 'netScore' : 'totalScore';
  return [...leaderboard.value].sort((a, b) => a[field] - b[field]);
});

onMounted(fetchLeaderboard);

const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });
};
</script>