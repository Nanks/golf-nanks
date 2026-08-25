import { defineStore } from 'pinia'
import { collection, onSnapshot, query, where, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore'
import { ref, computed } from 'vue'
import { getLocalIsoDate, isEventFinished } from '~/utils/leagueActions'
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
  // Set when the initial league/course fetch fails, so app.vue can surface
  // it -- otherwise a failed hydration and "there just aren't any leagues
  // yet" look identical to the user (both render an empty home page).
  const hydrationError = ref(null)
  const calendarUnsub = ref(null)
  
  const upcomingEvents = ref({}) 
  const activeListenerType = ref(null)

  const hydrateStore = async () => {
    if (isHydrated.value || loading.value) return
    loading.value = true
    hydrationError.value = null

    try {
      const [leaguesSnap, coursesSnap] = await Promise.all([
        getDocs(query(collection($db, 'leagues'), where('active', '==', true))),
        getDocs(collection($db, 'courses'))
      ])

      const today = getLocalIsoDate()

      // A single where('leagueId','==',...) equality filter, with the iso
      // range/sort done client-side, rather than combining it with a
      // where/orderBy on iso -- that combination needs a composite index,
      // and this app's per-league event volume is tiny enough that fetching
      // everything and filtering in JS is trivially cheap. Same pattern as
      // the useHandicap.js fix for the same class of issue.
      const leaguePromises = leaguesSnap.docs.map(async (lDoc) => {
        const league = { id: lDoc.id, ...lDoc.data() }
        const calSnap = await getDocs(query(collection($db, 'events'), where('leagueId', '==', lDoc.id)))
        const upcoming = calSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(e => e.iso >= today)
          .sort((a, b) => a.iso.localeCompare(b.iso))
        league.nextRound = upcoming[0] || null
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

      // Keeps league.nextRound in sync for the rest of the session -- without
      // this, another admin adding/editing an event never reaches an
      // already-open session (the fetch above is one-time). Started only
      // client-side, after the one-time fetch above already gave SSR/first
      // paint correct data immediately.
      if (import.meta.client) startCalendarListener()
    } catch (err) {
      console.error("Hydration Error:", err)
      hydrationError.value = err
    } finally {
      loading.value = false
    }
  }

  // One listener across every league's events, rather than one per league --
  // calendar writes are rare, so the standing cost is low, and this avoids
  // juggling N separate subscriptions/unsubs. Range + orderBy on the same
  // field (iso) needs no composite index, unlike the per-league queries
  // above which add a leagueId equality filter.
  const startCalendarListener = () => {
    stopCalendarListener()
    const today = getLocalIsoDate()
    const q = query(collection($db, 'events'), where('iso', '>=', today), orderBy('iso', 'asc'))

    calendarUnsub.value = onSnapshot(q, (snapshot) => {
      const nextByLeague = new Map()
      snapshot.docs.forEach(d => {
        const leagueId = d.data().leagueId
        if (!leagueId || nextByLeague.has(leagueId)) return
        nextByLeague.set(leagueId, { id: d.id, ...d.data() })
      })

      leagues.value.forEach(league => {
        league.nextRound = nextByLeague.get(league.id) || null
      })
    })
  }

  const stopCalendarListener = () => {
    if (calendarUnsub.value) {
      calendarUnsub.value()
      calendarUnsub.value = null
    }
  }

  const fetchUpcomingEvents = async (leagueId, forceRefresh = false) => {
    if (upcomingEvents.value[leagueId] && !forceRefresh) return

    try {
      const today = getLocalIsoDate()
      const snap = await getDocs(query(collection($db, 'events'), where('leagueId', '==', leagueId)))
      upcomingEvents.value[leagueId] = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.iso >= today)
        .sort((a, b) => a.iso.localeCompare(b.iso))
        .slice(0, 3)
    } catch (error) {
      console.error(`Failed to fetch upcoming events for league ${leagueId}:`, error)
    }
  }

  const getNextActiveEvent = computed(() => {
    return (leagueId) => {
      const events = upcomingEvents.value[leagueId]
      if (!events || !events.length) return null
      
      return events.find(e => !isEventFinished(e.status)) || null
    }
  })

  const refreshLeagueCalendar = async (leagueId) => {
    try {
      await fetchUpcomingEvents(leagueId, true)

      const today = getLocalIsoDate();
      const calSnap = await getDocs(query(collection($db, 'events'), where('leagueId', '==', leagueId)));
      const upcoming = calSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.iso >= today)
        .sort((a, b) => a.iso.localeCompare(b.iso));
      const nextRound = upcoming[0] || null;

      const idx = leagues.value.findIndex(l => l.id === leagueId);
      if (idx > -1) {
        leagues.value[idx].nextRound = nextRound;
      }
    } catch (err) {
      console.error("Error refreshing league calendar:", err);
    }
  };

  const activeRoundIdForLeague = computed(() => (leagueId) => {
    const myId = authStore.userProfile?.id
    if (!myId) return null
    const today = getLocalIsoDate()
    const found = liveRounds.value.find(r =>
      r.leagueId === leagueId && r.iso === today &&
      r.players?.some(p => String(p.id) === String(myId))
    )
    return found?.id || null
  });

  const startLiveListener = (filters = {}) => {
    if (filters.myRoundsOnly) {
      const uid = authStore.userProfile?.id
      if (!uid) return
    }

    stopLiveListener()
    activeListenerType.value = filters

    let q = collection($db, "live_rounds")

    if (filters.leagueId) {
      q = query(q, where("leagueId", "==", filters.leagueId))
    }
    if (filters.type) {
      q = query(q, where("type", "==", filters.type))
    }
    if (filters.myRoundsOnly) {
      q = query(q, where("playerIds", "array-contains", authStore.userProfile.id))
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
      type: round.type,
      eventId: round.eventId
    }
  })

  return {
    liveRounds, leagues, courses, isHydrated, loading, hydrationError, upcomingEvents, activeLiveRound,
    hydrateStore, startLiveListener, stopLiveListener, resumeListener,
    deleteLiveRound, refreshLeagueCalendar, fetchUpcomingEvents, getNextActiveEvent,
    activeRoundIdForLeague, startCalendarListener, stopCalendarListener
  }
})