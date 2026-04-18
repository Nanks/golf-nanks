<template>
  <ClientOnly>
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-1 px-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none">
      <div class="max-w-md mx-auto flex justify-between gap-2">
        
        <NuxtLink 
          to="/" 
          class="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:text-emerald-500 active:scale-95 transition-all rounded-xl"
        >
          <Icon name="mdi:home-variant-outline" class="size-6 mb-1" />
          <span class="text-[9px] font-black uppercase tracking-widest">Home</span>
        </NuxtLink>
        
        <NuxtLink 
          v-if="activeTab !== 'scorecard'" 
          :to="`/rounds/${roundId}`" 
          class="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:text-emerald-500 active:scale-95 transition-all rounded-xl"
        >
          <Icon name="mdi:clipboard-text-outline" class="size-6 mb-1" />
          <span class="text-[9px] font-black uppercase tracking-widest">Scorecard</span>
        </NuxtLink>
        <div v-else class="flex-1 flex flex-col items-center justify-center py-2 text-emerald-500 bg-emerald-500/10 rounded-xl cursor-default">
          <Icon name="mdi:clipboard-text-outline" class="size-6 mb-1" />
          <span class="text-[9px] font-black uppercase tracking-widest">Scorecard</span>
        </div>

        <NuxtLink 
          v-if="activeTab !== 'leaderboard'" 
          :to="`/leaderboard/${leagueType}/${iso}/live?from=scorecard`" 
          class="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:text-emerald-500 active:scale-95 transition-all rounded-xl"
        >
          <Icon name="mdi:trophy" class="size-6 mb-1" />
          <span class="text-[9px] font-black uppercase tracking-widest">Leaderboard</span>
        </NuxtLink>
        <div v-else class="flex-1 flex flex-col items-center justify-center py-2 text-emerald-500 bg-emerald-500/10 rounded-xl cursor-default">
          <Icon name="mdi:trophy" class="size-6 mb-1" />
          <span class="text-[9px] font-black uppercase tracking-widest">Leaderboard</span>
        </div>

      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
defineProps({
  activeTab: { type: String, required: true }, // 'scorecard' or 'leaderboard'
  roundId: { type: String, required: true },
  leagueType: { type: String, required: true },
  iso: { type: String, required: true }
});
</script>