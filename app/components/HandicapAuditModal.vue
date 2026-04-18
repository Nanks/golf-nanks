<template>
  <Transition name="sheet">
    <div v-show="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4">
      <div 
        class="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border-t sm:border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col"
      >
        <div class="sm:hidden flex justify-center py-3">
          <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        </div>

        <div class="px-6 pb-4 pt-2 sm:pt-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <h3 class="font-black text-slate-900 dark:text-white italic uppercase tracking-tighter text-lg leading-none">
              {{ player?.fname }} {{ player?.lname }}
            </h3>
            <p class="text-[10px] font-black uppercase text-emerald-500 tracking-widest mt-1">
              Handicap Audit <span class="text-slate-400 lowercase font-medium">(best 4)</span>
            </p>
          </div>
          <button @click="$emit('close')" class="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <Icon name="mdi:close" class="size-6" />
          </button>
        </div>

        <div class="p-3 grid grid-cols-2 gap-2 overflow-hidden">
          <div v-for="(round, idx) in auditRounds" :key="idx" 
              :class="round.isUsed 
                  ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm shadow-emerald-500/10' 
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30'"
              class="flex flex-col justify-between p-2 rounded-xl border transition-all relative"
          >
            <div v-if="round.isUsed" class="absolute top-1 right-1">
              <Icon name="mdi:check-circle" class="size-2.5 text-emerald-500" />
            </div>

            <div class="flex flex-col mb-1">
              <span class="text-[8px] text-slate-400 font-black uppercase tracking-tighter truncate">
                {{ formatDate(round.date) }}
              </span>
              <span v-if="round.isPadding" class="text-[7px] text-amber-500 font-black uppercase leading-none">Penalty</span>
            </div>

            <div class="flex justify-between items-end">
              <div>
                <p class="text-[6px] uppercase text-slate-400 font-bold leading-none">Gross</p>
                <p :class="round.isUsed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'" class="text-[11px] font-black italic">
                  {{ round.rawGross }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-[6px] uppercase text-slate-400 font-bold leading-none">Diff</p>
                <p :class="round.isUsed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'" class="text-[11px] font-black italic">
                  {{ round.differential?.toFixed(1) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center pb-10 sm:pb-6">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current League Handicap</p>
          <p class="text-3xl font-black text-emerald-600 dark:text-emerald-400 italic tabular-nums">
            {{ leagueHcp }}
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean,
  player: Object,
  leagueId: String
});

defineEmits(['close']);

const auditRounds = computed(() => {
  const rounds = props.player?.leagueAudits?.[props.leagueId] || [];
  if (!rounds.length) return [];
  
  const sorted = [...rounds].sort((a, b) => a.differential - b.differential);
  const lowest4Indices = new Set(sorted.slice(0, 4).map(r => rounds.indexOf(r)));
  
  return rounds.map((r, idx) => ({ ...r, isUsed: lowest4Indices.has(idx) }));
});

const leagueHcp = computed(() => {
  const hcp = props.player?.leagueHandicaps?.[props.leagueId];
  return hcp ? Number(hcp).toFixed(3) : '0.000';
});

const formatDate = (d) => {
  if (!d || d === 'N/A') return 'Est. Round';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
</script>

<style scoped>
/* Bottom sheet animation for mobile, fade for desktop */
.sheet-enter-active, 
.sheet-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.sheet-enter-from, 
.sheet-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .sheet-enter-from, 
  .sheet-leave-to {
    transform: translateY(0) scale(0.95);
  }
}
</style>
