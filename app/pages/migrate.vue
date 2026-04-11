<template>
  <div class="min-h-screen bg-slate-950 text-white p-10 flex flex-col items-center justify-center">
    <div class="max-w-md w-full bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl text-center">
      <h1 class="text-2xl font-black uppercase italic mb-2 tracking-tighter">Year Migration</h1>
      <p class="text-slate-400 text-xs mb-8 uppercase tracking-widest">Target League: I7LCsEb1va49YU1lkRmu</p>

      <div v-if="status === 'idle'">
        <button 
          @click="runMigration" 
          class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20"
        >
          Fix 2026 Data Types
        </button>
      </div>

      <div v-if="status === 'running'" class="py-6">
        <Icon name="svg-spinners:ring-resize" class="size-10 text-emerald-500 mb-4 mx-auto" />
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 animate-pulse">
          Updating {{ processedCount }} Docs...
        </p>
      </div>

      <div v-if="status === 'complete'">
        <div class="size-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="mdi:check-bold" class="size-6" />
        </div>
        <p class="font-black uppercase text-emerald-500 mb-1">Migration Successful</p>
        <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-8">{{ processedCount }} entries moved to String format</p>
        <button @click="router.push('/leagues/I7LCsEb1va49YU1lkRmu/calendar')" class="text-[10px] font-black text-slate-400 hover:text-white underline uppercase tracking-widest transition-colors">
          Verify Calendar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
const { $db } = useNuxtApp();
const router = useRouter();

const status = ref('idle');
const processedCount = ref(0);

const runMigration = async () => {
  status.value = 'running';
  
  try {
    // Target the specific league's calendar
    const calendarPath = "leagues/I7LCsEb1va49YU1lkRmu/calendar";
    const calendarRef = collection($db, calendarPath);

    // Query specifically for Number 2026
    const q = query(calendarRef, where("year", "==", 2026));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No Number-based 2026 docs found.");
      status.value = 'complete';
      return;
    }

    const updatePromises = querySnapshot.docs.map(async (d) => {
      await updateDoc(d.ref, {
        year: "2026" // Convert to string
      });
      processedCount.value++;
    });

    await Promise.all(updatePromises);
    status.value = 'complete';

  } catch (err) {
    console.error("Migration Error:", err);
    alert("Check console for error details.");
    status.value = 'idle';
  }
};
</script>