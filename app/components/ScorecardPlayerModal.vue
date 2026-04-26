<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-stone-900/60 backdrop-blur-sm">
      <div @click.self="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[95vh]">
        
        <div class="p-4 px-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
          <div class="min-w-0 pr-2">
            <h3 class="text-xl font-black text-stone-800 dark:text-white uppercase tracking-tight leading-none truncate">
              {{ player.name }}
            </h3>
            <p class="text-sm font-black text-lime-500 uppercase tracking-widest mt-1">
              {{ player.tees }} • HCP: {{ player.index % 1 !== 0 ? player.index.toFixed(3) : Math.round(player.index) }}
            </p>
          </div>
          <button @click="$emit('close')" class="p-1.5 bg-white dark:bg-stone-800 rounded-lg shadow-sm text-stone-400 active:scale-95 transition-all shrink-0">
            <Icon name="mdi:close" class="size-5" />
          </button>
        </div>

        <div class="p-2 overflow-y-auto no-scrollbar flex flex-col gap-6">
          
          <div v-for="nine in ['Front', 'Back']" :key="nine" class="space-y-1.5">
            <div class="flex justify-between px-1 items-end">
              <h4 class="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">{{ nine }} 9</h4>
              <span class="text-[10px] font-black text-stone-800 dark:text-white uppercase">Tot: <span class="text-xs">{{ getNineTotal(nine) }}</span></span>
            </div>

            <div class="flex gap-1 px-1">
              <div v-for="h in getNineHoles(nine)" :key="h" class="flex-1 flex flex-col items-center gap-1">
                <span class="text-[9px] font-black text-stone-400 uppercase">#{{ h }}</span>
                
                <div class="relative w-full aspect-square flex items-center justify-center">
                  <div v-if="showBirds && player.games?.birds?.[h-1] > 0" class="absolute -top-1.5 -left-1 text-lime-600 flex items-start z-20 pointer-events-none drop-shadow-sm bg-white/90 dark:bg-stone-900/90 rounded-full px-0.5">
                    <span class="text-[10px] font-black leading-none">{{ Math.floor(player.games.birds[h-1]) || '' }}</span>
                    <span v-if="player.games.birds[h-1] % 1 !== 0" class="text-[7px] font-black leading-none mt-[1px] ml-[0.5px]">½</span>
                  </div>

                  <div v-if="hasGame('Gross Skins') && player.winStats?.grossSkinHoles?.includes(h)" class="absolute -top-1.5 -right-1 text-amber-500 bg-amber-50 dark:bg-amber-950/80 rounded-full size-3.5 flex items-center justify-center z-20 pointer-events-none drop-shadow-sm border border-amber-200 dark:border-amber-800">
                    <span class="text-[7px] font-black leading-none mt-[1px]">G</span>
                  </div>

                  <div v-if="hasGame('Net Skins') && player.winStats?.netSkinHoles?.includes(h)" class="absolute -bottom-1.5 -left-1 text-lime-600 bg-lime-50 dark:bg-lime-950/80 rounded-full size-3.5 flex items-center justify-center z-20 pointer-events-none drop-shadow-sm border border-lime-200 dark:border-lime-800">
                    <span class="text-[7px] font-black leading-none mt-[1px]">N</span>
                  </div>

                  <div v-if="(isVegasType && player.games?.deuces?.[h-1] > 0) || (hasDeucePot && player.winStats?.deuceHoles?.includes(h))" class="absolute -bottom-1.5 -right-1 flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-950/80 rounded-full size-3.5 z-20 pointer-events-none drop-shadow-sm border border-blue-200 dark:border-blue-800">
                    <span class="text-[8px] font-black leading-none mt-[1px]">2</span>
                  </div>

                  <div 
                    :class="getScoreClass(player.scores[h-1], h)"
                    class="w-full h-full rounded-lg font-black text-lg transition-all flex flex-col items-center justify-center border-2 relative pb-1 shadow-sm"
                  >
                    <span class="mt-0.5 leading-none">{{ player.scores[h-1] || '-' }}</span>
                    
                    <div v-if="player.games?.pops?.[h-1] > 0" class="absolute bottom-1 w-full flex justify-center items-end gap-[1px]">
                      <div v-for="dot in Math.floor(player.games.pops[h-1])" :key="'p'+dot" class="w-1.5 h-1.5 rounded-full opacity-80 bg-lime-500"></div>
                      <div v-if="player.games.pops[h-1] % 1 !== 0" class="w-[4px] h-[4px] rounded-full opacity-50 bg-lime-500 mb-[1px]"></div>
                    </div>
                  </div>
                </div>

                <span 
                  class="text-[9px] font-black tabular-nums transition-colors" 
                  :class="showChicago ? 'text-blue-500' : 'text-stone-500'"
                >
                  {{ 
                    showChicago 
                      ? Math.floor(hasGame('Modified Chicago') ? (player.games?.modChicago?.[h-1] || 0) : (player.games?.chicago?.[h-1] || 0))
                      : formatNet(player.games?.net?.[h-1]) 
                  }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mt-2 pt-6 border-t border-stone-100 dark:border-stone-800">
            
            <div v-if="showChicago" class="flex flex-col items-center justify-center gap-1">
              <span class="text-secondary text-[10px]">
                {{ hasGame('Modified Chicago') ? 'Mod. Chicago' : 'Chicago' }}
              </span>
              <span class="text-2xl font-black italic tracking-tighter leading-none text-blue-500 tabular-nums">
                {{ formatChicagoTotal(hasGame('Modified Chicago') ? player.games.totalModChicago : player.games.totalChicago) }}
              </span>
            </div>
            <div v-else class="flex flex-col items-center justify-center gap-1">
              <span class="text-secondary text-[10px]">Net</span>
              <span :class="getNetColor(player.games.totalNet)" class="text-2xl font-black italic tracking-tighter leading-none tabular-nums">
                {{ player.games.totalNet > 0 ? '+' : '' }}{{ formatNet(player.games.totalNet) }}
              </span>
            </div>

            <div v-if="showBirds" class="flex flex-col items-center justify-center gap-1">
              <span class="text-secondary text-[10px]">Birds</span>
              <span class="text-2xl font-black italic tracking-tighter leading-none text-lime-600 tabular-nums">
                {{ player.games.totalBirds }}
              </span>
            </div>

            <div v-if="isVegasType" class="flex flex-col items-center justify-center gap-1">
              <span class="text-secondary text-[10px]">Net 2s</span>
              <span class="text-2xl font-black italic tracking-tighter leading-none text-amber-500 tabular-nums">
                {{ player.games.totalDeuces }}
              </span>
            </div>

            <div v-if="hasDeucePot" class="flex flex-col items-center justify-center gap-1">
              <span class="text-secondary text-[10px]">Deuce Pot</span>
              <span class="text-2xl font-black italic tracking-tighter leading-none text-amber-500 tabular-nums">
                {{ player.winStats?.deucesCount || 0 }}
              </span>
            </div>

            <div v-if="showSkinsSummary" class="col-span-3 flex justify-center gap-6 mt-2">
               <div v-if="hasGame('Gross Skins') && player.winStats?.grossSkinsCount > 0" class="flex flex-col items-center">
                 <span class="text-secondary text-[8px]">G Skins</span>
                 <span class="text-sm font-black text-amber-600 italic">{{ player.winStats.grossSkinsCount }}</span>
               </div>
               <div v-if="hasGame('Net Skins') && player.winStats?.netSkinsCount > 0" class="flex flex-col items-center">
                 <span class="text-secondary text-[8px]">N Skins</span>
                 <span class="text-sm font-black text-lime-600 italic">{{ player.winStats.netSkinsCount }}</span>
               </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-stone-50 dark:bg-stone-800/30 border-t border-stone-100 dark:border-stone-800 flex justify-center">
           <button @click="$emit('close')" class="w-full max-w-sm py-3.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-lg">
             Close
           </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['isOpen', 'player', 'event']);
