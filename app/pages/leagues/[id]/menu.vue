<template>
  <div class="max-w-2xl mx-auto select-none">
    
    <template v-if="league">
      <LeagueHeader 
        :title="league.shortName || league.name" 
        :is-admin="isAdmin" 
      />

      <nav class="space-y-3">
        <NuxtLink 
          v-for="item in menuItems" 
          :key="item.path"
          :to="`/leagues/${route.params.id}/${item.path}`" 
          class="card-interactive flex items-center justify-between p-4 px-5 group"
        >
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 flex items-center justify-center">
              <Icon 
                :name="item.icon" 
                class="size-6 text-slate-500 dark:text-slate-400 transition-colors group-active:text-emerald-500" 
              />
            </div>
            
            <p class="text-2xl text-primary">
              {{ item.label }}
            </p>
          </div>
          
          <Icon 
            name="mdi:chevron-right" 
            class="size-5 text-slate-400 dark:text-slate-500 transition-colors group-active:text-emerald-500" 
          />
        </NuxtLink>
      </nav>
    </template>

    <div v-else class="pt-20 flex flex-col items-center justify-center">
      <Icon name="mdi:alert-circle-outline" class="size-12 mb-4 text-slate-700 opacity-20" />
      <p class="text-secondary text-xs">League Not Found</p>
      
      <NuxtLink to="/" class="btn-primary mt-6 text-xs px-8">
        Return Home
      </NuxtLink>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'

const route = useRoute()
const authStore = useAuthStore()
const dataStore = useData()

// 1. Grab data instantly from the store instead of Firebase
const league = computed(() => {
  return dataStore.leagues.find(l => l.id === route.params.id)
})

// 2. Updated to use our new getter
const isAdmin = computed(() => {
  if (!league.value) return false;
  return authStore.isAdminForLeague(league.value.type);
});

// 3. Adjusted to check the array instead of just 'yearly' cadence
const hasGame = (gameName) => {
  if (!league.value?.yearly_games) return false;
  return league.value.yearly_games.some(g => g.toLowerCase() === gameName.toLowerCase());
};

const menuItems = computed(() => {
  const items = [
    { label: 'Calendar', path: 'calendar', icon: 'mdi:calendar-month' }
  ];
  
  if (hasGame('birds')) items.push({ label: 'Birds', path: 'birds', icon: 'mdi:bird' });
  if (hasGame('deuces')) items.push({ label: 'Deuces', path: 'deuces', icon: 'mdi:numeric-2-circle' });
  
  items.push({ label: 'Roster', path: 'roster', icon: 'mdi:account-group' });
  return items;
});
</script>