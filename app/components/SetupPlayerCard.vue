<template>
  <div class="p-2.5 bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm relative group">
    <div class="grid grid-cols-12 gap-2 items-center">
      <div class="col-span-7 flex flex-col justify-center min-w-0 pl-1.5">
        <h4 class="font-black uppercase italic tracking-tighter leading-none truncate text-base text-stone-900 dark:text-white">
          {{ player.fname }} {{ player.lname }}
        </h4>
        
        <div class="mt-1.5 flex items-center gap-1.5">
          <p v-if="isAppManaged" class="text-[8px] font-black text-stone-400 uppercase tracking-widest">
            League HCP: <span class="text-emerald-500 text-[10px]">{{ player.displayLeagueHcp }}</span>
          </p>
          
          <template v-else>
            <p class="text-[8px] font-black text-stone-400 uppercase tracking-widest">
              Index: <span class="text-emerald-500 text-[10px]">{{ (player.ghin ?? 0).toFixed(1) }}</span>
            </p>
            <span v-if="player.teeId" class="w-px h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full"></span>
            <p v-if="player.teeId" class="text-[8px] font-black text-stone-400 uppercase tracking-widest">
              CH: <span class="text-emerald-500 text-[10px]">{{ player.displayCourseHcp }}</span>
            </p>
          </template>
        </div>
      </div>

      <div class="col-span-5">
        <BaseSelect
          v-model="player.teeId"
          :options="availableTees"
          placeholder="Tee"
          dense
          :disabled="isLeague && !isMixedTees"
        />
      </div>
    </div>

    <button 
      @click="$emit('remove')" 
      class="absolute -top-2.5 -left-2.5 bg-white dark:bg-stone-950 rounded-full p-0.5 active:scale-90 transition-transform z-10 shadow-sm border border-stone-100 dark:border-stone-800"
    >
      <Icon name="mdi:close-circle" class="size-5 text-stone-300 dark:text-stone-700 active:text-red-500 transition-colors" />
    </button>
  </div>
</template>

<script setup>
defineProps({
  player: { type: Object, required: true },
  isAppManaged: { type: Boolean, default: false },
  isLeague: { type: Boolean, default: false },
  isMixedTees: { type: Boolean, default: false },
  availableTees: { type: Array, default: () => [] }
})

defineEmits(['remove'])
</script>