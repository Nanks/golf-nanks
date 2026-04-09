<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
    <header class="py-6 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm flex justify-between items-end">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/menu`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors flex items-center gap-1">
          <Icon name="mdi:arrow-left" class="size-3" /> Back to Menu
        </NuxtLink>
        <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-2 leading-none">League Roster</h1>
      </div>

      <button 
        v-if="isAdmin" 
        @click="isAddModalOpen = true"
        class="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition flex items-center gap-2"
      >
        <Icon name="mdi:plus" class="size-4" /> Add Player
      </button>
    </header>

    <div class="px-4 mt-6 max-w-2xl mx-auto">
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 6" :key="i" class="h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse rounded-2xl"></div>
      </div>

      <div v-else class="space-y-3">
        <div v-for="player in sortedRoster" :key="player.id" class="flex flex-col group">
          
          <div class="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center z-10 relative shadow-sm transition-all">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400 uppercase border border-slate-200 dark:border-slate-700">
                {{ player.fname[0] }}{{ player.lname[0] }}
              </div>
              
              <div>
                <p class="font-bold uppercase text-sm tracking-tight text-slate-800 dark:text-slate-100">
                  {{ player.fname }} {{ player.lname }}
                </p>
                <div class="flex items-center gap-3 text-[10px] font-bold uppercase mt-1">
                  <span class="text-slate-400">GHIN: {{ player.ghin || 'NH' }}</span>
                  <button 
                    v-if="player.leagueHcp !== undefined" 
                    @click="activeAuditId = activeAuditId === player.id ? null : player.id"
                    class="text-emerald-600 hover:text-emerald-500 flex items-center gap-1 transition"
                  >
                    L-HCP: {{ Number(player.leagueHcp).toFixed(3) }}
                    <Icon :name="activeAuditId === player.id ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="size-3" />
                  </button>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div v-if="player.isAdmin" class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 rounded text-[8px] font-black text-emerald-600 uppercase border border-emerald-200/50 dark:border-emerald-800/50">
                Admin
              </div>
              
              <button 
                v-if="isAdmin && !player.isSuperAdmin" 
                @click="confirmRemove(player)"
                class="p-2 text-slate-300 hover:text-red-500 transition-colors active:scale-90"
              >
                <Icon name="mdi:trash-can-outline" class="size-5" />
              </button>
            </div>
          </div>

          <Transition name="expand">
            <div v-if="activeAuditId === player.id" class="mx-3 -mt-2 pt-6 pb-4 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-b-2xl border-x border-b border-slate-200 dark:border-slate-800">
               <div class="flex justify-between items-center mb-3">
                 <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent League History</p>
                 <span class="text-[9px] font-black text-emerald-600 uppercase">Best 4 Counted</span>
               </div>
               
               <div class="grid grid-cols-2 gap-2">
                 <div v-for="round in player.auditRounds" :key="round.iso" 
                      :class="round.isBest ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'"
                      class="flex justify-between items-center py-2 px-3 rounded-xl border text-[10px] font-bold shadow-sm">
                   <span class="text-slate-400">{{ round.iso }}</span>
                   <span :class="round.isBest ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'">{{ round.score }}</span>
                 </div>
               </div>
            </div>
          </Transition>
        </div>

        <div v-if="roster.length === 0" class="text-center py-20 flex flex-col items-center">
          <Icon name="mdi:account-off-outline" class="size-12 text-slate-200 dark:text-slate-800 mb-4" />
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">No players found in this league.</p>
        </div>
      </div>
    </div>
   <Teleport to="body">
      <Transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="translate-y-full" 
        enter-to-class="translate-y-0" 
        leave-active-class="transition duration-200 ease-in" 
        leave-from-class="translate-y-0" 
        leave-to-class="translate-y-full"
      >
        <div v-if="isAddModalOpen" class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div @click="isAddModalOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          
          <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] sm:h-auto sm:max-h-[80vh] keyboard-modal">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Add to Roster</h4>
                <button @click="isAddModalOpen = false" class="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                  <Icon name="mdi:close" class="size-4" />
                </button>
              </div>

              <div class="relative">
                <Icon name="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search global players..." 
                  class="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar overscroll-contain">
              <div v-if="isSearchingGlobal" class="flex flex-col items-center justify-center py-10 opacity-50">
                <Icon name="mdi:loading" class="size-8 animate-spin text-emerald-500 mb-2" />
                <p class="text-[10px] font-black uppercase tracking-widest">Loading Players...</p>
              </div>

              <template v-else>
                <div 
                  v-for="p in filteredGlobalPlayers" :key="p.id"
                  class="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                      {{ p.fname[0] }}{{ p.lname[0] }}
                    </div>
                    <div>
                      <p class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ p.fname }} {{ p.lname }}</p>
                      <p class="text-[9px] font-black text-slate-400 uppercase">GHIN: {{ p.ghin || 'NH' }}</p>
                    </div>
                  </div>
                  
                  <button 
                    @click="addPlayerToLeague(p)"
                    class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition shadow-sm"
                  >
                    Add
                  </button>
                </div>
              </template>
              
              <div v-if="!isSearchingGlobal && filteredGlobalPlayers.length === 0" class="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
                No matching players found
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    </div>
</template>

<script setup>
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { useData } from '~/stores/data';
import { calculateLeagueHandicap, fetchFullCourseData } from '~/utils/handicap';

const { isAdminOf } = useAuth(); 
const { $db } = useNuxtApp();
const route = useRoute();
const dataStore = useData();

// Roster State
const roster = ref([]);
const loading = ref(true);
const isAdmin = ref(false); 
const activeAuditId = ref(null);

// Modal & Search State
const isAddModalOpen = ref(false);
const searchQuery = ref("");
const globalPlayers = ref([]); 
const isSearchingGlobal = ref(false);
const hasLoadedGlobal = ref(false);

// 🛡️ Watch the modal state to trigger the "Lazy Load"
watch(isAddModalOpen, async (isOpen) => {
  if (isOpen && isAdmin.value && !hasLoadedGlobal.value) {
    isSearchingGlobal.value = true;
    try {
      const allSnap = await getDocs(collection($db, "players"));
      globalPlayers.value = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      hasLoadedGlobal.value = true;
    } catch (err) {
      console.error("Failed to fetch global players:", err);
    } finally {
      isSearchingGlobal.value = false;
    }
  }
});

// Computed Roster Sorting
const sortedRoster = computed(() => {
  return [...roster.value].sort((a, b) => {
    if (a.isAdmin && !b.isAdmin) return -1;
    if (!a.isAdmin && b.isAdmin) return 1;
    return a.lname.localeCompare(b.lname);
  });
});

// Computed Global Search
const filteredGlobalPlayers = computed(() => {
  const queryStr = searchQuery.value.toLowerCase();
  return globalPlayers.value.filter(p => {
    const isAlreadyIn = p.leagues?.includes(route.params.id);
    const matchesSearch = `${p.fname} ${p.lname}`.toLowerCase().includes(queryStr);
    return !isAlreadyIn && matchesSearch;
  });
});

const fetchRoster = async () => {
  loading.value = true;
  try {
    const coursesMap = await fetchFullCourseData($db);

    const leagueDoc = await getDoc(doc($db, "leagues", route.params.id));
    if (leagueDoc.exists()) {
      const leagueData = leagueDoc.data();
      isAdmin.value = isAdminOf(leagueData.leagueID); 
    }

    const q = query(collection($db, "players"), where("leagues", "array-contains", route.params.id));
    const snap = await getDocs(q);
    
    const playerPromises = snap.docs.map(async (d) => {
      try {
        const data = d.data();
        // 🛡️ Added a fallback for calculateLeagueHandicap so one failure doesn't break the roster
        const hcpResult = await calculateLeagueHandicap($db, d.id, route.params.id, data.ghin || 0, coursesMap)
          .catch(err => ({ hcp: data.ghin || 0, audit: [] })); 
        
        return {
          id: d.id,
          ...data,
          leagueHcp: hcpResult.hcp,
          auditRounds: hcpResult.audit,
          isAdmin: data.admin === route.params.id || data.admin === 'super'
        };
      } catch (err) {
        console.error(`Error processing player ${d.id}:`, err);
        return null; // Skip this player if they are truly broken
      }
    });

    // Filter out any nulls from failed players
    const results = await Promise.all(playerPromises);
    roster.value = results.filter(p => p !== null);

  } catch (err) {
    console.error("Failed to fetch roster:", err);
  } finally {
    loading.value = false;
  }
};

const addPlayerToLeague = async (player) => {
  try {
    const playerRef = doc($db, "players", player.id);
    await updateDoc(playerRef, {
      leagues: arrayUnion(route.params.id)
    });
    
    await fetchRoster();
    searchQuery.value = "";
    isAddModalOpen.value = false;
  } catch (err) {
    console.error("Failed to add player:", err);
  }
};

onMounted(fetchRoster);
</script>

<style scoped>
/* 📱 Mobile Keyboard Fix */
@media (max-width: 640px) {
  /* 🛡️ Targets ONLY the modal now, leaving your player rows alone! */
  .keyboard-modal {
    height: calc(100dvh - 20px); 
  }
}

.overscroll-contain {
  overscroll-behavior: contain;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.2);
  border-radius: 10px;
}

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease-out; max-height: 300px; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; transform: translateY(-10px); }
</style>