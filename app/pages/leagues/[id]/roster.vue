<template>
  <div class="max-w-2xl mx-auto select-none pb-32">
    
    <LeagueHeader 
      :title="league?.shortName || league?.name || 'Loading...'"
      subtitle="Roster" 
      :is-admin="isAdmin"
      :back-to="`/leagues/${route.params.id}/menu`"
      back-text="League Menu"
    >
      <template #action v-if="isAdmin">
        <button 
          @click="isEditMode = !isEditMode"
          :class="isEditMode 
            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/20 border border-amber-500/50 shadow-[inset_0_0_8px_rgba(245,158,11,0.2)]' 
            : 'text-amber-700 dark:text-amber-500 bg-amber-500/10 border border-amber-500/30'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
        >
          <Icon :name="isEditMode ? 'mdi:lock-open-variant' : 'mdi:cog'" class="size-3.5" />
          <span>{{ isEditMode ? 'Finish' : 'Manage' }}</span>
        </button>
      </template>
    </LeagueHeader>

    <Transition name="fade">
      <div v-if="isEditMode" class="grid grid-cols-2 gap-2 mb-6 px-1">
        <button @click="isAddModalOpen = true" class="card-interactive p-4 border-2 border-dashed flex flex-col items-center gap-2">
          <Icon name="mdi:plus-circle-outline" class="size-5 text-emerald-500" /> 
          <span class="text-secondary text-[10px]">Add Player</span>
        </button>
        <button @click="syncAllHandicaps" class="card-interactive p-4 border-2 border-dashed flex flex-col items-center gap-2">
          <Icon name="mdi:sync" class="size-5 text-amber-500" /> 
          <span class="text-secondary text-[10px]">Sync All</span>
        </button>
      </div>
    </Transition>

    <div class="space-y-2 px-1">
      <div v-for="player in roster" :key="player.id" class="card-base relative overflow-hidden group">
        
        <div class="p-3 flex items-center justify-between gap-3">
          <div class="flex flex-col min-w-0 flex-1 pl-1">
            
            <div class="flex items-center gap-1.5">
              <Icon 
                v-if="isPlayerAdmin(player)" 
                name="mdi:shield-crown-outline" 
                class="size-5 text-amber-500 shrink-0" 
              />
              <span class="text-primary text-lg mt-1">
                {{ player.fname }} {{ player.lname }}
              </span>
              
              <button 
                v-if="isEditMode" 
                @click="openEditModal(player)" 
                class="ml-1 text-slate-300 hover:text-emerald-500 dark:text-slate-600 dark:hover:text-emerald-400 active:scale-90 transition-colors"
              >
                <Icon name="mdi:pencil-circle" class="size-5" />
              </button>
            </div>
            
            <button v-if="league?.appHandicap" @click="openAuditModal(player)" 
                    class="flex items-center gap-1 mt-1 group/hcp active:opacity-60 transition-opacity w-fit">
              <span class="text-secondary text-[10px] text-emerald-600 dark:text-emerald-500">
                League HCP: <span class="tabular-nums ml-0.5">{{ formatHcp(player.leagueHandicaps?.[route.params.id]) }}</span>
              </span>
              <Icon name="mdi:information-outline" class="size-3 text-emerald-500/50 group-active/hcp:text-emerald-500 mb-0.5" />
            </button>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <div class="relative bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-900 min-w-[75px] text-center shadow-inner">
              <p class="text-secondary text-[8px] mb-0.5">GHIN</p>
              <p class="text-primary text-lg tabular-nums">
                {{ player.ghin?.toFixed(1) || 'NH' }}
              </p>
              
              <button v-if="canEditPlayer(player)" @click="openGhinModal(player)" 
                      class="absolute -top-1.5 -right-1.5 size-5 bg-emerald-500/80 rounded-md flex items-center justify-center text-emerald-800 shadow-md z-10 active:scale-95 transition-transform border border-emerald-400">
                <Icon name="mdi:pencil" class="size-3" />
              </button>
            </div>

            <button v-if="isEditMode" @click="handleRemoveClick(player)" class="p-2 text-slate-400 hover:text-red-500 active:scale-90 transition-all">
              <Icon name="mdi:close-circle-outline" class="size-6" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <HandicapAuditModal :is-open="isAuditModalOpen" :player="selectedPlayerForAudit" :league-id="route.params.id" @close="isAuditModalOpen = false" />
    
    <GhinModal v-if="selectedPlayer" :is-open="isGhinModalOpen" :player="selectedPlayer" @close="isGhinModalOpen = false" @updated="fetchRoster" />
    
    <PlayerPicker v-model:is-open="isAddModalOpen" 
      :selected-players="roster" 
      :can-create="isAdmin" 
      :default-tee-type="league?.tee_type || 'mens'" 
      :course="leagueCourse"
      @toggle="handleTogglePlayer" 
      @create-new="handleCreateAndAdd" 
    />

    <ClientOnly>
      <PlayerCreateModal 
        v-if="isEditModalOpen && selectedPlayerForEdit"
        :player="selectedPlayerForEdit" 
        :course="leagueCourse"
        :default-tee-type="league?.tee_type"
        @close="isEditModalOpen = false"
        @saved="onPlayerEdited"
      />
    </ClientOnly>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { doc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useNuxtApp } from '#app';
