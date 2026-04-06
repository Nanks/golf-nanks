// app/utils/adminActions.ts
import { writeBatch, doc, collection, query, where, getDocs } from "firebase/firestore";
import { calculateLeagueHandicap } from "./handicap";

export const finalizeEvent = async ($db: any, leagueDocId: string, eventIso: string) => {
  const batch = writeBatch($db);
  
  // 1. Mark event as finalized
  const eventRef = doc($db, "leagues", leagueDocId, "calendar", eventIso);
  batch.update(eventRef, { status: "mdi-check-bold" });

  // 2. Find all players in this league
  const playersQuery = query(collection($db, "players"), where("leagues", "array-contains", leagueDocId));
  const playersSnap = await getDocs(playersQuery);

  for (const playerDoc of playersSnap.docs) {
    const pData = playerDoc.data();
    
    // 3. Calculate new handicap based on the new finalized status
    const newHcp = await calculateLeagueHandicap($db, playerDoc.id, leagueDocId, pData.ghin || 0);

    // 4. Update Player's global league handicap
    batch.update(playerDoc.ref, { leagueHcp: newHcp });

    // // 5. Update the 'index' field in the current round for this event
    // const roundRef = doc($db, "players", playerDoc.id, "rounds", eventIso);
    // batch.update(roundRef, { index: newHcp });
  }

  await batch.commit();
};
