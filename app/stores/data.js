import { defineStore } from 'pinia'
import { collection, query, getDocs, orderBy, where, limit, addDoc, serverTimestamp } from "firebase/firestore"

export const useData = defineStore('data', () => {
  const { $db } = useNuxtApp()
  
  const leagues = ref(new Map())
  const courses = ref(new Map())
  const players = ref(new Map()) // 🛡️ NEW: Players state
  const isBooted = ref(false)
  const activeLeagueEvent = ref(null)
  const currentRound = ref(null)

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
    
    // 1. Fetch raw data (Added fetch for players)
    const [lMap, cMap, uSnap] = await Promise.all([
      fetchFullLeaguesData($db),
      fetchFullCourseData($db),
      getDocs(collection($db, "players")) // 🛡️ NEW: Fetch global players
    ]);

    // 2. Prepare Leagues
    const leaguesArray = Array.from(lMap.values());
    const enrichedLeagues = await Promise.all(leaguesArray.map(async (lg) => {
      const nextRound = await fetchNextRound(lg.id);
      return { ...lg, nextRound }; 
    }));

    const finalLeaguesMap = new Map();
    enrichedLeagues.forEach(lg => finalLeaguesMap.set(lg.id, lg));

    // 3. Prepare Players Map
    const finalPlayersMap = new Map();
    uSnap.forEach(doc => {
      finalPlayersMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // 4. Set the store state
    leagues.value = finalLeaguesMap;
    courses.value = cMap;
    players.value = finalPlayersMap; // 🛡️ NEW: Set players ref
    
    const today = getLocalToday();
    const todayEvent = enrichedLeagues.find(lg => 
      userLeagueIds.includes(lg.id) && lg.nextRound?.iso === today
    );
    
    if (todayEvent) activeLeagueEvent.value = todayEvent;
    
    isBooted.value = true;
  };

  const refreshLeagueRound = async (leagueId) => {
    const lg = leagues.value.get(leagueId)
    if (lg) {
      lg.nextRound = await fetchNextRound(leagueId)
      if (lg.nextRound?.iso === getLocalToday()) {
        activeLeagueEvent.value = lg
      }
    }
  }

  const startNewRound = async (setupData) => {
    const roundRef = await addDoc(collection($db, "live_rounds"), {
      ...setupData,
      status: 'active',
      createdAt: serverTimestamp(),
      scores: setupData.players.reduce((acc, p) => {
        acc[p.id] = new Array(setupData.holes).fill(0);
        return acc;
      }, {})
    });

    currentRound.value = { id: roundRef.id, ...setupData };
    return roundRef.id;
  };

  return {
    leagues,
    courses,
    players, // 🛡️ NEW: Return players
    isBooted,
    activeLeagueEvent,
    currentRound,
    bootstrap,
    refreshLeagueRound,
    startNewRound
  }
})