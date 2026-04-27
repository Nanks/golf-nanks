<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
        <div @click="$emit('update:isOpen', false)" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        
        <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
          
          <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Hole {{ hole }} <span class="text-emerald-500 ml-1">• Par {{ currentPar }}</span>
              </p>
              <h4 class="text-xl font-black text-slate-800 dark:text-white uppercase italic leading-none">Score Entry</h4>
            </div>
            <button @click="$emit('update:isOpen', false)" class="size-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-transform">
              <Icon name="mdi:close" class="size-5" />
            </button>
          </div>

          <div class="p-3 overflow-y-auto space-y-1.5 no-scrollbar">
            <div v-for="p in round.players" :key="'key'+p.id" @click="localActivePlayerId = p.id" 
              class="p-3.5 rounded-2xl border-2 flex justify-between items-center transition-all cursor-pointer"
              :class="localActivePlayerId === p.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'"
            >
              <div class="flex flex-col">
                <div class="font-black text-xs uppercase transition-colors" :class="localActivePlayerId === p.id ? 'text-emerald-600' : 'text-slate-500'">
                  {{ p.fname }} {{ p.lname }}
                </div>
                <div v-if="Math.floor(pStats[p.id]?.pops?.[hole - 1] || 0) > 0" class="flex gap-1 mt-1">
                  <div v-for="dot in Math.floor(pStats[p.id]?.pops?.[hole - 1] || 0)" :key="p.id+'k'+dot" class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_2px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
              <div class="text-3xl font-black w-14 text-center transition-colors" :class="localActivePlayerId === p.id ? 'text-emerald-600' : 'text-slate-300'">
                {{ localScores[p.id] || '-' }}
              </div>
            </div>
          </div>

          <div class="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
            
            <div class="flex gap-2 mb-3">
              <button 
                v-for="n in quickEntryNumbers" 
                :key="n" 
                @click="setScore(n)" 
                class="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-600 dark:text-white active:scale-95 shadow-sm transition-transform"
              >
                {{ n }}
              </button>
            </div>

            <div class="flex items-center gap-4 mb-5">
              <button @click="adjustScore(-1)" class="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center active:bg-red-500 active:border-red-500 active:text-white shadow-sm transition-colors"><Icon name="mdi:minus" class="size-8" /></button>
              <button @click="adjustScore(1)" class="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center active:bg-emerald-500 active:border-emerald-500 active:text-white shadow-sm transition-colors"><Icon name="mdi:plus" class="size-8" /></button>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <button @click="nextPlayer" class="py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">Next Player</button>
              <button @click="saveScores" class="py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Save Hole {{ hole }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  hole: Number,
  initialPlayerId: String,
  round: Object,
  pStats: Object
});

const emit = defineEmits(['update:isOpen', 'save']);

const localScores = ref({});
const localActivePlayerId = ref(null);

// Get the Par to display in the header
const currentPar = computed(() => {
  if (!props.round?.courseSnapshot || !props.round?.players?.length) return 4;
  const firstTee = props.round.players[0]?.tees;
  return props.round.courseSnapshot.tees?.[firstTee]?.pars?.[props.hole - 1] || 4;
});

// Calculate the quick entry numbers: [Par - 1, Par, Par + 1]
const quickEntryNumbers = computed(() => {
  const par = currentPar.value;
  return [par - 1, par, par + 1];
});

// Initialize state every time the modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.round) {
    localActivePlayerId.value = props.initialPlayerId || props.round.players[0]?.id;
    
    const initScores = {};
    props.round.players.forEach(p => {
      const currentScore = props.round.scores[p.id][props.hole - 1];
      initScores[p.id] = (currentScore || currentPar.value).toString();
    });
    
    localScores.value = initScores;
  }
});

// Controls
const setScore = (val) => {
  if (localActivePlayerId.value) {
    // Set the score
    localScores.value[localActivePlayerId.value] = val.toString();
    // Auto-advance to the next player
    nextPlayer();
  }
};

const adjustScore = (mod) => {
  const pid = localActivePlayerId.value;
  if (!pid) return;
  const current = parseInt(localScores.value[pid]) || 4;
  localScores.value[pid] = Math.min(Math.max(current + mod, 1), 15).toString();
  // Note: Fine adjustments do NOT auto-advance, giving the user time to adjust multiple strokes.
};

const nextPlayer = () => {
  const players = props.round.players;
  const idx = players.findIndex(p => p.id === localActivePlayerId.value);
  localActivePlayerId.value = players[(idx + 1) % players.length].id;
};

// Emit data back to parent to save
const saveScores = () => {
  emit('save', localScores.value);
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>