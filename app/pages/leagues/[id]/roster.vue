<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 px-2 py-6 pt-24 max-w-2xl mx-auto pb-32">
    
    <LeagueHeader 
      title="Roster" 
      :is-admin="isAdmin"
      :back-to="`/leagues/${route.params.id}/menu`"
      back-text="League Menu"
    >
      <template #action v-if="isAdmin">
        <button 
          @click="isEditMode = !isEditMode"
          :class="isEditMode ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'"
          class="flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
        >
          <Icon :name="isEditMode ? 'mdi:lock-open-variant' : 'mdi:cog'" class="size-3.5" />
          <span class="hidden xs:inline">{{ isEditMode ? 'Finish Editing' : 'Manage' }}</span>
        </button>
      </template>
    </LeagueHeader>

    <Transition name="fade">
      <div v-if="isEditMode" class="grid grid-cols-2 gap-2 mb-4">
        <button 
          @click="isAddModalOpen = true"
          class="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
        >
          <Icon name="mdi:plus-circle-outline" class="size-4" /> 
          Add Player
        </button>
        <button 
          @click="syncAllHandicaps"
          class="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
        >
          <Icon name="mdi:sync" class="size-4" /> 
          Sync All
        </button>
      </div>
    </Transition>

    <div class="space-y-2">
      <div v-for="player in roster" :key="player.id" 
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-all shadow-sm">
        
        <div v-if="isPlayerAdmin(player)"
             class="absolute top-0 left-0 bg-amber-500 text-white p-1 rounded-br-lg z-10 shadow-sm">
          <Icon name="mdi:shield-check" class="size-3" />
        </div>

        <div class="p-2 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="flex flex-col min-w-0">
              <span class="text-xl text-primary">
                {{ player.fname }} {{ player.lname }}
              </span>
              <button v-if="league?.cadence === 'yearly'" @click="openAuditModal(player)" 
                      class="flex items-center gap-1 mt-1.5 text-emerald-600 dark:text-emerald-500 active:opacity-60 transition-opacity">
                <span class="text-xs font-black uppercase tracking-widest">
                  LEAGUE HCP: {{ formatHcp(player.leagueHandicaps?.[route.params.id]) }}
                </span>
                <Icon name="mdi:information-outline" class="size-3" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <div class="relative bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 min-w-[65px] text-center">
              <p class="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">GHIN</p>
              <p class="font-black text-slate-900 dark:text-white text-xs leading-none">{{ player.ghin?.toFixed(1) || 'NH' }}</p>
              <button v-if="canEditPlayer(player)" @click="openGhinModal(player)" 
                      class="absolute -top-2 -right-2 p-1 text-slate-300 hover:text-emerald-500 transition-colors">
                <Icon name="mdi:pencil-circle" class="size-4" />
              </button>
            </div>
            <button v-if="isEditMode" @click="handleRemoveClick(player)" class="p-1 text-slate-300 hover:text-red-500 transition-colors">
              <Icon name="mdi:close-circle-outline" class="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <HandicapAuditModal 
      :is-open="isAuditModalOpen" 
      :player="selectedPlayerForAudit" 
      :league-id="route.params.id" 
      @close="isAuditModalOpen = false" 
    />

    <GhinModal 
      v-if="selectedPlayer" 
      :is-open="isGhinModalOpen" 
      :player="selectedPlayer" 
      @close="isGhinModalOpen = false" 
      @updated="fetchRoster" 
    />

    <PlayerPicker 
      v-model:is-open="isAddModalOpen" 
      :selected-players="roster" 
      :can-create="isAdmin" 
      @toggle="handleTogglePlayer" 
      @create-new="handleCreateAndAdd" 
    />
  </div>
</template>

<script setup>
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthStore } from "~/stores/auth";
import { useUIStore } from "~/stores/ui";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";
import { calculateLeagueHandicap } from "~/utils/handicap";

// Route & Stores
const route = useRoute();
const { $db } = useNuxtApp();
const authStore = useAuthStore();
const ui = useUIStore();
const toast = useToast();
const confirm = useConfirm();

// UI State
const roster = ref([]);
const league = ref(null);
const isEditMode = ref(false);

// Modal/Selection State
const isGhinModalOpen = ref(false);
const isAuditModalOpen = ref(false);
const isAddModalOpen = ref(false);

const selectedPlayer = ref(null);
const selectedPlayerForAudit = ref(null);

// Computed Admin Check
const isAdmin = computed(() => {
  if (!league.value) return false;
  return authStore.isAdminForType(league.value.type);
});

// --- Data Fetching ---
const fetchRoster = async () => {
  ui.setLoading(true, "Syncing Roster...");
  try {
    const leagueDoc = await getDoc(doc($db, "leagues", route.params.id));
    if (leagueDoc.exists()) league.value = leagueDoc.data();
    
    const q = query(collection($db, "players"), where("leagues", "array-contains", route.params.id));
    const snap = await getDocs(q);
    
    roster.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.lname || '').localeCompare(b.lname || ''));
  } catch (e) {
    console.error("Fetch Roster Failed:", e);
  } finally {
    ui.setLoading(false);
  }
};

