import { collection, query, where, getDocs, doc, writeBatch, updateDoc } from "firebase/firestore";

export const getLocalIsoDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export const completeLeagueEvent = async (db, leagueId, iso) => {
  const batch = writeBatch(db);

  // 1. Reference the Calendar Event to lock it
  const calendarRef = doc(db, 'leagues', leagueId, 'calendar', iso);
  batch.update(calendarRef, { status: 'complete' });

  // 2. Fetch all live rounds for this specific event
  const liveRoundsQuery = query(
    collection(db, 'live_rounds'),
    where('leagueId', '==', leagueId),
    where('iso', '==', iso)
  );
  
  const liveSnap = await getDocs(liveRoundsQuery);

  if (liveSnap.empty) {
    console.warn("No live rounds found to migrate.");
    await batch.commit(); // Still lock the calendar even if no rounds were played
    return;
  }

  // 3. Migrate each round to the player's subcollection
  liveSnap.docs.forEach((liveDoc) => {
    const roundData = liveDoc.data();
    
    // We assume each live_round document represents one group/scorecard 
    // but we need to save the round record for each player in that group
    roundData.players.forEach((player) => {
      const playerRoundRef = doc(collection(db, 'players', player.id, 'rounds'));
      
      batch.set(playerRoundRef, {
        ...roundData,
        // Ensure we strip out live-only metadata if necessary
        isLive: false,
        completedAt: new Date().toISOString(),
        playerId: player.id // Explicitly link the subcollection doc
      });
    });

    // 4. Queue the live_round for deletion
    batch.delete(liveDoc.ref);
  });

  // 5. Commit the entire transaction
  try {
    await batch.commit();
    console.log(`Successfully locked event ${iso} and migrated ${liveSnap.size} rounds.`);
  } catch (error) {
    console.error("Failed to complete league event:", error);
    throw error;
  }
};