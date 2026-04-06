<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-2xl mx-auto">
    <header class="mb-6 flex justify-between items-end">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/menu`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
          ← Back to Menu
        </NuxtLink>
        <h1 class="text-4xl font-black text-emerald-600 uppercase tracking-tighter mt-2 leading-none">
          {{ leagueName }}
        </h1>
      </div>

      <!-- Admin Toggle -->
      <button 
        v-if="isAdmin" 
        @click="isEditMode = !isEditMode"
        :class="isEditMode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'"
        class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
      >
        <Icon :name="isEditMode ? 'mdi:check' : 'mdi:cog'" class="size-3" />
        {{ isEditMode ? 'Done' : 'Edit' }}
      </button>
    </header>

    <!-- Year Selection Chips -->
    <div v-if="availableYears.length > 0" class="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
      <button 
        v-for="year in availableYears" :key="year"
        @click="selectedYear = year"
        :class="selectedYear === year ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'"
        class="px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap"
      >
        {{ year }}
      </button>
    </div>

    <!-- Calendar List -->
    <div v-if="!loading" class="space-y-1.5">
      <div v-for="item in filteredItems" :key="item.id" class="flex items-center gap-2">
        
        <!-- Selection Button: Only in Edit Mode -->
        <button 
          v-if="isEditMode" 
          @click="openEditor(item)"
          class="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 active:scale-90 transition"
        >
          <Icon name="mdi:pencil" class="size-4" />
        </button>

        <NuxtLink 
          :to="isEditMode ? '' : `/leagues/${route.params.id}/${item.iso}`"
          :class="isEditMode ? 'pointer-events-none opacity-60' : ''"
          class="flex-grow flex items-center justify-between p-2.5 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-all active:scale-[0.99]"
        >
          <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-tight">
            {{ getFullDate(item.iso) }}
          </p>

          <div class="flex items-center gap-3">
            <!-- Icon Display -->
            <div v-if="item.status" class="flex items-center">
              <div v-if="item.status === 'mdi-check-bold'" class="status-dot border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30">
                <Icon name="mdi:check-bold" class="text-emerald-600 size-3" />
              </div>
              <div v-else-if="item.status === 'mdi-alpha-h-circle-outline'" class="status-dot border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <Icon name="mdi:alpha-h-circle-outline" class="text-blue-600 size-4" />
              </div>
              <div v-else-if="item.status === 'mdi-alpha-p-circle-outline'" class="status-dot border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <Icon name="mdi:alpha-p-circle-outline" class="text-amber-600 size-4" />
              </div>
              <div v-else-if="item.status === 'mdi-weather-pouring'" class="status-dot border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <Icon name="mdi:weather-lightning-rainy" class="text-slate-600 size-3.5" />
              </div>
            </div>
            <Icon v-if="!isEditMode" name="mdi:chevron-right" class="text-slate-300 size-4" />
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Admin Status Modal -->
    <Teleport to="body">
      <div v-if="editingItem" class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Set Status For</p>
          <h3 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">{{ getFullDate(editingItem.iso) }}</h3>
          
          <div class="grid grid-cols-2 gap-2">
            <button v-for="opt in statusOptions" :key="opt.value" 
              @click="updateStatus(opt.value)"
              class="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 transition-all bg-slate-50 dark:bg-slate-800/50"
            >
              <Icon :name="opt.icon" :class="opt.color" class="size-6" />
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">{{ opt.label }}</span>
            </button>
            <button @click="updateStatus('')" class="col-span-2 py-3 text-[10px] font-black uppercase text-slate-400">Clear Status</button>
          </div>
          <button @click="editingItem = null" class="w-full mt-4 py-4 font-bold text-slate-400 uppercase text-xs">Cancel</button>
        </div>
      </div>

      <!-- Syncing Overlay -->
      <div v-if="isProcessing" class="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-md flex items-center justify-center">
        <div class="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-slate-200 dark:border-slate-800">
          <div class="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <div class="text-center">
            <p class="text-xs font-black text-emerald-600 uppercase tracking-widest">Syncing Stats</p>
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Recalculating season totals...</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, where, collectionGroup, writeBatch } from "firebase/firestore";
import { calcBirds, calcDeuces, calcChicago } from '~/utils/gameLogic';
import { fetchFullCourseData } from '~/utils/handicap';


const route = useRoute();
const { $db } = useNuxtApp();
const { isAdminOf } = useAuth();
const toast = useToast();

const leagueName = ref('Loading...');
const allItems = ref<any[]>([]);
const selectedYear = ref('');
const loading = ref(true);
const isEditMode = ref(false);
const isProcessing = ref(false);
const editingItem = ref<any>(null);

const statusOptions = [
  { label: 'Complete', value: 'mdi-check-bold', icon: 'mdi:check-bold', color: 'text-emerald-500' },
  { label: 'Handicap', value: 'mdi-alpha-h-circle-outline', icon: 'mdi:alpha-h-circle-outline', color: 'text-blue-500' },
  { label: 'Practice', value: 'mdi-alpha-p-circle-outline', icon: 'mdi:alpha-p-circle-outline', color: 'text-amber-500' },
  { label: 'Rain Out', value: 'mdi-weather-pouring', icon: 'mdi:weather-lightning-rainy', color: 'text-slate-500' },
];

const availableYears = computed(() => {
  const years = allItems.value.map(item => item.iso.substring(0, 4));
  return [...new Set(years)].sort((a, b) => b.localeCompare(a));
});

const filteredItems = computed(() => {
  if (!selectedYear.value) return [];
  return allItems.value
    .filter(item => item.iso.startsWith(selectedYear.value))
    .sort((a, b) => a.iso.localeCompare(b.iso));
});

const isAdmin = computed(() => {
  const leagueId = route.params.id as string;
  // This depends on how you store the leagueID field in your league document
  // Make sure your useAuth handles this lookup
  return isAdminOf(leagueId); 
});

const openEditor = (item: any) => { editingItem.value = item; };

const updateStatus = async (newStatus: string) => {
  if (!editingItem.value) return;
  const targetItem = { ...editingItem.value };
  const leagueDocId = route.params.id as string;
  
  editingItem.value = null; // Close modal
  isProcessing.value = true;

  try {
    const docRef = doc($db, "leagues", leagueDocId, "calendar", targetItem.id);
    await updateDoc(docRef, { status: newStatus });

    // Sync weeklyStats
    if (newStatus === 'mdi-check-bold') {
      const coursesMap = await fetchFullCourseData($db);
      const leagueSnap = await getDoc(doc($db, "leagues", leagueDocId));
      const targetLeagueId = leagueSnap.data()?.leagueID;

      const roundsQuery = query(
        collectionGroup($db, "rounds"),
        where("type", "==", targetLeagueId),
        where("iso", "==", targetItem.iso)
      );
      const roundsSnap = await getDocs(roundsQuery);
      const batch = writeBatch($db);

      for (const rDoc of roundsSnap.docs) {
        const roundData = rDoc.data();
        const playerSnap = await getDoc(rDoc.ref.parent.parent!);
        const teeData = coursesMap.get(roundData.course)?.tees[roundData.tees];

        if (teeData) {
          const birds = calcBirds(roundData, targetItem, teeData).reduce((a, b) => a + b, 0);
          const deuces = calcDeuces(roundData, teeData).reduce((a, b) => a + b, 0);
          const chicago = calcChicago(roundData, teeData).reduce((a, b) => a + b, 0);

          const statsId = `${playerSnap.id}_${targetItem.iso}`;
          const statsRef = doc($db, "leagues", leagueDocId, "weeklyStats", statsId);

          batch.set(statsRef, {
            playerId: playerSnap.id,
            playerName: `${playerSnap.data()?.fname} ${playerSnap.data()?.lname}`,
            iso: targetItem.iso,
            birds, deuces, chicago,
            updatedAt: new Date()
          });
        }
      }
      await batch.commit();
    } else {
      // Cleanup: Remove existing stats if changing away from Complete
      const statsRef = collection($db, "leagues", leagueDocId, "weeklyStats");
      const q = query(statsRef, where("iso", "==", targetItem.iso));
      const snap = await getDocs(q);
      const batch = writeBatch($db);
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    // Update Local UI
    const idx = allItems.value.findIndex(i => i.id === targetItem.id);
    if (idx !== -1) allItems.value[idx].status = newStatus;
    
    toast.show("Status and Stats updated", "success");
  } catch (err) {
    console.error(err);
    toast.show("Sync failed", "error");
  } finally {
    isProcessing.value = false;
  }
};

onMounted(async () => {
  const leagueId = route.params.id as string;
  try {
    const leagueSnap = await getDoc(doc($db, "leagues", leagueId));
    if (leagueSnap.exists()) leagueName.value = leagueSnap.data().name;

    const calRef = collection($db, "leagues", leagueId, "calendar");
    const q = query(calRef, orderBy("iso", "desc"));
    const querySnapshot = await getDocs(q);
    allItems.value = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (availableYears.value.length > 0) {
      selectedYear.value = availableYears.value[0];
    }
  } catch (err) {
    console.error("Load Error:", err);
  } finally {
    loading.value = false;
  }
});

const getFullDate = (iso: string) => {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric'
  });
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.status-dot { @apply w-5 h-5 flex items-center justify-center rounded-full border flex-shrink-0; }
</style>
