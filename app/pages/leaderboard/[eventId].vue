<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
    
    <div v-if="loading" class="flex flex-col items-center justify-center pt-32 space-y-4">
      <Icon name="mdi:golf" class="size-12 text-emerald-600 animate-pulse opacity-50" />
      <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Fetching Scores...</p>
    </div>

    <template v-else-if="allPlayers.length > 0">
      <header class="bg-emerald-600 px-6 py-6 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex justify-between items-start">
            <button @click="router.back()" class="bg-white/20 p-2 rounded-xl backdrop-blur-md active:scale-95 transition-all">
              <Icon name="mdi:arrow-left" class="size-5" />
            </button>
            <div v-if="isLive" class="flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm">
              <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Live
            </div>
          </div>
          
          <h1 class="text-3xl font-black uppercase tracking-tighter leading-none mt-4">
            {{ leagueData?.shortName || leagueData?.name || 'Tournament' }}
          </h1>
          <p class="text-[10px] font-bold opacity-90 uppercase tracking-[0.2em] mt-2">
            {{ courseData?.name || 'Course' }} • {{ getShortDate(eventDate) }}
          </p>
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

      <div class="p-4 max-w-2xl mx-auto mt-2">
        <div class="flex justify-between px-4 mb-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <div class="flex gap-6"><span>Pos</span><span>Player</span></div>
          <div class="flex gap-4">
            <span v-if="activeTab !== 'Chicago Points'">Thru</span>
            <span>Score</span>
          </div>
        </div>

        <TransitionGroup name="shuffle-list" tag="div" class="space-y-3 relative">
          <div 
            v-for="(row, index) in sortedLeaderboard" :key="row.id"
            @click="activeTab !== 'Blind Best Ball' ? openPlayerModal(row) : null"
            class="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          >
            <div class="flex items-center gap-4">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center font-black text-sm z-10 relative', index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-500']">
                {{ getRank(index) }}
              </div>
              
              <div>
                <p class="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-tight">{{ row.name || `${row.fname} ${row.lname}` }}</p>
                <p v-if="activeTab === 'Net Score'" class="text-[9px] font-black text-slate-400 uppercase">CH: {{ isYearlyLeague ? Number(row.index).toFixed(3) : Math.round(row.index) }}</p>
              </div>
            </div>

            <div class="flex items-center gap-5">
              <span v-if="activeTab !== 'Chicago Points'" class="text-xs font-bold text-slate-400">
                {{ row.holesPlayed === (row.holes || 18) ? 'F' : (row.holesPlayed === 0 ? '-' : row.holesPlayed) }}
              </span>
              
              <div class="w-12 text-right">
                <span :class="row.scoreColor" class="font-black text-lg">{{ row.scoreDisplay }}</span>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </template>

    <ScorecardPlayerModal 
      v-if="selectedPlayer"
      :isOpen="isModalOpen" 
      :player="selectedPlayer" 
      :isYearly="isYearlyLeague"
      @close="isModalOpen = false"
    />
  </div>
</template>

<script setup>
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, collectionGroup } from "firebase/firestore";
import { calcPops, calcBirds, calcDeuces, calcChicago, calcNetRelative } from '~/utils/gameLogic';

const route = useRoute();
const router = useRouter();
const { $db } = useNuxtApp();

const eventId = route.params.eventId;
const loading = ref(true);
const isLive = ref(false);
const allPlayers = ref([]);
const activeTab = ref('Net Score');
const availableTabs = ref(['Net Score']);

const leagueData = ref(null);
const courseData = ref(null);
const eventDate = ref('');
const isYearlyLeague = ref(false);

// Modal State
const isModalOpen = ref(false);
const selectedPlayer = ref(null);

