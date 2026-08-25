<template>
  <div @click="$emit('click', row)" class="card-interactive cursor-pointer p-3 flex flex-col gap-1.5">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-primary text-md opacity-40 font-black w-6 text-center">{{ rank }}</span>
        <h3 class="text-lg text-primary font-black uppercase italic">{{ row.name }}</h3>
      </div>
      <span :class="row.scoreColor" class="text-2xl font-black italic tabular-nums">
        {{ row.scoreDisplay }}
      </span>
    </div>
    
    <div class="flex items-center justify-between border-t border-stone-100 dark:border-stone-800/60">
      <div class="flex items-center gap-4 text-secondary text-xs font-black uppercase">
        <span>HCP: <span class="text-stone-900 dark:text-stone-100">{{ formattedHcp }}</span></span>
        <span>THRU: <span class="text-stone-900 dark:text-stone-100">{{ thruText }}</span></span>
        <span>GROSS: <span class="text-stone-900 dark:text-stone-100">{{ grossText }}</span></span>
      </div>
    </div>

    <div v-if="row.winStats?.individualBadges?.length > 0 || row.winStats?.totalMoney > 0" class="flex flex-wrap items-center gap-1 pt-1.5">
      <template v-for="(badge, bIdx) in row.winStats.individualBadges" :key="bIdx">
        <span v-if="shouldShowBadge(badge)" :class="badge.color" class="badge text-[11px] px-1.5">
          {{ badge.label }}
        </span>
      </template>
      <span v-if="row.winStats?.totalMoney > 0" class="text-primary text-sm text-emerald-600 font-black italic ml-auto shrink-0">
        ${{ row.winStats.totalMoney.toFixed(2) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  row: { type: Object, required: true },
  rank: { type: String, required: true },
  isAppManaged: { type: Boolean, required: true },
  eventGames: { type: Array, default: () => [] }
});

defineEmits(['click']);

const formattedHcp = computed(() => props.isAppManaged ? Number(props.row.index).toFixed(3) : Math.round(props.row.index));

const thruText = computed(() => props.row.games?.holesPlayed === (props.row.holes || 18) ? 'F' : (props.row.games?.holesPlayed || 0));

const grossText = computed(() => {
  const gross = props.row.games?.totalGrossUnder || 0;
  return gross === 0 ? 'E' : (gross > 0 ? `+${gross}` : gross);
});

const shouldShowBadge = (badge) => {
  if (!props.eventGames.length) return false;
  if (badge.category === 'grossSkins') return props.eventGames.includes('Gross Skins');
  if (badge.category === 'netSkins') return props.eventGames.includes('Net Skins');
  if (badge.category === 'deuces') return props.eventGames.includes('Deuce Pot');
  return true;
};
</script>