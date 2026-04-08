<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
    
    <div v-if="loading" class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:golf" class="size-12 text-emerald-600 animate-pulse opacity-50" />
      <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Fetching Scores...</p>
    </div>

    <template v-else-if="allPlayers.length > 0">
      <header class="bg-emerald-600 px-6 py-8 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex justify-between items-start mb-2">
            <button @click="router.back()" class="bg-white/20 p-2 rounded-xl backdrop-blur-md active:scale-95 transition-all">
              <Icon name="mdi:arrow-left" class="size-5" />
            </button>
            <div v-if="isLive" class="flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Live
            </div>
            <div v-else class="bg-slate-900/50 text-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm">
              Final
            </div>
          </div>
          
          <h1 class="text-3xl font-black uppercase tracking-tighter leading-none mt-4">{{ leagueData?.shortName || leagueData?.name || 'Tournament' }}</h1>
          <p class="text-[10px] font-bold opacity-90 uppercase tracking-[0.2em] mt-2">
            {{ courseData?.name || 'Course' }} • {{ getShortDate(eventDate) }}
          </p>
          <p class="text-xs font-black mt-1 opacity-80 uppercase">{{ allPlayers.length }} Players</p>
        </div>
        <Icon name="mdi:trophy" class="absolute -right-6 -bottom-6 size-40 opacity-10 pointer-events-none" />
      </header>

      <div class="sticky top-0 z-40 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
        <div class="flex p-2 gap-2">
          <button 
            v-for="tab in availableTabs" :key="tab"
            @click="activeTab = tab"
            :class="activeTab === tab ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'"
            class="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <div class="p-4 max-w-2xl mx-auto mt-2 relative">
        
        <div v-if="activeTab === 'Blind Best Ball' && isLive" class="mb-4 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800 shadow-sm">
          <Icon name="mdi:shuffle-variant" class="size-5 animate-pulse" />
          Live Shuffle: Teams lock when round is archived
        </div>

        <div class="flex justify-between px-4 mb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <div class="flex gap-6"><span>Pos</span><span>Player</span></div>
          <div class="flex gap-4">
            <span v-if="activeTab === 'Net Score' || activeTab === 'Blind Best Ball'">Thru</span>
            <span>Score</span>
          </div>
        </div>

        <TransitionGroup name="shuffle-list" tag="div" class="space-y-3 relative">
          <div 
            v-for="(row, index) in sortedLeaderboard" :key="row.id"
            @click="activeTab !== 'Blind Best Ball' ? openPlayerModal(row) : null"
            :class="activeTab !== 'Blind Best Ball' ? 'cursor-pointer active:scale-[0.98]' : ''"
            class="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all"
          >
            <div class="flex items-center gap-4">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-colors z-10 relative', index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-500']">
                {{ getRank(index) }}
              </div>
              
              <div>
                <template v-if="activeTab === 'Blind Best Ball'">
                  <p class="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-tight">{{ row.name }}</p>
                  <p class="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Blind Pair</p>
                </template>
                <template v-else>
                  <p class="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-tight">{{ row.fname }} {{ row.lname }}</p>
                  <p v-if="activeTab === 'Net Score'" class="text-[9px] font-black text-slate-400 uppercase">CH: {{ isYearlyLeague ? Number(row.index).toFixed(3) : Math.round(row.index) }}</p>
                </template>
              </div>
            </div>

            <div class="flex items-center gap-5 relative z-10">
              <span v-if="activeTab === 'Net Score' || activeTab === 'Blind Best Ball'" class="text-xs font-bold text-slate-400">
                {{ row.holesPlayed === (row.holes || 18) ? 'F' : (row.holesPlayed === 0 ? '-' : row.holesPlayed) }}
              </span>
              
              <div class="w-12 text-right">
                <span v-if="activeTab === 'Net Score' || activeTab === 'Blind Best Ball'" :class="row.netRelColor" class="font-black text-lg transition-colors">{{ row.netRelStr }}</span>
                <span v-else-if="activeTab === 'Chicago Points'" :class="row.chicago > 0 ? 'text-amber-500' : 'text-slate-500'" class="font-black text-lg transition-colors">{{ row.chicago > 0 ? '+' : '' }}{{ row.chicago }}</span>
                <span v-else-if="activeTab === 'Gross Skins' || activeTab === 'Net Skins'" class="font-black text-lg text-emerald-600 transition-colors">{{ row.skins }}</span>
                <span v-else class="font-black text-lg text-slate-800 dark:text-white transition-colors">{{ row[activeTab.toLowerCase()] || 0 }}</span>
              </div>
            </div>
          </div>
        </TransitionGroup>
        
        <div v-if="sortedLeaderboard.length === 0" class="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest">
          No data for this game yet.
        </div>
      </div>
    </template>
    
    <div v-else class="flex flex-col items-center justify-center pt-32 space-y-4 px-6 text-center">
      <Icon name="mdi:alert-circle-outline" class="size-12 text-slate-400" />
      <p class="text-sm font-black text-slate-500 uppercase tracking-widest">No Leaderboard Found</p>
      <button @click="router.push('/')" class="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-sm">Go Home</button>
    </div>

    <ScorecardPlayerModal 
      :isOpen="isModalOpen" 
      :player="selectedPlayer" 
      :courseName="courseData?.name || 'Course'"
      :isYearly="isYearlyLeague"
      :pars="selectedPlayer?.courseSnapshot?.tees?.[selectedPlayer?.tee]?.pars || new Array(18).fill(4)"
      @close="isModalOpen = false"
    />
  </div>
