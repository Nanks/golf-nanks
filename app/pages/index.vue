<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-2xl mx-auto space-y-8 pb-24">
    
    <div v-if="isInitialLoading || !dataStore.isBooted" class="p-20 text-center animate-pulse text-emerald-600 font-bold uppercase tracking-widest text-sm">
      Syncing...
    </div>
    
    <div v-else class="space-y-8">
      <section v-if="player" class="space-y-6">
        
        <div class="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
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

        <div class="space-y-3">
          <button v-if="activeLiveRound" @click="router.push(`/rounds/${activeLiveRound.id}`)" class="w-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800/50 active:scale-[0.98] transition-all shadow-sm">
            <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            Resume: {{ activeLiveRound.course }}
          </button>

          <button v-else-if="dataStore.activeLeagueEvent" @click="openLeagueRound" class="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-emerald-600/20">
            <Icon name="mdi:trophy" class="size-4" /> Start {{ dataStore.activeLeagueEvent.shortName || dataStore.activeLeagueEvent.name }}
          </button>

          <button @click="openManualRound" class="w-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-slate-200 dark:hover:bg-slate-800">
            <Icon name="mdi:golf-tee" class="size-4 text-emerald-600" /> Start Casual Round
          </button>
        </div>

        <div v-if="activeEvents.length > 0" class="pt-2">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Live Action</h3>
          <div class="grid gap-3">
            <button 
              v-for="ev in activeEvents" :key="ev.eventId"
              @click="router.push(`/leaderboard/${ev.eventId}`)"
              class="w-full flex items-center justify-between p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all text-white group relative overflow-hidden"
            >
              <Icon name="mdi:trophy" class="absolute -right-4 -bottom-4 size-24 opacity-10 pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div class="flex items-center gap-4 relative z-10">
                <div class="flex items-center justify-center w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner relative">
                  <div class="absolute inset-0 bg-white/20 rounded-2xl animate-ping opacity-40"></div>
                  <Icon name="mdi:format-list-numbered" class="size-6" />
                </div>
                
                <div class="text-left">
                  <div class="flex items-center gap-2 mb-0.5">
                    <p class="font-black uppercase tracking-tight text-lg leading-none">{{ ev.leagueName }}</p>
                    <span class="bg-amber-400 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded-[4px] tracking-widest animate-pulse shadow-sm">LIVE</span>
                  </div>
                  <p class="text-[10px] font-bold opacity-80 uppercase tracking-widest">{{ ev.course }}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 relative z-10 opacity-50">
                <span class="text-[10px] font-black uppercase tracking-widest">View</span>
                <Icon name="mdi:chevron-right" class="size-5" />
              </div>
            </button>
          </div>
        </div>

        <div v-if="myLeagues.length > 0" class="pt-2">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">My Active Leagues</h3>
          <div class="grid gap-3">
            <NuxtLink v-for="ml in myLeagues" :key="ml.id" :to="`/leagues/${ml.id}/menu`" class="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-50 transition-all">
              <div class="flex flex-col gap-2.5 w-full pr-4">
                <span class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm">{{ ml.shortName || ml.name }}</span>
                <div v-if="ml.nextRound" class="flex flex-wrap items-center gap-2">
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <Icon name="mdi:calendar-arrow-right" class="size-3" /> {{ getShortDate(ml.nextRound.iso) }}
                  </div>
                </div>
              </div>
              <div class="w-8 h-8 flex-shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-xs">→</div>
            </NuxtLink>
          </div>
        </div>

        <div v-if="otherLeagues.length > 0" class="pt-2">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Other Available Leagues</h3>
          <div class="grid gap-3">
            <NuxtLink v-for="league in otherLeagues" :key="league.id" :to="`/leagues/${league.id}/menu`" class="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all">
              <div class="flex flex-col gap-2.5 w-full pr-4">
                <span class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm">{{ league.shortName || league.name }}</span>
                <div v-if="league.nextRound" class="flex flex-wrap items-center gap-2">
                  <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <Icon name="mdi:calendar-arrow-right" class="size-3" /> {{ getShortDate(league.nextRound.iso) }}
                  </div>
                </div>
              </div>
              <div class="w-8 h-8 flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">→</div>
            </NuxtLink>
          </div>
        </div>

      </section>
    </div>

    <RoundSetupModal v-model="roundConfig" :courses="courses" @toggle-player="togglePlayer" @open-picker="showPlayerPicker = true" @start="startRound" />
    <PlayerPicker v-model:isOpen="showPlayerPicker" :selectedPlayers="roundConfig.players" :isLeague="roundConfig.isLeague" :leagueId="roundConfig.leagueId" @toggle="togglePlayer" />
  </div>
