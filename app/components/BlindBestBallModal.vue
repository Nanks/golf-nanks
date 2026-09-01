<template>
  <Transition name="fade">
    <div v-if="isReady" class="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-stone-900/60 backdrop-blur-sm">
      <div @click.self="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex flex-col max-h-[95vh]">
        
        <div class="p-3 px-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-start bg-stone-50/50 dark:bg-stone-800/50">
          <div class="min-w-0 pr-2 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-blue-500"></span>
              <h3 class="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight leading-none truncate">
                {{ team.p1.name }}
              </h3>
              <span class="text-xs font-black text-stone-400 uppercase">HCP: {{ isReady ? formatHcp(team.p1.index) : '0' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-amber-500"></span>
              <h3 class="text-sm font-black text-stone-800 dark:text-white uppercase tracking-tight leading-none truncate">
                {{ team.p2.name }}
              </h3>
              <span class="text-xs font-black text-stone-400 uppercase">HCP: {{ isReady ? formatHcp(team.p2.index) : '0' }}</span>
            </div>
          </div>
          <button @click="$emit('close')" class="modal-close-btn shrink-0">
            <Icon name="mdi:close" class="size-5" />
          </button>
        </div>

        <div class="p-2 overflow-y-auto no-scrollbar flex flex-col gap-4 pb-4">
          <div v-for="nine in ['Front', 'Back']" :key="nine" class="space-y-1.5">
            <div class="flex justify-between px-1 items-end">
              <h4 class="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">{{ nine }} 9</h4>
              <span class="text-xs font-black text-stone-800 dark:text-white uppercase">
                Net: <span class="text-xs ml-0.5" :class="getRelativeColor(getNineTeamNet(nine))">{{ formatNet(getNineTeamNet(nine)) }}</span>
              </span>
            </div>

            <div class="flex gap-1 px-0.5 overflow-x-auto no-scrollbar">
              <div v-for="h in getNineHoles(nine)" :key="h" class="flex-1 min-w-[44px] flex flex-col items-center gap-1">
                <span class="text-[10px] font-black uppercase text-stone-400">#{{ h }}</span>
                
                <div class="flex flex-col items-center w-full transition-opacity duration-300" :class="isP1Used(h) ? 'opacity-100' : 'opacity-30 grayscale'">
                  <div :class="getScoreClass(team.p1, h)" class="w-full aspect-square rounded font-black text-sm flex flex-col items-center justify-center border-2 shadow-sm">
                    <span class="leading-none">{{ team.p1.scores?.[h-1] || '-' }}</span>
                  </div>
                  <span class="text-xs font-black mt-0.5 tabular-nums" :class="isP1Used(h) ? 'text-blue-500' : 'text-stone-400'">
                    {{ formatHoleNet(getP1Net(h)) }}
                  </span>
                </div>

                <div class="flex flex-col items-center w-full transition-opacity duration-300" :class="isP2Used(h) ? 'opacity-100' : 'opacity-30 grayscale'">
                  <div :class="getScoreClass(team.p2, h)" class="w-full aspect-square rounded font-black text-sm flex flex-col items-center justify-center border-2 shadow-sm">
                    <span class="leading-none">{{ team.p2.scores?.[h-1] || '-' }}</span>
                  </div>
                  <span class="text-xs font-black mt-0.5 tabular-nums" :class="isP2Used(h) ? 'text-amber-500' : 'text-stone-400'">
                    {{ formatHoleNet(getP2Net(h)) }}
                  </span>
                </div>

                <div class="w-full py-0.5 mt-0.5 rounded bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex justify-center items-center">
                  <span class="text-xs font-black tabular-nums" :class="getRelativeColor(getTeamBestNet(h))">
                    {{ formatHoleNet(getTeamBestNet(h)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-2 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-8">
             <div class="flex flex-col items-center">
               <span class="text-stone-400 text-[10px] uppercase font-black tracking-widest leading-none mb-2">Team Net vs Par</span>
               <span class="text-4xl font-black italic tracking-tighter leading-none tabular-nums" :class="getRelativeColor(getTeamTotalNet())">
                 {{ formatNet(getTeamTotalNet()) }}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, watchEffect, onMounted } from 'vue'; // Ensure these are imported
const props = defineProps(['isOpen', 'team', 'event', 'isAppManaged']);
defineEmits(['close']);

const isReady = computed(() => !!(props.isOpen && props.team && props.event));

// Helper to pull the PRE-CALCULATED net from par from your gameLogic utility
const getP1Net = (h) => props.team.p1?.games?.net?.[h - 1] ?? null;
const getP2Net = (h) => props.team.p2?.games?.net?.[h - 1] ?? null;

const getTeamBestNet = (h) => {
  const n1 = getP1Net(h);
  const n2 = getP2Net(h);
  if (n1 === null && n2 === null) return null;
  // Since these are net vs par (e.g. -0.5 is better than 0.2), we still just want the minimum value
  return Math.min(n1 ?? 99, n2 ?? 99);
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

// Formatting
const formatHcp = (hcp) => {
  if (!isReady.value) return props.isAppManaged ? '0.000' : '0';
  
  const val = parseFloat(hcp);
  if (isNaN(val)) return props.isAppManaged ? '0.000' : '0';
  
  return props.isAppManaged ? val.toFixed(3) : Math.round(val).toString();
};
const formatHoleNet = (val) => {
  if (!isReady.value || val === null || val === undefined) return '-';
  const num = parseFloat(val);
  if (val === null || val === undefined || isNaN(num)) return '-';
  
  if (Math.abs(num) < 0.0001) return 'E';
  
  if (props.isAppManaged) {
    return num > 0 ? `+${num.toFixed(3)}` : num.toFixed(3);
  } else {
    const rounded = Math.round(num);
    if (rounded === 0) return 'E';
    return rounded > 0 ? `+${rounded}` : rounded.toString();
  }
};
const formatNet = (val) => {
  const num = parseFloat(val);
  if (val === null || val === undefined || isNaN(num) || Math.abs(num) < 0.0001) return 'E';
  
  if (props.isAppManaged) {
    return num > 0 ? `+${num.toFixed(3)}` : num.toFixed(3);
  } else {
    const rounded = Math.round(num);
    if (rounded === 0) return 'E';
    return rounded > 0 ? `+${rounded}` : rounded.toString();
  }
};

// Styling
const getScoreClass = (player, hole) => {
  const val = player?.scores?.[hole-1];
  if (!val || val <= 0) return 'bg-transparent border-stone-200 text-transparent'; 
  
  // Get par from the snapshot you already have in the player object
  const tees = player?.courseSnapshot?.tees;
  const teeData = Array.isArray(tees) ? (tees.find(t => t.id === player.teesId)) : tees?.[player.teesId];
  const par = teeData?.pars?.[hole - 1] || 4;

  if (val < par) return 'bg-red-50 dark:bg-red-950/30 text-red-600 border-red-500';
  if (val === par) return 'bg-white dark:bg-stone-900 text-stone-800 border-stone-300';
  return 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 border-blue-500';
};

const getRelativeColor = (val) => {
  if (val === null) return 'text-stone-800 dark:text-white';
  if (val < -0.01) return 'text-red-600 dark:text-red-400';
  if (val > 0.01) return 'text-blue-600 dark:text-blue-400';
  return 'text-stone-900 dark:text-white';
};

</script>