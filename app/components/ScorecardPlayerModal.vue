<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div @click.self="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
              {{ player.fname }} {{ player.lname }}
            </h3>
            <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
              {{ courseName }} • CH: {{ isYearly ? Number(player.index).toFixed(3) : Math.round(player.index) }}
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
                <div 
                  :class="getScoreClass(player.scores[h-1], h)"
                  class="w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center relative pb-0.5"
                >
                  <div v-if="isYearly && player.birdsArr && player.birdsArr[h-1]" class="absolute -top-1.5 -left-1 text-emerald-500 flex items-start z-20 pointer-events-none drop-shadow-sm bg-white/50 dark:bg-slate-900/50 rounded-full px-0.5">
                    <span class="text-[10px] font-black leading-none">{{ Math.floor(player.birdsArr[h-1]) || '' }}</span>
                    <span v-if="player.birdsArr[h-1] % 1 !== 0" class="text-[7px] font-black leading-none mt-[1px] ml-[0.5px]">1/2</span>
                  </div>

                  <div v-if="isYearly && player.deucesArr && (player.deucesArr[h-1] || player.scores[h-1] === 2)" class="absolute -top-1.5 -right-1 flex items-center justify-center bg-blue-100 dark:bg-blue-900/80 text-blue-600 dark:text-blue-300 rounded-full size-3.5 border border-blue-200 dark:border-blue-700 z-20 pointer-events-none drop-shadow-sm">
                    <span class="text-[8px] font-black leading-none mt-[1px]">2</span>
                  </div>

                  <div v-if="player.chicagoArr && player.chicagoArr[h-1] !== 0" class="absolute -bottom-1 -right-1.5 bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 px-1 rounded-sm border border-amber-200 dark:border-amber-700 z-20 pointer-events-none drop-shadow-sm">
                    <span class="text-[8px] font-black leading-none">{{ player.chicagoArr[h-1] > 0 ? '+' : '' }}{{ player.chicagoArr[h-1] }}</span>
                  </div>

                  <span class="text-xs font-black">{{ player.scores[h-1] || '-' }}</span>
                  
                  <div v-if="player.popsArr && player.popsArr[h-1] > 0" class="absolute bottom-0.5 w-full flex justify-center items-end gap-[1px]">
                    <div v-for="dot in Math.floor(player.popsArr[h-1])" :key="'p'+dot" class="w-1 h-1 rounded-full bg-emerald-500"></div>
                    <div v-if="player.popsArr[h-1] % 1 !== 0" class="w-0.5 h-0.5 rounded-full bg-emerald-500/50 mb-[0.5px]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
           <button @click="$emit('close')" class="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
             Close
           </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps(['isOpen', 'player', 'courseName', 'isYearly', 'pars']);
defineEmits(['close']);

const getNineHoles = (nine) => nine === 'Front' ? [1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18];

const getNineTotal = (nine) => {
  const holes = getNineHoles(nine);
  return holes.reduce((acc, h) => acc + (parseInt(props.player.scores[h-1]) || 0), 0);
};

const getScoreClass = (val, hole) => {
  if (!val || val === 0) return 'bg-transparent border-slate-100 dark:border-slate-800 text-transparent';
  const par = props.pars[hole - 1] || 4;
  if (val < par) return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500';
  if (val === par) return 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700';
  return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-500';
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>