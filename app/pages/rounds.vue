<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 pt-20">
    <div class="max-w-md mx-auto space-y-6">
      
      <!-- 1. Round Entry Form -->
      <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 class="text-xl font-bold mb-4">New Scorecard</h2>
        
        <input 
          v-model="courseName" 
          placeholder="Course Name" 
          class="w-full p-3 mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition" 
        />
        
        <!-- Front/Back Toggle -->
        <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
          <button 
            @click="viewSide = 'front'" 
            :class="viewSide === 'front' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'" 
            class="flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition"
          >
            Holes 1-9
          </button>
          <button 
            @click="viewSide = 'back'" 
            :class="viewSide === 'back' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'" 
            class="flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition"
          >
            Holes 10-18
          </button>
        </div>

        <!-- Hole Grid -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div 
            v-for="n in (viewSide === 'front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18])" 
            :key="n" 
            @click.stop="openScoreModal(n)"
            class="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-center cursor-pointer active:scale-95 transition-transform"
          >
            <div class="text-[10px] text-slate-400 font-bold uppercase mb-1">Hole {{ n }}</div>
            <div class="text-2xl font-black text-emerald-600 tabular-nums">
              {{ scores[n - 1] || '-' }}
            </div>
          </div>
        </div>

        <!-- Totals Summary -->
        <div class="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mb-6">
          <div>
            <p class="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Total Score</p>
            <p class="text-3xl font-black text-emerald-600">{{ totalScore }}</p>
          </div>
          <div class="text-right text-xs font-bold text-slate-400">
            <p>Front: {{ frontTotal }}</p>
            <p>Back: {{ backTotal }}</p>
          </div>
        </div>

        <button 
          @click="handleSave" 
          :disabled="!courseName"
          class="w-full bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 dark:shadow-none"
        >
          Save Round
        </button>
      </div>

      <!-- 2. Recent History List -->
      <div class="space-y-4">
        <div class="flex justify-between items-center px-2">
          <h2 class="text-lg font-bold">History</h2>
          <button @click="loadRounds" class="text-xs font-bold text-emerald-600 uppercase">Refresh</button>
        </div>

        <div v-if="rounds.length === 0" class="text-center p-12 bg-slate-100 dark:bg-slate-900 rounded-3xl text-slate-400 italic">
          No rounds found.
        </div>

        <div v-else class="space-y-3">
          <div v-for="round in rounds" :key="round.id" class="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div>
              <p class="font-bold">{{ round.course }}</p>
              <p class="text-[10px] text-slate-400">{{ formatDate(round.createdAt) }}</p>
            </div>
            <div class="text-xl font-black text-emerald-600">{{ round.score }}</div>
          </div>
        </div>
      </div>

      <!-- 3. Score Entry Modal -->
      <ScoreModal 
        v-if="activeHole !== null"
        :holeNumber="activeHole"
        v-model="scores[activeHole - 1]"
        @close="activeHole = null"
      />

    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'authenticated' })

const { saveRound, fetchRounds } = useRounds()

// State
const courseName = ref('')
const viewSide = ref('front')
const scores = ref(Array(18).fill(null))
const activeHole = ref(null)
const rounds = ref([])

// Computed Totals
const frontTotal = computed(() => scores.value.slice(0, 9).reduce((a, b) => a + (b || 0), 0))
const backTotal = computed(() => scores.value.slice(9, 18).reduce((a, b) => a + (b || 0), 0))
const totalScore = computed(() => frontTotal.value + backTotal.value)

// Lifecycle
onMounted(() => {
  loadRounds()
})

// Actions
const openScoreModal = (hole) => {
  // Initialize with a 4 if the hole is empty
  if (scores.value[hole - 1] === null) {
    scores.value[hole - 1] = 4
  }
  activeHole.value = hole
}

const handleSave = async () => {
  if (!courseName.value) return
  try {
    await saveRound(courseName.value, totalScore.value, scores.value)
    // Reset form
    courseName.value = ''
    scores.value = Array(18).fill(null)
    loadRounds()
  } catch (err) {
    alert("Error saving round: " + err.message)
  }
}

const loadRounds = async () => {
  rounds.value = await fetchRounds()
}

const formatDate = (ts) => {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString()
}
</script>
