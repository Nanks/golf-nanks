<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-stone-900/60 backdrop-blur-sm">
      <div @click.self="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[95vh]">
        
        <div class="p-4 px-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-start bg-stone-50/50 dark:bg-stone-800/50">
          <div class="min-w-0 pr-2">
            <h3 class="text-xl font-black text-stone-800 dark:text-white uppercase tracking-tight leading-none truncate">
              {{ player.name }}
            </h3>
            <p class="text-sm font-black text-lime-500 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <span>{{ player.tees }} • HCP: {{ player.index % 1 !== 0 ? player.index.toFixed(3) : Math.round(player.index) }}</span>
              <button
                v-if="isAdmin && player.roundDocId"
                @click="isTeeModalOpen = true"
                class="text-lime-500/60 hover:text-lime-500 active:scale-90 transition-all"
              >
                <Icon name="mdi:pencil-circle" class="size-4" />
              </button>
            </p>
          </div>
          <button @click="$emit('close')" class="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            <Icon name="mdi:close-circle" class="size-7" />
          </button>
        </div>

        <div class="p-2 overflow-y-auto no-scrollbar flex flex-col gap-6 pb-8">
          
          <div v-for="nine in ['Front', 'Back']" :key="nine" class="space-y-1.5">
            <div class="flex justify-between px-1 items-end">
              <h4 class="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">{{ nine }} 9</h4>
              <span class="text-xs font-black text-stone-800 dark:text-white uppercase">Tot: <span class="text-xs">{{ getNineTotal(nine) }}</span></span>
            </div>

            <div class="flex gap-1 px-1">
              <div v-for="h in getNineHoles(nine)" :key="h" class="flex-1 flex flex-col items-center gap-1">
                <span 
                  class="text-xs font-black uppercase transition-colors"
                  :class="event?.ddHole?.includes(h) ? 'text-lime-500' : 'text-stone-400'"
                >
                  #{{ h }}
                </span>
                
                <div class="relative w-full aspect-square flex items-center justify-center">
                  <div v-if="showPrimaryBirds && player.games?.birds?.[h-1] > 0" class="absolute -top-1.5 -left-1 text-lime-600 flex items-start z-20 pointer-events-none drop-shadow-sm bg-white dark:bg-stone-900 rounded-full px-0.5 border border-stone-100 dark:border-stone-800">
                    <span class="text-xs font-black leading-none">{{ Math.floor(player.games.birds[h-1]) || '' }}</span>
                    <span v-if="player.games.birds[h-1] % 1 !== 0" class="text-[7px] font-black leading-none mt-[1px] ml-[0.5px]">½</span>
                  </div>

                  <div v-if="hasGame('Gross Skins') && player.winStats?.grossSkinHoles?.includes(h)" class="absolute -top-1.5 -right-1 text-amber-500 bg-amber-50 dark:bg-amber-950/80 rounded-full size-3.5 flex items-center justify-center z-20 pointer-events-none drop-shadow-sm border border-amber-200 dark:border-amber-800">
                    <span class="text-[7px] font-black leading-none mt-[1px]">G</span>
                  </div>
                  <div v-if="hasGame('Net Skins') && player.winStats?.netSkinHoles?.includes(h)" class="absolute -bottom-1.5 -left-1 text-lime-600 bg-lime-50 dark:bg-lime-950/80 rounded-full size-3.5 flex items-center justify-center z-20 pointer-events-none drop-shadow-sm border border-lime-200 dark:border-lime-800">
                    <span class="text-[7px] font-black leading-none mt-[1px]">N</span>
                  </div>

                  <div v-if="(isVegasType && player.games?.deuces?.[h-1] > 0) || (hasDeucePot && player.winStats?.deuceHoles?.includes(h))" class="absolute -bottom-1.5 -right-1 flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-950/80 rounded-full size-3.5 z-20 pointer-events-none drop-shadow-sm border border-blue-200 dark:border-blue-800">
                    <span class="text-xs font-black leading-none mt-[1px]">2</span>
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

                <span class="text-xs font-black tabular-nums transition-colors" :class="showChicago ? 'text-blue-500' : 'text-stone-500'">
                  {{ showChicago ? Math.floor(hasGame('Modified Chicago') ? (player.games?.modChicago?.[h-1] || 0) : (player.games?.chicago?.[h-1] || 0)) : formatHoleNet(player.games?.net?.[h-1]) }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-2 pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-8">
            <div class="flex items-center justify-around">
              <div class="flex flex-col items-center justify-center gap-1">
                <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-black">Gross</span>
                <span class="text-2xl font-black italic tracking-tighter leading-none text-stone-800 dark:text-stone-200 tabular-nums">{{ getRawGross }}</span>
              </div>

              <div class="flex flex-col items-center justify-center gap-1">
                <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-black">Adjusted</span>
                <span class="text-2xl font-black italic tracking-tighter leading-none text-stone-800 dark:text-stone-200 tabular-nums">{{ getAdjustedGross }}</span>
              </div>

              <div class="flex flex-col items-center justify-center gap-1">
                <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-black">{{ showChicago ? 'Chicago' : 'Net' }}</span>
                <span :class="showChicago ? 'text-blue-500' : getNetColor(player.games.totalNet)" class="text-2xl font-black italic tracking-tighter tabular-nums leading-none">
                  {{ showChicago ? formatChicagoTotal(hasGame('Modified Chicago') ? player.games.totalModChicago : player.games.totalChicago) : (player.games.totalNet > 0 ? '+' : '') + formatNet(player.games.totalNet) }}
                </span>
              </div>
            </div>

            <div v-if="showPrimaryBirds || showPrimaryDeuces" class="flex items-center justify-around">
              <div v-if="showPrimaryBirds" class="flex flex-col items-center">
                <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-black">Birds</span>
                <span class="text-2xl font-black italic tracking-tighter text-lime-600 tabular-nums leading-none">{{ player.games.totalBirds }}</span>
              </div>
              <div v-if="showPrimaryDeuces" class="flex flex-col items-center">
                <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-black">{{ isVegasType ? 'Net 2s' : 'Season 2s' }}</span>
                <span class="text-2xl font-black italic tracking-tighter text-amber-500 tabular-nums leading-none">{{ player.games.totalDeuces }}</span>
              </div>
            </div>

            <div v-if="showSideGames" class="pt-4 pb-1 border-t border-dashed border-stone-200 dark:border-stone-800 flex justify-center gap-8">
               <div v-if="hasGame('Gross Skins') && player.winStats?.grossSkinsCount > 0" class="flex flex-col items-center">
                 <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-black">G Skins</span>
                 <span class="text-2xl font-black text-amber-600 italic leading-none mt-1">{{ player.winStats.grossSkinsCount }}</span>
               </div>
               <div v-if="hasGame('Net Skins') && player.winStats?.netSkinsCount > 0" class="flex flex-col items-center">
                 <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-black">N Skins</span>
                 <span class="text-2xl font-black text-lime-600 italic leading-none mt-1">{{ player.winStats.netSkinsCount }}</span>
               </div>
               <div v-if="hasDeucePot && player.winStats?.deucesCount > 0" class="flex flex-col items-center">
                 <span class="text-stone-400 dark:text-stone-500 text-xs uppercase font-black">Deuce Pot</span>
                 <span class="text-2xl font-black text-blue-500 italic leading-none mt-1">{{ player.winStats.deucesCount }}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <LazyCourseTeesModal
        :is-open="isTeeModalOpen"
        :selected-course="player.course"
        :selected-tee="player.tees"
        :league-tees-type="player.tee_type || 'mens'"
        @close="isTeeModalOpen = false"
        @pick="handleTeePick"
      />
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { calcAdjustedGross } from '~/utils/gameLogic';

const props = defineProps({
  isOpen: Boolean,
  player: Object,
  event: Object,
  isAdmin: { type: Boolean, default: false }
});
const emit = defineEmits(['close', 'change-tee']);

const isTeeModalOpen = ref(false);

const handleTeePick = (picked) => {
  isTeeModalOpen.value = false;
  emit('change-tee', { player: props.player, ...picked });
};
const route = useRoute();

const roundType = computed(() => route.params.type || '');
const gameArray = computed(() => props.event?.game || []);
const hasGame = (gameName) => gameArray.value.includes(gameName);

const isYearlyLeague = computed(() => props.event?.cadence === 'yearly');
const isVegasType = computed(() => ['vegas', 'mbWed'].includes(roundType.value));
const hasDeucePot = computed(() => hasGame('Deuce Pot'));

const showChicago = computed(() => hasGame('Chicago Points') || hasGame('Modified Chicago'));
const showPrimaryBirds = computed(() => isVegasType.value || isYearlyLeague.value);
const showPrimaryDeuces = computed(() => isVegasType.value || isYearlyLeague.value);

const showSideGames = computed(() => (hasGame('Gross Skins') && props.player.winStats?.grossSkinsCount > 0) || (hasGame('Net Skins') && props.player.winStats?.netSkinsCount > 0) || (hasDeucePot.value && props.player.winStats?.deucesCount > 0));

const getRawGross = computed(() => props.player?.games?.totalGross || props.player?.scores?.reduce((a, b) => a + (Number(b) || 0), 0) || 0);

const getAdjustedGross = computed(() => {
  const scores = props.player?.scores || [];
  const pops = props.player?.games?.pops || Array(18).fill(0);
  
  // Pull pars from the player's snapshot
  let pars = Array(18).fill(4);
  const tees = props.player?.courseSnapshot?.tees;
  const targetTeeId = props.player?.teesId;

  if (Array.isArray(tees)) {
    const tMatch = tees.find(t => t.id === targetTeeId) || tees[targetTeeId] || tees.find(t => t.name?.toLowerCase() === props.player?.tees?.toLowerCase());
    if (tMatch && tMatch.pars) pars = tMatch.pars;
  } else if (tees && typeof tees === 'object') {
    const tMatch = tees[targetTeeId] || Object.values(tees).find(t => t.name?.toLowerCase() === props.player?.tees?.toLowerCase());
    if (tMatch && tMatch.pars) pars = tMatch.pars;
  }
  
  const adj = calcAdjustedGross(scores, pars, pops);
  return adj === 0 ? '-' : adj;
});

const formatChicagoTotal = (val) => {
  if (val === undefined || val === null) return '0.000';
  return isYearlyLeague.value ? val.toFixed(3) : Math.floor(val).toString();
};

const formatNet = (val) => {
  if (val === undefined || val === null) return '0.000';
  // Logic Fix: Strictly 3 decimals for yearly leagues
  if (isYearlyLeague.value) return val.toFixed(3);
  
  const hasDecimals = props.player?.index % 1 !== 0;
  return hasDecimals ? val.toFixed(3) : Math.round(val);
};

const formatHoleNet = (val) => val === undefined || val === null ? '-' : val.toFixed(1);

const getNetColor = (rel) => {
  if (rel === undefined || rel === null || Math.abs(rel) < 0.0001) return 'text-stone-800 dark:text-stone-200';
  return rel < 0 ? 'text-red-500' : 'text-blue-500 dark:text-blue-400';
};

const getNineHoles = (nine) => nine === 'Front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];
const getNineTotal = (nine) => getNineHoles(nine).reduce((acc, h) => acc + (parseInt(props.player.scores[h-1]) || 0), 0);

const getScoreClass = (val, hole) => {
  if (!val || val === 0 || val === '0') return 'bg-transparent border-stone-200 dark:border-stone-700 text-transparent'; 
  
  const numVal = Number(val);
  let par = 4;
  const tees = props.player?.courseSnapshot?.tees;
  const targetTeeId = props.player?.teesId;

  if (Array.isArray(tees)) {
    const tMatch = tees.find(t => t.id === targetTeeId) || tees[targetTeeId] || tees.find(t => t.name?.toLowerCase() === props.player?.tees?.toLowerCase());
    if (tMatch && tMatch.pars) par = Number(tMatch.pars[hole - 1]) || 4;
  } else if (tees && typeof tees === 'object') {
    const tMatch = tees[targetTeeId] || Object.values(tees).find(t => t.name?.toLowerCase() === props.player?.tees?.toLowerCase());
    if (tMatch && tMatch.pars) par = Number(tMatch.pars[hole - 1]) || 4;
  }
  
  let classes = 'w-full h-full rounded-lg font-black text-lg transition-all flex flex-col items-center justify-center border-2 relative pb-1 shadow-sm ';
  
  if (numVal < par) classes += 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500';
  else if (numVal === par) classes += 'bg-white dark:bg-stone-900 text-stone-800 dark:text-white border-stone-300 dark:border-stone-600';
  else classes += 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500';

  if (props.event?.ddHole?.includes(hole)) {
    classes += ' !border-lime-500 !border-4 ring-2 ring-lime-500/20';
  }

  return classes;
};
</script>