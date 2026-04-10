<template>
  <Transition name="fade">
    <div 
      v-if="active" 
      class="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md"
    >
      <div class="relative w-16 h-16">
        <div class="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
      
      <div class="mt-6 text-center">
        <h2 class="text-emerald-500 font-black tracking-[0.3em] uppercase text-sm animate-pulse">
          Syncing Data...
        </h2>
        <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">
          Golf Nanks
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  active: Boolean
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>