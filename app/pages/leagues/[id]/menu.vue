<template>
  <div class="max-w-2xl mx-auto select-none pb-20">
    
    <template v-if="league">
      <LeagueHeader 
        :title="league.shortName || league.name" 
        :is-admin="isAdmin" 
        back-to="/"
        back-text="Home"
      />

      <nav class="space-y-3 px-3">
        <NuxtLink 
          v-for="item in menuItems" 
          :key="item.label"
          :to="item.path" 
          class="card-interactive flex items-center justify-between p-4 px-5 group"
        >
          <div class="flex items-center gap-4">
            <div class="relative w-8 h-8 flex items-center justify-center">
              <div v-if="item.isLive" class="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
              
              <Icon 
                :name="item.icon" 
                :class="[
                  item.isLive ? 'text-emerald-500' : 'text-stone-500 dark:text-stone-400',
                  'size-6 transition-colors group-active:text-emerald-500'
                ]" 
              />
            </div>
            
            <div>
              <p class="text-2xl text-primary" :class="{ 'text-emerald-500': item.isLive }">
                {{ item.label }}
              </p>
              <p v-if="item.isLive" class="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 -mt-1">
                Round in Progress
              </p>
            </div>
          </div>
          
          <Icon 
            name="mdi:chevron-right" 
            class="size-5 text-stone-400 dark:text-stone-500 transition-colors group-active:text-emerald-500" 
          />
        </NuxtLink>
      </nav>
    </template>

    <div v-else class="pt-20 flex flex-col items-center justify-center">
      <Icon name="mdi:alert-circle-outline" class="size-12 mb-4 text-stone-700 opacity-20" />
      <p class="text-secondary text-xs">League Not Found</p>
      <NuxtLink to="/" class="text-emerald-500 font-black uppercase tracking-widest text-[10px] mt-6">
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

const leagueId = route.params.id
const todayIso = new Date().toISOString().split('T')[0]

const league = computed(() => dataStore.leagues.find(l => l.id === leagueId))

const isAdmin = computed(() => {
  if (!league.value) return false
  return authStore.isAdminForLeague(league.value.id)
})

const isLive = computed(() => {
  return dataStore.liveRounds.some(r => r.leagueId === leagueId)
})

const hasGame = (gameName) => {
  const games = league.value?.yearly_games || []
  return games.some(g => g.toLowerCase() === gameName.toLowerCase())
}

const menuItems = computed(() => {
  const items = []

  // 1. Live Leaderboard (Absolute Path)
  if (isLive.value) {
    items.push({ 
      label: 'Live Leaderboard', 
      path: `/leaderboard/${leagueId}/${todayIso}/live?from=menu`, 
      icon: 'mdi:broadcast',
      isLive: true 
    })
  }

  // 2. Standard League Pages (Absolute Paths)
  items.push({ 
    label: 'Calendar', 
    path: `/leagues/${leagueId}/calendar`, 
    icon: 'mdi:calendar-month' 
  })
  
  if (hasGame('birds')) {
    items.push({ 
      label: 'Birds', 
      path: `/leagues/${leagueId}/birds`, 
      icon: 'mdi:bird' 
    })
  }

  if (hasGame('deuces')) {
    items.push({ 
      label: 'Deuces', 
      path: `/leagues/${leagueId}/deuces`, 
      icon: 'mdi:numeric-2-circle' 
    })
  }
  
  items.push({ 
    label: 'Roster', 
    path: `/leagues/${leagueId}/roster`, 
    icon: 'mdi:account-group' 
  })

  return items
})
</script>