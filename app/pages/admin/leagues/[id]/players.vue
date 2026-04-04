<template>
  <div class="min-h-screen p-6 max-w-2xl mx-auto pt-24">
    <header class="mb-8">
      <NuxtLink :to="`/leagues/${route.params.id}`" class="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
        ← Back to League
      </NuxtLink>
      <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-2">Manage Players</h1>
      <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">League ID: {{ route.params.id }}</p>
    </header>

    <!-- Search Section -->
    <div class="mb-8 space-y-4">
      <input v-model="searchQuery" type="text" placeholder="Search by Name or Phone..." class="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl font-bold border-none focus:ring-2 focus:ring-emerald-500" />

      <div v-if="filteredPlayers.length > 0" class="space-y-2">
        <div v-for="p in filteredPlayers" :key="p.id" class="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-sm">{{ p.fname }} {{ p.lname }}</p>
              <button @click="openGhinEdit(p)" class="flex items-center gap-1 group bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                <span class="text-[10px] font-black text-emerald-600">GHIN: {{ p.ghin || 'N/A' }}</span>
                <svg xmlns="http://w3.org" class="h-3 w-3 text-slate-400 group-hover:text-emerald-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{{ p.phone }}</p>
          </div>

          <!-- ADD BUTTON: Only shows if NOT in this specific league -->
          <button 
            v-if="!isInThisLeague(p)"
            @click="addToLeague(p)" 
            class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition active:scale-95 shadow-md shadow-emerald-600/10"
          >
            Add to League
          </button>
          
          <div v-else class="flex items-center gap-1 text-slate-300">
            <svg xmlns="http://w3.org" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-[9px] font-black uppercase tracking-tighter">Member</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AdminAddPlayerModal v-model="isAddModalOpen" @create="handleCreatePlayer" />
    <AdminEditGhinModal v-model="isGhinModalOpen" :player="selectedPlayer" @save="handleSaveGhin" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { collection, getDocs, updateDoc, doc, arrayUnion, addDoc } from "firebase/firestore";

const route = useRoute();
const { $db } = useNuxtApp();
const { player: adminUser } = useAuth();
const toast = useToast();

const leagueId = route.params.id as string; // From the URL /admin/leagues/[leagueId]/players
const allPlayers = ref<Player[]>([]);
const searchQuery = ref('');
const isAddModalOpen = ref(false);
const isGhinModalOpen = ref(false);
const selectedPlayer = ref<Player | null>(null);

const fetchAllPlayers = async () => {
  const snap = await getDocs(collection($db, "players"));
  allPlayers.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as Player));
};

const filteredPlayers = computed(() => {
  const term = searchQuery.value.trim().toLowerCase();
  if (term.length < 3) return [];
  return allPlayers.value.filter(p => {
    const fullName = `${p.fname || ''} ${p.lname || ''}`.toLowerCase();
    return fullName.includes(term) || (p.phone || '').includes(term);
  });
});

const isInThisLeague = (p: Player) => {
  return p.leagues?.includes(leagueId);
};

const openGhinEdit = (p: Player) => {
  selectedPlayer.value = p;
  isGhinModalOpen.value = true;
};

const addToLeague = async (targetPlayer: Player) => {
  try {
    const playerRef = doc($db, "players", targetPlayer.id);
    
    // updateDoc with arrayUnion handles the "if doesn't exist" logic automatically in Firestore
    await updateDoc(playerRef, {
      leagues: arrayUnion(leagueId)
    });

    // Update local state so the button disappears and "Member" shows immediately
    if (!targetPlayer.leagues) targetPlayer.leagues = [];
    targetPlayer.leagues.push(leagueId);
    
    toast.show("Player added to league!", "success");
  } catch (err) {
    toast.show("Failed to add player.", "error");
  }
};

const handleSaveGhin = async (newGhin: number) => {
  if (!selectedPlayer.value) return;
  try {
    await updateDoc(doc($db, "players", selectedPlayer.value.id), { ghin: newGhin });
    selectedPlayer.value.ghin = newGhin;
    isGhinModalOpen.value = false;
    toast.show("GHIN updated!", "success");
  } catch { toast.show("Update failed", "error"); }
};

const handleCreatePlayer = async (newPlayerData: any) => {
  const leagueId = adminUser.value?.admin;
  if (!leagueId) return;
  try {
    const docRef = await addDoc(collection($db, "players"), { ...newPlayerData, leagues: [leagueId], uids: [] });
    allPlayers.value.push({ id: docRef.id, ...newPlayerData, leagues: [leagueId] });
    isAddModalOpen.value = false;
    toast.show("Player created!", "success");
  } catch { toast.show("Create failed", "error"); }
};

onMounted(fetchAllPlayers);
</script>
