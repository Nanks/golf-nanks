<template>
  <header class="mb-6 px-2">
    <NuxtLink 
      :to="backTo" 
      class="text-secondary inline-flex items-center gap-1 mb-2 text-[10px] active:text-emerald-500 transition-colors"
    >
      <Icon name="mdi:arrow-left" class="size-3" /> {{ backText }}
    </NuxtLink>
    
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <ClientOnly>
          <Icon 
            v-if="isAdmin" 
            name="mdi:shield-crown-outline" 
            class="text-amber-500 size-8 shrink-0" 
          />
        </ClientOnly>
        
        <h1 class="text-primary text-4xl text-emerald-500">
          <slot name="title">{{ title }}</slot>
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <slot name="action" />
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: String,
  isAdmin: Boolean,
  backTo: { type: String, default: '/' },
  backText: { type: String, default: 'All Leagues' }
})
</script>