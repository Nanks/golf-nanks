<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24 max-w-2xl mx-auto space-y-8">
    <button @click="migrateCalendarDocuments($db)" class="bg-emerald-600 text-white p-3 rounded-xl">
      Update calendars
    </button>

  </div>
</template>

<script setup>
import { collection, getDocs, writeBatch } from "firebase/firestore";

const migrateCalendarDocuments = async ($db) => {
  try {
    console.log("Starting database migration (Rule-Friendly Version)...");

    // 1. Build the League Dictionary
    const leagueMap = {};
    const leaguesSnap = await getDocs(collection($db, "leagues"));
    leaguesSnap.forEach(d => {
      const data = d.data();
      if (data.leagueID) { 
        leagueMap[data.leagueID] = d.id;
      }
    });

    // 2. Build the Course and Tees Dictionaries
    const courseMap = {}; 
    const teesMap = {};   

    const coursesSnap = await getDocs(collection($db, "courses"));
    for (const cDoc of coursesSnap.docs) {
      courseMap[cDoc.data().name] = cDoc.id;
      teesMap[cDoc.id] = {};

      const tSnap = await getDocs(collection($db, `courses/${cDoc.id}/tees`));
      tSnap.forEach(tDoc => {
        teesMap[cDoc.id][tDoc.data().name] = tDoc.id;
      });
    }

    // 3. Loop through each League to get Calendars (Bypasses collectionGroup!)
    const batch = writeBatch($db);
    let updateCount = 0;

    for (const leagueDoc of leaguesSnap.docs) {
      // This matches your existing rule: /leagues/{leagueId}/calendar/{entryId}
      const calendarSnap = await getDocs(collection($db, `leagues/${leagueDoc.id}/calendar`));
      
      calendarSnap.forEach(calDoc => {
        const data = calDoc.data();
        const updates = {};
        let needsUpdate = false;

        // Match League ID
        if (data.type && leagueMap[data.type]) {
          updates.leagueID = leagueMap[data.type];
          needsUpdate = true;
        }

        // Match Course ID
        if (data.course && courseMap[data.course]) {
          updates.courseID = courseMap[data.course];
          needsUpdate = true;
        }

        // Match Tees ID
        const targetCourseId = updates.courseID || data.courseID;
        if (targetCourseId && data.tees && teesMap[targetCourseId]?.[data.tees]) {
          updates.teesID = teesMap[targetCourseId][data.tees];
          needsUpdate = true;
        }

        // Add to batch if we found matches
        if (needsUpdate) {
          batch.update(calDoc.ref, updates);
          updateCount++;
        }
      });
    }

    // 4. Execute the changes
    if (updateCount > 0) {
      await batch.commit();
      console.log(`Success! Updated ${updateCount} calendar documents. ⛳`);
    } else {
      console.log("All calendar documents are already up to date!");
    }

  } catch (error) {
    console.error("Error migrating calendar documents:", error);
  }
};
</script>
