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
                <div class="col-span-7 flex items-center gap-2">
                  <div class="w-8 h-8 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px] uppercase text-slate-400">
                    {{ player.fname?.[0] }}{{ player.lname?.[0] }}
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-black uppercase italic tracking-tighter leading-none truncate text-sm text-slate-900 dark:text-white">
                      {{ player.fname }} {{ player.lname }}
                    </h4>
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {{ isLeague ? 'League HCP' : 'Index' }}: 
                      <span class="text-emerald-500">{{ getDisplayHandicap(player) }}</span>
                    </p>
                  </div>
                </div>

                <div class="col-span-5">
                  <BaseSelect 
                    v-model="player.teeId"
                    :options="sortedTeeOptions"
                    placeholder="Tee"
                    dense
                    :disabled="isLeague"
                  />
                </div>
              </div>

              <button 
                @click="removePlayer(index)" 
                class="absolute -top-2 -right-2 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 p-1.5 active:scale-90 transition-transform z-10"
              >
                <Icon name="mdi:close" class="size-4 text-slate-400 active:text-red-500" />
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

const { $db } = useNuxtApp()
const dataStore = useData()
const authStore = useAuthStore()
const route = useRoute()

// Constants
const TEE_MAPPING = {
  'mens': 'Blue',
  'senior': 'White',
  'ladies': 'Ladies Green'
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
const isAdmin = computed(() => authStore.isAdminForType(currentLeague.value?.type))

// Computed
const sortedCourses = computed(() => {
  return [...dataStore.courses]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c => ({ label: c.name, value: c.id }))
})

const selectedCourse = computed(() => dataStore.courses.find(c => c.id === selectedCourseId.value))

const sortedTeeOptions = computed(() => {
  if (!selectedCourse.value?.tees) return []
  return Object.entries(selectedCourse.value.tees)
    .map(([id, tee]) => ({ label: tee.name, value: id }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const canStart = computed(() => {
  return selectedCourseId.value && players.value.length > 0 && players.value.every(p => p.teeId) && !loading.value
})

// Helpers
const getDisplayHandicap = (player) => {
  const leagueHcp = isLeague.value && leagueId.value 
    ? player.leagueHandicaps?.[leagueId.value] 
    : null
  const val = leagueHcp ?? player.ghin ?? 0
  
  return parseFloat(val).toFixed(3)
}

const getTeeIdByName = (course, teeName) => {
  const entry = Object.entries(course?.tees || {}).find(([id, t]) => t.name === teeName)
  return entry ? entry[0] : ''
}

const applyTeeLogic = (playerList) => {
  if (!selectedCourse.value) return
  const leagueTeeSetting = currentLeague.value?.nextRound?.tees

  playerList.forEach(p => {
    let targetTeeName = ''
    if (isLeague.value && leagueTeeSetting) {
      targetTeeName = (leagueTeeSetting === 'Mixed') ? (TEE_MAPPING[p.tee_type] || 'Blue') : leagueTeeSetting
    } else if (selectedCourse.value.name.toLowerCase().includes('elks')) {
      targetTeeName = 'Blue'
    }
    if (targetTeeName) p.teeId = getTeeIdByName(selectedCourse.value, targetTeeName)
  })
}

// Initialization
onMounted(async () => {
  if (!dataStore.isHydrated) await dataStore.hydrateStore()
  if (authStore.userProfile && players.value.length === 0) {
    players.value.push({ ...authStore.userProfile, teeId: '' })
  }

  if (isLeague.value && currentLeague.value?.nextRound) {
    const course = dataStore.courses.find(c => c.name === currentLeague.value.nextRound.course)
    if (course) selectedCourseId.value = course.id
  } else if (!isLeague.value) {
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

    Object.entries(selectedCourse.value.tees).forEach(([id, tee]) => {
      courseSnapshot.tees[tee.name] = {
        name: tee.name,
        active: true,
        rating: tee.rating,
        slope: tee.slope,
        pars: tee.pars || [], 
        hnds: tee.hnds || [], 
        old_rating: tee.old_rating || tee.rating,
        old_slope: tee.old_slope || tee.slope
      }
    })

    const playerSnapshots = players.value.map(p => {
      const selectedTeeData = selectedCourse.value.tees[p.teeId]
      
      // Calculate dynamic par based on the selected tee's pars array
      const teePar = selectedTeeData.pars?.reduce((sum, val) => sum + Number(val), 0) || 72;
      
      const leagueHcp = isLeague.value && leagueId.value 
        ? p.leagueHandicaps?.[leagueId.value] 
        : null

      let finalIndex, finalCourseHcp

      if (leagueHcp !== null && leagueHcp !== undefined) {
        finalIndex = parseFloat(leagueHcp)
        // Keep the exact decimal precision requested for league tie-breakers
        finalCourseHcp = isLeague.value ? parseFloat(finalIndex.toFixed(3)) : Math.round(finalIndex)
      } else {
        const ghinIndex = p.ghin ?? 0
        // Calculate raw playing handicap using dynamic par
        const raw = (ghinIndex * (selectedTeeData.slope / 113)) + (selectedTeeData.rating - teePar)
        finalIndex = ghinIndex
        finalCourseHcp = isLeague.value ? parseFloat(raw.toFixed(3)) : Math.round(raw)
      }

      return {
        id: p.id,
        fname: p.fname,
        lname: p.lname,
        ghin: finalIndex,
        index: finalCourseHcp,
        teeId: p.teeId,
        tees: selectedTeeData.name, 
        tee_type: p.tee_type || 'mens'
      }
    })

    const roundData = {
      course: courseSnapshot.name,
      courseSnapshot,
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