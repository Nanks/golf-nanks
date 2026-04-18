<template>
  <Transition name="toast">
    <div v-if="isVisible" 
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
    >
      <div 
        class="rounded-2xl shadow-2xl border bg-white/95 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden"
        :class="theme.border"
      >
        <div class="p-4 flex items-start gap-3" :class="theme.bgTint">
          
          <Icon 
            :name="theme.icon" 
            :class="theme.text"
            class="size-5 shrink-0 mt-0.5"
          />
          
          <div>
            <h3 class="text-xs font-black uppercase tracking-widest leading-none mb-1"
                :class="theme.text">
              {{ toastData.title }}
            </h3>
            <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
              {{ toastData.description }}
            </p>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const { isVisible, toastData } = useToast()

// Clean mapping for all your toast variants
const theme = computed(() => {
  switch (toastData.value?.color) {
    case 'red':
      return {
        border: 'border-red-500/30',
        bgTint: 'bg-red-500/10',
        text: 'text-red-500',
        icon: 'mdi:alert-circle'
      }
    case 'amber': // Added for our new League Card warning!
      return {
        border: 'border-amber-500/30',
        bgTint: 'bg-amber-500/10',
        text: 'text-amber-500',
        icon: 'mdi:alert'
      }
    case 'emerald':
    default:
      return {
        border: 'border-emerald-500/30',
        bgTint: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        icon: 'mdi:check-circle'
      }
  }
})
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { 
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
}
.toast-enter-from, .toast-leave-to { 
  opacity: 0; 
  transform: translate(-50%, 20px); 
}
</style>