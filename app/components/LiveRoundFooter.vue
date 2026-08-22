<template>
  <ClientOnly>
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-1 px-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-none">
      <div class="max-w-md mx-auto flex justify-between gap-2">
        
        <NuxtLink to="/" class="footer-btn" :class="{ 'active': activeTab === 'home' }">
          <Icon name="mdi:home-variant-outline" class="size-8 mb-1" />
          <span class="btn-text">Home</span>
        </NuxtLink>
        
        <NuxtLink 
          :to="`/rounds/${roundId}`" 
          class="footer-btn" 
          :class="{ 'active': activeTab === 'scorecard' }"
        >
          <Icon name="mdi:clipboard-text-outline" class="size-8 mb-1" />
          <span class="btn-text">Scorecard</span>
        </NuxtLink>

        <NuxtLink
          :to="`/leaderboard/${leagueId}/${eventId}?from=scorecard`"
          class="footer-btn"
          :class="{ 'active': activeTab === 'leaderboard' }"
        >
          <Icon name="mdi:trophy" class="size-8 mb-1" />
          <span class="btn-text">Leaders</span>
        </NuxtLink>

      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
defineProps({
  activeTab: { type: String, default: 'home' },
  roundId: { type: String },
  leagueId: { type: String }, // Using the ID for guaranteed uniqueness
  eventId: { type: String }
});
</script>

<style scoped>
@reference "tailwindcss";

.footer-btn {
  @apply flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition-all rounded-xl;
}

.footer-btn.active {
  @apply text-emerald-500 bg-emerald-500/10 cursor-default;
}

.btn-text {
  @apply text-[9px] font-black uppercase tracking-widest;
}
</style>