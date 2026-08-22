<template>
  <div class="max-w-2xl mx-auto overflow-x-hidden">
    <section v-if="authStore.isLoggedIn && authStore.userProfile" class="mb-6 px-4">
      <div class="card-base p-5 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-primary text-xl font-bold uppercase tracking-tight">
            {{ authStore.userProfile.fname }} {{ authStore.userProfile.lname }}
          </h1>
        </div>

        <div @click="showGhinModal = true" class="relative active:scale-95 transition-transform cursor-pointer">
          <div class="absolute -top-1.5 -right-1.5 size-5 bg-emerald-500/80 rounded-md flex items-center justify-center text-emerald-800 shadow-md z-10">
            <Icon name="mdi:pencil" class="size-2.5" />
          </div>
          
          <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-center min-w-[85px]">
            <p class="text-secondary text-[10px] uppercase font-black opacity-60">GHIN</p>
            <p class="text-primary text-xl tabular-nums font-black">
              {{ authStore.userProfile.ghin || '—' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="flex items-center justify-between mb-2 px-4">
        <h2 class="text-emerald-500 text-2xl font-black italic uppercase tracking-tighter">Leagues</h2>
        
        <button 
          v-if="authStore.isSuperAdmin" 
          @click="navigateTo('/rounds/setup')" 
          class="text-emerald-500 text-[10px] flex items-center gap-1.5 active:opacity-70 font-bold uppercase"
        >
          <Icon name="mdi:plus-circle-outline" class="size-4" /> Casual Round
        </button>
      </div>

      <div v-if="myLeagues.length > 0" class="mb-12 relative">
        <h3 class="text-secondary text-[10px] mb-4 px-4 uppercase tracking-[0.2em] font-black opacity-50">My Active Leagues</h3>
        
        <div class="relative h-[320px] w-full overflow-visible">
          
          <button 
            @click="prevLeague" 
            :disabled="carouselIndex === 0"
            class="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-xl border transition-all flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none"
            :class="carouselIndex === 0 
              ? 'border-transparent text-slate-300 dark:text-slate-800 bg-transparent' 
              : 'bg-emerald-500/60 border-emerald-500/80 text-emerald-900 dark:text-emerald-400 shadow-sm active:scale-95 hover:bg-emerald-500/20'"
          >
            <Icon name="mdi:chevron-left" class="size-6" />
          </button>

          <div class="absolute inset-0 overflow-visible pointer-events-none">
            <div 
              class="absolute left-1/2 top-0 bottom-0 flex items-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-auto"
              :style="{ 
                transform: `translateX(calc(-104px - (${carouselIndex} * 208px)))` 
              }"
            >
              <div 
                v-for="(league, index) in myLeagues" 
                :key="`my-${league.id}`"
                class="w-52 px-2 transition-all duration-500 flex justify-center items-center"
                :class="[
                  carouselIndex === index 
                    ? 'scale-125 opacity-100 z-30' 
                    : 'scale-75 opacity-20 blur-[2px] grayscale pointer-events-none'
                ]"
              >
                <LeagueLogoCard :league="league" :showAction="true" />
              </div>
            </div>
          </div>

          <button 
            @click="nextLeague" 
            :disabled="carouselIndex >= myLeagues.length - 1"
            class="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-xl border transition-all flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none"
            :class="carouselIndex >= myLeagues.length - 1
              ? 'border-transparent text-slate-300 dark:text-slate-800 bg-transparent' 
              : 'bg-emerald-500/60 border-emerald-500/80 text-emerald-900 dark:text-emerald-400 shadow-sm active:scale-95 hover:bg-emerald-500/20'"
          >
            <Icon name="mdi:chevron-right" class="size-6" />
          </button>
        </div>
      </div>

      <div class="space-y-6 px-4 pb-12">
        <div v-if="myOtherLeagues.length > 0">
          <h3 class="text-secondary text-[10px] mb-3 uppercase tracking-[0.2em] font-black opacity-50">My Leagues</h3>
          <div class="grid grid-cols-1 gap-3">
            <LeagueCard
              v-for="league in myOtherLeagues"
              :key="`mine-${league.id}`"
              :league="league"
              :is-member="true"
            />
          </div>
        </div>

        <div v-if="otherLeagues.length > 0">
          <h3 class="text-secondary text-[10px] mb-3 uppercase tracking-[0.2em] font-black opacity-50">Other Leagues</h3>
          <div class="grid grid-cols-1 gap-3">
            <LeagueCard
              v-for="league in otherLeagues"
              :key="`other-${league.id}`"
              :league="league"
              :is-member="false"
            />
          </div>
        </div>
      </div>
    </section>

    <ClientOnly>
      <LazyGhinModal :is-open="showGhinModal" :player="authStore.userProfile" @close="showGhinModal = false" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'
import { getLocalIsoDate } from '~/utils/leagueActions'
import { computed, ref, onMounted } from 'vue'

const authStore = useAuthStore()
const dataStore = useData()
const todayIso = getLocalIsoDate()

// UI State
const showGhinModal = ref(false)
const isMounted = ref(false)
const carouselIndex = ref(0)

// Computed Data

// Joined leagues with an event happening today -- shown in the LeagueLogoCard carousel
const myLeagues = computed(() => {
  if (!isMounted.value || !authStore.isInitialized || !authStore.isLoggedIn) return [];

  return dataStore.leagues.filter(l =>
    authStore.userProfile?.leagues?.includes(l.id) && l.nextRound?.iso === todayIso
  );
});

// Joined leagues without an event today -- shown as LeagueCard, below the carousel
const myOtherLeagues = computed(() => {
  if (!isMounted.value || !authStore.isInitialized || !authStore.isLoggedIn) return [];

  return dataStore.leagues.filter(l =>
    authStore.userProfile?.leagues?.includes(l.id) && l.nextRound?.iso !== todayIso
  );
});

const otherLeagues = computed(() => {
  if (!isMounted.value || !authStore.isInitialized) return []
  if (!authStore.isLoggedIn) return dataStore.leagues
  return dataStore.leagues.filter(l => !authStore.userProfile?.leagues?.includes(l.id))
})

// Carousel Navigation
const nextLeague = () => {
  if (carouselIndex.value < myLeagues.value.length - 1) {
    carouselIndex.value++
  }
}

const prevLeague = () => {
  if (carouselIndex.value > 0) {
    carouselIndex.value--
  }
}

// Lifecycle Hooks
onMounted(() => {
  isMounted.value = true
})
</script>

<style scoped>
/* Performance optimization for smooth transforms */
.transition-all, .transition-transform {
  will-change: transform, opacity;
}

/* Hide scrollbar just in case of overflow leaks */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>