import { useRoute } from 'vue-router';
import { useAuthStore } from "~/stores/auth";
import { useUIStore } from "~/stores/ui";
import { useData } from "~/stores/data";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";
import { getDefaultTeeId } from "~/utils/gameLogic";

// Route & Stores
const route = useRoute();
const { $db } = useNuxtApp();
const authStore = useAuthStore();
const dataStore = useData();
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
const isEditModalOpen = ref(false);

const selectedPlayer = ref(null);
const selectedPlayerForAudit = ref(null);
const selectedPlayerForEdit = ref(null);

// --- Computed ---
const isAdmin = computed(() => {
  if (!league.value) return false;
  return authStore.isAdminForLeague(league.value); 
});

const leagueCourse = computed(() => {
  if (!league.value?.courseId) return null;
  return dataStore.courses.find(c => c.id === league.value.courseId);
});

// --- Data Fetching ---
const fetchRoster = async () => {
  ui.setLoading(true, "Syncing Roster...");
  try {
    league.value = dataStore.leagues.find(l => l.id === route.params.id);
    
    const q = query(collection($db, "players"), where("leagues", "array-contains", route.params.id));
    const snap = await getDocs(q);
    
    roster.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.active !== false)
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
  const digits = formData.phone?.replace(/\D/g, '') || '';
  if (digits && digits.length !== 10) {
    toast.add({ title: 'Validation Error', description: 'Phone must be exactly 10 digits.', color: 'red' });
    return;
  }

  const normalize = (val) => val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase();
  const cleanData = {
    ...formData,
    fname: normalize(formData.fname),
    lname: normalize(formData.lname),
    phone: digits ? `+1${digits}` : ''
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
  ui.setLoading(true, "Resolving Tee Assignments...");
  try {
    const assignedTeesId = getDefaultTeeId(
        data, 
        dataStore.courses.find(c => c.id === league.value.courseId),
        true, 
        league.value
    );

    const newPlayer = {
      ...data,
      ghin: data.ghin ? parseFloat(data.ghin) : 0.0,
      teesId: assignedTeesId,
      leagues: [route.params.id],
      active: true,
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
    toast.add({ title: 'Success', description: 'Player created and added to roster.', color: 'green' });
  } catch (err) {
    console.error("Creation Error:", err);
    toast.add({ title: 'Error', description: 'Failed to create player.', color: 'red' });
  } finally {
    ui.setLoading(false);
  }
};

const handleRemoveClick = async (player) => {
  const confirmed = await confirm.ask(
    'Remove Player', 
    `Are you sure you want to remove <b>${player.fname} ${player.lname}</b> from the league?`,
    { confirmText: 'Remove', variant: 'danger', icon: 'mdi:account-remove' }
  );

  if (confirmed) {
    ui.setLoading(true, "Removing...");
    try {
      await updateDoc(doc($db, "players", player.id), { leagues: arrayRemove(route.params.id) });
      await fetchRoster();
      toast.add({ title: 'Removed', description: 'Player removed from league.', color: 'info' });
    } finally { ui.setLoading(false); }
  }
};

const syncAllHandicaps = async () => {
  const confirmed = await confirm.ask(
    'Sync All Handicaps', 
    `Re-calculate and sync handicaps for all ${roster.value.length} players?`,
    { confirmText: 'Sync', icon: 'mdi:sync', confirmBtnClass: 'bg-amber-500' }
  );

  if (!confirmed) return;
  
  ui.setLoading(true, "Global Re-Sync...");
  const batch = writeBatch($db);

  try {
    for (const player of roster.value) {
      const { hcp, audit } = await getYearlyInitData(player.id, player.ghin || 0);
      const playerRef = doc($db, "players", player.id);
      
      batch.update(playerRef, {
        [`leagueHandicaps.${route.params.id}`]: hcp,
        [`leagueAudits.${route.params.id}`]: audit
      });

      if (!player.leagueHandicaps) {
        player.leagueHandicaps = {};
      }
      player.leagueHandicaps[route.params.id] = hcp;
    }

    await batch.commit();
    toast.add({ title: 'Success', description: 'All handicaps synced.', color: 'green' });
  } catch (e) {
    console.error("Batch sync failed:", e);
    toast.add({ title: 'Error', description: 'Sync failed.', color: 'red' });
  } finally {
    ui.setLoading(false);
  }
};

// --- Edit Player Hook ---
const openEditModal = (p) => { 
  selectedPlayerForEdit.value = p; 
  isEditModalOpen.value = true; 
};

const onPlayerEdited = async () => {
  isEditModalOpen.value = false;
  await fetchRoster();
};

// --- Local Utilities ---
const getYearlyInitData = async (playerId, ghin) => {
  const initialHcp = (Number(ghin) - 3).toFixed(3);
  const initialAudit = [{
    iso: 'INIT',
    diff: Number(initialHcp),
    score: 0,
    isPlaceholder: true,
    isBest: true
  }];
  return { hcp: initialHcp, audit: initialAudit };
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