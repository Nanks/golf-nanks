<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
    <div class="p-10 w-full max-w-xl text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl">
      
      <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon name="mdi:database-sync" class="size-8" />
      </div>

      <h1 class="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 tracking-tight">Database Migration</h1>
      <p class="text-sm text-slate-500 font-bold mb-8 leading-relaxed">
        This will sweep all archived rounds and inject the course snapshots so legacy data works with the new Leaderboard and Player History.
      </p>

      <button
        @click="runMigration"
        :disabled="isMigrating"
        class="w-full py-4 bg-emerald-600 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        <Icon v-if="isMigrating" name="mdi:loading" class="size-5 animate-spin" />
        {{ isMigrating ? 'Migrating Data...' : 'Run Migration' }}
      </button>

      <div v-if="message" class="mt-6 p-4 rounded-xl font-black text-sm uppercase tracking-widest" :class="message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { collection, collectionGroup, getDocs, updateDoc } from 'firebase/firestore';

const { $db } = useNuxtApp();
const isMigrating = ref(false);
const message = ref('');

const runMigration = async () => {
  isMigrating.value = true;
  message.value = "Fetching courses and tees subcollections...";

  try {
    // 1. Get all courses
    const coursesSnap = await getDocs(collection($db, "courses"));
    const courseDict = {};
    
    // 2. Loop through each course and manually fetch its 'tees' subcollection
    for (const courseDoc of coursesSnap.docs) {
      const courseData = courseDoc.data();
      const courseName = courseData.name;
      const teesObj = {};

      const teesSnap = await getDocs(collection($db, "courses", courseDoc.id, "tees"));
      teesSnap.forEach(teeDoc => {
        const teeData = teeDoc.data();
        // Use the tee's name field as the dictionary key
        const teeName = teeData.name || teeDoc.id; 
        teesObj[teeName] = teeData;
      });

      // Save the fully assembled tees object to our dictionary
      courseDict[courseName] = teesObj;
    }

    message.value = "Sweeping archived rounds and fixing empty snapshots...";

    // 3. Query ALL 'rounds' subcollections
    const roundsSnap = await getDocs(collectionGroup($db, "rounds"));
    let updatedCount = 0;
    let skippedCount = 0;

    for (const roundDoc of roundsSnap.docs) {
      const data = roundDoc.data();

      // 4. FIX PREVIOUS RUN: Only skip if the snapshot exists AND actually has tee data inside it
      const hasValidSnapshot = data.courseSnapshot && 
                               data.courseSnapshot.tees && 
                               Object.keys(data.courseSnapshot.tees).length > 0;

      if (hasValidSnapshot) {
        skippedCount++;
        continue;
      }

      // Find the course match in our newly built dictionary
      const matchedTees = courseDict[data.course] || {};

      // Overwrite the document
      await updateDoc(roundDoc.ref, {
        courseSnapshot: {
          tees: matchedTees
        }
      });

      updatedCount++;
    }

    message.value = `Success! Updated/Fixed ${updatedCount} rounds. Skipped ${skippedCount} valid rounds.`;
  } catch (error) {
    console.error("Migration failed:", error);
    message.value = "Error: Check console for details.";
  } finally {
    isMigrating.value = false;
  }
};
</script>