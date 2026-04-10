<template>
  <Teleport to="body">
    <Transition name="toast">
      <div 
        v-if="isVisible" 
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs px-4"
      >
        <div 
          :class="[
            'flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl',
            typeClasses[toastType]
          ]"
        >
          <div :class="['p-2 rounded-xl bg-white/10', iconClasses[toastType]]">
            <svg v-if="toastType === 'error'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            <svg v-if="toastType === 'success'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
            <svg v-if="toastType === 'info'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>

          <p class="text-[11px] font-black uppercase tracking-widest text-white leading-tight">
            {{ toastMessage }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useToast } from '~/composables/useToast'

const { isVisible, toastMessage, toastType } = useToast()

const typeClasses = {
  error: 'bg-red-950/90 border-red-500/50 text-red-200',
  success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
  info: 'bg-slate-900/90 border-slate-700/50 text-slate-200'
}

const iconClasses = {
  error: 'text-red-400',
  success: 'text-emerald-400',
  info: 'text-blue-400'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px) scale(0.95);
}
</style>