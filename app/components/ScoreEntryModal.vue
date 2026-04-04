<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 class="text-2xl font-black text-emerald-600 uppercase tracking-tighter">Hole {{ holeNumber }}</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Par {{ holePar }} • Enter Scores</p>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-2 text-2xl">&times;</button>
        </div>

        <!-- Player List -->
        <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div v-for="player in localPlayers" :key="player.id" 
               class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            
            <div class="flex-1 mr-4">
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm truncate">{{ player.name }}</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Current: {{ player.originalScore || 'None' }}</p>
            </div>

            <!-- Score Controls -->
            <div class="flex items-center gap-3">
              <button 
                @click="updateScore(player.id, -1)"
                class="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xl font-bold shadow-sm active:scale-95 transition"
              >
                -
              </button>
              
              <div class="w-12 text-center">
                <span class="text-2xl font-black text-emerald-600 tabular-nums">
                  {{ tempScores[player.id] }}
                </span>
              </div>

              <button 
                @click="updateScore(player.id, 1)"
                class="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xl font-bold shadow-sm active:scale-95 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-6 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/30">
          <button 
            @click="$emit('close')" 
            class="py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button 
            @click="handleSave" 
            class="py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition"
          >
            Save Scores
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  holeNumber: Number,
  holePar: Number,
  players: Array // List of players in the group with their current rounds/scores
});

const emit = defineEmits(['close', 'save']);

// Local state for the modal's temp values
const tempScores = ref({});
const localPlayers = ref([]);

onMounted(() => {
  // Initialize scores based on your rules
  localPlayers.value = props.players.map(player => {
    const existingScore = player.scores[props.holeNumber - 1];
    
    // Rule: Default to par if the value is 0, null, or undefined
    const initialValue = (existingScore && existingScore > 0) 
      ? existingScore 
      : props.holePar;

    tempScores.value[player.id] = initialValue;

    return {
      ...player,
      originalScore: existingScore
    };
  });
});

const updateScore = (playerId, delta) => {
  const current = tempScores.value[playerId];
  // Rule: Score should never go below 1 and must be an integer
  tempScores.value[playerId] = Math.max(1, Math.floor(current + delta));
};

const handleSave = () => {
  // Send the tempScores object back to the parent to execute the Firestore Batch update
  emit('save', {
    holeIndex: props.holeNumber - 1,
    newScores: tempScores.value
  });
};
</script>
