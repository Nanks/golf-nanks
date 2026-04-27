import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

/**
 * Locks a league event by updating its status to 'complete'
 */
export const completeLeagueEvent = async ($db, leagueId, iso) => {
  if (!leagueId || !iso) throw new Error("Missing required parameters to complete event.");

  const qEvent = query(collection($db, "leagues", leagueId, "calendar"), where("iso", "==", iso));
  const eventSnap = await getDocs(qEvent);
  
  if (!eventSnap.empty) {
    const eventDocId = eventSnap.docs[0].id;
    const eventRef = doc($db, "leagues", leagueId, "calendar", eventDocId);
    
    await updateDoc(eventRef, { 
      status: 'complete' 
    });
    
    return true;
  }
  
  throw new Error("Calendar event not found for this date.");
};