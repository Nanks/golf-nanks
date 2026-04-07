<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-2xl mx-auto space-y-8 overflow-hidden pb-24">
    
    <div v-if="isInitialLoading || !dataStore.isBooted" class="p-20 text-center animate-pulse text-emerald-600 font-bold uppercase tracking-widest text-sm">
      Syncing...
    </div>
    
    <div v-else class="space-y-8">
      <section v-if="player" class="space-y-4">
        <div class="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
          <div class="relative z-10 flex justify-between items-start">
            <div>
              <h1 class="text-3xl font-black uppercase tracking-tighter leading-none">
                {{ player.fname }}<br/>{{ player.lname }}
              </h1>
              <p class="text-[10px] font-bold opacity-80 uppercase tracking-[0.2em] mt-3">
                GHIN: {{ player.ghin || 'N/A' }} • {{ player.admin ? 'Admin' : 'Player' }}
              </p>
            </div>
            <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-md text-center min-w-[70px]">
              <p class="text-[8px] font-black uppercase opacity-70 mb-1">Leagues</p>
              <p class="text-xl font-black leading-none">{{ player.leagues?.length || 0 }}</p>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-6 text-[120px] font-black opacity-10 select-none">G</div>
        </div>

        <button 
          @click="openManualRound"
          class="w-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <Icon name="mdi:golf-tee" class="size-4 text-emerald-600" />
          Start Casual Round
        </button>

        <div v-if="myLeagues.length > 0" class="pt-4">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">My Active Leagues</h3>
          <div class="grid gap-3">
            <NuxtLink 
              v-for="ml in myLeagues" :key="ml.id" :to="`/leagues/${ml.id}/menu`"
              class="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all active:scale-[0.98]"
            >
              <div class="flex flex-col gap-2.5 w-full pr-4">
                <span class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm">
                  {{ ml.shortName || ml.name }}
                </span>
                
                <div v-if="ml.nextRound" class="flex flex-wrap items-center gap-2">
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <Icon name="mdi:calendar-arrow-right" class="size-3" />
                    {{ getShortDate(ml.nextRound.iso) }}
                  </div>
                  <div v-if="ml.nextRound.game?.length" class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">
                    {{ ml.nextRound.game.join(' & ') }}
                  </div>
                </div>
              </div>
              <div class="w-8 h-8 flex-shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-xs">→</div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <section v-if="otherLeagues.length > 0">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Other Available Leagues</h3>
        <div class="grid gap-3">
          <NuxtLink 
            v-for="league in otherLeagues" :key="league.id" :to="`/leagues/${league.id}/menu`"
            class="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all active:scale-[0.98]"
          >
            <div class="flex flex-col gap-2.5 w-full pr-4">
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm tracking-tight">
                {{ league.shortName || league.name }}
              </p>
              <div v-if="league.nextRound" class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {{ getShortDate(league.nextRound.iso) }}
              </div>
            </div>
            <div class="text-slate-300">→</div>
          </NuxtLink>
        </div>
      </section>
    </div>
    <ClientOnly>
      <Teleport to="body">
        <div v-if="roundSetup.isOpen" class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            
            <div class="flex justify-between items-start mb-6">
              <div>
                <p v-if="roundSetup.isLeague" class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">League Event Today</p>
                <p v-else class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Casual Round</p>
                <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                  {{ roundSetup.isLeague ? roundSetup.leagueName : 'Setup Round' }}
                </h3>
              </div>
              <button @click="roundSetup.isOpen = false" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600">
                <Icon name="mdi:close" class="size-5" />
              </button>
            </div>

            <div class="overflow-y-auto pr-1 -mr-1 space-y-6 pb-4">
              <div>
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">Round Details</h4>
                
                <div v-if="roundSetup.isLeague" class="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-slate-500 uppercase text-[10px]">Course</span>
                    <span class="text-slate-800 dark:text-slate-100">{{ roundSetup.data.course || 'TBD' }}</span>
                  </div>
                  <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-slate-500 uppercase text-[10px]">Tees</span>
                    <span class="text-slate-800 dark:text-slate-100">{{ roundSetup.data.tees || 'TBD' }}</span>
                  </div>
                  <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-slate-500 uppercase text-[10px]">Holes</span>
                    <span class="text-slate-800 dark:text-slate-100">{{ roundSetup.data.holes }}</span>
                  </div>
                </div>

                <div v-else class="space-y-4">
                  <div class="relative">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Course</label>
                    <select v-model="roundSetup.data.course" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 appearance-none focus:border-emerald-500 outline-none">
                      <option value="" disabled>Select Course...</option>
                      <option v-for="c in courses" :key="c.id" :value="c.name">{{ c.name }}</option>
                    </select>
                    <Icon name="mdi:chevron-down" class="absolute right-4 bottom-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3">
                    <div class="relative">
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tees</label>
                      <select v-model="roundSetup.data.tees" :disabled="!availableTees.length" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 appearance-none focus:border-emerald-500 outline-none disabled:opacity-50">
                        <option value="" disabled>Select Tees...</option>
                        <option v-for="t in availableTees" :key="t" :value="t">{{ t }}</option>
                      </select>
                      <Icon name="mdi:chevron-down" class="absolute right-4 bottom-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Holes</label>
                      <div class="flex bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 h-[46px]">
                        <button @click="roundSetup.data.holes = 9" :class="roundSetup.data.holes === 9 ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'" class="flex-1 text-sm font-bold rounded-lg transition-all">9</button>
                        <button @click="roundSetup.data.holes = 18" :class="roundSetup.data.holes === 18 ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'" class="flex-1 text-sm font-bold rounded-lg transition-all">18</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">Group ({{ roundSetup.players.length }})</h4>
                
                <div class="flex flex-wrap gap-2 mb-3">
                  <div v-for="p in roundSetup.players" :key="p.id" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full text-xs font-bold pr-1.5">
                    {{ p.fname }} {{ p.lname?.charAt(0) }}.
                    <button @click="togglePlayer(p)" class="p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full">
                      <Icon name="mdi:close-circle" class="size-4 opacity-50" />
                    </button>
                  </div>
                </div>

                <button @click="isPlayerPickerOpen = true" class="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl py-3 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest transition-all">
                  <Icon name="mdi:account-multiple-plus" class="size-4" />
                  Add Players
                </button>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
              <button @click="startRound" class="w-full py-4 bg-emerald-600 text-white font-black rounded-xl uppercase text-sm tracking-widest hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-600/20">
                Start Scoring
              </button>
            </div>
          </div>
        </div>

        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div v-if="isPlayerPickerOpen" class="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-4">
            <div @click="isPlayerPickerOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
            <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[75vh]">
              <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h4 class="text-xs font-black uppercase tracking-widest text-slate-400">Select Players</h4>
                <button @click="isPlayerPickerOpen = false" class="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full">
                  <Icon name="mdi:check" class="size-5" />
                </button>
              </div>

              <div v-if="isLoadingRoster" class="flex-1 flex justify-center items-center">
                <div class="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              </div>

              <div v-else class="p-3 overflow-y-auto flex-1 space-y-6">
                <div v-if="roundSetup.players.length > 0">
                  <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 px-2">In Your Group</p>
                  <div class="space-y-2">
                    <button v-for="p in roundSetup.players" :key="'sel-'+p.id" @click="togglePlayer(p)" class="w-full flex items-center justify-between p-4 rounded-2xl border-2 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                          {{ p.fname[0] }}{{ p.lname[0] }}
                        </div>
                        <p class="text-emerald-700 dark:text-emerald-400 font-bold text-sm">{{ p.fname }} {{ p.lname }}</p>
                      </div>
                      <div class="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                        <Icon name="mdi:check" class="text-white size-4" />
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Available</p>
                  <div class="space-y-2">
                    <button v-for="p in unselectedRoster" :key="'unsel-'+p.id" @click="togglePlayer(p)" class="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold uppercase relative">
                          {{ p.fname[0] }}{{ p.lname[0] }}
                          <div v-if="player?.prefs?.favPartners?.includes(p.id)" class="absolute -top-1 -right-1 bg-amber-400 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white dark:border-slate-900">
                            <Icon name="mdi:star" class="text-white size-2.5" />
                          </div>
                        </div>
                        <p class="text-slate-800 dark:text-slate-200 font-bold text-sm">{{ p.fname }} {{ p.lname }}</p>
                      </div>
                      <div class="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