</template>

<script setup>
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useData } from '~/stores/data';
import { calculateLeagueHandicap, calcUSGACourseHandicap } from '~/utils/handicap';

const { player, isInitialLoading } = useAuth();
const { $db } = useNuxtApp();
const dataStore = useData();
const router = useRouter();

const showPlayerPicker = ref(false);
const activeLiveRound = ref(null);
const activeEvents = ref([]); // NEW
let activeRoundUnsub = null;

const roundConfig = ref({
  isOpen: false, isLeague: false, isYearly: false, leagueName: '', leagueId: null, eventId: null,
  data: { date: '', course: '', tees: '', holes: 18, games: [] },
  players: []
});

const courses = computed(() => Array.from(dataStore.courses.values()));
const myLeagues = computed(() => Array.from(dataStore.leagues.values()).filter(lg => (player.value?.leagues || []).includes(lg.id)));
const otherLeagues = computed(() => Array.from(dataStore.leagues.values()).filter(lg => !(player.value?.leagues || []).includes(lg.id)));
const getShortDate = (iso) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const getDefaultTee = (p, courseName, isLeague, globalTee) => {
  if (isLeague && globalTee) return globalTee; 
  if (courseName) {
    const course = courses.value.find(c => c.name === courseName);
    if (course && course.tee_types) {
      const playerTeeType = p.tee_type || 'mens'; 
      return course.tee_types[playerTeeType] || globalTee || ''; 
    }
  }
  return globalTee || ''; 
};

const getCurrentUserAsPlayer = (courseName = '', isLeague = false, globalTee = '') => {
  const p = { 
    id: player.value?.uid || player.value?.id, 
    fname: player.value?.fname || '', 
    lname: player.value?.lname || '', 
    ghin: player.value?.ghin || '',
    tee_type: player.value?.tee_type || 'mens'
  };
  p.tee = getDefaultTee(p, courseName, isLeague, globalTee);
  return p;
};

// UPGRADED WATCHER
watch(() => player.value, (newVal) => {
  if (newVal) {
    if (!activeRoundUnsub) {
      // Listen to ALL live rounds to find tournaments + current user's active round
      const q = query(collection($db, "live_rounds")); 
      activeRoundUnsub = onSnapshot(q, (snap) => {
        let foundMyRound = null;
        const eventsMap = new Map();

        snap.docs.forEach(doc => {
          const d = doc.data();
          
          // 1. Check if user is in this round
          if (d.players && d.players.some(p => p.id === (newVal.uid || newVal.id))) {
            foundMyRound = { id: doc.id, ...d };
          }

          // 2. Map Live Events for Leaderboards
          if (d.eventId && d.leagueId) {
            if (!eventsMap.has(d.eventId)) {
              const league = dataStore.leagues.get(d.leagueId);
              eventsMap.set(d.eventId, {
                eventId: d.eventId,
                leagueName: league?.shortName || league?.name || 'Tournament',
                course: d.course
              });
            }
          }
        });
        
        activeLiveRound.value = foundMyRound;
        activeEvents.value = Array.from(eventsMap.values());
      });
    }
  }
}, { immediate: true });

onUnmounted(() => { if (activeRoundUnsub) activeRoundUnsub(); });

watch(() => dataStore.activeLeagueEvent, (ev) => {
  if (ev && !roundConfig.value.isOpen && !activeLiveRound.value) openLeagueRound();
});

