import { writeBatch, query, collection, where, getDocs, doc } from 'firebase/firestore';

export const getLocalIsoDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export const completeLeagueEvent = async (db, leagueId, iso) => {
  // 1. Query the Calendar Event by ISO to get the REAL document ID
  const calQuery = query(
    collection(db, 'leagues', leagueId, 'calendar'), 
    where('iso', '==', iso)
  );
  const calSnap = await getDocs(calQuery);

  if (calSnap.empty) {
    throw new Error(`Cannot lock event: No calendar event found for ${iso}.`);
  }
  
  const calendarDocId = calSnap.docs[0].id;

  // 2. Fetch all live rounds for this specific event
  const liveRoundsQuery = query(
    collection(db, 'live_rounds'),
    where('leagueId', '==', leagueId),
    where('iso', '==', iso)
  );
  
  const liveSnap = await getDocs(liveRoundsQuery);

  // 3. Setup safe batching (Limit 500)
  let batch = writeBatch(db);
  let batchCount = 0;

  const commitBatch = async () => {
    await batch.commit();
    batch = writeBatch(db);
    batchCount = 0;
  };

  // Lock the Calendar Event
  batch.update(doc(db, 'leagues', leagueId, 'calendar', calendarDocId), { status: 'complete' });
  batchCount++;

  if (liveSnap.empty) {
    console.warn("No live rounds found to migrate. Just locking the calendar.");
    await commitBatch();
    return;
  }

  // 4. Migrate each round to the player's subcollection
  for (const liveDoc of liveSnap.docs) {
    const roundData = liveDoc.data();
    
    // Save the round record for each player in that group
    for (const player of roundData.players) {
      const playerRoundRef = doc(collection(db, 'players', player.id, 'rounds'));
      
      batch.set(playerRoundRef, {
        ...roundData,
        isLive: false,
        completedAt: new Date().toISOString(),
        playerKey: player.id // FIXED: Using playerKey to match your archive queries
      });

      batchCount++;
      if (batchCount >= 450) await commitBatch(); // Commit early to be safe
    }

    // Queue the live_round for deletion
    batch.delete(liveDoc.ref);
    batchCount++;
    if (batchCount >= 450) await commitBatch();
  }

  // 5. Commit any remaining writes in the final batch
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`Successfully locked event ${iso} and migrated ${liveSnap.size} rounds.`);
};