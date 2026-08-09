<template>
  <div class="fixed top-24 left-0 right-0 z-[100] px-4 pointer-events-none space-y-3">
    <TransitionGroup name="announcement">
      <div 
        v-for="item in store.activeAnnouncements" 
        :key="item.id"
        class="max-w-md mx-auto pointer-events-auto overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl transition-all"
        :class="[
          item.type === 'urgent' 
            ? 'bg-red-500 border-red-400 text-white' 
            : 'bg-slate-900/90 dark:bg-emerald-950/90 border-slate-700 dark:border-emerald-500/30 text-white'
        ]"
      >
        <div class="p-4">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-white/10">
              <Icon :name="item.type === 'urgent' ? 'mdi:alert-decagram' : 'mdi:bullhorn-variant'" class="size-6" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-black uppercase italic tracking-tight text-lg leading-tight">{{ item.title }}</h3>
              <p class="text-sm opacity-90 leading-snug mt-0.5">{{ item.body }}</p>
            </div>
            <button @click="store.dismiss(item.id)" class="p-1 hover:bg-white/10 rounded-md transition-colors">
              <Icon name="mdi:close" class="size-5" />
            </button>
          </div>
          
          <button 
            v-if="item.url" 
            @click="handleAction(item)"
            class="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          >
            View Details
          </button>
        </div>
        
        <div v-if="item.type !== 'urgent'" class="h-1 bg-white/20 w-full">
          <div class="h-full bg-white/40 animate-progress"></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
const store = useAnnouncementStore()

const handleAction = (item) => {
  if (item.url) navigateTo(item.url)
  store.dismiss(item.id)
}
</script>

<style scoped>
.announcement-enter-active { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.announcement-leave-active { transition: all 0.3s ease-in; }
.announcement-enter-from { transform: translateY(-100%) scale(0.9); opacity: 0; }
.announcement-leave-to { transform: translateX(100%); opacity: 0; }

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}
.animate-progress {
  animation: progress 10s linear forwards;
}
</style>