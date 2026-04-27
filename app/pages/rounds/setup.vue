<template>
  <div class="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-1 pb-32">
    <div class="max-w-md mx-auto pt-2">
      
      <LeagueHeader 
        back-to="/" 
        back-text="Dashboard"
        :is-admin="isAdmin"
      >
        <template #title>
          <span class="block text-2xl">
            {{ isLeague ? 'League' : 'Casual' }}
            <span class="text-slate-400 dark:text-slate-600 italic">Round</span>
          </span>
        </template>
      </LeagueHeader>

      <p v-if="leagueName" class="px-2 -mt-2 mb-6 text-emerald-500 font-black uppercase text-[10px] tracking-[0.15em]">
        {{ leagueName }}
      </p>

      <div v-if="dataStore.loading" class="py-12 text-center">
        <Icon name="svg-spinners:ring-resize" class="size-8 text-emerald-500 mb-2" />
      </div>

      <div v-else class="space-y-4 px-2">
        
        <section class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <BaseSelect 
            v-model="selectedCourseId"
            label="1. Select Course"
            :options="sortedCourses"
            placeholder="Choose a course..."
            :disabled="isLeague"
          />
        </section>

        <section v-show="selectedCourseId" class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          
          <div class="flex justify-between items-center mb-4">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">2. Players & Tees</label>
            <button 
              @click="showPlayerPicker = true" 
              class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Icon name="mdi:account-plus" class="size-4" /> Add
            </button>
          </div>

          <div v-if="players.length === 0" class="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-2">
            <Icon name="mdi:golf-tee" class="size-6 text-slate-300 dark:text-slate-700" />
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">No players added</p>
          </div>

          <div v-else class="space-y-3 mt-2">
            <div v-for="(player, index) in players" :key="player.id" 
                 class="p-2.5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
              
              <div class="grid grid-cols-12 gap-2 items-center">
                <div class="col-span-7 flex flex-col justify-center min-w-0 pl-1.5">
                  <h4 class="font-black uppercase italic tracking-tighter leading-none truncate text-sm text-slate-900 dark:text-white">
                    {{ player.fname }} {{ player.lname }}
                  </h4>
                  
                  <div class="mt-1.5 flex items-center gap-1.5">
                    
                    <p v-if="isYearlyLeague" class="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      League HCP: <span class="text-emerald-500">{{ getDisplayHandicap(player) }}</span>
                    </p>
                    
                    <template v-else>
                      <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Index: <span class="text-emerald-500">{{ (player.ghin ?? 0).toFixed(1) }}</span>
                      </p>
                      <span v-if="player.teeId" class="w-px h-2 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                      <p v-if="player.teeId" class="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        CH: <span class="text-emerald-500">{{ getDynamicCourseHandicap(player) }}</span>
                      </p>
                    </template>

                  </div>
                </div>

                <div class="col-span-5">
                  <BaseSelect 
                    v-model="player.teeId"
                    :options="getAvailableTees(player)"
                    placeholder="Tee"
                    dense
                    :disabled="isLeague"
                  />
                </div>
              </div>

              <button 
                @click="removePlayer(index)" 
                class="absolute -top-2.5 -left-2.5 bg-white dark:bg-slate-950 rounded-full p-0.5 active:scale-90 transition-transform z-10"
              >
                <Icon name="mdi:close-circle" class="size-[22px] text-slate-300 dark:text-slate-700 active:text-red-500 transition-colors" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 pt-8 pb-4 px-4 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 z-40">
      <div class="max-w-md mx-auto">
        <button 
          @click="startRound" 
          :disabled="!canStart" 
          class="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-white bg-emerald-600 disabled:opacity-30 disabled:bg-slate-400 dark:disabled:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 disabled:shadow-none"
        >
          <div class="flex items-center justify-center gap-2">
            <Icon v-if="loading" name="svg-spinners:ring-resize" class="size-4" />
            <span>{{ loading ? 'Setting up...' : 'Start Round' }}</span>
          </div>
        </button>
      </div>
    </div>

    <PlayerPicker 
      v-model:is-open="showPlayerPicker" 
      :selected-players="players" 
      mode="setup" 
      @toggle="togglePlayer" 
      @create-new="addManualPlayer" 
    />
  </div>
