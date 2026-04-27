<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="store.isOpen" class="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md">
          <div @click="store.cancel" class="absolute inset-0"></div>
          
          <div class="relative bg-white dark:bg-stone-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-stone-200 dark:border-stone-800 text-center">
            <div 
              :class="[store.iconBg, store.iconColor]" 
              class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-stone-200/50 dark:border-stone-700/50 shadow-sm transition-all"
            >
              <Icon :name="store.icon" class="size-8" />
            </div>

            <h3 class="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tighter italic mb-2">
              {{ store.title }}
            </h3>
            
            <p class="text-sm text-stone-500 dark:text-stone-400 mb-8 px-2 leading-tight">
              {{ store.message || 'Are you sure you want to proceed?' }}
            </p>

            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="store.cancel"
                class="py-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                @click="store.confirm"
                :class="store.confirmBtnClass"
                class="py-4 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg"
              >
                {{ store.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { useConfirmStore } from '~/stores/confirm'
const store = useConfirmStore()
</script>