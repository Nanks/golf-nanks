<template>
  <div class="group relative bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden">
    <div class="flex justify-between items-center">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Icon v-if="isMember" name="mdi:check-decagram" class="text-emerald-500 size-4" />
          <h3 class="text-2xl font-black uppercase tracking-tighter italic text-slate-800 dark:text-white">
            {{ league.name }}
          </h3>
        </div>
        <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {{ league.type }} League • {{ league.course }}
        </p>
        
        <div v-if="league.nextRound" class="mt-4 flex items-center gap-2">
           <div class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
             <Icon name="mdi:calendar-clock" class="size-3 text-emerald-500" />
             <span class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
               Next: {{ league.nextRound.iso }}
             </span>
           </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button 
          v-if="isEventToday"
          @click.stop="$emit('play', league)"
          class="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Icon name="mdi:play" class="size-5" />
          <span class="text-[10px] font-black uppercase tracking-widest pr-1">Play</span>
        </button>

        <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-emerald-500 transition-colors">
          <Icon name="mdi:chevron-right" class="size-5" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['league', 'isMember']);
defineEmits(['play']);

// Check if the league's next round is actually today
const isEventToday = computed(() => {
  if (!props.league.nextRound) return false;
  const today = new Date().toISOString().split('T')[0];
  return props.league.nextRound.iso === today;
});
</script>