// --- Player Management ---
const handleTogglePlayer = async (player) => {
  const isRemoving = roster.value.some(p => p.id === player.id);
  ui.setLoading(true, isRemoving ? "Removing..." : "Syncing Roster...");
  
  try {
    const playerRef = doc($db, "players", player.id);
    const updates = {
      leagues: isRemoving ? arrayRemove(route.params.id) : arrayUnion(route.params.id)
    };

    if (!isRemoving && league.value?.cadence === 'yearly') {
      const { hcp, audit } = await getYearlyInitData(player.id, player.ghin || 0);
      updates[`leagueHandicaps.${route.params.id}`] = hcp;
      updates[`leagueAudits.${route.params.id}`] = audit;
    }

    await updateDoc(playerRef, updates);
    await fetchRoster();
    toast.add(isRemoving ? "Player removed" : "Player added", 'info');
  } finally {
    ui.setLoading(false);
  }
};

const handleCreateAndAdd = async (formData) => {
  // 1. Phone Validation
  const digits = formData.phone.replace(/\D/g, '');
  if (digits.length !== 10) {
    toast.add("Phone must be exactly 10 digits.", 'error');
    return;
  }

  // 2. Normalization
  const normalize = (val) => val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase();
  const cleanData = {
    ...formData,
    fname: normalize(formData.fname),
    lname: normalize(formData.lname),
    phone: `+1${digits}`
  };

  ui.setLoading(true, "Checking duplicates...");
  try {
    const q = query(collection($db, "players"), where("fname", "==", cleanData.fname), where("lname", "==", cleanData.lname));
    const snap = await getDocs(q);
    ui.setLoading(false);
    
    if (!snap.empty) {
      const proceed = await confirm.ask(
        'Duplicate Found', 
        `A player named <b>${cleanData.fname} ${cleanData.lname}</b> already exists. Create a new profile anyway?`,
        { variant: 'warning', confirmText: 'Create Anyway' }
      );
      if (!proceed) return;
    }

    await finalizePlayerCreation(cleanData);
  } catch (err) {
    ui.setLoading(false);
  }
};

const finalizePlayerCreation = async (data) => {
  ui.setLoading(true, "Saving Player...");
  try {
    const newPlayer = {
      ...data,
      ghin: Number(data.ghin) || 0,
      leagues: [route.params.id],
      createdAt: serverTimestamp(),
      admin: false,
      leagueHandicaps: {},
      leagueAudits: {}
    };

    if (league.value?.cadence === 'yearly') {
      const { hcp, audit } = await getYearlyInitData("temp-id", newPlayer.ghin);
      newPlayer.leagueHandicaps[route.params.id] = hcp;
      newPlayer.leagueAudits[route.params.id] = audit;
    }

    await addDoc(collection($db, "players"), newPlayer);
    await fetchRoster();
    
    isAddModalOpen.value = false;
    toast.add("Player created successfully", 'success');
  } finally {
    ui.setLoading(false);
  }
};

const handleRemoveClick = async (player) => {
  const confirmed = await confirm.ask(
    'Remove Player', 
    `Are you sure you want to remove <b>${player.fname} ${player.lname}</b> from the league?`,
    { confirmText: 'Remove', variant: 'danger' }
  );

  if (confirmed) {
    ui.setLoading(true, "Removing...");
    try {
      await updateDoc(doc($db, "players", player.id), { leagues: arrayRemove(route.params.id) });
      await fetchRoster();
      toast.add("Player removed", 'info');
    } finally { ui.setLoading(false); }
  }
};

const syncAllHandicaps = async () => {
  if (!confirm(`Re-calculate all ${roster.value.length} handicaps?`)) return;
  ui.setLoading(true, "Global Re-Sync...");
  try {
    for (const player of roster.value) {
      const { hcp, audit } = await getYearlyInitData(player.id, player.ghin || 0);
      await updateDoc(doc($db, "players", player.id), {
        [`leagueHandicaps.${route.params.id}`]: hcp,
        [`leagueAudits.${route.params.id}`]: audit
      });
    }
    await fetchRoster();
    toast.add("All handicaps synced", 'success');
  } finally { ui.setLoading(false); }
};

// --- Utilities ---
const getYearlyInitData = async (playerId, ghin) => {
  const result = await calculateLeagueHandicap($db, playerId, route.params.id, Number(ghin), new Map());
  return { hcp: result.hcp, audit: result.audit };
};

const isPlayerAdmin = (p) => p.admin === 'super' || p.admin === league.value?.type;
const canEditPlayer = (p) => isAdmin.value || p.id === authStore.userProfile?.id;
const openAuditModal = (p) => { selectedPlayerForAudit.value = p; isAuditModalOpen.value = true; };
const openGhinModal = (p) => { selectedPlayer.value = p; isGhinModalOpen.value = true; };
const formatHcp = (hcp) => hcp ? Number(hcp).toFixed(3) : '0.000';

onMounted(fetchRoster);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>