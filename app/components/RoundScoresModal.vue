<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div @click="$emit('close')" class="absolute inset-0"></div>

        <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85dvh] flex flex-col">
          <div class="px-6 pb-4 pt-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0">
            <div>
              <h3 class="font-black text-slate-900 dark:text-white italic uppercase tracking-tighter text-lg leading-none">
                {{ displayName }}
              </h3>
              <p class="text-[10px] font-black uppercase text-emerald-500 tracking-widest mt-1">Score Entry</p>
            </div>
            <button @click="$emit('close')" class="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <Icon name="mdi:close" class="size-6" />
            </button>
          </div>

          <div class="p-4 overflow-y-auto space-y-4">
            <div v-for="nine in nines" :key="nine.label">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{{ nine.label }}</p>
              <div class="flex gap-1.5">
                <div v-for="h in nine.holes" :key="h" class="flex-1 flex flex-col items-center gap-1">
                  <span class="text-[9px] font-black text-slate-400">{{ h }}</span>
                  <input
                    v-model.number="localScores[h - 1]"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="2"
                    class="w-full aspect-square text-center rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-black text-lg text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
            <button
              @click="handleSave"
              class="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
            >
              Save Scores
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  player: Object, // { fname, lname, scores? }
  holes: { type: Number, default: 18 }
});

const emit = defineEmits(['close', 'save']);

const localScores = ref(Array(18).fill(0));

// Live rows carry separate fname/lname; archived rows only carry a combined
// `name` string, so fall back rather than showing a blank header.
const displayName = computed(() => {
  const p = props.player;
  if (p?.fname || p?.lname) return `${p.fname || ''} ${p.lname || ''}`.trim();
  return p?.name || 'Player';
});

const nines = computed(() => {
  if (props.holes === 9) return [{ label: 'Holes', holes: [1, 2, 3, 4, 5, 6, 7, 8, 9] }];
  return [
    { label: 'Front 9', holes: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { label: 'Back 9', holes: [10, 11, 12, 13, 14, 15, 16, 17, 18] }
  ];
});

// Re-seed the grid every time this opens -- either with the player's existing
// scores (editing) or all zeros (adding a new round).
watch(() => props.isOpen, (opened) => {
  if (!opened) return;
  const existing = props.player?.scores || [];
  localScores.value = Array.from({ length: props.holes }, (_, i) => Number(existing[i]) || 0);
});

const handleSave = () => {
  emit('save', localScores.value.map(s => Number(s) || 0));
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
