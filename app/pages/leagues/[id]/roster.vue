<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-2xl mx-auto">
    <header class="mb-8 flex justify-between items-end">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/menu`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
          ← Back to Menu
        </NuxtLink>
        <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-2">League Roster</h1>
      </div>

      <NuxtLink 
        v-if="isAdmin" 
        :to="`/admin/leagues/${route.params.id}/players`"
        class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition"
      >
        Add / Edit
      </NuxtLink>
    </header>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 bg-white dark:bg-slate-900 animate-pulse rounded-2xl"></div>
    </div>

    <div v-else class="space-y-3">
      <div v-for="player in sortedRoster" :key="player.id" class="flex flex-col">
        <!-- Main Row -->
        <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center z-10 relative">
          <div>
            <p class="font-bold uppercase text-sm tracking-tight text-slate-800 dark:text-slate-100">{{ player.fname }} {{ player.lname }}</p>
            <div class="flex items-center gap-2 text-[10px] font-bold uppercase mt-1">
              <span class="text-slate-400">GHIN: {{ player.ghin }}</span>
              <button 
                v-if="player.leagueHcp" 
                @click="toggleAudit(player.id)"
                class="text-emerald-600 hover:text-emerald-500 flex items-center gap-1 transition"
              >
                • L-HCP: {{ player.leagueHcp }} 
                <span class="text-[8px] opacity-60">{{ activeAuditId === player.id ? '▲' : '▼' }}</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div v-if="player.admin === leagueIDString || player.admin === 'super'" 
                 class="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded text-[8px] font-black text-emerald-600 uppercase">
              Admin
            </div>
            <button 
              v-if="isAdmin && player.admin !== 'super'" 
              @click="confirmRemove(player)"
              class="p-2 text-slate-300 hover:text-red-500 transition"
            >
              <svg xmlns="http://w3.org" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Audit Table (Expandable) -->
        <div v-if="activeAuditId === player.id" class="mx-3 -mt-2 pt-6 pb-4 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-b-2xl border-x border-b border-slate-200 dark:border-slate-800 space-y-3">
           <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last 10 Valid Rounds (Best 4 in Emerald)</p>
           <div class="grid flex flex-col gap-1">
             <div v-for="round in player.auditRounds" :key="round.iso" 
                  :class="round.isBest ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50'"
                  class="flex justify-between items-center py-1 px-3 rounded-lg border text-[10px] font-bold">
               <span class="text-slate-400">{{ round.iso.startsWith('PH-') ? 'PH' : round.iso }}</span>
               <span :class="round.isBest ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'">{{ round.score }}</span>
             </div>
           </div>
        </div>
      </div>

      <div v-if="roster.length === 0" class="text-center py-20 text-slate-400 italic text-sm">
        No players found in this league yet.
      </div>
    </div>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div v-if="isDeleteModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Remove Player?</h3>
          <p class="text-xs font-bold text-slate-400 uppercase mt-1 mb-6">
            Remove <span class="text-slate-900 dark:text-white">{{ playerToRemove?.fname }}</span> from this league?
          </p>
          <div class="flex flex-col gap-2">
            <button @click="handleRemovePlayer" class="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition">Yes, Remove</button>
            <button @click="isDeleteModalOpen = false" class="w-full py-4 font-bold text-slate-400 uppercase text-xs">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { calculateLeagueHandicap, fetchFullCourseData } from '~/utils/handicap';

const route = useRoute();
const { $db } = useNuxtApp();
const { isAdminOf } = useAuth();
const toast = useToast();

const roster = ref<Player[]>([]);
const loading = ref(true);
const isAdmin = ref(false);
const leagueIDString = ref("");
const isDeleteModalOpen = ref(false);
const playerToRemove = ref<Player | null>(null);
const activeAuditId = ref<string | null>(null);

const toggleAudit = (playerId: string) => {
  activeAuditId.value = activeAuditId.value === playerId ? null : playerId;
};

const sortedRoster = computed(() => {
  return [...roster.value].sort((a, b) => {
    const aAdmin = a.admin === leagueIDString.value || a.admin === 'super';
    const bAdmin = b.admin === leagueIDString.value || b.admin === 'super';
    if (aAdmin && !bAdmin) return -1;
    if (!aAdmin && bAdmin) return 1;
    return (a.lname || '').toLowerCase().localeCompare((b.lname || '').toLowerCase());
  });
});

const confirmRemove = (p: Player) => {
  playerToRemove.value = p;
  isDeleteModalOpen.value = true;
};

const handleRemovePlayer = async () => {
  if (!playerToRemove.value) return;
  try {
    await updateDoc(doc($db, "players", playerToRemove.value.id), {
      leagues: arrayRemove(route.params.id as string)
    });
    roster.value = roster.value.filter(p => p.id !== playerToRemove.value?.id);
    toast.show("Player removed", "success");
  } catch (err) {
    toast.show("Error removing player", "error");
  } finally {
    isDeleteModalOpen.value = false;
  }
};

const fetchRoster = async () => {
  loading.value = true;
  try {
    // 1. Fetch ALL courses and tees ONCE for efficiency
    const coursesMap = await fetchFullCourseData($db);
    
    // 2. Fetch League details to verify admin status
    const leagueDoc = await getDoc(doc($db, "leagues", route.params.id as string));
    if (!leagueDoc.exists()) return;
    const leagueData = leagueDoc.data();
    leagueIDString.value = leagueData.leagueID;
    isAdmin.value = isAdminOf(leagueData.leagueID);

    // 3. Fetch Players matching this league
    const q = query(
      collection($db, "players"), 
      where("leagues", "array-contains", route.params.id)
    );
    const snap = await getDocs(q);

    // 4. Map data and calculate handicaps
    const playerPromises = snap.docs.map(async (d) => {
      const pData = d.data();
      const p: Player = { 
        id: d.id, 
        admin: pData.admin || '',
        fname: pData.fname || '',
        lname: pData.lname || '',
        phone: pData.phone || '',
        ghin: pData.ghin || 0,
        leagues: pData.leagues || []
      };

      // Only calculate L-HCP for specific leagues
      if (['vegas', 'mbWed'].includes(leagueIDString.value)) {
        const result = await calculateLeagueHandicap($db, p.id, route.params.id as string, p.ghin || 0, coursesMap);
        p.leagueHcp = result.hcp;
        p.auditRounds = result.audit;
      }
      return p;
    });

    roster.value = await Promise.all(playerPromises);
  } catch (err) {
    console.error("Roster fetch failed:", err);
    toast.show("Error loading roster", "error");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchRoster);
</script>
