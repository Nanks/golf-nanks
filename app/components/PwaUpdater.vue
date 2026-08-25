<template>
  <ClientOnly>
    <Transition name="slide-up">
      <div
        v-if="$pwa?.needRefresh"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[500] w-[90%] max-w-sm"
      >
        <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">

          <div class="flex items-start gap-3">
            <div class="p-2 bg-emerald-500/10 rounded-full text-emerald-500 shrink-0">
              <Icon name="mdi:cloud-download" class="size-6 animate-pulse" />
            </div>
            <div>
              <h4 class="font-black uppercase italic tracking-tight text-sm">Update Available</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                A new version of the app is ready. Refresh to get the latest features and fixes.
              </p>
            </div>
          </div>

          <div v-if="isUpdating" class="flex items-center justify-center gap-2 py-2">
            <Icon name="svg-spinners:ring-resize" class="size-4 text-emerald-500" />
            <span class="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest">
              Updating...
            </span>
          </div>

          <div v-else class="flex gap-2 mt-1">
            <button
              @click="handleUpdate"
              class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors active:scale-95"
            >
              Refresh Now
            </button>
            <button
              @click="$pwa.cancelPrompt()"
              class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors active:scale-95"
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
import { ref } from 'vue';

const { $pwa } = useNuxtApp();

// updateServiceWorker() posts a message to the waiting worker and reloads
// once it takes over -- that gap had no feedback at all, looking like the
// button did nothing. Flip to a loading state synchronously on click so
// there's instant confirmation the tap registered.
const isUpdating = ref(false);

const handleUpdate = async () => {
  isUpdating.value = true;
  await $pwa.updateServiceWorker();
};
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translate(-50%, 100%); opacity: 0; }
</style>
