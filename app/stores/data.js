import { defineStore } from 'pinia'
import { collection, query, getDocs, orderBy, where, limit, addDoc,serverTimestamp } from "firebase/firestore"

export const useData = defineStore('data', () => {
  const { $db } = useNuxtApp()
  
  const leagues = ref(new Map())
  const courses = ref(new Map())
  const isBooted = ref(false)
  const activeLeagueEvent = ref(null)

  // Helper to get local YYYY-MM-DD
  const getLocalToday = () => {
    const now = new Date()
    const offset = now.getTimezoneOffset() * 60000
    return new Date(now - offset).toISOString().split('T')[0]
  }

  const fetchNextRound = async (leagueId) => {
    const today = getLocalToday()
    const q = query(
      collection($db, "leagues", leagueId, "calendar"),
      where("iso", ">=", today),
      orderBy("iso", "asc"),
      limit(1)
    )
    const snap = await getDocs(q)
    return !snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null
  }

const bootstrap = async (userLeagueIds = []) => {
  isBooted.value = false;
  
  // 1. Fetch raw data
  const [lMap, cMap] = await Promise.all([
    fetchFullLeaguesData($db),
    fetchFullCourseData($db)
  ]);

  // 2. Prepare all leagues with their rounds in parallel BEFORE setting the refs
  const leaguesArray = Array.from(lMap.values());
  
  const enrichedLeagues = await Promise.all(leaguesArray.map(async (lg) => {
    const nextRound = await fetchNextRound(lg.id);
    return { ...lg, nextRound }; // Combine them here
  }));

  // 3. Re-build the map with enriched data
  const finalLeaguesMap = new Map();
  enrichedLeagues.forEach(lg => finalLeaguesMap.set(lg.id, lg));

  // 4. NOW set the store state
  leagues.value = finalLeaguesMap;
  courses.value = cMap;
  
  // 5. Determine today's active event using the enriched data
  const today = getLocalToday();
  const todayEvent = enrichedLeagues.find(lg => 
    userLeagueIds.includes(lg.id) && lg.nextRound?.iso === today
  );
  
  if (todayEvent) activeLeagueEvent.value = todayEvent;
  
  isBooted.value = true;
};

  // Action to call when an admin adds a new event
  const refreshLeagueRound = async (leagueId) => {
    const lg = leagues.value.get(leagueId)
    if (lg) {
      lg.nextRound = await fetchNextRound(leagueId)
      // Re-check if this new event is for today
      if (lg.nextRound?.iso === getLocalToday()) {
        activeLeagueEvent.value = lg
      }
    }
  }

  const currentRound = ref(null);

  const startNewRound = async (setupData) => {
    const { $db } = useNuxtApp();
    
    // 1. Create the Firestore Document
    const roundRef = await addDoc(collection($db, "rounds"), {
      ...setupData,
      status: 'active',
      createdAt: serverTimestamp(),
      // Initialize empty scores for each player
      scores: setupData.players.reduce((acc, p) => {
        acc[p.id] = new Array(setupData.holes).fill(0);
        return acc;
      }, {})
    });

    // 2. Set local state and return ID for routing
    currentRound.value = { id: roundRef.id, ...setupData };
    return roundRef.id;
  };
  return { leagues, courses, isBooted, activeLeagueEvent, bootstrap, refreshLeagueRound, currentRound, startNewRound }
})