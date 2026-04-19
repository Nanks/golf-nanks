import { defineStore } from 'pinia'
import { collection, onSnapshot, query, where, getDocs, doc, deleteDoc, orderBy, limit } from 'firebase/firestore'

export const useData = defineStore('data', () => {
  const { $db } = useNuxtApp()
  
  const liveRounds = ref([])
  const liveRoundsUnsub = ref(null)
  const leagues = ref([])
  const courses = ref([])
  const isHydrated = ref(false)
  const loading = ref(false)
  
  // Track the active listener type so we can restart it when returning from background
  const activeListenerType = ref(null)

  const hydrateStore = async () => {
    // Prevent double-fetching if two components call this at once
    if (isHydrated.value || loading.value) return
    loading.value = true

    try {
      const [leaguesSnap, coursesSnap] = await Promise.all([
        getDocs(collection($db, 'leagues')),
        getDocs(collection($db, 'courses'))
      ])

      const today = new Date().toISOString().split('T')[0]
      
      // OPTIMIZATION: Use Promise.all for the sub-queries (calendar and tees)
      // to avoid the "waterfall" effect in your loops
      const leaguePromises = leaguesSnap.docs.map(async (lDoc) => {
        const league = { id: lDoc.id, ...lDoc.data() }
        const calQ = query(
          collection($db, 'leagues', lDoc.id, 'calendar'), 
          where('iso', '>=', today), 
          orderBy('iso', 'asc'), 
          limit(1)
        )
        const calSnap = await getDocs(calQ)
        league.nextRound = !calSnap.empty ? { id: calSnap.docs[0].id, ...calSnap.docs[0].data() } : null
        return league
      })

      const coursePromises = coursesSnap.docs.map(async (cDoc) => {
        const teesSnap = await getDocs(collection($db, 'courses', cDoc.id, 'tees'))
        const teesMap = {}
        teesSnap.docs.forEach(t => { teesMap[t.id] = t.data() })
        return { id: cDoc.id, ...cDoc.data(), tees: teesMap }
      })

      leagues.value = await Promise.all(leaguePromises)
      courses.value = await Promise.all(coursePromises)
      
      isHydrated.value = true
    } catch (err) {
      console.error("Hydration Error:", err)
    } finally {
      loading.value = false
    }
  }

  // Helper to get local YYYY-MM-DD
  const getTodayISO = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  };

  // GETTER: Check if a specific league is live right now
  const isLeagueLiveToday = computed(() => (leagueId) => {
    const today = getTodayISO();
    return liveRounds.value.some(r => r.leagueId === leagueId && r.iso === today);
  });

  const startLiveListener = (filters = {}) => {
    // 1. Clean up existing to prevent memory leaks
    stopLiveListener()
    
    // 2. Store the filters so we can resume them after backgrounding
    activeListenerType.value = filters

    let q = collection($db, "live_rounds")
    
    // 3. Dynamically apply filters
    if (filters.leagueId) {
      q = query(q, where("leagueId", "==", filters.leagueId))
    }
    if (filters.type) {
      q = query(q, where("type", "==", filters.type))
    }

    liveRoundsUnsub.value = onSnapshot(q, (snapshot) => {
      liveRounds.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
  }

  const stopLiveListener = () => {
    if (liveRoundsUnsub.value) {
      liveRoundsUnsub.value()
      liveRoundsUnsub.value = null
    }
  }

  const resumeListener = () => {
    // Re-run the listener with the saved filter object
    if (activeListenerType.value || liveRounds.value.length > 0) {
      startLiveListener(activeListenerType.value || {})
    }
  }

  const deleteLiveRound = async (roundId) => {
    try {
      await deleteDoc(doc($db, "live_rounds", roundId))
      return true
    } catch (err) {
      console.error("Delete Error:", err)
      return false
    }
  }

  const fetchHistoricByIso = async (type, iso) => {
    try {
      const q = query(
        collectionGroup($db, "rounds"), 
        where("type", "==", type),
        where("iso", "==", iso)
      )
      const snap = await getDocs(q)
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (err) {
      console.error("Error fetching historic rounds:", err);
      return []
    }
  }

  return { 
    liveRounds, leagues, courses, isHydrated, loading,
    hydrateStore, startLiveListener, stopLiveListener, resumeListener,
    deleteLiveRound,
    fetchHistoricByIso
  }
})