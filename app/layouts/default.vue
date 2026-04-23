<template>
  <div class="relative min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-24 px-2 pb-24 transition-colors duration-300">
    
    <div v-if="!isMounted || !authStore.isInitialized">
      <div class="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center">
        <Icon name="mdi:golf" class="size-16 text-emerald-500 animate-bounce mb-4" />
        <p class="text-secondary text-[10px]">Loading...</p>
      </div>
    </div>

    <main v-else>
      <slot />
    </main>

    </div>
</template>

<script setup>
const authStore = useAuthStore()
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})
</script>