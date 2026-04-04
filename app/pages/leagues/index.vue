<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-3xl font-black text-emerald-600 mb-8">LEAGUES</h1>
    
    <div v-if="leagues.length === 0" class="text-slate-400 italic py-10 text-center">
      No leagues found.
    </div>

    <div v-else class="grid gap-4">
      <!-- Clicking a league navigates to /leagues/[id] -->
      <NuxtLink 
        v-for="league in leagues" 
        :key="league.id" 
        :to="`/leagues/${league.id}`"
        class="block p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition shadow-sm group"
      >
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold group-hover:text-emerald-600 transition">{{ league.name }}</h2>
            <p class="text-xs text-slate-400 uppercase font-black tracking-widest">{{ league.leagueID }}</p>
          </div>
          <span class="text-slate-300">→</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { collection, getDocs } from "firebase/firestore";
const { $db } = useNuxtApp();
const leagues = ref([]);

onMounted(async () => {
  const querySnapshot = await getDocs(collection($db, "leagues"));
  leagues.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
</script>
