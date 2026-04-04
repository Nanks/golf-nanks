<template>
  <div class="p-10">
    <button @click="updateMeadowbrookTees" class="bg-emerald-600 text-white p-4 rounded">
      Run MB tees Migration
    </button>
  </div>
</template>

<script setup>
// import { initializeApp, getApp, getApps } from "firebase/app";
import { collectionGroup, query, where, getDocs, writeBatch, doc } from "firebase/firestore";

// Temporary config for your old project
// const secondaryConfig = {
//   apiKey: "AIzaSyBjNPRtvVd3wKwXl1BTQYeH3BG8wiJCN3I",
//   authDomain: "golf-group.firebaseapp.com",
//   databaseURL: "https://golf-group.firebaseio.com",
//   projectId: "golf-group",
//   storageBucket: "golf-group.appspot.com",
//   messagingSenderId: "110220444166",
//   appId: "1:110220444166:web:474b8b2dadd54d7cacf987",
//   measurementId: "G-8KH2Z4GRER"
// };

const updateMeadowbrookTees = async () => {
  const { $db } = useNuxtApp();
  console.log("🛠️ Starting Tee Name Update for Meadowbrook 2025...");

  // Mapping for tee name updates
  const teeMap = {
    "One": "1",
    "One Point Five": "1.5",
    "Two": "2",
    "Two Point Five": "2.5",
    "Three": "3",
    "Four": "4"
  };

  try {
    // 1. Query ALL 'rounds' collections for year 2025 and Meadowbrook
    const roundsRef = collectionGroup($db, "rounds");
    const q = query(
      roundsRef, 
      where("migratedYear", "==", "2025"), // Ensure this matches your data type (String "2025" or Number 2025)
      where("course", "==", "Meadowbrook")
    );

    const querySnapshot = await getDocs(q);
    console.log(`📍 Found ${querySnapshot.size} rounds to check.`);

    if (querySnapshot.empty) return;

    // 2. Initialize a batch for performance
    const batch = writeBatch($db);
    let updateCount = 0;

    querySnapshot.forEach((roundDoc) => {
      const data = roundDoc.data();
      const currentTee = data.tees;

      // 3. Check if the tee name exists in our mapping
      if (teeMap[currentTee]) {
        batch.update(roundDoc.ref, {
          tees: teeMap[currentTee]
        });
        updateCount++;
        console.log(`✅ Queued update for round ${roundDoc.id}: ${currentTee} -> ${teeMap[currentTee]}`);
      }
    });

    // 4. Commit the batch
    if (updateCount > 0) {
      await batch.commit();
      console.log(`🏁 Successfully updated ${updateCount} rounds!`);
    } else {
      console.log("ℹ️ No rounds matched the specific tee names provided.");
    }
  } catch (err) {
    console.error("❌ Update failed:", err.message);
  }
};
</script>
