import { defineStore } from 'pinia'
import { collection, onSnapshot, query, where, getDocs, doc, deleteDoc, orderBy, limit } from 'firebase/firestore'
import { ref, computed } from 'vue'
import { getLocalIsoDate } from '~/utils/leagueActions' 
import { useAuthStore } from '~/stores/auth' // <-- ADDED IMPORT

export const useData = defineStore('data', () => {
  const { $db } = useNuxtApp()
  const authStore = useAuthStore() // <-- ADDED INITIALIZATION
  
  const liveRounds = ref([])
  const liveRoundsUnsub = ref(null)
  const leagues = ref([])
  const courses = ref([])
  const isHydrated = ref(false)
  const loading = ref(false)
  
  const upcomingEvents = ref({}) 
  const activeListenerType = ref(null)

  const hydrateStore = async () => {
    if (isHydrated.value || loading.value) return
    loading.value = true

    try {
      const [leaguesSnap, coursesSnap] = await Promise.all([
        getDocs(query(collection($db, 'leagues'), where('active', '==', true))),
        getDocs(collection($db, 'courses'))
      ])

      const today = getLocalIsoDate()
      
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
        teesSnap.docs.forEach(t => { 
          teesMap[t.id] = { id: t.id, ...t.data() } 
        })
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

  const fetchUpcomingEvents = async (leagueId, forceRefresh = false) => {
    if (upcomingEvents.value[leagueId] && !forceRefresh) return

    try {
      const today = getLocalIsoDate()
      const qRef = query(
        collection($db, "leagues", leagueId, "calendar"),
        where("iso", ">=", today),
        orderBy("iso", "asc"),
        limit(3)
      )
      
      const snap = await getDocs(qRef)
      upcomingEvents.value[leagueId] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error(`Failed to fetch upcoming events for league ${leagueId}:`, error)
    }
  }

  const getNextActiveEvent = computed(() => {
    return (leagueId) => {
      const events = upcomingEvents.value[leagueId]
      if (!events || !events.length) return null
      
      return events.find(e => e.status !== 'complete') || null
    }
  })

  const refreshLeagueCalendar = async (leagueId) => {
    try {
      await fetchUpcomingEvents(leagueId, true)

      const today = getLocalIsoDate();
      const calQ = query(
        collection($db, 'leagues', leagueId, 'calendar'),
        where('iso', '>=', today),
        orderBy('iso', 'asc'),
        limit(1)
      );
      const calSnap = await getDocs(calQ);
      const nextRound = !calSnap.empty ? { id: calSnap.docs[0].id, ...calSnap.docs[0].data() } : null;

      const idx = leagues.value.findIndex(l => l.id === leagueId);
      if (idx > -1) {
        leagues.value[idx].nextRound = nextRound;
      }
    } catch (err) {
      console.error("Error refreshing league calendar:", err);
    }
  };

  const isLeagueLiveToday = computed(() => (leagueId) => {
    const today = getLocalIsoDate(); 
    return liveRounds.value.some(r => r.leagueId === leagueId && r.iso === today);
  });

  const startLiveListener = (filters = {}) => {
    stopLiveListener()
    activeListenerType.value = filters

    let q = collection($db, "live_rounds")
    
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

  const activeLiveRound = computed(() => {
    // This will now work perfectly because authStore is defined!
    if (!authStore.userProfile?.id) return null
    
    const round = liveRounds.value.find(r => 
      r.players.some(p => p.id === authStore.userProfile.id)
    )

    if (!round) return null

    return {
      id: round.id,
      leagueId: round.leagueId,
      iso: round.iso,
      type: round.type
    }
  })

  return { 
    liveRounds, leagues, courses, isHydrated, loading, upcomingEvents, activeLiveRound,
    hydrateStore, startLiveListener, stopLiveListener, resumeListener,
    deleteLiveRound, refreshLeagueCalendar, fetchUpcomingEvents, getNextActiveEvent
  }
})