</template>

<script setup>
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, collectionGroup } from "firebase/firestore";
import { calcBirds, calcDeuces, calcChicago } from '~/utils/gameLogic';

const route = useRoute();
const router = useRouter();
const { $db } = useNuxtApp();

const eventId = route.params.eventId;
const loading = ref(true);
const isLive = ref(false);
const allPlayers = ref([]);

// Modal State
const isModalOpen = ref(false);
const selectedPlayer = ref(null);

const activeTab = ref('Net Score');
const availableTabs = ref(['Net Score']);

const leagueData = ref(null);
const courseData = ref(null);
const eventDate = ref('');
const isYearlyLeague = ref(false);

// --- 🎲 DETERMINISTIC RANDOMIZER ---
const activeSeed = ref(eventId);
let shuffleInterval = null;

const getSeededRandom = (seedStr) => {
  let h = 0;
  for(let i = 0; i < seedStr.length; i++) h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  return function() {
    h = Math.imul(h ^ h >>> 15, h | 1);
    h ^= h + Math.imul(h ^ h >>> 7, h | 61);
    return ((h ^ h >>> 14) >>> 0) / 4294967296;
  }
};

const generateBlindTeams = (players, seed, isMixed) => {
  const rng = getSeededRandom(seed);
  const shuffle = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  let teams = [];
  if (isMixed) {
    let guys = shuffle(players.filter(p => !p.tee_type || ['mens', 'senior'].includes(p.tee_type.toLowerCase())));
    let gals = shuffle(players.filter(p => p.tee_type?.toLowerCase() === 'ladies'));
    const maxLen = Math.max(guys.length, gals.length);
    for(let i=0; i < maxLen; i++) {
      const p1 = guys[i % guys.length];
      const p2 = gals[i % gals.length];
      if(p1 && p2) teams.push([p1, p2]); 
    }
  } else {
    let pool = shuffle(players);
    for (let i = 0; i < pool.length; i += 2) {
      if (i + 1 < pool.length) teams.push([pool[i], pool[i+1]]);
      else teams.push([pool[i], pool[0]]);
    }
  }
  return teams;
};

// --- 🎲 SHUFFLE CONTROLLER ---
watch([activeTab, isLive], ([newTab, newIsLive]) => {
  if (newTab === 'Blind Best Ball' && newIsLive) {
    if (!shuffleInterval) {
      shuffleInterval = setInterval(() => {
        activeSeed.value = Math.random().toString(36).substring(7); 
      }, 4000); 
    }
  } else {
    if (shuffleInterval) {
      clearInterval(shuffleInterval);
      shuffleInterval = null;
    }
    activeSeed.value = eventId; 
  }
}, { immediate: true });

