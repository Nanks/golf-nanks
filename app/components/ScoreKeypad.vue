<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div @click="$emit('update:isOpen', false)" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh]">

          <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Hole {{ hole }}
              </p>
              <h4 class="text-xl font-black text-slate-800 dark:text-white uppercase italic leading-none">Score Entry</h4>
            </div>
            <button @click="$emit('update:isOpen', false)" class="size-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-transform">
              <Icon name="mdi:close" class="size-5" />
            </button>
          </div>

          <div class="p-3 overflow-y-auto space-y-1.5 no-scrollbar">
            <div v-for="p in round.players" :key="'key'+p.id"
              class="px-3 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center gap-2"
            >
              <div class="flex flex-col min-w-0">
                <div class="font-black text-lg uppercase text-slate-600 dark:text-slate-300 truncate">
                  {{ p.fname }} {{ p.lname }}
                </div>
                <div v-if="Math.floor(pStats[p.id]?.pops?.[hole - 1] || 0) > 0" class="flex gap-1 mt-1">
                  <div v-for="dot in Math.floor(pStats[p.id]?.pops?.[hole - 1] || 0)" :key="p.id+'k'+dot" class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_2px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <button
                  @click="adjustScore(p.id, -1)"
                  class="size-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl active:bg-red-500 active:border-red-500 active:text-white transition-colors"
                >
                  <Icon name="mdi:minus" class="size-5" />
                </button>
                <div class="text-2xl font-black w-8 text-center text-slate-800 dark:text-white tabular-nums">
                  {{ localScores[p.id] || '-' }}
                </div>
                <button
                  @click="adjustScore(p.id, 1)"
                  class="size-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl active:bg-emerald-500 active:border-emerald-500 active:text-white transition-colors"
                >
                  <Icon name="mdi:plus" class="size-5" />
                </button>
              </div>
            </div>
          </div>

          <div class="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
            <button @click="saveScores" class="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Save Hole {{ hole }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  hole: Number,
  round: Object,
  pStats: Object
});

const emit = defineEmits(['update:isOpen', 'save']);

const localScores = ref({});

// Each player can be on a different tee, so par is resolved per player rather
// than for a single "active" selection.
const getPlayerPar = (p) => {
  const tee = p?.teesId || props.round?.players?.[0]?.teesId;
  return props.round?.courseSnapshot?.tees?.[tee]?.pars?.[props.hole - 1] || 4;
};

// Initialize state every time the modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.round) {
    const initScores = {};
    props.round.players.forEach(p => {
      // Safely access the current score if they already entered one
      const currentScore = props.round.scores?.[p.id]?.[props.hole - 1];
      // Set to existing score, or default to their specific par
      initScores[p.id] = (currentScore || getPlayerPar(p)).toString();
    });
    localScores.value = initScores;
  }
});

const adjustScore = (playerId, mod) => {
  const player = props.round.players.find(p => p.id === playerId);
  const current = parseInt(localScores.value[playerId]) || getPlayerPar(player);
  localScores.value[playerId] = Math.min(Math.max(current + mod, 1), 15).toString();
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
