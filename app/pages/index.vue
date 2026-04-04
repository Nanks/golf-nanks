<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24 max-w-2xl mx-auto space-y-10">
    
    <div v-if="isInitialLoading" class="p-20 text-center animate-pulse text-emerald-600 font-bold">
      SYNCING...
    </div>
    
    <div v-else class="space-y-10">
      <section v-if="player" class="space-y-6">
        <!-- Player Header Card -->
        <div class="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
          <div class="relative z-10 flex justify-between items-start">
            <div>
              <h1 class="text-3xl font-black uppercase tracking-tighter leading-none">
                {{ player.fname }}<br/>{{ player.lname }}
              </h1>
              <p class="text-[10px] font-bold opacity-80 uppercase tracking-[0.2em] mt-3">
                GHIN: {{ player.ghin || 'N/A' }} • {{ player.admin ? 'Admin' : 'Player' }}
              </p>
            </div>
            <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-md text-center min-w-[70px]">
              <p class="text-[8px] font-black uppercase opacity-70 mb-1">Leagues</p>
              <p class="text-xl font-black leading-none">{{ player.leagues?.length || 0 }}</p>
            </div>
          </div>
          <!-- Decorative subtle "G" or background shape -->
          <div class="absolute -right-4 -bottom-6 text-[120px] font-black opacity-10 select-none">G</div>
        </div>

        <!-- Player's Specific Leagues (Horizontal Scroll or List) -->
        <div v-if="myLeagues.length > 0">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">My Active Leagues</h3>
          <div class="grid gap-3">
            <NuxtLink 
              v-for="ml in myLeagues" :key="ml.id" :to="`/leagues/${ml.id}`"
              class="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all active:scale-[0.98]"
            >
              <span class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm">{{ ml.name }}</span>
              <div class="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-xs">→</div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <section>
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Leagues</h3>
        <div class="grid gap-3">
          <NuxtLink 
            v-for="league in allLeagues" 
            :key="league.id" 
            :to="`/leagues/${league.id}/menu`"
            class="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all active:scale-[0.98]"
          >
            <div>
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm tracking-tight">{{ league.name }}</p>
              <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {{ league.leagueID }}</p>
            </div>
            <div class="text-slate-300">→</div>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, where, getDocs, orderBy, documentId } from "firebase/firestore";

const { player, isLoggedIn, isInitialLoading, isAnyAdmin, isAdminOf } = useAuth();
const { $db } = useNuxtApp();

const allLeagues = ref<any[]>([]);
const myLeagues = ref<any[]>([]);
const loadingAll = ref(true);

// 1. Fetch Every League (Global List)
const fetchAllLeagues = async () => {
  try {
    const q = query(collection($db, "leagues"), orderBy("name"));
    const snap = await getDocs(q);
    allLeagues.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Error fetching all leagues:", e);
  } finally {
    loadingAll.value = false;
  }
};

// 2. Fetch only the logged-in player's specific leagues
const fetchMyLeagues = async () => {
  // Access the array from the player ref
  const leagueIds = player.value?.leagues;

  // IMPORTANT: Firestore 'in' query fails if the array is empty or undefined
  if (!leagueIds || leagueIds.length === 0) {
    myLeagues.value = [];
    return;
  }

  try {
    const q = query(
      collection($db, "leagues"), 
      where(documentId(), "in", leagueIds)
    );
    const snap = await getDocs(q);
    myLeagues.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Personal league fetch failed:", e);
  }
};

// 3. Orchestrate data fetching
onMounted(() => {
  fetchAllLeagues();
});

// Watch the player ref. When it changes from null -> Player, fetch their leagues.
watch(() => player.value, (newVal) => {
  if (newVal) {
    fetchMyLeagues();
  }
}, { immediate: true });
</script>

