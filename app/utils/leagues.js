import { collection, getDocs } from "firebase/firestore";

export const fetchFullLeaguesData = async ($db) => {
  const leaguesMap = new Map();
  
  const leaguesSnap = await getDocs(collection($db, "leagues"));
  
  leaguesSnap.docs.forEach(doc => {
    const data = doc.data();
    // Keying by the Document ID makes it instantly searchable 
    // against the array of IDs stored in player.leagues
    leaguesMap.set(doc.id, { id: doc.id, ...data });
  });

  return leaguesMap;
};