<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24 max-w-2xl mx-auto space-y-8">
    <header>
      <NuxtLink to="/leagues/I7LCsEb1va49YU1lkRmu/menu" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
        ← Back to Menu
      </NuxtLink>
      <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-2 leading-none">
        Full Season Calculations
      </h1>
      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
        All weeks for League I7LCs...
      </p>
        <button 
          @click="syncToWeeklyStats" 
          :disabled="loading || calculatedWeeks.length === 0"
          class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 disabled:bg-slate-300 transition"
        >
          Sync to WeeklyStats
        </button>
    </header>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-32 bg-white dark:bg-slate-900 animate-pulse rounded-3xl border border-slate-200 dark:border-slate-800"></div>
    </div>

    <div v-else class="space-y-6">
      <section v-for="week in calculatedWeeks" :key="week.iso" class="space-y-3">
        <h2 class="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight ml-1">
          {{ formatDate(week.iso) }} — {{ week.location || 'TBD' }}
        </h2>
        
        <div class="grid gap-2">
          <div v-for="player in week.players" :key="player.id" 
               class="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-tight">
                {{ player.name }}
              </p>
              <div class="flex gap-2 mt-1">
                <span class="text-[9px] font-bold text-slate-400 uppercase">Birds: {{ player.birds.toFixed(1) }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase">Deuces: {{ player.deuces }}</span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-black text-emerald-600 leading-none">{{ player.chicago }}</p>
              <p class="text-[8px] font-black text-slate-400 uppercase mt-1">Chicago</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, query, where, getDocs, doc, getDoc, collectionGroup, writeBatch } from "firebase/firestore";
import { calcBirds, calcDeuces, calcChicago } from '~/utils/gameLogic';
import { fetchFullCourseData } from '~/utils/handicap';

const { $db } = useNuxtApp();
const loading = ref(true);
const calculatedWeeks = ref<any[]>([]);
const leagueDocId = "fGi9I5ISmgoeYoVuOfvt";

const loadAllWeeks = async () => {
  try {
    const coursesMap = await fetchFullCourseData($db);

    const leagueSnap = await getDoc(doc($db, "leagues", leagueDocId));
    const targetLeagueId = leagueSnap.data()?.leagueID;

    const calSnap = await getDocs(collection($db, "leagues", leagueDocId, "calendar"));
    
    // 1. FILTER: Only keep weeks that are finalized (mdi-check-bold)
    const calendarItems = calSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(item => 
        typeof item.iso === 'string' && 
        item.status === 'mdi-check-bold' // This ignores "HCP Only" or "Pending"
      )
      .sort((a, b) => b.iso.localeCompare(a.iso));

    // 2. Fetch rounds only for those specific finalized weeks
    const results = await Promise.all(calendarItems.map(async (cal) => {
      const roundsQuery = query(
        collectionGroup($db, "rounds"),
        where("type", "==", targetLeagueId),
        where("iso", "==", cal.iso)
      );
      const roundsSnap = await getDocs(roundsQuery);

      const playerResults = await Promise.all(roundsSnap.docs.map(async (rDoc) => {
        const roundData = rDoc.data();
        const playerSnap = await getDoc(rDoc.ref.parent.parent!);
        const pData = playerSnap.data();
        const teeData = coursesMap.get(roundData.course)?.tees[roundData.tees];

        if (!teeData) return null;

        // Pass 'cal' into these helpers to handle double-downs or multipliers
        const birds = calcBirds(roundData, cal, teeData).reduce((a, b) => a + b, 0);
        const deuces = calcDeuces(roundData, teeData).reduce((a, b) => a + b, 0);
        const chicago = calcChicago(roundData, teeData).reduce((a, b) => a + b, 0);

        return {
          id: playerSnap.id,
          name: `${pData?.fname} ${pData?.lname}`,
          birds,
          deuces,
          chicago
        };
      }));

      return {
        iso: cal.iso,
        location: cal.location,
        players: playerResults.filter(p => p !== null).sort((a, b) => b.birds - a.birds)
      };
    }));

    calculatedWeeks.value = results;
  } catch (err) {
    console.error("Error loading full season data:", err);
  } finally {
    loading.value = false;
  }
};

const syncToWeeklyStats = async () => {
  const batch = writeBatch($db);
  let totalWrites = 0;

  try {
    calculatedWeeks.value.forEach((week) => {
      week.players.forEach((player: any) => {
        // Create a unique ID for this player's week to prevent duplicates
        // Format: PLAYERID_ISO (e.g., "p123_2025-05-15")
        const statsId = `${player.id}_${week.iso}`;
        const statsRef = doc($db, "leagues", leagueDocId, "weeklyStats", statsId);

        batch.set(statsRef, {
          playerId: player.id,
          playerName: player.name,
          iso: week.iso,
          birds: player.birds,
          deuces: player.deuces,
          chicago: player.chicago,
          updatedAt: new Date()
        }, { merge: true }); // Merge ensures we don't overwrite if other data exists

        totalWrites++;
      });
    });

    // Firestore batches have a 500-write limit
    // If your league is huge, you'd need to split this into multiple batches
    await batch.commit();
    alert(`Successfully synced ${totalWrites} stats records!`);
  } catch (err) {
    console.error("Batch sync failed:", err);
    alert("Sync failed. Check console for details.");
  }
};

const formatDate = (iso: string) => {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

onMounted(loadAllWeeks);
</script>