</template>

<script setup>
import { collection, addDoc } from 'firebase/firestore'
import { useData } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import { calcCourseHandicap } from '~/utils/gameLogic'

const { $db } = useNuxtApp()
const dataStore = useData()
const authStore = useAuthStore()
const route = useRoute()

const TEE_MAPPING = {
  'mens': 'Blue',
  'senior': 'White',
  'ladies': 'Green'
}

// State
const loading = ref(false)
const showPlayerPicker = ref(false)
const selectedCourseId = ref('')
const players = ref([])

// Params
const isLeague = computed(() => route.query.isLeague === 'true')
const leagueId = computed(() => route.query.leagueId || '')
const currentLeague = computed(() => dataStore.leagues.find(l => l.id === leagueId.value))
const leagueName = computed(() => currentLeague.value?.name || '')
const isAdmin = computed(() => authStore.isAdminForLeague(currentLeague.value))
const isYearlyLeague = computed(() => currentLeague.value?.cadence === 'yearly')

// Computed
const sortedCourses = computed(() => {
  return [...dataStore.courses]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c => ({ label: c.name, value: c.id }))
})

const selectedCourse = computed(() => dataStore.courses.find(c => c.id === selectedCourseId.value))

const canStart = computed(() => {
  return selectedCourseId.value && players.value.length > 0 && players.value.every(p => p.teeId) && !loading.value
})

// ==========================================
// CENTRALIZED HELPERS 
// ==========================================

const getTeePar = (teeData) => {
  return teeData?.pars?.reduce((sum, val) => sum + Number(val), 0) || 72
}

// UI: Display exact decimal for Yearly Leagues
const getDisplayHandicap = (player) => {
  const hcp = player.leagueHandicaps?.[leagueId.value] ?? 0
  return parseFloat(hcp).toFixed(3)
}

// UI: Display dynamic integer for Casual / Non-Yearly
const getDynamicCourseHandicap = (player) => {
  if (!selectedCourse.value || !player.teeId) return '-'
  
  const teeData = selectedCourse.value.tees[player.teeId]
  if (!teeData) return '-'

  return calcCourseHandicap(
    player.ghin ?? 0, 
    teeData.slope, 
    teeData.rating, 
    getTeePar(teeData)
  )
}

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

const getTeeIdByName = (course, teeName) => {
  const entry = Object.entries(course?.tees || {}).find(([id, t]) => t.name === teeName)
  return entry ? entry[0] : ''
}

const applyTeeLogic = (playerList) => {
  if (!selectedCourse.value) return

  playerList.forEach(p => {
    let finalTeeId = ''
    const pType = p.tee_type || 'mens'

    // 1. LEAGUE ROUND (Hardcoded Tee)
    // If the league has a teesId AND it isn't a 'Mixed' tee league
    if (isLeague.value && currentLeague.value?.tees !== 'Mixed' && currentLeague.value?.teesId) {
      finalTeeId = currentLeague.value.teesId
    } 
    // 2. MIXED LEAGUE or CASUAL ROUND (Player's Default)
    else {
      // Use the course's 'tee_types' map (e.g., 'ladies' -> 'v7A78o...')
      if (selectedCourse.value.tee_types && selectedCourse.value.tee_types[pType]) {
        finalTeeId = selectedCourse.value.tee_types[pType]
      } 
      // Ultimate Fallback
      else {
        const targetName = TEE_MAPPING[pType] || 'Blue'
        finalTeeId = getTeeIdByName(selectedCourse.value, targetName)
      }
    }
    
    if (finalTeeId) p.teeId = finalTeeId
  })
}

// Initialization
onMounted(async () => {
  if (!dataStore.isHydrated) await dataStore.hydrateStore()
  if (authStore.userProfile && players.value.length === 0) {
    players.value.push({ ...authStore.userProfile, teeId: '' })
  }

  // NEW: Directly assign the courseId from the league document
  if (isLeague.value && currentLeague.value?.courseId) {
    selectedCourseId.value = currentLeague.value.courseId
  } 
  // Fallback for casual rounds
  else if (!isLeague.value) {
    const elks = dataStore.courses.find(c => c.name.toLowerCase().includes('elks'))
    if (elks) selectedCourseId.value = elks.id
  }
  applyTeeLogic(players.value)
})

