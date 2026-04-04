<template>
  <div class="min-h-screen p-6 max-w-xl mx-auto pt-20">
    <header class="mb-8">
      <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter">New Round</h1>
      <p class="text-slate-400 text-sm font-bold uppercase tracking-widest">Select Group (Max 5)</p>
    </header>

    <!-- Search Input -->
    <div class="relative mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search players..." 
        class="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 transition"
      />
    </div>

    <!-- Selected Players Chips -->
    <div v-if="selectedPlayers.length > 0" class="flex flex-wrap gap-2 mb-6">
      <div v-for="player in selectedPlayers" :key="player.id" 
           class="flex items-center gap-2 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase">
        {{ player.name }}
        <button @click="togglePlayer(player)" class="hover:text-emerald-200">&times;</button>
      </div>
    </div>

    <!-- Player List -->
    <div v-if="loading" class="space-y-3 animate-pulse">
      <div v-for="i in 5" :key="i" class="h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl"></div>
    </div>

    <div v-else class="space-y-2 mb-24">
      <button 
        v-for="player in filteredPlayers" 
        :key="player.id"
        @click="togglePlayer(player)"
        :class="isSelected(player.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'"
        class="w-full flex items-center justify-between p-4 rounded-2xl border transition text-left"
      >
        <div>
          <p class="font-bold text-slate-800 dark:text-slate-100 uppercase">{{ player.name }}</p>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Index: {{ player.hcpIndex }}</p>
        </div>
        <div v-if="isSelected(player.id)" class="text-emerald-600 font-black">✓</div>
      </button>
    </div>

    <!-- Sticky Start Button -->
    <div class="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-slate-950 via-white dark:via-slate-950 to-transparent">
      <button 
        @click="startRound"
        :disabled="selectedPlayers.length === 0"
        class="w-full max-w-xl mx-auto block py-4 bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 transition active:scale-95 uppercase tracking-widest"
      >
        Start Round ({{ selectedPlayers.length }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { collection, query, where, getDocs } from "firebase/firestore";

const route = useRoute();
const router = useRouter();
const { $db } = useNuxtApp();

const loading = ref(true);
const searchQuery = ref('');
const allPlayers = ref([]);
const selectedPlayers = ref([]);

// Filter players locally for fast searching
const filteredPlayers = computed(() => {
  const queryText = searchQuery.value.toLowerCase();
  return allPlayers.value.filter(p => p.name.toLowerCase().includes(queryText));
});

const isSelected = (id) => selectedPlayers.value.some(p => p.id === id);

const togglePlayer = (player) => {
  if (isSelected(player.id)) {
    selectedPlayers.value = selectedPlayers.value.filter(p => p.id !== player.id);
  } else if (selectedPlayers.value.length < 5) {
    selectedPlayers.value.push(player);
  }
};

const fetchData = async () => {
  try {
    const q = query(
      collection($db, "players"), 
      where("leagues", "array-contains", route.query.leagueId)
    );
    const snap = await getDocs(q);
    allPlayers.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } finally {
    loading.value = false;
  }
};

const startRound = () => {
  const playerIds = selectedPlayers.value.map(p => p.id).join(',');
  router.push({
    path: `/scorecard/${route.query.date}`,
    query: {
      ...route.query,
      players: playerIds
    }
  });
};

onMounted(fetchData);
</script>
