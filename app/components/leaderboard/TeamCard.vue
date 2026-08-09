<template>
  <div @click="$emit('click', row)" class="card-base cursor-pointer flex items-center justify-between p-3">
    <div class="flex items-center gap-3 flex-1 min-w-0">
      <span class="text-primary text-lg opacity-40 w-6 text-center">{{ index + 1 }}</span>
      <div class="w-px h-8 bg-stone-200 dark:bg-stone-800"></div>
      <div class="min-w-0 flex flex-col leading-tight">
        <p class="text-primary text-md font-black">{{ p1Name }}</p>
        <p class="text-primary text-md opacity-60">{{ p2Name }}</p>
      </div>
    </div>
    <div class="pl-4 border-l border-stone-200 dark:border-stone-800">
      <span class="text-primary text-3xl text-emerald-600 font-black italic tabular-nums">
        {{ row.scoreDisplay }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  row: { type: Object, required: true },
  index: { type: Number, required: true }
});

defineEmits(['click']);

const p1Name = computed(() => props.row.player?.split(' / ')[0] || 'TBD');
const p2Name = computed(() => props.row.player?.split(' / ')[1] || 'TBD');
</script>