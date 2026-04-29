<template>
  <div class="max-w-2xl mx-auto select-none pb-32 pt-8 px-4">
    <div class="card-base p-8 flex flex-col items-center text-center gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-900">
      
      <div class="space-y-2">
        <h1 class="text-3xl font-black text-primary">Database Migration</h1>
        <p class="text-secondary text-sm">Player Archive Cleanup (2025+ Activity)</p>
      </div>

      <div v-if="status === 'idle'" class="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 p-4 rounded-xl text-xs max-w-md border border-amber-200 dark:border-amber-800/50">
        This will scan all players. If their leagues array is empty OR they have no rounds since Jan 1, 2025, they will be marked as inactive.
      </div>

      <div v-if="status === 'running'" class="flex flex-col items-center gap-4 py-4">
        <Icon name="mdi:loading" class="size-10 text-emerald-500 animate-spin" />
        <p class="text-emerald-600 font-black tracking-widest text-xs uppercase animate-pulse">
          Processing {{ processedCount }} / {{ totalCount }} Players...
        </p>
      </div>

      <div v-if="status === 'complete'" class="flex flex-col items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 w-full p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
        <Icon name="mdi:check-circle" class="size-12 text-emerald-500" />
        
        <div class="grid grid-cols-2 gap-8 w-full max-w-xs mt-2">
          <div class="flex flex-col items-center">
            <span class="text-4xl font-black text-emerald-600 tabular-nums italic">{{ activeCount }}</span>
            <span class="text-[10px] font-black uppercase text-emerald-800/50 dark:text-emerald-200/50 tracking-widest mt-1">Active</span>
          </div>
          
          <div class="flex flex-col items-center border-l border-emerald-200 dark:border-emerald-800/50">
            <span class="text-4xl font-black text-amber-500 tabular-nums italic">{{ archivedCount }}</span>
            <span class="text-[10px] font-black uppercase text-amber-700/50 dark:text-amber-300/50 tracking-widest mt-1">Archived</span>
          </div>
        </div>
      </div>

      <button 
        v-if="status === 'idle'"
        @click="runMigration" 
        class="mt-4 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all w-full sm:w-auto"
      >
        Begin Migration
      </button>
      
      <button 
        v-if="status === 'complete'"
        @click="status = 'idle'" 
        class="mt-4 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
      >
        Reset
      </button>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { useNuxtApp } from '#imports';

const { $db } = useNuxtApp();

const status = ref('idle'); // idle, running, complete
const totalCount = ref(0);
const processedCount = ref(0);
const activeCount = ref(0);
const archivedCount = ref(0);

const runMigration = async () => {
  // Reset state
  status.value = 'running';
  processedCount.value = 0;
  activeCount.value = 0;
  archivedCount.value = 0;

  try {
    const playersRef = collection($db, 'players');
    const playersSnap = await getDocs(playersRef);
    
    totalCount.value = playersSnap.size;

    let batch = writeBatch($db);
    let batchCount = 0;

    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data();
      const playerId = playerDoc.id;
      let shouldArchive = false;

      // Condition 1: Empty or missing leagues array
      if (!data.leagues || !Array.isArray(data.leagues) || data.leagues.length === 0) {
        shouldArchive = true;
      } else {
        // Condition 2: No rounds with iso >= 2025-01-01 in their specific subcollection
        const roundsRef = collection($db, 'players', playerId, 'rounds');
        const roundsQuery = query(
          roundsRef,
          where('iso', '>=', '2025-01-01')
        );
        
        const roundsSnap = await getDocs(roundsQuery);
        
        if (roundsSnap.empty) {
          shouldArchive = true;
        }
      }

      // If they shouldn't be archived, they are active
      const newActiveState = !shouldArchive;

      // Log it for the UI totals
      newActiveState ? activeCount.value++ : archivedCount.value++;

      // Only queue a database write if the field actually needs to change or be created
      if (data.active !== newActiveState) {
        batch.update(doc($db, 'players', playerId), { active: newActiveState });
        batchCount++;

        // Commit if we hit the 500 limit just to be safe
        if (batchCount === 500) {
          await batch.commit();
          batch = writeBatch($db);
          batchCount = 0;
        }
      }

      processedCount.value++;
    }

    // Commit any remaining updates left in the queue
    if (batchCount > 0) {
      await batch.commit();
    }

    status.value = 'complete';

  } catch (error) {
    console.error("Migration failed:", error);
    alert("An error occurred. Check the console for details.");
    status.value = 'idle';
  }
};
</script>