const processRoundsData = async (docs) => {
  let tempPlayers = [];
  let leagueId = null;
  let courseName = null;

  docs.forEach(d => {
    const data = d.data();
    if (!leagueId) leagueId = data.leagueId;
    if (!courseName) courseName = data.course;
    if (!eventDate.value) eventDate.value = data.date;
    
    // Support both live foursomes and individual archived rounds
    if (data.players) {
      data.players.forEach(p => tempPlayers.push({ ...p, scores: data.scores[p.id], holes: data.holes, type: data.type, courseSnapshot: data.courseSnapshot }));
    } else {
      tempPlayers.push({ id: d.id, ...data });
    }
  });

  if (leagueId) {
    const lSnap = await getDoc(doc($db, "leagues", leagueId));
    if (lSnap.exists()) {
      leagueData.value = lSnap.data();
      isYearlyLeague.value = leagueData.value.cadence === 'yearly';
      availableTabs.value = ['Net Score', ...(leagueData.value.yearly_games || [])];
    }
  }

  // --- 🛠️ THE NEW MATH ENGINE (Cleaned up with gameLogic.js) ---
  allPlayers.value = tempPlayers.map(p => {
    // 1. Get Course Specs from snapshot (Safe against course changes!)
    const teeData = p.courseSnapshot?.tees?.[p.tee] || {};
    const pars = teeData.pars || new Array(18).fill(4);
    const hnds = teeData.hnds || new Array(18).fill(18);

    // 2. Use shared utility to get pops
    const pops = calcPops(p.scores, hnds, p.index, isYearlyLeague.value);
    
    // 3. Use shared utility for Net Relative
    const { rel, holesPlayed } = calcNetRelative(p.scores, pops, pars);

    // 4. Calculate Games
    const birdsArr = calcBirds(p, {}, teeData, isYearlyLeague.value);
    const deucesArr = calcDeuces(p, teeData, isYearlyLeague.value);
    const chicagoArr = calcChicago(p, teeData);

    return {
      ...p,
      holesPlayed,
      netRel: rel,
      birds: birdsArr.reduce((a, b) => a + b, 0),
      deuces: deucesArr.reduce((a, b) => a + b, 0),
      chicago: chicagoArr.reduce((a, b) => a + b, 0),
      popsArr: pops // Still passing this for the modal
    };
  });

  loading.value = false;
};

// Data Fetching
onMounted(async () => {
  // Check Live first
  const qLive = query(collection($db, "live_rounds"), where("eventId", "==", eventId));
  onSnapshot(qLive, async (snap) => {
    if (!snap.empty) {
      isLive.value = true;
      processRoundsData(snap.docs);
    } else {
      // If no live rounds, check archive
      const qArchive = query(collectionGroup($db, "rounds"), where("eventId", "==", eventId));
      const archSnap = await getDocs(qArchive);
      if (!archSnap.empty) processRoundsData(archSnap.docs);
      else loading.value = false;
    }
  });
});

const sortedLeaderboard = computed(() => {
  const players = [...allPlayers.value];
  const tab = activeTab.value;

  return players.map(p => {
    let scoreVal = 0;
    let display = '';
    let color = 'text-slate-800 dark:text-white';

    if (tab === 'Net Score') {
      scoreVal = p.netRel;
      display = p.netRel === 0 ? 'E' : (p.netRel > 0 ? `+${p.netRel}` : p.netRel);
      if (p.netRel < 0) color = 'text-red-500';
      if (p.netRel > 0) color = 'text-blue-500';
    } else if (tab === 'Chicago Points') {
      scoreVal = -p.chicago; // Invert for sorting
      display = p.chicago > 0 ? `+${p.chicago}` : p.chicago;
      color = 'text-amber-500';
    } else {
      scoreVal = -p[tab.toLowerCase()];
      display = p[tab.toLowerCase()];
      color = 'text-emerald-500';
    }

    return { ...p, scoreVal, scoreDisplay: display, scoreColor: color };
  }).sort((a, b) => a.scoreVal - b.scoreVal);
});

const getRank = (index) => {
  if (index === 0) return '1';
  const isTie = sortedLeaderboard.value[index].scoreVal === sortedLeaderboard.value[index - 1].scoreVal;
  return isTie ? '-' : (index + 1).toString();
};

const openPlayerModal = (p) => {
  selectedPlayer.value = p;
  isModalOpen.value = true;
};

const getShortDate = (iso) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
</script>