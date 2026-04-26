<template>
  <div class="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center font-mono">
    <div class="max-w-2xl w-full bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
      
      <h1 class="text-2xl font-black text-emerald-500 uppercase tracking-widest mb-2">
        Deep Database Migration (Historical Only)
      </h1>
      <p class="text-slate-400 text-sm mb-8">
        This version targets only the historical 'rounds' subcollections. It uses case-insensitive fuzzy matching and supports both flat and array player schemas.
      </p>

      <div class="grid grid-cols-2 gap-4">
        <button 
          @click="runMigration(true)" 
          :disabled="isMigrating"
          class="w-full py-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all"
        >
          {{ isMigrating ? 'Processing...' : '1. Run Dry-Run (100 Docs)' }}
        </button>

        <button 
          @click="runMigration(false)" 
          :disabled="isMigrating"
          class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all"
        >
          {{ isMigrating ? 'Processing...' : '2. Execute Full Migration' }}
        </button>
      </div>

      <div v-if="logs.length > 0" class="mt-6 p-4 bg-black rounded-xl max-h-96 overflow-y-auto border border-slate-800 text-[10px] text-slate-300 space-y-2 whitespace-pre-wrap">
        <p v-for="(log, i) in logs" :key="i">{{ log }}</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { collection, collectionGroup, getDocs, updateDoc, deleteField } from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'

const { $db } = useNuxtApp()
const authStore = useAuthStore()
const isMigrating = ref(false)
const logs = ref([])

const addLog = (msg) => {
  logs.value.push(msg)
  console.log(msg)
}

const cleanStr = (str) => String(str || '').toLowerCase().replace(/\s+/g, '')

