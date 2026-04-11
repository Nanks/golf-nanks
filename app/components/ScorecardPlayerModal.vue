<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div @click.self="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
              {{ player.name }}
            </h3>
            <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
              {{ player.course }} • {{ player.tees }} • HCP: {{ player.index % 1 !== 0 ? player.index.toFixed(3) : Math.round(player.index) }}
            </p>
          </div>
          <button @click="$emit('close')" class="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400 active:scale-95 transition-all">
            <Icon name="mdi:close" class="size-5" />
          </button>
        </div>

        <div class="p-4 overflow-y-auto no-scrollbar space-y-6">
          
          <div v-for="nine in ['Front', 'Back']" :key="nine" class="space-y-3">
            <div class="flex justify-between px-2 items-end">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ nine }} 9</h4>
              <span class="text-xs font-black text-slate-800 dark:text-white">Total: {{ getNineTotal(nine) }}</span>
            </div>

            <div class="flex gap-1.5">
              <div v-for="h in getNineHoles(nine)" :key="h" class="flex-1 flex flex-col items-center gap-1">
                <span class="text-[8px] font-black text-slate-300 uppercase">#{{ h }}</span>
                
                <div class="relative w-full aspect-square flex items-center justify-center">
                  
                  <div v-if="player.games?.birds?.[h-1] > 0" class="absolute -top-1.5 -left-1 text-emerald-500 flex items-start z-20 pointer-events-none drop-shadow-sm bg-white/50 dark:bg-slate-900/50 rounded-full px-0.5">
                    <span class="text-[10px] font-black leading-none">{{ Math.floor(player.games.birds[h-1]) || '' }}</span>
                    <span v-if="player.games.birds[h-1] % 1 !== 0" class="text-[7px] font-black leading-none mt-[1px] ml-[0.5px]">1/2</span>
                  </div>

                  <div v-if="player.games?.deuces?.[h-1] > 0 || player.scores[h-1] === 2" class="absolute -bottom-1.5 -right-1 flex items-center justify-center text-blue-600 dark:text-blue-300 rounded-full size-3.5 z-20 pointer-events-none drop-shadow-sm">
                    <span class="text-[8px] font-black leading-none mt-[1px]">2</span>
                  </div>

                  <div 
                    :class="getScoreClass(player.scores[h-1], h)"
                    class="w-full h-full rounded-xl font-black text-sm transition-all flex flex-col items-center justify-center border-2 relative pb-1 shadow-sm"
                  >
                    <span class="mt-1">{{ player.scores[h-1] || '-' }}</span>
                    
                    <div v-if="player.games?.pops?.[h-1] > 0" class="absolute bottom-0.5 w-full flex justify-center items-end gap-[1px]">
                      <div v-for="dot in Math.floor(player.games.pops[h-1])" :key="'p'+dot" class="w-1.5 h-1.5 rounded-full opacity-80 bg-emerald-500"></div>
                      <div v-if="player.games.pops[h-1] % 1 !== 0" class="w-1 h-1 rounded-full opacity-50 bg-emerald-500 mb-[1px]"></div>
                    </div>
                  </div>
                </div>

                <span class="text-[8px] font-black text-slate-500 tabular-nums">
                  {{ formatNet(player.games?.net?.[h-1]) }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div class="text-center">
              <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Net</p>
              <p :class="getNetColor(player.totalNet)" class="text-lg font-black italic">{{ player.games.totalNet > 0 ? '+' : '' }}{{ formatNet(player.games.totalNet) }}</p>
            </div>
            <div class="text-center">
              <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Birds</p>
              <p class="text-lg font-black text-emerald-600 italic">{{ player.games.totalBirds }}</p>
            </div>
            <div class="text-center">
              <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deuces</p>
              <p class="text-lg font-black text-amber-500 italic">{{ player.games.totalDeuces }}</p>
            </div>
          </div>

        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
           <button @click="$emit('close')" class="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
             Close Scorecard
           </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps(['isOpen', 'player']);
defineEmits(['close']);

const getNineHoles = (nine) => nine === 'Front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];

const getNineTotal = (nine) => {
  const holes = getNineHoles(nine);
  return holes.reduce((acc, h) => acc + (parseInt(props.player.scores[h-1]) || 0), 0);
};

const formatNet = (val) => {
  if (val === undefined || val === null) return '-';
  const hasDecimals = props.player?.index % 1 !== 0;
  return hasDecimals ? val.toFixed(3) : Math.round(val);
};

const getNetColor = (rel) => {
  if (!rel || Math.abs(rel) < 0.0001) return 'text-slate-800 dark:text-white';
  return rel < 0 ? 'text-red-500' : 'text-blue-500 dark:text-blue-400';
};

// --- Exact Styling Logic from your Reference ---
const getScoreClass = (val, hole) => {
  if (!val || val === 0) return 'bg-transparent border-slate-200 dark:border-slate-700 text-transparent'; 
  
  // Get par from player's course snapshot
  const par = props.player?.courseSnapshot?.tees?.[props.player.tee]?.pars?.[hole - 1] || 4;
  
  if (val < par) return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500 shadow-sm';
  if (val === par) return 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm';
  
  return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm';
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>