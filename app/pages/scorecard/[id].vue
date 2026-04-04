<template>
  <div class="min-h-screen p-6 max-w-5xl mx-auto pt-20">
    <header class="mb-8 flex justify-between items-end">
      <div>
        <NuxtLink :to="`/leagues/${route.params.leagueId}`" class="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
          ← Back to League
        </NuxtLink>
        <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-2">Group Scorecard</h1>
        <p class="text-slate-400 text-sm font-bold uppercase tracking-widest">{{ formattedDate }}</p>
      </div>
      
      <div v-if="courseInfo" class="text-right">
        <p class="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{{ courseInfo.name }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ teeInfo.name }} Tees</p>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-64 bg-slate-100 dark:bg-slate-900 rounded-3xl"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <ScorecardGrid 
        :players="groupPlayers" 
        :pars="teeInfo.pars"
        @open-hole="openScoreModal" 
      />
    </div>

    <!-- Score Entry Modal -->
    <ScoreEntryModal 
      v-if="isModalOpen" 
      :hole-number="activeHole"
      :hole-par="teeInfo.pars[activeHole - 1]"
      :players="groupPlayers"
      @close="isModalOpen = false"
      @save="saveGroupScores"
    />
  </div>
</template>

<script setup>
import { collection, query, where, getDocs, doc, getDoc, writeBatch } from "firebase/firestore";

const route = useRoute();
const { $db } = useNuxtApp();

// State
const loading = ref(true);
const isModalOpen = ref(false);
const activeHole = ref(null);
const groupPlayers = ref([]);
const courseInfo = ref(null);
const teeInfo = ref(null);

const formattedDate = computed(() => {
  return new Date(route.params.id).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'long', day: 'numeric' 
  });
});

const fetchData = async () => {
  loading.value = true;
  try {
    // 1. Fetch Course & Tee Info (to get the Pars array)
    // Note: Adjust these based on how you passed the IDs in the URL or state
    const courseSnap = await getDoc(doc($db, "courses", route.query.courseId));
    const teeSnap = await getDoc(doc($db, "courses", route.query.courseId, "tees", route.query.teeId));
    
    courseInfo.value = courseSnap.data();
    teeInfo.value = teeSnap.data();

    // 2. Fetch Players in the active group
    // For this example, we assume group player IDs are passed in the query string: ?players=ID1,ID2
    const playerIds = route.query.players?.split(',') || [];
    
    const playersWithRounds = [];
    for (const pId of playerIds) {
      const pSnap = await getDoc(doc($db, "players", pId));
      const rSnap = await getDoc(doc($db, "players", pId, "rounds", route.params.id));
      
      if (pSnap.exists()) {
        playersWithRounds.push({
          id: pId,
          name: pSnap.data().name,
          scores: rSnap.exists() ? rSnap.data().scores : new Array(18).fill(0)
        });
      }
    }
    groupPlayers.value = playersWithRounds;
  } catch (err) {
    console.error("Error loading scorecard data:", err);
  } finally {
    loading.value = false;
  }
};

const openScoreModal = (holeNum) => {
  activeHole.value = holeNum;
  isModalOpen.value = true;
};

const saveGroupScores = async ({ holeIndex, newScores }) => {
  const batch = writeBatch($db);

  try {
    groupPlayers.value.forEach(player => {
      const score = newScores[player.id];
      const playerRoundRef = doc($db, "players", player.id, "rounds", route.params.id);
      
      // Update local state for reactivity
      player.scores[holeIndex] = score;

      // Add to Firestore Batch
      batch.set(playerRoundRef, { 
        scores: player.scores,
        date: route.params.id,
        courseName: courseInfo.value.name 
      }, { merge: true });
    });

    await batch.commit();
    isModalOpen.value = false;
  } catch (err) {
    console.error("Batch save failed:", err);
    alert("Failed to save scores. Please try again.");
  }
};

onMounted(fetchData);
</script>
