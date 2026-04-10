<template>
  <div class="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-28 px-6 pb-24">
    <div class="max-w-2xl mx-auto">
      
      <header class="mb-10 flex justify-between items-end">
        <div>
          <NuxtLink :to="`/leagues/${route.params.id}/menu`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
            ← Back to Menu
          </NuxtLink>
          <h1 class="text-4xl font-black text-emerald-600 uppercase tracking-tighter mt-2 leading-none">
            League Roster
          </h1>
        </div>

        <button 
          v-if="isAdmin"
          @click="isEditMode = !isEditMode"
          :class="isEditMode ? 'bg-amber-500 shadow-amber-900/20' : 'bg-emerald-600 shadow-emerald-900/20'"
          class="px-6 py-3 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          {{ isEditMode ? 'Finish Editing' : 'Manage Roster' }}
        </button>
      </header>

      <Transition name="fade">
        <button 
          v-if="isEditMode" 
          @click="handleAddPlayer"
          class="w-full mb-6 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
        >
          <Icon name="mdi:plus-circle-outline" class="w-4 h-4" /> 
          Add New Player to League
        </button>
      </Transition>

      <div class="space-y-4">
        <div v-for="player in roster" :key="player.id" 
             class="bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-all shadow-sm">
          
          <div v-if="player.admin === 'super' || player.admin === league?.type" 
               class="absolute top-4 left-4 z-10">
            <Icon name="mdi:shield-check" class="w-5 h-5 text-amber-500" />
          </div>

          <div class="p-5 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 text-sm">
                {{ player.fname?.[0] }}{{ player.lname?.[0] }}
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-slate-900 dark:text-white text-lg leading-tight pr-6">
                  {{ player.fname }} {{ player.lname }}
                </span>
                
                <button @click="toggleAudit(player.id)" class="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-500 active:opacity-60 transition-opacity">
                  <span class="text-[10px] font-black uppercase tracking-widest">
                    L-HCP: {{ formatHcp(player.leagueHandicaps?.[route.params.id]) }}
                  </span>
                  <Icon :name="expandedAudit === player.id ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="w-3 h-3" />
                </button>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="relative bg-white dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 min-w-[85px] text-center">
                <p class="text-[8px] font-black text-slate-400 uppercase">GHIN</p>
                <p class="font-black text-slate-900 dark:text-white">{{ player.ghin || 'NH' }}</p>
                
                <button 
                  v-if="isAdmin || player.id === authStore.userProfile?.id" 
                  @click="openGhinModal(player)" 
                  class="absolute -top-2 -right-2 p-0.5 bg-white dark:bg-slate-900 rounded-full text-slate-300 hover:text-emerald-500 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors"
                >
                  <Icon name="mdi:pencil-circle" class="w-5 h-5" />
                </button>
              </div>
              
              <button v-if="isEditMode" @click="confirmRemove(player)" class="p-2 text-slate-400 active:text-red-500 transition-colors">
                <Icon name="mdi:delete-outline" class="w-6 h-6" />
              </button>
            </div>
          </div>

          <Transition name="expand">
            <div v-if="expandedAudit === player.id" class="px-5 pb-5 pt-2 bg-slate-100/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <p class="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest flex flex-col gap-1">
                Handicap Audit 
                <span class="text-[8px] text-emerald-500 lowercase font-medium">(highlighted rounds used in calculation)</span>
              </p>
              
              <div class="space-y-2">
                <div v-for="(round, idx) in processAuditRounds(player.leagueAudits?.[route.params.id])" :key="idx" 
                     :class="round.isUsed ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'"
                     class="flex justify-between items-center p-2 px-4 rounded-xl border transition-all">
                  
                  <div class="flex flex-col">
                    <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{{ formatDate(round.date) }}</span>
                    <span v-if="round.isPadding" class="text-[8px] text-amber-500 font-bold uppercase">GHIN-3 Penalty</span>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <p class="text-[8px] uppercase text-slate-400 font-black">Gross</p>
                      <p :class="round.isUsed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'" class="text-sm font-black">
                        {{ round.rawGross }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-[8px] uppercase text-slate-400 font-black">Adj</p>
                      <p :class="round.isUsed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'" class="text-sm font-black">
                        {{ round.adjustedGross }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-[8px] uppercase text-slate-400 font-black">Diff</p>
                      <p :class="round.isUsed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'" class="text-sm font-black">
                        {{ round.differential?.toFixed(3) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <p v-if="!player.leagueAudits?.[route.params.id]?.length" class="text-[10px] italic text-slate-400 mt-2">No rounds found for this season.</p>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <GhinModal v-if="selectedPlayer" :is-open="isGhinModalOpen" :player="selectedPlayer" @close="isGhinModalOpen = false" @updated="fetchRoster" />
  </div>
</template>

<script setup>
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuthStore } from "~/stores/auth";
import { useUIStore } from "~/stores/ui";

const route = useRoute();
const { $db } = useNuxtApp();
const authStore = useAuthStore();
const ui = useUIStore();

const roster = ref([]);
const league = ref(null);
const isAdmin = ref(false);
const isEditMode = ref(false);
const expandedAudit = ref(null);
const isGhinModalOpen = ref(false);
const selectedPlayer = ref(null);

const fetchRoster = async () => {
  ui.setLoading(true);
  try {
    const leagueDoc = await getDoc(doc($db, "leagues", route.params.id));
    if (leagueDoc.exists()) {
      league.value = leagueDoc.data();
      isAdmin.value = authStore.isAdminForType(league.value.type);
    }

    // Now simply query the players. The handicap math is already stored in the doc!
    const q = query(collection($db, "players"), where("leagues", "array-contains", route.params.id));
    const snap = await getDocs(q);
    
    roster.value = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

  } catch (err) {
    console.error(err);
  } finally {
    ui.setLoading(false);
  }
};

const formatHcp = (hcp) => {
  if (hcp === undefined || hcp === null) return '0.000';
  return Number(hcp).toFixed(3);
};

const toggleAudit = (id) => expandedAudit.value = expandedAudit.value === id ? null : id;

const openGhinModal = (player) => {
  selectedPlayer.value = player;
  isGhinModalOpen.value = true;
};

const handleAddPlayer = () => console.log("Open Add Player Modal");

const confirmRemove = (player) => {
  if (confirm(`Are you sure you want to remove ${player.fname} from the league?`)) {
    console.log("Removing player ID:", player.id);
  }
};

const formatDate = (d) => {
  if (!d || d === 'N/A') return 'Established Round';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const processAuditRounds = (rounds) => {
  if (!rounds || !rounds.length) return [];
  
  // Find the lowest 4 differentials to flag them as "Used"
  const sortedByDiff = [...rounds].sort((a, b) => a.differential - b.differential);
  const lowest4Indices = new Set(sortedByDiff.slice(0, 4).map(r => rounds.indexOf(r)));

  return rounds.map((r, idx) => ({
    ...r,
    isUsed: lowest4Indices.has(idx)
  }));
};

onMounted(fetchRoster);
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease-in-out; max-height: 1200px; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; overflow: hidden; }
.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>