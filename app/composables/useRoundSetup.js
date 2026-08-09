import { ref, computed, onMounted } from 'vue'
import { collection, addDoc } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import { useData } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { getLocalIsoDate } from '~/utils/leagueActions'
import { 
  calcCourseHandicap, 
  getDefaultTeeId, 
  createPlayerSnapshot, 
  getTeePar 
} from '~/utils/gameLogic'

export function useRoundSetup() {
  const { $db } = useNuxtApp()
  const dataStore = useData()
  const authStore = useAuthStore()
  const uiStore = useUIStore()
  const route = useRoute()
  const router = useRouter() 

  // --- STATE ---
  const showPlayerPicker = ref(false)
  const selectedCourseId = ref('')
  const players = ref([])

  // --- COMPUTED PARAMS ---
  const isLeague = computed(() => route.query.isLeague === 'true')
  const leagueId = computed(() => route.query.leagueId || '')
  const currentLeague = computed(() => dataStore.leagues.find(l => l.id === leagueId.value))
  const leagueName = computed(() => currentLeague.value?.name || '')
  const isAdmin = computed(() => authStore.isAdminForLeague(currentLeague.value))
  const isAppManaged = computed(() => isLeague.value && currentLeague.value?.appHandicap === true)

  const backRoute = computed(() => route.query.from === 'menu' ? `/leagues/${leagueId.value}/menu` : '/')
  const backText = computed(() => route.query.from === 'menu' ? 'Menu' : 'Dashboard')

  const scheduledEvent = computed(() => {
    const today = getLocalIsoDate()
    if (!currentLeague.value?.nextRound) return null
    return currentLeague.value.nextRound.iso === today ? currentLeague.value.nextRound : null
  })

  const sortedCourses = computed(() => {
    return [...dataStore.courses]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({ label: c.name, value: c.id }))
  })

  const selectedCourse = computed(() => dataStore.courses.find(c => c.id === selectedCourseId.value))

  const canStart = computed(() => {
    return selectedCourseId.value && players.value.length > 0 && players.value.every(p => p.teeId) && !uiStore.isGlobalLoading
  })

  // --- HELPERS ---
  const getAvailableTees = (player) => {
    if (!selectedCourse.value?.tees) return []
    return Object.entries(selectedCourse.value.tees)
      .filter(([id, tee]) => {
        if (tee.types && Array.isArray(tee.types) && tee.types.length > 0) {
          return tee.types.includes(player.tee_type || 'mens')
        }
        return true
      })
      .map(([id, tee]) => ({ label: tee.name, value: id }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  const initializePlayer = (player) => {
    // 1. Resolve Tee ID using our shared utility from gameLogic.js
    if (selectedCourse.value) {
      player.teeId = getDefaultTeeId(
        player, 
        selectedCourse.value, 
        isLeague.value, 
        currentLeague.value, 
        scheduledEvent.value
      )
    }

    // 2. Format UI display handicaps
    player.displayLeagueHcp = parseFloat(player.leagueHandicaps?.[leagueId.value] ?? ((player.ghin ?? 0) - 3)).toFixed(3)
    
    player.displayCourseHcp = computed(() => {
       if (!selectedCourse.value || !player.teeId) return '-'
       const teeData = selectedCourse.value.tees[player.teeId]
       if (!teeData) return '-'
       return calcCourseHandicap(player.ghin ?? 0, teeData.slope, teeData.rating, getTeePar(teeData))
    })

    return player
  }

  // --- ACTIONS ---
  const togglePlayer = (player) => {
    const index = players.value.findIndex(p => p.id === player.id)
    if (index > -1) {
      players.value.splice(index, 1)
    } else {
      players.value.push(initializePlayer({ ...player, teeId: '' }))
    }
  }

  const addManualPlayer = (formData) => {
    players.value.push(initializePlayer({ id: `guest-${Date.now()}`, ...formData, teeId: '' }))
  }

  const removePlayer = (index) => players.value.splice(index, 1)

  const startRound = async () => {
    if (!canStart.value || uiStore.isGlobalLoading) return
    
    const todayIso = getLocalIsoDate()
    const currentUserId = authStore.userProfile?.id
    
    if (isLeague.value) {
      const existingRound = dataStore.liveRounds.find(r => 
        r.leagueId === leagueId.value && 
        r.iso === todayIso &&
        r.players.some(p => p.id === currentUserId)
      )

      if (existingRound) {
        uiStore.setLoading(false)
        return router.push(`/rounds/${existingRound.id}`)
      }
    }

    showPlayerPicker.value = false
    uiStore.setLoading(true, "Setting up...")

    try {
      const courseSnapshot = {
        id: selectedCourse.value.id,
        name: selectedCourse.value.name,
        holes: selectedCourse.value.holes || 18,
        tees: JSON.parse(JSON.stringify(selectedCourse.value.tees))
      }
      Object.values(courseSnapshot.tees).forEach(tee => {
        if (!tee.par) tee.par = getTeePar(tee)
      })

      // 3. Delegate handicap math to the shared utility
      const playerSnapshots = players.value.map(p => {
        return createPlayerSnapshot(
          p, 
          p.teeId, 
          selectedCourse.value, 
          isAppManaged.value, 
          leagueId.value
        )
      })

      let eventTeeId = ''
      let eventTeeName = ''
      
      if (scheduledEvent.value && scheduledEvent.value.tees !== 'Mixed') {
        eventTeeId = scheduledEvent.value.teesId || ''
        eventTeeName = scheduledEvent.value.tees || 'Mixed'
      } else if (isLeague.value && currentLeague.value?.tees !== 'Mixed' && currentLeague.value?.teesId) {
        eventTeeId = currentLeague.value.teesId
        eventTeeName = currentLeague.value.tees
      } else {
        eventTeeId = playerSnapshots[0]?.teesId || ''
        eventTeeName = playerSnapshots[0]?.tees || 'Mixed'
      }

      const roundData = {
        courseId: selectedCourse.value.id,
        course: courseSnapshot.name,
        courseSnapshot,
        tees: eventTeeName,
        teesId: eventTeeId,
        leagueId: leagueId.value,
        appHandicap: isAppManaged.value,
        type: isLeague.value ? (currentLeague.value?.type || 'league') : 'casual',
        createdAt: new Date().toISOString(),
        iso: todayIso,
        players: playerSnapshots,
        playerIds: playerSnapshots.map(p => p.id), 
        scores: {},
        currentHole: 1,
        status: 'active'
      }

      players.value.forEach(p => {
        roundData.scores[p.id] = new Array(courseSnapshot.holes).fill(0)
      })

      const docRef = await addDoc(collection($db, 'live_rounds'), roundData)
      dataStore.liveRounds.push({ id: docRef.id, ...roundData })
      
      await router.push(`/rounds/${docRef.id}`)
      
    } catch (e) {
      console.error("Setup failed:", e)
      uiStore.setLoading(false)
    }
  }

  // --- LIFECYCLE ---
  onMounted(async () => {
    if (!dataStore.isHydrated) await dataStore.hydrateStore()
    
    if (scheduledEvent.value?.courseId) {
      selectedCourseId.value = scheduledEvent.value.courseId
    } else if (isLeague.value && currentLeague.value?.courseId) {
      selectedCourseId.value = currentLeague.value.courseId
    } else if (!isLeague.value) {
      const elks = dataStore.courses.find(c => c.name.toLowerCase().includes('elks'))
      if (elks) selectedCourseId.value = elks.id
    }

    if (authStore.userProfile && players.value.length === 0) {
      players.value.push(initializePlayer({ ...authStore.userProfile, teeId: '' }))
    }
  })

  return {
    showPlayerPicker, selectedCourseId, players,
    isLeague, leagueId, leagueName, isAdmin, isAppManaged,
    backRoute, backText, sortedCourses, canStart,
    getAvailableTees, togglePlayer, addManualPlayer, removePlayer, startRound,
    dataStore, uiStore
  }
}