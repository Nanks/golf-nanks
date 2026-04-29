<template>
  <ClientOnly>
    <Transition name="slide-up">
      <div 
        v-if="$pwa?.needRefresh" 
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[500] w-[90%] max-w-sm"
      >
        <div class="bg-stone-900 dark:bg-stone-800 text-white p-4 rounded-2xl shadow-2xl border border-stone-700 flex flex-col gap-3">
          
          <div class="flex items-start gap-3">
            <div class="p-2 bg-emerald-500/20 rounded-full text-emerald-400 shrink-0">
              <Icon name="mdi:cloud-download" class="size-6 animate-pulse" />
            </div>
            <div>
              <h4 class="font-black uppercase tracking-tight text-sm">Update Available</h4>
              <p class="text-xs text-stone-300 leading-relaxed mt-0.5">
                A new version of the app is ready. Refresh to get the latest features and fixes.
              </p>
            </div>
          </div>

          <div class="flex gap-2 mt-1">
            <button 
              @click="$pwa.updateServiceWorker()"
              class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors active:scale-95"
            >
              Refresh Now
            </button>
            <button 
              @click="$pwa.cancelPrompt()"
              class="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors active:scale-95"
            >
              Later
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<script setup>
const { $pwa } = useNuxtApp();
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 100%); opacity: 0; }
</style>