<template>
  <Transition name="fade">
    <div v-if="isOpen && team?.p1 && team?.p2" class="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-stone-900/60 backdrop-blur-sm">
      <div @click.self="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[95vh]">
        
        <div class="p-3 px-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-start bg-stone-50/50 dark:bg-stone-800/50">
          <div class="min-w-0 pr-2 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-blue-500"></span>
              <h3 class="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight leading-none truncate">
                {{ team.p1.name }}
              </h3>
              <span class="text-xs font-black text-stone-400 uppercase">HCP: {{ formatHcp(team.p1.index) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-amber-500"></span>
              <h3 class="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight leading-none truncate">
                {{ team.p2.name }}
              </h3>
              <span class="text-xs font-black text-stone-400 uppercase">HCP: {{ formatHcp(team.p2.index) }}</span>
            </div>
          </div>
          <button @click="$emit('close')" class="text-stone-400 dark:text-stone-500 active:text-stone-300">
            <Icon name="mdi:close-circle" class="size-6" />
          </button>
        </div>

        <div class="p-2 overflow-y-auto no-scrollbar flex flex-col gap-4 pb-4">
          
          <div v-for="nine in ['Front', 'Back']" :key="nine" class="space-y-1.5">
            <div class="flex justify-between px-1 items-end">
              <h4 class="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">{{ nine }} 9</h4>
              <span class="text-xs font-black text-stone-800 dark:text-white uppercase">
                Net: <span class="text-xs ml-0.5" :class="getRelativeColor(getNineTeamNet(nine) - getNinePar(nine))">{{ formatNet(getNineTeamNet(nine)) }}</span>
              </span>
            </div>

            <div class="flex gap-1 px-0.5">
              <div v-for="h in getNineHoles(nine)" :key="h" class="flex-1 flex flex-col items-center gap-1">
                <span class="text-[10px] font-black uppercase text-stone-400">#{{ h }}</span>
                
                <div class="flex flex-col items-center w-full transition-opacity duration-300" :class="isP1Used(h) ? 'opacity-100' : 'opacity-30 grayscale'">
                  <div :class="getScoreClass(team.p1, h)" class="w-full aspect-square rounded font-black text-sm flex flex-col items-center justify-center border-2 relative pb-1 shadow-sm">
                    <span class="mt-0.5 leading-none">{{ team.p1.scores?.[h-1] || '-' }}</span>
                    <div v-if="team.p1.games?.pops?.[h-1] > 0" class="absolute bottom-0.5 w-full flex justify-center items-end gap-[1px]">
                      <div v-for="dot in Math.floor(team.p1.games.pops[h-1])" :key="'p1'+dot" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                  <span class="text-xs font-black mt-0.5 tabular-nums" :class="isP1Used(h) ? 'text-blue-500' : 'text-stone-400'">
                    {{ formatHoleNet(getP1Net(h)) }}
                  </span>
                </div>

                <div class="flex flex-col items-center w-full transition-opacity duration-300" :class="isP2Used(h) ? 'opacity-100' : 'opacity-30 grayscale'">
                  <div :class="getScoreClass(team.p2, h)" class="w-full aspect-square rounded font-black text-sm flex flex-col items-center justify-center border-2 relative pb-1 shadow-sm">
                    <span class="mt-0.5 leading-none">{{ team.p2.scores?.[h-1] || '-' }}</span>
                    <div v-if="team.p2.games?.pops?.[h-1] > 0" class="absolute bottom-0.5 w-full flex justify-center items-end gap-[1px]">
                      <div v-for="dot in Math.floor(team.p2.games.pops[h-1])" :key="'p2'+dot" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                  <span class="text-xs font-black mt-0.5 tabular-nums" :class="isP2Used(h) ? 'text-amber-500' : 'text-stone-400'">
                    {{ formatHoleNet(getP2Net(h)) }}
                  </span>
                </div>

                <div class="w-full py-0.5 mt-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex justify-center items-center">
                  <span class="text-xs font-black tabular-nums" :class="getNetColorClass(getTeamBestNet(h), h)">
                    {{ formatHoleNet(getTeamBestNet(h)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-2 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-4">
             <div class="flex flex-col items-end">
               <span class="text-stone-400 text-xs uppercase font-black tracking-widest leading-none">Team Net</span>
               <span class="text-3xl font-black italic tracking-tighter leading-none text-stone-900 dark:text-white tabular-nums">
                 {{ formatNet(getTeamTotalNet()) }}
               </span>
             </div>
             
             <div class="w-px h-8 bg-stone-200 dark:bg-stone-800"></div>

             <div class="flex flex-col items-start">
               <span class="text-stone-400 text-xs uppercase font-black tracking-widest leading-none">To Par</span>
               <span class="text-3xl font-black italic tracking-tighter leading-none tabular-nums" :class="getRelativeColor(getRelativeNetValue())">
                 {{ getRelativeNet() }}
               </span>
             </div>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps(['isOpen', 'team', 'event']);
defineEmits(['close']);

const isYearlyLeague = computed(() => props.event?.cadence === 'yearly');

// --- Par Lookups ---
const getPlayerHolePar = (player, hole) => {
  let par = 4;
  const tees = player?.courseSnapshot?.tees;
  const targetTeeId = player?.teesId;
  const tMatch = Array.isArray(tees) ? (tees.find(t => t.id === targetTeeId) || tees[targetTeeId]) : (tees?.[targetTeeId]);
  if (tMatch && tMatch.pars) par = Number(tMatch.pars[hole - 1]) || 4;
  return par;
};

const getHolePar = (hole) => getPlayerHolePar(props.team?.p1, hole);

const getNinePar = (nine) => getNineHoles(nine).reduce((acc, h) => acc + getHolePar(h), 0);

const getTotalPar = () => {
  let total = 0;
  for (let i = 1; i <= 18; i++) total += getHolePar(i);
  return total;
};

// --- Net Score Calculations ---
const getP1Net = (h) => {
  const score = props.team?.p1?.scores?.[h-1];
  if (!score || score === 0) return null;
  return score - (props.team.p1.games?.pops?.[h-1] || 0);
};

const getP2Net = (h) => {
  const score = props.team?.p2?.scores?.[h-1];
  if (!score || score === 0) return null;
  return score - (props.team.p2.games?.pops?.[h-1] || 0);
};

const getTeamBestNet = (h) => {
  const n1 = getP1Net(h);
  const n2 = getP2Net(h);
  if (n1 === null && n2 === null) return null;
  if (n1 === null) return n2;
  if (n2 === null) return n1;
  return Math.min(n1, n2);
};

const isP1Used = (h) => {
  const best = getTeamBestNet(h);
  return best !== null && getP1Net(h) === best;
};

const isP2Used = (h) => {
  const best = getTeamBestNet(h);
  return best !== null && getP2Net(h) === best;
};

const getNineHoles = (nine) => nine === 'Front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];

const getNineTeamNet = (nine) => {
  return getNineHoles(nine).reduce((acc, h) => {
    const best = getTeamBestNet(h);
    return acc + (best !== null ? best : 0);
  }, 0);
};

const getTeamTotalNet = () => getNineTeamNet('Front') + getNineTeamNet('Back');

const getRelativeNetValue = () => getTeamTotalNet() - getTotalPar();

const getRelativeNet = () => {
  const rel = getRelativeNetValue();
  if (rel === 0) return 'E';
  return rel > 0 ? `+${rel}` : rel;
};

// --- Formatting ---
const formatHcp = (hcp) => (hcp !== undefined && hcp !== null && !isNaN(hcp)) ? Number(hcp).toFixed(3) : '0';
const formatHoleNet = (val) => val === null || val === undefined ? '-' : (val % 1 !== 0 ? val.toFixed(1) : val);
const formatNet = (val) => {
  if (val === undefined || val === null || val === 0) return 'E';
  if (isYearlyLeague.value) return val.toFixed(3);
  return val % 1 !== 0 ? val.toFixed(1) : Math.round(val);
};

// --- Styling ---
const getScoreClass = (player, hole) => {
  const val = player?.scores?.[hole-1];
  if (!val || val === 0 || val === '0') return 'bg-transparent border-stone-200 dark:border-stone-700 text-transparent'; 
  const numVal = Number(val);
  const par = getPlayerHolePar(player, hole);
  
  if (numVal < par) return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500';
  if (numVal === par) return 'bg-white dark:bg-stone-900 text-stone-800 dark:text-white border-stone-300 dark:border-stone-600';
  return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500';
};

const getNetColorClass = (netVal, hole) => {
  if (netVal === null || netVal === undefined) return 'text-stone-800 dark:text-white';
  const par = getHolePar(hole);
  if (netVal < par) return 'text-red-600 dark:text-red-400';
  if (netVal === par) return 'text-stone-800 dark:text-white';
  return 'text-blue-600 dark:text-blue-400';
};

const getRelativeColor = (val) => {
  if (val < 0) return 'text-red-600 dark:text-red-400';
  if (val > 0) return 'text-blue-600 dark:text-blue-400';
  return 'text-stone-900 dark:text-white';
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>