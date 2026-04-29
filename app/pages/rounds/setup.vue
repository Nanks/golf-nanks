<template>
  <div class="min-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 px-1 pb-28">
    <div class="max-w-md mx-auto pt-2">
      
      <LeagueHeader 
        :back-to="backRoute" 
        :back-text="backText"
        :is-admin="isAdmin"
      >
        <template #title>
          <span class="block text-2xl">
            {{ isLeague ? 'League' : 'Casual' }}
            <span class="text-stone-400 dark:text-stone-600 italic">Round</span>
          </span>
        </template>
      </LeagueHeader>

      <p v-if="leagueName" class="px-2 -mt-2 mb-4 text-emerald-500 font-black uppercase text-xs tracking-[0.15em]">
        {{ leagueName }}
      </p>

      <div v-if="dataStore.loading" class="py-12 text-center">
        <Icon name="svg-spinners:ring-resize" class="size-8 text-emerald-500 mb-2" />
      </div>

      <div v-else class="space-y-3 px-2">
        
        <section class="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <BaseSelect 
            v-model="selectedCourseId"
            label="1. Select Course"
            :options="sortedCourses"
            placeholder="Choose a course..."
            :disabled="isLeague"
          />
        </section>

        <section v-show="selectedCourseId" class="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          
          <div class="flex justify-between items-center mb-4">
            <label class="text-[11px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">2. Players & Tees</label>
            <button 
              @click="showPlayerPicker = true" 
              class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all shadow-[inset_0_0_8px_rgba(16,185,129,0.1)]"
            >
              <Icon name="mdi:account-plus" class="size-4" /> Add
            </button>
          </div>

          <div v-if="players.length === 0" class="py-8 text-center border-2 border-dashed border-stone-300 dark:border-stone-800 rounded-2xl flex flex-col items-center gap-2">
            <Icon name="mdi:golf-tee" class="size-6 text-stone-300 dark:text-stone-700" />
            <p class="text-[9px] font-black uppercase tracking-widest text-stone-400">No players added</p>
          </div>

          <div v-else class="space-y-2.5 mt-2">
            <div v-for="(player, index) in players" :key="player.id" 
                 class="p-2.5 bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm relative group">
              
              <div class="grid grid-cols-12 gap-2 items-center">
                <div class="col-span-7 flex flex-col justify-center min-w-0 pl-1.5">
                  <h4 class="font-black uppercase italic tracking-tighter leading-none truncate text-base text-stone-900 dark:text-white">
                    {{ player.fname }} {{ player.lname }}
                  </h4>
                  
                  <div class="mt-1.5 flex items-center gap-1.5">
                    
                    <p v-if="isYearlyLeague" class="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                      League HCP: <span class="text-emerald-500 text-[10px]">{{ getDisplayHandicap(player) }}</span>
                    </p>
                    
                    <template v-else>
                      <p class="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                        Index: <span class="text-emerald-500 text-[10px]">{{ (player.ghin ?? 0).toFixed(1) }}</span>
                      </p>
                      <span v-if="player.teeId" class="w-px h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full"></span>
                      <p v-if="player.teeId" class="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                        CH: <span class="text-emerald-500 text-[10px]">{{ getDynamicCourseHandicap(player) }}</span>
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
                class="absolute -top-2.5 -left-2.5 bg-white dark:bg-stone-950 rounded-full p-0.5 active:scale-90 transition-transform z-10 shadow-sm border border-stone-100 dark:border-stone-800"
              >
                <Icon name="mdi:close-circle" class="size-5 text-stone-300 dark:text-stone-700 active:text-red-500 transition-colors" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 pt-4 pb-4 px-3 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-stone-950 dark:via-stone-950/95 z-40 backdrop-blur-[2px]">
      <div class="max-w-md mx-auto px-1">
        <button 
          @click="startRound" 
          :disabled="!canStart || uiStore.isGlobalLoading" 
          class="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm active:scale-[0.98] transition-all
                 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)] backdrop-blur-md
                 disabled:opacity-60 disabled:text-stone-500 disabled:bg-stone-500/10 disabled:border-stone-500/20 disabled:shadow-none"
        >
          <div class="flex items-center justify-center gap-2">
            <Icon v-if="uiStore.isGlobalLoading" name="svg-spinners:ring-resize" class="size-5" />
            <span>{{ uiStore.isGlobalLoading ? 'Setting up...' : 'Start Round' }}</span>
          </div>
        </button>
      </div>
    </div>

    <PlayerPicker 
      v-model:is-open="showPlayerPicker" 
      :selected-players="players" 
      mode="setup" 
      :league-id="isLeague ? leagueId : null" 
      :can-create="isAdmin"
      @toggle="togglePlayer" 
      @create-new="addManualPlayer" 
    />
  </div>
