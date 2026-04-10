<template>
  <div class="min-h-screen bg-black text-white p-8 flex items-center justify-center">
    <div class="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-xl w-full shadow-xl">
      <h1 class="text-2xl font-bold mb-4 text-[#82D927]">Rebuild Yearly Handicaps</h1>
      <p class="text-gray-400 text-sm mb-6">
        Calculates L-HCPs based ONLY on completed calendar events. Incomplete scorecards (0s) are purged, and missing rounds are penalized at GHIN - 3.
      </p>

      <div class="mb-6">
        <h3 class="font-bold text-white mb-2">Detected Yearly Leagues:</h3>
        <div v-if="yearlyLeagues.length === 0" class="text-gray-500 text-sm">
          Loading yearly leagues...
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <span 
            v-for="league in yearlyLeagues" 
            :key="league.id" 
            class="bg-gray-800 border border-gray-700 text-gray-300 text-sm py-1 px-3 rounded-full"
          >
            {{ league.name || league.type || league.id }}
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <button 
          @click="runRebuild" 
          :disabled="isProcessing || yearlyLeagues.length === 0"
          class="w-full bg-[#82D927] hover:bg-[#6eb821] text-black font-bold py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isProcessing ? 'Rebuilding Handicaps...' : 'Process Player Profiles' }}
        </button>

        <button 
          @click="runTestForDann" 
          :disabled="yearlyLeagues.length === 0"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
        >
          Run Console Test (Dann)
        </button>

        <div v-if="statusMessage" class="p-4 rounded bg-gray-800 text-center border border-gray-700">
          <p :class="isError ? 'text-red-400' : 'text-green-400'" class="font-medium">
            {{ statusMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// 1. IMPORT deleteField from firestore
import { collection, getDocs, doc, getDoc, query, where, writeBatch, deleteField } from 'firebase/firestore'
import { calcDifferential, calcLeagueHandicap, calcPops, calcAdjustedGross, calcRawGross } from '~/utils/gameLogic'

const { $db } = useNuxtApp()

const yearlyLeagues = ref([])
const validDatesByLeague = ref({})

const isProcessing = ref(false)
const statusMessage = ref('')
const isError = ref(false)

onMounted(async () => {
  try {
    const leaguesRef = collection($db, 'leagues')
    const q = query(leaguesRef, where('cadence', '==', 'yearly'))
    const snap = await getDocs(q)
    
    yearlyLeagues.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    for (const league of yearlyLeagues.value) {
      const calSnap = await getDocs(collection($db, 'leagues', league.id, 'calendar'))
      const validDates = new Set()
      
      calSnap.forEach(doc => {
        const calData = doc.data()
        if (calData.status === 'mdi-check-bold' && calData.iso) {
          validDates.add(calData.iso)
        }
      })
      validDatesByLeague.value[league.id] = validDates
    }
  } catch (e) {
    console.error("Failed to load yearly leagues and calendars", e)
  }
})

const processRoundData = (round) => {
  const teeName = round.tees || 'White'
  const teeData = round.courseSnapshot?.tees?.[teeName] || {}
  
  const cr = teeData.rating || teeData.old_rating || 70
  const sr = teeData.slope || teeData.old_slope || 113
  const pars = teeData.pars || new Array(18).fill(4)
  const hnds = teeData.hnds || new Array(18).fill(0)
  
  const historicalIndex = parseFloat(round.index) || 0
  const pops = calcPops(round.scores || [], hnds, historicalIndex)

  const adjustedGross = calcAdjustedGross(round.scores, pars, pops)
  const rawGross = calcRawGross(round.scores)
  const diff = calcDifferential(adjustedGross, cr, sr)

  return {
    roundId: round.id,
    date: round.iso,
    rawGross,           
    adjustedGross, 
    courseRating: cr,
    slopeRating: sr,
    differential: isNaN(diff) ? 0 : diff,
    isPadding: false
  }
}

// (You can keep your runTestForDann function exactly as it was here)

const runRebuild = async () => {
  isProcessing.value = true
  statusMessage.value = 'Rebuilding...'
  try {
    const playersSnapshot = await getDocs(collection($db, 'players'))
    let batch = writeBatch($db)
    let count = 0
    let playersSkipped = 0

    for (const playerDoc of playersSnapshot.docs) {
      const playerData = playerDoc.data()
      const paddingDiff = (parseFloat(playerData.ghin || playerData.index) || 0) - 3
      
      // 2. Initialize the payload to scrub the old legacy fields
      const updatePayload = {
        leagueHandicap: deleteField(),
        recentRoundsAudit: deleteField(),
        isYearlyMember: true
      }
      
      let updated = false

      // Process each league totally independently
      for (const league of yearlyLeagues.value) {
        const validDates = validDatesByLeague.value[league.id]
        const roundsSnap = await getDocs(query(collection($db, 'players', playerDoc.id, 'rounds'), where('leagueId', '==', league.id)))
        
        const validRounds = roundsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(round => round.iso && validDates.has(round.iso) && round.scores && !round.scores.some(s => Number(s) === 0))
          .sort((a, b) => new Date(b.iso) - new Date(a.iso))
          .slice(0, 10)

        // If they don't have rounds for THIS league, skip adding it to the payload
        if (validRounds.length === 0) continue

        const auditTrail = validRounds.map(processRoundData)
        while (auditTrail.length < 10) {
          auditTrail.push({ 
            roundId: `padded-${auditTrail.length}`, 
            date: 'N/A', rawGross: 0, adjustedGross: 0, courseRating: 0, slopeRating: 0, 
            differential: paddingDiff, isPadding: true 
          })
        }

        const hcp = calcLeagueHandicap(auditTrail.map(a => a.differential), 4, 10)

        // 3. Dot-Notation Update! 
        // This targets the specific map key without wiping out other leagues
        updatePayload[`leagueHandicaps.${league.id}`] = hcp
        updatePayload[`leagueAudits.${league.id}`] = auditTrail
        updated = true
      }

      if (updated) {
        batch.update(playerDoc.ref, updatePayload)
        
        if (++count % 450 === 0) { 
          await batch.commit()
          batch = writeBatch($db)
        }
      } else {
        playersSkipped++
      }
    }
    
    if (count > 0) {
      await batch.commit()
    }
    
    statusMessage.value = `Success! Processed ${count} active players. Skipped ${playersSkipped} players with no data.`
  } catch (error) { 
    isError.value = true
    statusMessage.value = error.message 
  } finally { 
    isProcessing.value = false 
  }
}
</script>
