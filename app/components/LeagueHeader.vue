<template>
  <header class="mb-6 px-2">
    <NuxtLink 
      :to="backTo" 
      class="text-stone-500 dark:text-stone-400 inline-flex items-center gap-1 mb-2 text-xs font-bold uppercase tracking-widest active:text-emerald-500 transition-colors"
    >
      <Icon name="mdi:arrow-left" class="size-3.5" /> {{ backText }}
    </NuxtLink>
    
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <ClientOnly>
          <Icon 
            v-if="isAdmin" 
            name="mdi:shield-crown-outline" 
            class="text-amber-500 size-8 shrink-0" 
          />
        </ClientOnly>
        
        <div class="flex flex-col">
          <h1 class="text-primary text-4xl text-emerald-500 leading-none">
            <slot name="title">{{ title }}</slot>
          </h1>
          
          <div v-if="subtitle || $slots.subtitle" class="text-stone-500 dark:text-stone-400 text-xs font-black uppercase tracking-widest mt-1">
            <slot name="subtitle">{{ subtitle }}</slot>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 mt-1">
        <slot name="action" />
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String, // <-- New prop added
  isAdmin: Boolean,
  backTo: { type: String, default: '/' },
  backText: { type: String, default: 'All Leagues' }
})
</script>