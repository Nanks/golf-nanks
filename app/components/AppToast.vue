<script setup lang="ts">
// Nuxt 4 auto-imports useToast, but TypeScript knows its types
const { isVisible, toastMessage, toastType } = useToast()
</script>

<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isVisible" class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100]">
      <div 
        class="p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
        :class="{
          'bg-emerald-600 text-white': toastType === 'success',
          'bg-slate-900 text-white': toastType === 'error',
          'bg-blue-600 text-white': toastType === 'info'
        }"
      >
        <!-- Dynamic Icon Based on Type -->
        <div class="rounded-full p-1 bg-white/20">
          <svg v-if="toastType === 'success'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p class="text-xs font-black uppercase tracking-wider">{{ toastMessage }}</p>
      </div>
    </div>
  </Transition>
</template>