watch(() => roundConfig.value.data.course, (newCourse) => {
  if (!newCourse) return;
  const match = courses.value.find(c => c.name === newCourse);
  const tees = match?.tees ? (typeof match.tees === 'object' && !Array.isArray(match.tees) ? Object.keys(match.tees) : match.tees) : [];
  const favTees = player.value?.prefs?.favTees;
  if (favTees && tees.includes(favTees) && !roundConfig.value.data.tees) roundConfig.value.data.tees = favTees;
  else if (roundConfig.value.data.tees && !tees.includes(roundConfig.value.data.tees)) roundConfig.value.data.tees = '';
  roundConfig.value.players = roundConfig.value.players.map(p => ({
    ...p,
    tee: getDefaultTee(p, newCourse, roundConfig.value.isLeague, roundConfig.value.data.tees)
  }));
});

const openLeagueRound = () => {
  const ev = dataStore.activeLeagueEvent;
  if (!ev) return;
  const nr = ev.nextRound;
  const course = nr?.course || ev.course || '';
  const globalTee = nr?.tees || ev.tees || '';
  const activeLeague = dataStore.leagues.get(ev.id);
  const isYearly = activeLeague?.cadence === 'yearly';
  roundConfig.value = {
    isOpen: true, isLeague: true, isYearly: isYearly, leagueName: ev.shortName || ev.name, leagueId: ev.id, eventId: nr?.id,
    data: { date: nr?.iso, course: course, tees: globalTee, holes: nr?.holes || 18, games: nr?.game || [] },
    players: [getCurrentUserAsPlayer(course, true, globalTee)]
  };
};

const openManualRound = () => {
  const localToday = new Date(new Date() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const course = player.value?.prefs?.favCourse || '';
  const globalTee = player.value?.prefs?.favTees || '';
  roundConfig.value = {
    isOpen: true, isLeague: false, isYearly: false, leagueName: '', leagueId: null, eventId: null,
    data: { date: localToday, course: course, tees: globalTee, holes: 18, games: [] },
    players: [getCurrentUserAsPlayer(course, false, globalTee)]
  };
};

const togglePlayer = (p) => {
  const idx = roundConfig.value.players.findIndex(s => s.id === p.id);
  if (idx > -1) {
    roundConfig.value.players.splice(idx, 1);
  } else if (roundConfig.value.players.length < 5) {
    const newPlayer = { ...p, tee_type: p.tee_type || 'mens' };
    newPlayer.tee = getDefaultTee(newPlayer, roundConfig.value.data.course, roundConfig.value.isLeague, roundConfig.value.data.tees);
    roundConfig.value.players.push(newPlayer);
  }
};

const startRound = async () => {
  if (!roundConfig.value.data.course) return alert("Select a course!");
  const selectedCourse = courses.value.find(c => c.name === roundConfig.value.data.course);
  const activeLeague = roundConfig.value.leagueId ? dataStore.leagues.get(roundConfig.value.leagueId) : null;
  const isYearly = activeLeague?.cadence === 'yearly';
  const processedPlayers = await Promise.all(roundConfig.value.players.map(async (p) => {
    let playingHcp = 0;
    let rawGhin = parseFloat(p.ghin) || 0;
    const playerTeeName = p.tee || roundConfig.value.data.tees;
    const playerTeeData = selectedCourse?.tees?.[playerTeeName];
    if (isYearly && roundConfig.value.leagueId) {
      const { hcp } = await calculateLeagueHandicap($db, p.id, roundConfig.value.leagueId, rawGhin, dataStore.courses);
      playingHcp = parseFloat(hcp);
    } else {
      if (playerTeeData) {
        playingHcp = calcUSGACourseHandicap(rawGhin, playerTeeData.slope || 113, playerTeeData.rating || 72, playerTeeData.par || 72);
      } else {
        playingHcp = Math.round(rawGhin);
      }
    }
    return { ...p, ghin: rawGhin, index: playingHcp, tee: playerTeeName };
  }));
  const roundId = await dataStore.startNewRound({
    course: roundConfig.value.data.course, courseID: selectedCourse?.id || null,
    courseSnapshot: { tees: selectedCourse?.tees || {} },
    tees: roundConfig.value.data.tees, holes: roundConfig.value.data.holes, 
    leagueId: roundConfig.value.leagueId || null, eventId: roundConfig.value.eventId || null, 
    type: roundConfig.value.isLeague ? roundConfig.value.leagueId : 'casual',
    players: processedPlayers, date: roundConfig.value.data.date
  });
  roundConfig.value.isOpen = false;
  router.push(`/rounds/${roundId}`);
};
</script>