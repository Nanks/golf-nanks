<template>
  <div class="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-28 px-6 pb-24">
    
    <TransitionGroup name="fade">
      <section v-if="myActiveRounds.length > 0" class="mb-8">
        <div v-for="round in myActiveRounds" :key="round.id" 
            class="group relative bg-slate-900 dark:bg-emerald-600 p-6 rounded-[2.5rem] border border-slate-800 dark:border-emerald-500 shadow-xl transition-all">
          
          <button 
            @click.stop="confirmDelete(round.id)"
            class="absolute top-4 right-4 p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors z-20"
          >
            <Icon name="mdi:trash-can-outline" class="size-4" />
          </button>

          <div @click="navigateTo(`/rounds/${round.id}`)" class="cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-5">
              <div class="relative">
                <div class="bg-emerald-500 dark:bg-white/20 p-3 rounded-2xl">
                  <Icon name="mdi:golf" class="size-6 text-white" />
                </div>
              </div>
              <div>
                <p class="text-[9px] font-black text-emerald-500 dark:text-emerald-100 uppercase tracking-[0.3em] mb-1">Live Round</p>
                <h3 class="text-xl font-black text-white uppercase tracking-tight leading-none mb-2">{{ round.course }}</h3>
                
                <div class="flex flex-wrap gap-x-4 gap-y-1">
                  <div v-for="p in round.players" :key="p.id" class="flex items-center gap-1.5">
                    <span class="text-[10px] font-bold text-slate-400 dark:text-emerald-100/60 uppercase">{{ p.fname }}:</span>
                    <span class="text-[11px] font-black text-white">{{ getPlayerTotal(round, p.id) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-3 self-end sm:self-center">
              <span class="text-[10px] font-black text-white uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-all">Resume</span>
              <Icon name="mdi:chevron-right" class="size-6 text-white" />
            </div>
          </div>
        </div>
      </section>
    </TransitionGroup>

    <section v-if="authStore.userProfile" class="mb-12 p-8 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p class="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.4em] mb-2">Member Dashboard</p>
          <h1 class="text-5xl font-black tracking-tighter uppercase italic leading-none">
            {{ authStore.userProfile.fname }} <span class="text-slate-400 dark:text-slate-600">{{ authStore.userProfile.lname }}</span>
          </h1>
        </div>
        
        <div class="flex gap-4">
          <div class="relative group bg-white dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner text-center min-w-[120px]">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GHIN Index</p>
            <p class="text-3xl font-black text-slate-900 dark:text-white">{{ authStore.userProfile.ghin || 'NH' }}</p>
            <button @click="isModalOpen = true" class="absolute bottom-2 right-2 p-1 text-slate-300 hover:text-emerald-500 transition">
              <Icon name="mdi:pencil-circle" class="w-5 h-5" />
            </button>
          </div>

          <button @click="openCasualRound" class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex flex-col items-center justify-center min-w-[120px]">
            <Icon name="mdi:golf" class="w-6 h-6 mb-1" />
            <span class="text-[9px] font-black uppercase tracking-widest">Start Round</span>
          </button>
        </div>
      </div>
    </section>

    <section v-if="myLeagues.length > 0" class="mb-14">
      <div class="flex items-center justify-between mb-8 px-2">
        <div class="flex items-center gap-4 flex-1">
          <h2 class="text-3xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">My Leagues</h2>
          <div class="h-[2px] flex-1 bg-slate-100 dark:bg-slate-900"></div>
        </div>
        <button v-if="dataStore.liveRounds" @click="openCasualRound" class="ml-6 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-emerald-500 transition-colors">
          <Icon name="mdi:plus-circle-outline" class="size-4" />
          Casual Round
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeagueCard 
          v-for="league in myLeagues" 
          :key="league.id" 
          :league="league" 
          :is-member="true"
          :has-live="dataStore.liveRounds.some(r => r.leagueId === league.id)"
          @click="navigateTo(`/leagues/${league.id}/menu`)"
          @play="openLeagueRound" 
        />
      </div>
    </section>

    <section v-if="otherLiveRounds.length > 0" class="mb-14">
      <div class="flex items-center gap-4 mb-8 px-2">
        <div class="flex items-center gap-2">
          <h2 class="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Watch Live</h2>
          <span class="flex items-center gap-1 bg-red-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase animate-pulse">
            <div class="size-1 bg-white rounded-full"></div> Live
          </span>
        </div>
        <div class="h-[2px] flex-1 bg-slate-100 dark:bg-slate-900"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="round in otherLiveRounds" :key="round.id" 
             @click="navigateTo(`/rounds/${round.id}`)"
             class="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm hover:border-emerald-500 transition-all cursor-pointer group">
          <div class="flex justify-between items-center">
            <div>
              <h4 class="font-black text-slate-800 dark:text-white uppercase leading-none">{{ round.course }}</h4>
              <p class="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-wide">
                {{ round.players.map(p => p.fname).join(' • ') }}
              </p>
            </div>
            <div class="p-2 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Icon name="mdi:eye" class="size-5" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="otherLeagues.length > 0" class="mb-14">
      <div class="flex items-center gap-4 mb-8">
        <h2 class="text-2xl font-black tracking-tighter uppercase italic text-slate-400 dark:text-slate-600">Available Leagues</h2>
        <div class="h-[2px] flex-1 bg-slate-50 dark:bg-slate-950"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70 grayscale-[0.5] hover:grayscale-0 transition-all">
        <LeagueCard 
          v-for="league in otherLeagues" 
          :key="league.id" 
          :league="league" 
          :has-live="dataStore.liveRounds.some(r => r.leagueId === league.id)"
          @click="navigateTo(`/leagues/${league.id}/menu`)"
        />
      </div>
    </section>

    <div v-if="allLeagues.length === 0 && !ui.isGlobalLoading" class="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-[3rem]">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Seasons Found</p>
    </div>

    <GhinModal :is-open="isModalOpen" :player="authStore.userProfile" @close="isModalOpen = false" @updated="(val) => authStore.userProfile.ghin = val" />
    <RoundSetupModal v-model="roundSetup" />
    
    <ConfirmModal 
      :is-open="deleteModal.isOpen"
      title="Delete Live Round?"
      confirm-text="Delete"
      @close="deleteModal.isOpen = false"
      @confirm="handleDelete"
    >
      This will permanently delete this live round and all associated scores for all players.
    </ConfirmModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { useData } from '~/stores/data' 

const { $db } = useNuxtApp()
const authStore = useAuthStore()
const ui = useUIStore()
const dataStore = useData()
const router = useRouter()
const route = useRoute()

// --- STATE ---
const allLeagues = ref([])
const isModalOpen = ref(false)
const deleteModal = ref({
  isOpen: false,
  roundId: null
});

const roundSetup = ref({
  isOpen: false,
  isLeague: false,
  leagueName: '',
  isYearly: false,
  players: [],
  data: {
    course: '',
    tees: '',
    holes: 18
  }
})

// --- HELPERS ---
const getPlayerTotal = (round, playerId) => {
  const scores = round.scores?.[playerId] || [];
  return scores.reduce((sum, s) => {
    const val = parseInt(s);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

const confirmDelete = (roundId) => {
  deleteModal.value = { isOpen: true, roundId };
};

const handleDelete = async () => {
  if (!deleteModal.value.roundId) return;
  ui.setLoading(true, "Deleting round...");
  await dataStore.deleteLiveRound(deleteModal.value.roundId);
  deleteModal.value.isOpen = false;
  ui.setLoading(false);
};

// --- COMPUTED: LIVE ROUNDS (Now from Pinia) ---

// 1. My rounds for the "Resume" button
const myActiveRounds = computed(() => {
  if (!authStore.user?.uid || !Array.isArray(dataStore.liveRounds)) return [];
  return dataStore.liveRounds.filter(round => 
    round.participantUids?.includes(authStore.user.uid)
  );
});

// 2. Everyone else's rounds for public viewing
const otherLiveRounds = computed(() => {
  if (!Array.isArray(dataStore.liveRounds)) return [];
  const myIds = new Set(myActiveRounds.value.map(r => r.id));
  return dataStore.liveRounds.filter(round => !myIds.has(round.id));
});

// --- COMPUTED: LEAGUES ---
const myLeagues = computed(() => {
  if (!authStore.isLoggedIn) return []
  return allLeagues.value.filter(league => authStore.userProfile?.leagues?.includes(league.id))
})

const otherLeagues = computed(() => {
  if (!authStore.isLoggedIn) return allLeagues.value
  const myIds = myLeagues.value.map(l => l.id)
  return allLeagues.value.filter(league => !myIds.includes(league.id))
})

// --- METHODS: ROUND SETUP ---
const openCasualRound = () => {
  roundSetup.value = {
    isOpen: true,
    isLeague: false,
    leagueName: 'Casual Round',
    isYearly: false,
    players: authStore.userProfile ? [{...authStore.userProfile}] : [],
    data: { course: '', tees: '', holes: 18 }
  }
}

const openLeagueRound = (league) => {
  if (!league.nextRound) {
    alert("No upcoming events found for this league.");
    return;
  }

  roundSetup.value = {
    isOpen: true,
    isLeague: true,
    leagueId: league.id,
    leagueName: league.name,
    isYearly: league.type === 'yearly' || league.cadence === 'yearly',
    players: authStore.userProfile ? [{
      ...authStore.userProfile, 
      tee: league.nextRound.tees || '' 
    }] : [],
    data: { 
      course: league.nextRound.course || '', 
      tees: league.nextRound.tees || '', 
      holes: league.nextRound.holes || 18,
      eventId: league.nextRound.id
    }
  }
}

// --- DATA FETCHING ---
const fetchLeagues = async () => {
  ui.setLoading(true);
  try {
    const querySnapshot = await getDocs(collection($db, "leagues"));
    const leaguesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), nextRound: null }));
    const nowIso = new Date().toISOString().split('T')[0];

    for (const league of leaguesData) {
      const calRef = collection($db, "leagues", league.id, "calendar");
      const q = query(calRef, where("iso", ">=", nowIso), orderBy("iso", "asc"), limit(1));
      const calSnap = await getDocs(q);
      if (!calSnap.empty) {
        league.nextRound = { id: calSnap.docs[0].id, ...calSnap.docs[0].data() };
      }
    }
    allLeagues.value = leaguesData;
  } catch (e) {
    console.error("League Fetch Error:", e);
  } finally {
    ui.setLoading(false);
  }
};

// --- LIFECYCLE ---
onMounted(async () => {
  // Start the global live rounds listener
  dataStore.startLiveListener();
  
  // Fetch specific dashboard data
  await fetchLeagues();
})

onUnmounted(() => {
  // Hybrid Stop: Only kill the listener if we aren't moving to 
  // another page that needs real-time golf data.
  const liveRoutes = ['index', 'leaderboard', 'rounds-id'];
  if (!liveRoutes.includes(route.name)) {
    dataStore.stopLiveListener();
  }
})

// Debug logs
watch(() => authStore.userProfile, (newProfile) => {
  if (newProfile) console.log("✅ Dashboard Profile:", newProfile.fname);
}, { immediate: true });
</script>