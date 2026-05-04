const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = getFirestore();

exports.archiveLeagueRound = onDocumentUpdated("leagues/{leagueId}/calendar/{eventId}", async (event) => {
  const newValue = event.data.after.data();
  const previousValue = event.data.before.data();

  // Guard clause: Only run if the status JUST changed to 'complete'
  if (previousValue.status === "complete" || newValue.status !== "complete") {
    return null; 
  }

  const leagueId = event.params.leagueId;
  const eventId = event.params.eventId;
  const batch = db.batch();

  try {
    // 1. Find ALL active live_rounds for this league and date
    const liveRoundsQuery = await db.collection("live_rounds")
      .where("leagueId", "==", leagueId)
      .where("iso", "==", newValue.iso)
      .get();

    if (liveRoundsQuery.empty) {
      console.log(`No active live_rounds found for League ${leagueId} on ${newValue.iso}`);
      return { success: false, message: "No live rounds to archive." };
    }

    let operationCount = 0; // Track operations to ensure we don't hit the Firestore 500 batch limit

    // 2. Loop through EVERY live round found for this event
    liveRoundsQuery.forEach((liveRoundDoc) => {
      const roundData = liveRoundDoc.data();
      const roundId = liveRoundDoc.id;

      // 3. Loop through players in this specific group
      if (Array.isArray(roundData.players)) {
        roundData.players.forEach((player) => {
          const playerId = player.id;
          if (!playerId) return;

          const playerRoundRef = db.collection(`players/${playerId}/rounds`).doc(roundId);
          const playerScores = roundData.scores?.[playerId] || Array(roundData.holes || 18).fill(0);

          const historicalData = {
            course: roundData.course || null,
            courseId: roundData.courseId || null,
            leagueId: roundData.leagueId || null,
            iso: roundData.iso || null,
            type: roundData.type || null,
            
            name: `${player.fname} ${player.lname}`.trim(),
            playerKey: player.id,
            index: player.index,
            ghin: player.ghin,
            tee_type: player.tee_type,
            tees: player.tees,
            teesId: player.teesId,
            
            scores: playerScores,
            status: "end", // Legacy status compatibility
            createdAt: FieldValue.serverTimestamp(),
            eventId: eventId,
            
            courseSnapshot: roundData.courseSnapshot || null
          };

          batch.set(playerRoundRef, historicalData);
          operationCount++;
        });
      }

      // 4. Delete this specific live_round document
      batch.delete(liveRoundDoc.ref);
      operationCount++;
    });

    // 5. Commit all writes and deletes simultaneously
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Successfully archived ${liveRoundsQuery.size} groups (Total operations: ${operationCount})`);
    }

    return { success: true };

  } catch (error) {
    console.error(`Failed to process event completion for event ${eventId}:`, error);
    throw new Error("Failed to archive league rounds.");
  }
});