import { collection, query, getDocs, where } from "firebase/firestore";
import { useData } from '~/stores/data';

const { player, isInitialLoading } = useAuth();
const { $db } = useNuxtApp();
const dataStore = useData();

const availableTees = ref([]);
const isPlayerPickerOpen = ref(false);
const isLoadingRoster = ref(false);
const availableRoster = ref([]);

const roundSetup = ref({
  isOpen: false,
  isLeague: false,
  leagueName: '',
  leagueId: null,
  eventId: null,
  data: { date: '', course: '', tees: '', holes: 18, games: [] },
  players: []
});

const getCurrentUserAsPlayer = () => ({
  id: player.value?.uid || player.value?.id,
  fname: player.value?.fname || '',
  lname: player.value?.lname || '',
  ghin: player.value?.ghin || ''
});

const myLeagues = computed(() => {
  const ids = player.value?.leagues || [];
  return Array.from(dataStore.leagues.values()).filter(lg => ids.includes(lg.id));
});

const otherLeagues = computed(() => {
  const ids = player.value?.leagues || [];
  return Array.from(dataStore.leagues.values()).filter(lg => !ids.includes(lg.id));
});

const courses = computed(() => Array.from(dataStore.courses.values()));

const getShortDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

watchEffect(() => {
  if (dataStore.activeLeagueEvent && !roundSetup.value.isOpen) {
    const ev = dataStore.activeLeagueEvent;
    const nr = ev.nextRound; // The specific calendar event
    
    roundSetup.value = {
      isOpen: true,
      isLeague: true,
      leagueName: ev.shortName || ev.name,
      leagueId: ev.id,
      eventId: nr?.id,
      data: {
        date: nr?.iso,
        // Robust fallback: specific round tees -> league default tees -> 'TBD'
        course: nr?.course || ev.course || 'Unknown Course',
        tees: nr?.tees || ev.tees || 'TBD', 
        holes: nr?.holes || 18,
        games: nr?.game || []
      },
      players: [getCurrentUserAsPlayer()]
    };
  }
});

