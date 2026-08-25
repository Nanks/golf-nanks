<template>
  <div class="space-y-2">
    <div v-for="row in holes" :key="row.hole" class="card-base p-3 flex items-center gap-3">
      <span class="text-primary text-lg w-8 text-center shrink-0 opacity-50 tabular-nums">{{ row.hole }}</span>

      <div class="flex-1 flex flex-wrap items-center gap-1.5">
        <span v-if="row.gross" class="badge text-[9px] px-1.5 bg-amber-500/10 text-amber-600">
          G{{ row.gross.score }} &middot; {{ row.gross.player }}{{ formatMoney(row.gross.money) }}
        </span>
        <span v-if="row.net" class="badge text-[9px] px-1.5 bg-emerald-500/10 text-emerald-600">
          N{{ row.net.score }} &middot; {{ row.net.player }}{{ formatMoney(row.net.money) }}
        </span>
        <span v-for="(d, idx) in row.deuces" :key="idx" class="badge text-[9px] px-1.5 bg-blue-500/10 text-blue-600">
          D{{ d.score }} &middot; {{ d.player }}{{ formatMoney(d.money) }}
        </span>
        <span v-if="!row.gross && !row.net && row.deuces.length === 0" class="text-secondary text-[10px] opacity-40">
          &mdash;
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  holes: { type: Array, required: true }
});

const formatMoney = (money) => money > 0 ? ` ($${money.toFixed(2)})` : '';
</script>
