<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 px-2 py-6 pt-24 max-w-2xl mx-auto select-none">
    
    <template v-if="league">
      <LeagueHeader 
        :title="league.shortName || league.name" 
        :is-admin="isAdmin" 
      />

      <div class="space-y-3">
        <NuxtLink 
          v-for="item in menuItems" 
          :key="item.path"
          :to="`/leagues/${route.params.id}/${item.path}`" 
          class="card-base flex items-center justify-between p-4 px-5 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 flex items-center justify-center transition-colors">
              <Icon 
                :name="item.icon" 
                class="size-6 text-slate-600 dark:text-slate-400 group-active:text-emerald-500 transition-colors" 
              />
            </div>
            
            <p class="text-xl text-primary">
              {{ item.label }}
            </p>
          </div>
          
          <Icon 
            name="mdi:chevron-right" 
            class="text-slate-300 dark:text-slate-700 group-active:text-emerald-500 transition-colors size-5" 
          />
        </NuxtLink>
      </div>
    </template>

    <div v-else class="pt-32 flex flex-col items-center justify-center text-slate-500">
      <Icon name="mdi:alert-circle-outline" class="size-10 mb-2 opacity-50" />
      <p class="text-[10px] font-black uppercase tracking-[0.2em]">League Not Found</p>
      <NuxtLink to="/" class="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform text-slate-700 dark:text-slate-300">
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