// Methods
const togglePlayer = (player) => {
  const index = players.value.findIndex(p => p.id === player.id)
  if (index > -1) {
    players.value.splice(index, 1)
  } else {
    const newPlayer = { ...player, teeId: '' }
    applyTeeLogic([newPlayer])
    players.value.push(newPlayer)
  }
}

const addManualPlayer = (formData) => {
  const newGuest = { id: `guest-${Date.now()}`, ...formData, teeId: '' }
  applyTeeLogic([newGuest])
  players.value.push(newGuest)
}

const removePlayer = (index) => players.value.splice(index, 1)

const startRound = async () => {
  if (!canStart.value) return
  
  showPlayerPicker.value = false
  loading.value = true

  try {
    const courseSnapshot = {
      id: selectedCourse.value.id,
      name: selectedCourse.value.name,
      holes: selectedCourse.value.holes || 18,
      tees: {}
    }

    // IMPORTANT: Save the `types` array so the scorecard can filter tees later
    Object.entries(selectedCourse.value.tees).forEach(([id, tee]) => {
      courseSnapshot.tees[id] = { 
        name: tee.name,
        active: true,
        rating: tee.rating,
        slope: tee.slope,
        pars: tee.pars || [], 
        hnds: tee.hnds || [], 
        par: getTeePar(tee),
        types: tee.types || [] // <-- MUST CARRY THIS OVER
      }
    })

    const playerSnapshots = players.value.map(p => {
      const teeData = selectedCourse.value.tees[p.teeId]
      const teePar = getTeePar(teeData)
      
      let finalIndex, finalCourseHcp;

      if (isYearlyLeague.value) {
        const rawLeagueHcp = p.leagueHandicaps?.[leagueId.value] ?? 0;
        finalIndex = parseFloat(rawLeagueHcp);
        finalCourseHcp = parseFloat(finalIndex.toFixed(3)); 
      } else {
        finalIndex = p.ghin ?? 0;
        finalCourseHcp = calcCourseHandicap(finalIndex, teeData.slope, teeData.rating, teePar);
      }

      return {
        id: p.id,
        fname: p.fname,
        lname: p.lname,
        ghin: finalIndex, 
        index: finalCourseHcp, 
        teesId: p.teeId,
        tees: teeData.name, 
        tee_type: p.tee_type || 'mens'
      }
    })

    // Determine the officially designated event tees
    let eventTeeId = '';
    let eventTeeName = '';
    
    if (isLeague.value && currentLeague.value?.tees !== 'Mixed' && currentLeague.value?.teesId) {
      eventTeeId = currentLeague.value.teesId;
      eventTeeName = currentLeague.value.tees;
    } else {
      // Fallback for casual/mixed rounds
      eventTeeId = playerSnapshots[0]?.teesId || '';
      eventTeeName = playerSnapshots[0]?.tees || 'Mixed';
    }

    const roundData = {
      courseId: selectedCourse.value.id,
      course: courseSnapshot.name,
      courseSnapshot,
      tees: eventTeeName,
      teesId: eventTeeId,
      leagueId: leagueId.value,
      type: isLeague.value ? (currentLeague.value?.type || 'league') : 'casual',
      createdAt: new Date().toISOString(),
      iso: new Date().toISOString().split('T')[0],
      players: playerSnapshots,
      scores: {},
      currentHole: 1,
      status: 'active'
    }

    players.value.forEach(p => {
      roundData.scores[p.id] = new Array(courseSnapshot.holes).fill(0)
    })

    const docRef = await addDoc(collection($db, 'live_rounds'), roundData)
    
    loading.value = false
    return navigateTo(`/rounds/${docRef.id}`)
    
  } catch (e) {
    console.error("Setup failed:", e)
    loading.value = false
  }
}
</script>