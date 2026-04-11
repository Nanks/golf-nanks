<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isOpen" class="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div @click="$emit('close')" class="absolute inset-0"></div>
          
          <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div :class="[iconBg, iconColor]" class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon :name="icon" class="size-8" />
            </div>

            <h3 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">
              {{ title }}
            </h3>
            
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-8 px-2">
              <slot>Are you sure you want to proceed? This action cannot be undone.</slot>
            </p>

            <div class="grid grid-cols-2 gap-3">
              <button 
                @click="$emit('close')"
                class="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                @click="$emit('confirm')"
                :class="confirmBtnClass"
                class="py-4 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  title: { type: String, default: 'Are you sure?' },
  confirmText: { type: String, default: 'Confirm' },
  icon: { type: String, default: 'mdi:alert-circle' },
  iconBg: { type: String, default: 'bg-red-50' },
  iconColor: { type: String, default: 'text-red-500' },
  confirmBtnClass: { type: String, default: 'bg-red-600' }
});
defineEmits(['close', 'confirm']);
</script>