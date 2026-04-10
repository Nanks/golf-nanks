<template>
  <div class="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-28 px-6 pb-24">
    
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
            <button 
              @click="isModalOpen = true"
              class="absolute bottom-2 right-2 p-1 text-slate-300 hover:text-emerald-500 transition"
            >
              <Icon name="mdi:pencil-circle" class="w-5 h-5" />
            </button>
          </div>

          <button 
            @click="openCasualRound"
            class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex flex-col items-center justify-center min-w-[120px]"
          >
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
        
        <button 
          v-if="canStart"
          @click="openCasualRound" 
          class="ml-6 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-emerald-500 transition-colors"
        >
          <Icon name="mdi:plus-circle-outline" class="size-4" />
          Casual Round
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeagueCard 
          v-for="league in myLeagues" 
          :key="league.id" 
          :league="league" 
          :is-member="authStore.userProfile?.leagues?.includes(league.id)"
          @click="navigateTo(`/leagues/${league.id}/menu`)"
          @play="openLeagueRound" 
        />
      </div>
    </section>

    <section v-if="otherLeagues.length > 0">
      <div class="flex items-center gap-4 mb-8">
        <h2 class="text-2xl font-black tracking-tighter uppercase italic text-slate-400 dark:text-slate-600">Available Leagues</h2>
        <div class="h-[2px] flex-1 bg-slate-50 dark:bg-slate-950"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70 grayscale-[0.5] hover:grayscale-0 transition-all">
        <LeagueCard 
          v-for="league in otherLeagues" 
          :key="league.id" 
          :league="league" 
          @click="navigateTo(`/leagues/${league.id}/menu`)"
        />
      </div>
    </section>

    <div v-if="allLeagues.length === 0 && !ui.isGlobalLoading" class="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-[3rem]">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Seasons Found</p>
    </div>

    <GhinModal 
      :is-open="isModalOpen" 
      :player="authStore.userProfile" 
      @close="isModalOpen = false"
      @updated="(val) => authStore.userProfile.ghin = val" 
    />

    <RoundSetupModal 
      v-model="roundSetup"
      @start="handleStartRound"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { useData } from '~/stores/data' 

const { $db } = useNuxtApp()
const authStore = useAuthStore()
const ui = useUIStore()
const dataStore = useData()
const router = useRouter()

const allLeagues = ref([])
const isModalOpen = ref(false)

const coursesArray = computed(() => Array.from(dataStore.courses.values()))
const canStart = computed(() => dataStore.isBooted);

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

const myLeagues = computed(() => {
  if (!authStore.isLoggedIn) return []
  return allLeagues.value.filter(league => authStore.userProfile?.leagues?.includes(league.id))
})

const otherLeagues = computed(() => {
  if (!authStore.isLoggedIn) return allLeagues.value
  const myIds = myLeagues.value.map(l => l.id)
  return allLeagues.value.filter(league => !myIds.includes(league.id))
})

watch(() => authStore.userProfile, (newProfile) => {
  if (newProfile) {
    console.log("✅ Profile Loaded:", `${newProfile.fname} ${newProfile.lname}`);
  }
}, { immediate: true });

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
    
    // Auto-inject the user and apply the locked league tees
    players: authStore.userProfile ? [{
      ...authStore.userProfile, 
      tee: league.nextRound.tees || '' 
    }] : [],
    
    data: { 
      course: league.nextRound.course || '', 
      tees: league.nextRound.tees || '', 
      holes: league.nextRound.holes || 18,
      eventId: league.nextRound.id // IMPORTANT: Pass the calendar doc ID
    }
  }
}

const handleStartRound = async () => {
  ui.setLoading(true);
  try {
    // 1. Existing Start Round Logic
    const roundId = await dataStore.startNewRound({
      isLeague: roundSetup.value.isLeague,
      leagueId: null,
      eventId: roundSetup.value.isLeague ? roundSetup.value.data.eventId : null, // The calendar doc ID
      players: roundSetup.value.players,
      course: roundSetup.value.data.course,
      tees: roundSetup.value.data.tees,
      holes: roundSetup.value.data.holes
    });

    // 2. UPDATE RECENT PLAYERS:
    // Filter out yourself, then merge new IDs with existing ones
    const currentUserId = authStore.userProfile.id;
    const partnerIds = roundSetup.value.players
      .map(p => p.id)
      .filter(id => id !== currentUserId);

    if (partnerIds.length > 0) {
      // Create a unique set of IDs (new ones first)
      const existingRecent = authStore.userProfile.recentPlayers || [];
      const updatedRecent = [...new Set([...partnerIds, ...existingRecent])].slice(0, 5);

      // Save back to Firestore
      const userRef = doc($db, "players", currentUserId);
      await updateDoc(userRef, { recentPlayers: updatedRecent });
      
      // Update local state so it's instant
      authStore.userProfile.recentPlayers = updatedRecent;
    }

    roundSetup.value.isOpen = false;
    router.push(`/rounds/${roundId}`);
  } catch (e) {
    console.error(e);
  } finally {
    ui.setLoading(false);
  }
};


// Restored fetchLeagues function
const fetchLeagues = async () => {
  ui.setLoading(true);
  try {
    const querySnapshot = await getDocs(collection($db, "leagues"));
    const leaguesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), nextRound: null }));

    const nowIso = new Date().toISOString().split('T')[0];

    for (const league of leaguesData) {
      const calRef = collection($db, "leagues", league.id, "calendar");
      const q = query(
        calRef, 
        where("iso", ">=", nowIso), 
        orderBy("iso", "asc"), 
        limit(1)
      );
      
      const calSnap = await getDocs(q);
      if (!calSnap.empty) {
        league.nextRound = { id: calSnap.docs[0].id, ...calSnap.docs[0].data() };
      }
    }

    allLeagues.value = leaguesData;
  } catch (e) {
    console.error(e);
  } finally {
    ui.setLoading(false);
  }
};

onMounted(async () => {
  ui.setLoading(true)
  try {
    await fetchLeagues()
  } catch (e) { 
    console.error("League Fetch Error:", e) 
  } finally { 
    ui.setLoading(false) 
  }
})
</script>