watch(() => roundSetup.value.data.course, (newCourse) => {
  if (!newCourse) {
    availableTees.value = [];
    return;
  }
  const match = courses.value.find(c => c.name === newCourse);
  if (match && Array.isArray(match.tees)) {
    availableTees.value = [...match.tees];
  } else {
    availableTees.value = [];
  }
  const favTees = player.value?.prefs?.favTees;
  if (favTees && availableTees.value.includes(favTees)) {
    roundSetup.value.data.tees = favTees;
  } else if (!availableTees.value.includes(roundSetup.value.data.tees)) {
    roundSetup.value.data.tees = '';
  }
});

const unselectedRoster = computed(() => {
  const selectedIds = roundSetup.value.players.map(p => p.id);
  const pool = availableRoster.value.filter(p => !selectedIds.includes(p.id));
  return pool.sort((a, b) => {
    const aFav = player.value?.prefs?.favPartners?.includes(a.id) ? 1 : 0;
    const bFav = player.value?.prefs?.favPartners?.includes(b.id) ? 1 : 0;
    if (bFav !== aFav) return bFav - aFav;
    return (a.lname || '').toLowerCase().localeCompare((b.lname || '').toLowerCase());
  });
});

const fetchRoster = async () => {
  isLoadingRoster.value = true;
  try {
    let q = roundSetup.value.isLeague 
      ? query(collection($db, "players"), where("leagues", "array-contains", roundSetup.value.leagueId))
      : query(collection($db, "players"));
    
    const snap = await getDocs(q);
    availableRoster.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingRoster.value = false;
  }
};

const togglePlayer = (p) => {
  const idx = roundSetup.value.players.findIndex(s => s.id === p.id);
  if (idx > -1) {
    roundSetup.value.players.splice(idx, 1);
  } else if (roundSetup.value.players.length < 5) {
    roundSetup.value.players.push(p);
  } else {
    alert("Group is full (max 5 players).");
  }
};

watch(isPlayerPickerOpen, (isOpen) => {
  if (isOpen && availableRoster.value.length === 0) fetchRoster();
});

const openManualRound = async () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localToday = new Date(now - offset).toISOString().split('T')[0];
  availableRoster.value = []; 
  roundSetup.value = {
    isOpen: true,
    isLeague: false,
    leagueName: '',
    data: {
      date: localToday,
      course: player.value?.prefs?.favCourse || '',
      tees: player.value?.prefs?.favTees || '',
      holes: 18,
      games: []
    },
    players: [getCurrentUserAsPlayer()]
  };
};

// Replace the startRound function in index.vue
const startRound = async () => {
  if (!roundSetup.value.data.course || !roundSetup.value.data.tees) {
    alert("Please select a course and tees first!");
    return;
  }

  // 1. Look up the IDs from our Pinia store using the names
  const coursesArray = Array.from(dataStore.courses.values());
  const selectedCourse = coursesArray.find(c => c.name === roundSetup.value.data.course);
  const courseID = selectedCourse?.id || null;
  const teesID = selectedCourse?.tees?.[roundSetup.value.data.tees]?.id || null;

  // 2. Pass the enriched data to the store
  const roundId = await dataStore.startNewRound({
    course: roundSetup.value.data.course,
    courseID: courseID,
    tees: roundSetup.value.data.tees,
    teesID: teesID,
    holes: roundSetup.value.data.holes,
    leagueId: roundSetup.value.leagueId || null,
    eventId: roundSetup.value.eventId || null,
    type: roundSetup.value.isLeague ? roundSetup.value.leagueId : 'casual', // Set type
    players: roundSetup.value.players,
    date: roundSetup.value.data.date
  });

  roundSetup.value.isOpen = false;
  // router.push(`/rounds/${roundId}`);
};

onMounted(() => {
  if (player.value && !dataStore.isBooted) dataStore.bootstrap(player.value.leagues || []);
});

watch(() => player.value, (newVal) => {
  if (newVal && !dataStore.isBooted) dataStore.bootstrap(newVal.leagues || []);
}, { immediate: true });
</script>