onUnmounted(() => {
  if (shuffleInterval) clearInterval(shuffleInterval);
});

// --- ENGINE ---
const calculatePopsArray = (indexVal, hnds, holes) => {
  const arr = new Array(holes).fill(0);
  if (!hnds) return arr;
  
  const idx = isYearlyLeague.value ? parseFloat(indexVal) || 0 : Math.round(parseFloat(indexVal) || 0);
  const isPlus = idx < 0;
  const absIdx = Math.abs(idx);
  const baseIdx = Math.floor(absIdx);
  const remainder = absIdx - baseIdx;
  const loops = Math.floor(baseIdx / 18);
  const remBase = baseIdx % 18;
  
  for (let i = 0; i < holes; i++) {
      const hHcp = hnds[i];
      if (!hHcp) continue;
      let pop = loops;
      if (!isPlus) {
        if (hHcp <= remBase) pop += 1;
        if (remainder > 0 && hHcp === remBase + 1) pop += remainder;
        arr[i] = pop;
      } else {
        if (hHcp > 18 - remBase) pop += 1;
        if (remainder > 0 && hHcp === 18 - remBase) pop += remainder;
        arr[i] = -pop; 
      }
  }
  return arr;
};

const processRoundsData = async (docs) => {
  let tempPlayers = [];
  let leagueId = null;
  let courseName = null;
  let gamesToPlay = [];

  // Extract Players
  docs.forEach(d => {
    const data = d.data();
    if (!leagueId) leagueId = data.leagueId;
    if (!courseName) courseName = data.course;
    if (!eventDate.value) eventDate.value = data.date;
    
    if (data.players) {
      data.players.forEach(p => tempPlayers.push({ ...p, scores: data.scores[p.id], holes: data.holes, type: data.type, courseSnapshot: data.courseSnapshot }));
    } else {
      tempPlayers.push({ id: d.ref.parent.parent.id, fname: data.fname || 'Player', lname: '', index: data.index, tee: data.tees, scores: data.scores, holes: data.holes, type: data.type, courseSnapshot: data.courseSnapshot });
    }
  });

  // Fetch League & Course Metadata
  if (leagueId) {
    const lSnap = await getDoc(doc($db, "leagues", leagueId));
    if (lSnap.exists()) {
      leagueData.value = lSnap.data();
      isYearlyLeague.value = leagueData.value.cadence === 'yearly' || leagueData.value.yearly_games !== undefined;
      gamesToPlay = isYearlyLeague.value ? (leagueData.value.yearly_games || []) : (docs[0]?.data().game || []);
    }
  }
  
  if (courseName) {
    const cSnap = await getDocs(query(collection($db, "courses"), where("name", "==", courseName)));
    if (!cSnap.empty) courseData.value = { id: cSnap.docs[0].id, ...cSnap.docs[0].data() };
  }

  // Setup Tabs
  let tabs = ['Net Score'];
  if (gamesToPlay.includes('Chicago Points') || gamesToPlay.includes('Modified Chicago')) tabs.push('Chicago Points');
  if (isYearlyLeague.value) { tabs.push('Birds'); tabs.push('Deuces'); }
  if (gamesToPlay.includes('Gross Skins')) tabs.push('Gross Skins');
  if (gamesToPlay.includes('Net Skins')) tabs.push('Net Skins');
  if (gamesToPlay.includes('Blind Best Ball') && !isYearlyLeague.value) tabs.push('Blind Best Ball');
  availableTabs.value = tabs;

  const calData = { type: tempPlayers[0]?.type };
  const playModChicago = gamesToPlay.includes('Modified Chicago');
  const sumArray = (arr) => arr.reduce((sum, val) => sum + (Number(val) || 0), 0);

  // Math Engine
  allPlayers.value = tempPlayers.map(p => {
    const defaultTee = { pars: new Array(p.holes || 18).fill(4), hnds: new Array(p.holes || 18).fill(18) };
    const tData = p.courseSnapshot?.tees?.[p.tee] || courseData.value?.tees?.[p.tee] || (courseData.value?.tees ? Object.values(courseData.value.tees)[0] : null) || defaultTee;
    const pars = tData.pars;
    const hnds = tData.hnds;
    const pRound = { scores: p.scores, index: p.index };
    const popsArr = calculatePopsArray(p.index, hnds, p.holes);
    
    let rel = 0; let holesPlayed = 0;
    p.scores.forEach((score, index) => {
      if (score > 0) {
        holesPlayed++;
        rel += ((score - popsArr[index]) - pars[index]);
      }
    });

    let netRelStr = '';
    if (holesPlayed === 0) netRelStr = 'E';
    else if (isYearlyLeague.value) netRelStr = Math.abs(rel) < 0.0001 ? 'E' : (rel > 0 ? `+${rel.toFixed(3)}` : rel.toFixed(3));
    else netRelStr = Math.round(rel) === 0 ? 'E' : (Math.round(rel) > 0 ? `+${Math.round(rel)}` : Math.round(rel).toString());

    let netRelColor = 'text-slate-800 dark:text-white';
    if (holesPlayed > 0 && rel < -0.0001) netRelColor = 'text-red-500';
    if (holesPlayed > 0 && rel > 0.0001) netRelColor = 'text-blue-500 dark:text-blue-400';

    const hasData = tData && tData.hnds && tData.pars;
    const birdsArr = (isYearlyLeague.value && hasData) ? calcBirds(pRound, calData, tData) : new Array(p.holes || 18).fill(0);
    const deucesArr = (isYearlyLeague.value && hasData) ? calcDeuces(pRound, tData) : new Array(p.holes || 18).fill(0);
    const chicagoArr = (tabs.includes('Chicago Points') && hasData) ? calcChicago(pRound, tData, playModChicago) : new Array(p.holes || 18).fill(0);

    return {
      ...p, holesPlayed, netRel: rel, netRelStr, netRelColor, popsArr, 
      birdsArr, deucesArr, chicagoArr, 
      birds: sumArray(birdsArr), 
      deuces: sumArray(deucesArr),
      chicago: sumArray(chicagoArr),
      skins: 0 
    };
  });

  // Calculate Skins
  if (tabs.includes('Gross Skins') || tabs.includes('Net Skins')) {
    const isNet = tabs.includes('Net Skins');
    const holes = allPlayers.value[0]?.holes || 18;
    for (let i = 0; i < holes; i++) {
      let scoresOnHole = [];
      allPlayers.value.forEach(p => {
        if (p.scores[i] > 0) scoresOnHole.push({ id: p.id, score: isNet ? (p.scores[i] - p.popsArr[i]) : p.scores[i] });
      });
      if (scoresOnHole.length > 0) {
        const minScore = Math.min(...scoresOnHole.map(s => s.score));
        const winners = scoresOnHole.filter(s => s.score === minScore);
        if (winners.length === 1) {
          const winnerIndex = allPlayers.value.findIndex(p => p.id === winners[0].id);
          if (winnerIndex > -1) allPlayers.value[winnerIndex].skins += 1;
        }
      }
    }
  }

  loading.value = false;
};