</template>

<script setup>
import { collection, addDoc } from 'firebase/firestore'
import { useData } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { calcCourseHandicap } from '~/utils/gameLogic'
import { getLocalIsoDate } from '~/utils/leagueActions'

const { $db } = useNuxtApp()
const dataStore = useData()
const authStore = useAuthStore()
const uiStore = useUIStore()
const route = useRoute()

const TEE_MAPPING = {
  'mens': 'Blue',
  'senior': 'White',
  'ladies': 'Green'
}

// State
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

const backRoute = computed(() => {
  return route.query.from === 'menu' ? `/leagues/${leagueId.value}/menu` : '/';
});

const backText = computed(() => {
  return route.query.from === 'menu' ? 'Menu' : 'Dashboard';
});

// Computed
const scheduledEvent = computed(() => {
  const today = getLocalIsoDate();
  if (!currentLeague.value?.nextRound) return null;
  return currentLeague.value.nextRound.iso === today ? currentLeague.value.nextRound : null;
});

const sortedCourses = computed(() => {
  return [...dataStore.courses]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c => ({ label: c.name, value: c.id }))
})

const selectedCourse = computed(() => dataStore.courses.find(c => c.id === selectedCourseId.value))

const canStart = computed(() => {
  return selectedCourseId.value && players.value.length > 0 && players.value.every(p => p.teeId) && !uiStore.isGlobalLoading
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

    // 1. SCHEDULED EVENT (Highest Priority)
    if (scheduledEvent.value && scheduledEvent.value.teesId && scheduledEvent.value.tees !== 'Mixed') {
      finalTeeId = scheduledEvent.value.teesId
    }
    // 2. LEAGUE DEFAULT (Hardcoded Tee)
    else if (isLeague.value && currentLeague.value?.tees !== 'Mixed' && currentLeague.value?.teesId) {
      finalTeeId = currentLeague.value.teesId
    } 
    // 3. MIXED LEAGUE or CASUAL ROUND (Player's Default)
    else {
      if (selectedCourse.value.tee_types && selectedCourse.value.tee_types[pType]) {
        finalTeeId = selectedCourse.value.tee_types[pType]
      } else {
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

  // 1. Use Scheduled Event Course first
  if (scheduledEvent.value?.courseId) {
    selectedCourseId.value = scheduledEvent.value.courseId
  }
  // 2. Fallback to League Default Course
  else if (isLeague.value && currentLeague.value?.courseId) {
    selectedCourseId.value = currentLeague.value.courseId
  } 
  // 3. Fallback for casual rounds
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
  if (!canStart.value || uiStore.isGlobalLoading) return
  
  showPlayerPicker.value = false
  uiStore.setLoading(true, "Setting up...")

  try {
    const courseSnapshot = {
      id: selectedCourse.value.id,
      name: selectedCourse.value.name,
      holes: selectedCourse.value.holes || 18,
      tees: {}
    }

    Object.entries(selectedCourse.value.tees).forEach(([id, tee]) => {
      courseSnapshot.tees[id] = { 
        name: tee.name,
        active: true,
        rating: tee.rating,
        slope: tee.slope,
        pars: tee.pars || [], 
        hnds: tee.hnds || [], 
        par: getTeePar(tee),
        types: tee.types || [] 
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

    let eventTeeId = '';
    let eventTeeName = '';
    
    if (scheduledEvent.value && scheduledEvent.value.tees !== 'Mixed') {
      eventTeeId = scheduledEvent.value.teesId || '';
      eventTeeName = scheduledEvent.value.tees || 'Mixed';
    } else if (isLeague.value && currentLeague.value?.tees !== 'Mixed' && currentLeague.value?.teesId) {
      eventTeeId = currentLeague.value.teesId;
      eventTeeName = currentLeague.value.tees;
    } else {
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
      iso: getLocalIsoDate(),
      players: playerSnapshots,
      scores: {},
      currentHole: 1,
      status: 'active'
    }

    players.value.forEach(p => {
      roundData.scores[p.id] = new Array(courseSnapshot.holes).fill(0)
    })

    const docRef = await addDoc(collection($db, 'live_rounds'), roundData)
    
    await navigateTo(`/rounds/${docRef.id}`)
    
  } catch (e) {
    console.error("Setup failed:", e)
    uiStore.setLoading(false)
  }
}
</script>