const runMigration = async (isDryRun = true) => {
  if (!authStore.isSuperAdmin) {
    addLog('❌ Unauthorized: You must be a Super Admin.')
    return
  }

  isMigrating.value = true
  logs.value = []
  let updateCount = 0
  let diagnosticPrinted = false

  try {
    addLog('🗺️ Building Master Course & Tee Dictionary...')
    const coursesSnap = await getDocs(collection($db, 'courses'))
    const masterCourses = {}

    for (const cDoc of coursesSnap.docs) {
      const courseData = cDoc.data()
      const teesSnap = await getDocs(collection($db, 'courses', cDoc.id, 'tees'))
      
      const teesByName = {}
      teesSnap.docs.forEach(tDoc => {
        const tData = tDoc.data()
        const cleanName = cleanStr(tData.name)
        teesByName[cleanName] = tDoc.id
        if (cleanName === 'green') teesByName['ladiesgreen'] = tDoc.id
      })

      masterCourses[courseData.name] = { id: cDoc.id, teesByName }
    }
    
    // EXCLUSIVELY FETCHING HISTORICAL ROUNDS
    addLog('🔍 Fetching historical rounds...')
    const historicRoundsSnap = await getDocs(collectionGroup($db, 'rounds'))
    const allRounds = historicRoundsSnap.docs
    
    const targetRounds = isDryRun ? allRounds.slice(0, 100) : allRounds
    addLog(`✅ Processing ${targetRounds.length} total rounds...`)

    for (const docSnap of targetRounds) {
      const round = docSnap.data()
      const updates = {}
      let needsUpdate = false

      // 1. FUZZY COURSE MATCHING
      let masterCourse = null
      const roundCourseClean = cleanStr(round.course)
      
      for (const [dbCourseName, data] of Object.entries(masterCourses)) {
        const dbCourseClean = cleanStr(dbCourseName)
        if (roundCourseClean.includes(dbCourseClean) || dbCourseClean.includes(roundCourseClean)) {
          masterCourse = data
          break
        }
      }
      
      if (!masterCourse) {
         const elksKey = Object.keys(masterCourses).find(k => cleanStr(k).includes('elks'))
         if (elksKey) masterCourse = masterCourses[elksKey]
      }
      if (!masterCourse) continue
      
      const realCourseId = masterCourse.id

      // Root-Level Course ID
      if (round.courseId !== realCourseId) {
        updates.courseId = realCourseId
        needsUpdate = true
      }

      // 2. Refactor Course Snapshot
      if (round.courseSnapshot) {
        const oldTees = round.courseSnapshot.tees || {}
        const newTeesMap = {}
        let snapshotChanged = false

        if (round.courseSnapshot.id !== realCourseId) snapshotChanged = true

        for (const [key, teeData] of Object.entries(oldTees)) {
          let actualName = teeData.name
          if (cleanStr(actualName) === 'ladiesgreen') actualName = 'Green'

          const cleanKey = cleanStr(key)
          const cleanTeeDataName = cleanStr(teeData.name)
          const realTeeId = masterCourse.teesByName[cleanTeeDataName] || masterCourse.teesByName[cleanKey] || key

          if (key !== realTeeId || teeData.name !== actualName) snapshotChanged = true
          newTeesMap[realTeeId] = { ...teeData, name: actualName }
        }

        if (snapshotChanged) {
          updates.courseSnapshot = { ...round.courseSnapshot, id: realCourseId, tees: newTeesMap }
          needsUpdate = true
        }
      }

      // 3. Update MODERN Players Array
      if (round.players && Array.isArray(round.players)) {
        let playersChanged = false
        const updatedPlayers = round.players.map(player => {
          let p = { ...player }
          const cleanPTees = cleanStr(p.tees)

          if (cleanPTees === 'ladiesgreen') {
            p.tees = 'Green'
            playersChanged = true
          }

          let realTeeId = masterCourse.teesByName[cleanPTees] 
          if (!realTeeId && p.teeId) realTeeId = p.teeId 

          if (realTeeId && p.teesId !== realTeeId) {
            p.teesId = realTeeId
            playersChanged = true
          }

          if (p.teeId !== undefined) {
            delete p.teeId
            playersChanged = true
          }
          return p
        })

        if (playersChanged) {
          updates.players = updatedPlayers
          needsUpdate = true
        }
      }

      // 4. Update HISTORICAL Flat Root Properties
      if (round.tees) {
        const cleanRootTees = cleanStr(round.tees)

        if (cleanRootTees === 'ladiesgreen') {
          updates.tees = 'Green'
          needsUpdate = true
        }

        let realTeeId = masterCourse.teesByName[cleanRootTees]
        if (!realTeeId && round.teeId) realTeeId = round.teeId
        
        if (!realTeeId && round.courseSnapshot?.tees) {
          const matchingEntry = Object.entries(round.courseSnapshot.tees).find(([k, v]) => cleanStr(v.name) === cleanRootTees || cleanStr(k) === cleanRootTees)
          if (matchingEntry) realTeeId = matchingEntry[0]
        }

        if (realTeeId && round.teesId !== realTeeId) {
          updates.teesId = realTeeId
          needsUpdate = true
        }

        if (round.teeId !== undefined) {
          updates.teeId = deleteField()
          needsUpdate = true
        }
      }

      // EXECUTE OR LOG
      if (needsUpdate) {
        updateCount++
        
        if (isDryRun && updateCount <= 5) {
          addLog(`\n📝 UPDATE FOR DOC: ${docSnap.id}\n${JSON.stringify(updates, null, 2)}`)
        } else if (!isDryRun) {
          await updateDoc(docSnap.ref, updates)
          if (updateCount === 1 || updateCount % 100 === 0) addLog(`⏳ Updated ${updateCount}...`)
        }
      } else if (isDryRun && !diagnosticPrinted && updateCount === 0) {
        // Diagnostic only prints if it's skipping docs
        diagnosticPrinted = true
        addLog(`\n⚠️ DIAGNOSTIC: Skipped doc ${docSnap.id}. Everything looks matched and up to date?`)
      }
    }

    if (isDryRun) {
      addLog(`\n🔍 Dry Run Complete! ${updateCount} out of ${targetRounds.length} scanned documents require updates.`)
    } else {
      addLog(`\n🎉 Migration Complete! Successfully refactored ${updateCount} documents.`)
    }
    
  } catch (err) {
    addLog(`❌ Error: ${err.message}`)
    console.error(err)
  } finally {
    isMigrating.value = false
  }
}
</script>