// Data Fetching Strategy
onMounted(async () => {
  const qLive = query(collection($db, "live_rounds"), where("eventId", "==", eventId));
  onSnapshot(qLive, async (snap) => {
    if (!snap.empty) {
      isLive.value = true;
      processRoundsData(snap.docs);
    } else if (isLive.value === false) { 
      const qArchive = query(collectionGroup($db, "rounds"), where("eventId", "==", eventId));
      const archSnap = await getDocs(qArchive);
      if (!archSnap.empty) {
        isLive.value = false;
        processRoundsData(archSnap.docs);
      } else {
        loading.value = false;
      }
    }
  });
});

// --- REACTIVE BLIND TEAMS ---
const computedBlindTeams = computed(() => {
  if (!availableTabs.value.includes('Blind Best Ball') || allPlayers.value.length === 0) return [];
  const isMixed = leagueData.value?.isMixed || false;
  const rawTeams = generateBlindTeams(allPlayers.value, activeSeed.value, isMixed);

  return rawTeams.map((team) => {
    const [p1, p2] = team;
    let teamNetRel = 0; let holesPlayed = 0;
    const holesCount = p1.holes || 18;

    for (let i = 0; i < holesCount; i++) {
      const p1Score = p1.scores[i];
      const p2Score = p2 ? p2.scores[i] : 0;
      
      const p1Net = p1Score > 0 ? p1Score - (p1.popsArr[i] || 0) : null;
      const p2Net = p2Score > 0 ? p2Score - (p2.popsArr[i] || 0) : null;
      const par = courseData.value?.tees?.[p1.tee]?.pars?.[i] || 4; 

      if (p1Net !== null || p2Net !== null) {
        holesPlayed++;
        let bestNet = null;
        if (p1Net !== null && p2Net !== null) bestNet = Math.min(p1Net, p2Net);
        else if (p1Net !== null) bestNet = p1Net;
        else bestNet = p2Net;
        teamNetRel += (bestNet - par);
      }
    }

    const teamNetRelStr = Math.round(teamNetRel) === 0 ? 'E' : (Math.round(teamNetRel) > 0 ? `+${Math.round(teamNetRel)}` : Math.round(teamNetRel).toString());
    const teamColor = holesPlayed > 0 ? (teamNetRel < 0 ? 'text-red-500' : (teamNetRel > 0 ? 'text-blue-500 dark:text-blue-400' : 'text-slate-800 dark:text-white')) : 'text-slate-800 dark:text-white';

    return {
      id: `team-${p1.id}-${p2 ? p2.id : 'solo'}`,
      name: p2 ? `${p1.fname} & ${p2.fname}` : `${p1.fname} (Solo)`,
      holesPlayed, netRel: teamNetRel, netRelStr: teamNetRelStr, netRelColor: teamColor
    };
  });
});

