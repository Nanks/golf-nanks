<!-- components/ScorecardGrid.vue -->
<template>
  <div class="overflow-x-auto pb-4">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="text-[10px] uppercase text-slate-400 font-black tracking-widest">
          <th class="p-2 sticky left-0 bg-white dark:bg-slate-950 z-10">Player</th>
          <th v-for="h in 18" :key="h" 
              @click="openHoleModal(h)"
              class="p-2 text-center cursor-pointer hover:text-emerald-600">
            {{ h }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="player in groupPlayers" :key="player.id" class="border-t border-slate-100 dark:border-slate-800">
          <td class="p-2 font-bold text-sm sticky left-0 bg-white dark:bg-slate-950 truncate max-w-[100px]">
            {{ player.name }}
          </td>
          <td v-for="h in 18" :key="h" 
              @click="openHoleModal(h)"
              class="p-2 text-center text-lg font-black tabular-nums cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition">
            {{ player.scores[h-1] || '-' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
// Inside your script setup
const activeHole = ref(null);
const tempScores = ref({}); // { playerID: currentScore }

const openHoleModal = (holeNumber) => {
  activeHole.value = holeNumber;
  const holeIndex = holeNumber - 1;
  const holePar = selectedCourseData.value?.pars?.[holeIndex] || 4; // Default to 4 if par missing

  // Initialize temp scores for the modal
  groupPlayers.value.forEach(player => {
    const existingScore = player.scores[holeIndex];
    // Rule: Default to par if value is 0 or null
    tempScores.value[player.id] = (existingScore && existingScore > 0) ? existingScore : holePar;
  });
  isModalOpen.value = true;
};

const adjustScore = (playerId, delta) => {
  const newScore = tempScores.value[playerId] + delta;
  // Rule: Score should never go below 1
  if (newScore >= 1) {
    tempScores.value[playerId] = newScore;
  }
};

</script>