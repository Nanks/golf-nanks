<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-sm">
      <div @click.self="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh]">
        
        <div class="p-4 px-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div class="min-w-0 pr-2">
            <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none truncate">
              {{ player.name }}
            </h3>
            <p class="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">
              {{ player.tees }} • HCP: {{ player.index % 1 !== 0 ? player.index.toFixed(3) : Math.round(player.index) }}
            </p>
          </div>
          <button @click="$emit('close')" class="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400 active:scale-95 transition-all shrink-0">
            <Icon name="mdi:close" class="size-5" />
          </button>
        </div>

        <div class="p-2 overflow-y-auto no-scrollbar flex flex-col gap-4">
          
          <div v-for="nine in ['Front', 'Back']" :key="nine" class="space-y-1.5">
            <div class="flex justify-between px-1 items-end">
              <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ nine }} 9</h4>
              <span class="text-[10px] font-black text-slate-800 dark:text-white uppercase">Tot: <span class="text-xs">{{ getNineTotal(nine) }}</span></span>
            </div>

            <div class="flex gap-1 px-1">
              <div v-for="h in getNineHoles(nine)" :key="h" class="flex-1 flex flex-col items-center gap-1">
                <span class="text-[7px] font-black text-slate-400 uppercase">#{{ h }}</span>
                
                <div class="relative w-full aspect-square flex items-center justify-center">
                  
                  <div v-if="showBirds && player.games?.birds?.[h-1] > 0" class="absolute -top-1.5 -left-1 text-emerald-500 flex items-start z-20 pointer-events-none drop-shadow-sm bg-white/90 dark:bg-slate-900/90 rounded-full px-0.5">
                    <span class="text-[10px] font-black leading-none">{{ Math.floor(player.games.birds[h-1]) || '' }}</span>
                    <span v-if="player.games.birds[h-1] % 1 !== 0" class="text-[7px] font-black leading-none mt-[1px] ml-[0.5px]">½</span>
                  </div>

                  <div v-if="player.winStats?.grossSkinHoles?.includes(h)" class="absolute -top-1.5 -right-1 text-amber-500 bg-amber-50 dark:bg-amber-950/80 rounded-full size-3.5 flex items-center justify-center z-20 pointer-events-none drop-shadow-sm border border-amber-200 dark:border-amber-800">
                    <span class="text-[7px] font-black leading-none mt-[1px]">G</span>
                  </div>

                  <div v-if="player.winStats?.netSkinHoles?.includes(h)" class="absolute -bottom-1.5 -left-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/80 rounded-full size-3.5 flex items-center justify-center z-20 pointer-events-none drop-shadow-sm border border-emerald-200 dark:border-emerald-800">
                    <span class="text-[7px] font-black leading-none mt-[1px]">N</span>
                  </div>

                  <div v-if="showDeuces && (player.games?.deuces?.[h-1] > 0 || player.scores[h-1] === 2)" class="absolute -bottom-1.5 -right-1 flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-950/80 rounded-full size-3.5 z-20 pointer-events-none drop-shadow-sm border border-blue-200 dark:border-blue-800">
                    <span class="text-[8px] font-black leading-none mt-[1px]">2</span>
                  </div>

                  <div 
                    :class="getScoreClass(player.scores[h-1], h)"
                    class="w-full h-full rounded-lg font-black text-base transition-all flex flex-col items-center justify-center border-2 relative pb-1 shadow-sm"
                  >
                    <span class="mt-0.5">{{ player.scores[h-1] || '-' }}</span>
                    
                    <div v-if="player.games?.pops?.[h-1] > 0" class="absolute bottom-0.5 w-full flex justify-center items-end gap-[1px]">
                      <div v-for="dot in Math.floor(player.games.pops[h-1])" :key="'p'+dot" class="w-1 h-1 rounded-full opacity-80 bg-emerald-500"></div>
                      <div v-if="player.games.pops[h-1] % 1 !== 0" class="w-[3px] h-[3px] rounded-full opacity-50 bg-emerald-500 mb-[1px]"></div>
                    </div>
                  </div>
                </div>

                <span class="text-[7px] font-black text-slate-500 tabular-nums">
                  {{ formatNet(player.games?.net?.[h-1]) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            
            <div class="flex items-baseline gap-1">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Net</span>
              <span :class="getNetColor(player.games.totalNet)" class="text-sm font-black italic">{{ player.games.totalNet > 0 ? '+' : '' }}{{ formatNet(player.games.totalNet) }}</span>
            </div>

            <div v-if="showBirds" class="flex items-baseline gap-1">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Birds</span>
              <span class="text-sm font-black text-emerald-500 italic">{{ player.games.totalBirds }}</span>
            </div>

            <div v-if="showDeuces" class="flex items-baseline gap-1">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deuces</span>
              <span class="text-sm font-black text-amber-500 italic">{{ player.games.totalDeuces }}</span>
            </div>

            <div v-if="hasGame('Gross Skins')" class="flex items-baseline gap-1">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">G Skins</span>
              <span class="text-sm font-black text-slate-800 dark:text-white italic">{{ player.winStats?.grossSkinsCount || 0 }}</span>
            </div>

            <div v-if="hasGame('Net Skins')" class="flex items-baseline gap-1">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">N Skins</span>
              <span class="text-sm font-black text-slate-800 dark:text-white italic">{{ player.winStats?.netSkinsCount || 0 }}</span>
            </div>

            <div v-if="hasGame('Chicago Points') || hasGame('Modified Chicago')" class="flex items-baseline gap-1">
              <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Chicago</span>
              <span class="text-sm font-black text-blue-500 italic">{{ formatNet(player.games.totalChicago || player.games.totalModChicago) }}</span>
            </div>
            
          </div>
        </div>

        <div class="p-2 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
           <button @click="$emit('close')" class="w-full max-w-xs py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
             Close
           </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps(['isOpen', 'player', 'event']);
defineEmits(['close']);
const route = useRoute();

// --- Logic Helpers ---
const roundType = computed(() => route.params.type || '');
const gameArray = computed(() => props.event?.game || []);

const hasGame = (gameName) => gameArray.value.includes(gameName);

const showBirds = computed(() => ['vegas', 'mbWed'].includes(roundType.value));
const showDeuces = computed(() => roundType.value === 'vegas' || hasGame('Deuce Pot'));

// --- Scorecard Rendering ---
const getNineHoles = (nine) => nine === 'Front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];

const getNineTotal = (nine) => {
  const holes = getNineHoles(nine);
  return holes.reduce((acc, h) => acc + (parseInt(props.player.scores[h-1]) || 0), 0);
};

const formatNet = (val) => {
  if (val === undefined || val === null) return '-';
  const hasDecimals = props.player?.index % 1 !== 0;
  return hasDecimals ? val.toFixed(1) : Math.round(val);
};

const getNetColor = (rel) => {
  if (rel === undefined || rel === null || Math.abs(rel) < 0.0001) return 'text-slate-800 dark:text-white';
  return rel < 0 ? 'text-red-500' : 'text-blue-500 dark:text-blue-400';
};

const getScoreClass = (val, hole) => {
  if (!val || val === 0) return 'bg-transparent border-slate-200 dark:border-slate-700 text-transparent'; 
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