// View Sorting Output
const sortedLeaderboard = computed(() => {
  if (activeTab.value === 'Blind Best Ball') return [...computedBlindTeams.value].sort((a, b) => a.netRel - b.netRel);
  
  const players = [...allPlayers.value];
  if (activeTab.value === 'Net Score') return players.sort((a, b) => a.netRel - b.netRel);
  if (activeTab.value === 'Chicago Points') return players.sort((a, b) => b.chicago - a.chicago);
  if (activeTab.value === 'Birds') return players.sort((a, b) => b.birds - a.birds);
  if (activeTab.value === 'Deuces') return players.sort((a, b) => b.deuces - a.deuces);
  if (activeTab.value === 'Gross Skins' || activeTab.value === 'Net Skins') {
    return players.filter(p => p.skins > 0).sort((a, b) => b.skins - a.skins);
  }
  return players;
});

const getRank = (index) => {
  if (index === 0) return '1';
  const curr = sortedLeaderboard.value[index];
  const prev = sortedLeaderboard.value[index - 1];
  let isTie = false;
  if (activeTab.value === 'Net Score' || activeTab.value === 'Blind Best Ball') isTie = curr.netRel === prev.netRel;
  else if (activeTab.value === 'Chicago Points') isTie = curr.chicago === prev.chicago;
  else if (activeTab.value === 'Birds') isTie = curr.birds === prev.birds;
  else if (activeTab.value === 'Deuces') isTie = curr.deuces === prev.deuces;
  else if (activeTab.value === 'Gross Skins' || activeTab.value === 'Net Skins') isTie = curr.skins === prev.skins;
  return isTie ? '-' : (index + 1).toString();
};

const getShortDate = (iso) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const openPlayerModal = (p) => {
  selectedPlayer.value = p;
  isModalOpen.value = true;
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }

/* Shuffle Animation CSS */
.shuffle-list-move,
.shuffle-list-enter-active,
.shuffle-list-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.shuffle-list-enter-from,
.shuffle-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.shuffle-list-leave-active {
  position: absolute;
  width: calc(100% - 2rem);
}
</style>