defineEmits(['close']);

// --- Game Settings Logic ---
const gameArray = computed(() => props.event?.game || []);
const hasGame = (gameName) => gameArray.value.includes(gameName);

const isYearlyLeague = computed(() => props.event?.cadence === 'yearly');

// Separate the event type (Vegas/Net Deuces) from the Deuce Pot (Gross Deuces)
const isVegasType = computed(() => ['vegas', 'mbWed'].includes(props.event?.type));
const hasDeucePot = computed(() => hasGame('Deuce Pot'));

const showBirds = computed(() => isVegasType.value);
const showChicago = computed(() => hasGame('Chicago Points') || hasGame('Modified Chicago'));
const showSkinsSummary = computed(() => 
  (hasGame('Gross Skins') && props.player.winStats?.grossSkinsCount > 0) || 
  (hasGame('Net Skins') && props.player.winStats?.netSkinsCount > 0)
);

// --- Formatting ---
const formatChicagoTotal = (val) => {
  if (val === undefined || val === null) return '0';
  return isYearlyLeague.value ? val.toFixed(3) : Math.floor(val).toString();
};

const formatNet = (val) => {
  if (val === undefined || val === null) return '-';
  if (isYearlyLeague.value) return val.toFixed(3);
  const hasDecimals = props.player?.index % 1 !== 0;
  return hasDecimals ? val.toFixed(1) : Math.round(val);
};

const getNineHoles = (nine) => nine === 'Front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];

const getNineTotal = (nine) => {
  const holes = getNineHoles(nine);
  return holes.reduce((acc, h) => acc + (parseInt(props.player.scores[h-1]) || 0), 0);
};

const getNetColor = (rel) => {
  if (rel === undefined || rel === null || Math.abs(rel) < 0.0001) return 'text-stone-800 dark:text-white';
  return rel < 0 ? 'text-red-500' : 'text-blue-500 dark:text-blue-400';
};

const getScoreClass = (val, hole) => {
  if (!val || val === 0) return 'bg-transparent border-stone-200 dark:border-stone-700 text-transparent'; 
  const par = props.event?.courseSnapshot?.tees?.[props.player.teesId]?.pars?.[hole - 1] || 4;
  
  if (val < par) return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500 shadow-sm';
  if (val === par) return 'bg-white dark:bg-stone-900 text-stone-800 dark:text-white border-stone-300 dark:border-stone-600 shadow-sm';
  return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm';
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>