<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-2xl mx-auto pb-32">
    <header class="mb-6 flex justify-between items-end">
      <div>
        <NuxtLink :to="`/leagues/${route.params.id}/menu`" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
          ← Back to Menu
        </NuxtLink>
        <h1 class="text-4xl font-black text-emerald-600 uppercase tracking-tighter mt-2 leading-none">
          {{ leagueName }}
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <button 
          v-if="isAdmin && isEditMode" 
          @click="openEventEditor()"
          class="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1 active:scale-95"
        >
          <Icon name="mdi:plus" class="size-3" />
          Add
        </button>

        <button 
          v-if="isAdmin" 
          @click="isEditMode = !isEditMode"
          :class="isEditMode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'"
          class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 active:scale-95"
        >
          <Icon :name="isEditMode ? 'mdi:check' : 'mdi:cog'" class="size-3" />
          {{ isEditMode ? 'Done' : 'Edit' }}
        </button>
      </div>
    </header>

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

    <div v-if="!loading" class="space-y-1.5">
      <div v-for="item in filteredItems" :key="item.id" class="flex items-center gap-2">
        
        <div v-if="isEditMode" class="flex gap-1 flex-shrink-0">
          <button @click="openEventEditor(item)" class="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 active:scale-90 transition hover:border-emerald-500">
            <Icon name="mdi:pencil" class="size-4" />
          </button>
          
          <button @click="openStatusEditor(item)" class="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 active:scale-90 transition hover:border-blue-500 hover:text-blue-500">
            <Icon name="mdi:flag-checkered" class="size-4" />
          </button>
          
          <button @click="confirmDelete(item)" class="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-red-400 active:scale-90 transition hover:border-red-500">
            <Icon name="mdi:trash-can-outline" class="size-4" />
          </button>
        </div>

        <NuxtLink 
          :to="isEditMode ? '' : `/leagues/${route.params.id}/${item.iso}`"
          :class="isEditMode ? 'pointer-events-none opacity-60' : ''"
          class="flex-grow flex items-center justify-between p-2.5 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-all active:scale-[0.99]"
        >
          <div class="flex flex-col gap-1.5">
            <div>
              <p class="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-tight">
                {{ getFullDate(item.iso) }}
              </p>
              <p v-if="item.course" class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                {{ item.course }} 
                <span v-if="item.tees">• {{ item.tees }}</span>
                <span v-if="leagueData?.cadence !== 'yearly' && item.holes">• {{ item.holes }}H</span>
              </p>
            </div>

            <div v-if="item.game?.length" class="flex flex-wrap gap-1">
              <div v-for="g in item.game" :key="g" class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md text-[8px] font-black uppercase tracking-tighter border border-emerald-100/50 dark:border-emerald-800/50">
                <Icon name="mdi:flag-variant-outline" class="size-2.5" />
                {{ g }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div v-if="item.status" class="flex items-center">
              <Icon v-if="item.status === 'mdi-check-bold'" name="mdi:check-bold" class="text-emerald-600 size-4" />
              <Icon v-else-if="item.status === 'mdi-alpha-h-circle-outline'" name="mdi:alpha-h-circle-outline" class="text-blue-600 size-5" />
              <Icon v-else-if="item.status === 'mdi-weather-pouring'" name="mdi:weather-lightning-rainy" class="text-slate-500 size-4" />
            </div>
            <Icon v-if="!isEditMode" name="mdi:chevron-right" class="text-slate-300 size-4" />
          </div>
        </NuxtLink>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="eventEditor.isOpen" class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {{ eventEditor.isNew ? 'Add Date' : 'Edit Date' }}
            </h3>
            <button @click="eventEditor.isOpen = false" class="text-slate-400">
              <Icon name="mdi:close" class="size-6" />
            </button>
          </div>
          
          <form @submit.prevent="saveEvent" class="space-y-4">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
              <input type="date" v-model="eventEditor.data.iso" required class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100" />
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="relative">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Course</label>
                <select v-model="eventEditor.data.course" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 appearance-none focus:border-emerald-500 outline-none">
                  <option value="" disabled>Select Course...</option>
                  <option v-for="c in courses" :key="c.id" :value="c.name">{{ c.name }}</option>
                </select>
                <Icon name="mdi:chevron-down" class="absolute right-4 bottom-3.5 text-slate-400 pointer-events-none" />
              </div>
              <div class="relative">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tees</label>
                <select v-model="eventEditor.data.tees" :disabled="!availableTees.length" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 appearance-none focus:border-emerald-500 outline-none disabled:opacity-50">
                  <option value="" disabled>Select Tees...</option>
                  <option v-for="t in availableTees" :key="t" :value="t">{{ t }}</option>
                </select>
                <Icon name="mdi:chevron-down" class="absolute right-4 bottom-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div class="relative">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Games</label>
              <button type="button" @click="isGameDropdownOpen = true" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-sm font-bold text-slate-800 dark:text-slate-100 flex justify-between items-center text-left">
                <span class="truncate pr-4">{{ eventEditor.data.games.length ? eventEditor.data.games.join(', ') : 'Select games...' }}</span>
                <Icon name="mdi:format-list-bulleted" class="size-5 text-emerald-500" />
              </button>
            </div>

            <button type="submit" class="w-full mt-2 py-4 bg-emerald-600 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
              Save Event
            </button>
          </form>
        </div>
      </div>

      <div v-if="statusEditor.isOpen" class="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          
          <div class="flex justify-between items-center mb-6">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ getFullDate(statusEditor.item?.iso) }}</p>
              <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Set Event Status</h3>
            </div>
            <button @click="statusEditor.isOpen = false" class="text-slate-400 p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:text-slate-600 transition">
              <Icon name="mdi:close" class="size-5" />
            </button>
          </div>

          <div class="grid gap-3">
            <button @click="updateStatus('mdi-check-bold')" class="flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all text-left group active:scale-[0.98]">
              <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0"><Icon name="mdi:check-bold" class="size-5" /></div>
              <div>
                <p class="font-black text-emerald-700 dark:text-emerald-400 uppercase text-sm tracking-tight">Finalize & Archive</p>
                <p class="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest mt-0.5">Saves live scores to history</p>
              </div>
            </button>

            <button @click="updateStatus('mdi-alpha-h-circle-outline')" class="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-left group active:scale-[0.98]">
              <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0"><Icon name="mdi:alpha-h-circle-outline" class="size-6" /></div>
              <div>
                <p class="font-black text-blue-700 dark:text-blue-400 uppercase text-sm tracking-tight">Half Round</p>
                <p class="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest mt-0.5">Mark as 9 holes completed</p>
              </div>
            </button>

            <button @click="updateStatus('mdi-weather-pouring')" class="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left group active:scale-[0.98]">
              <div class="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center flex-shrink-0"><Icon name="mdi:weather-lightning-rainy" class="size-5" /></div>
              <div>
                <p class="font-black text-slate-700 dark:text-slate-300 uppercase text-sm tracking-tight">Rained Out</p>
                <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Event canceled</p>
              </div>
            </button>
            
            <button v-if="statusEditor.item?.status" @click="updateStatus(null)" class="mt-2 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition">
              Clear Status
            </button>
          </div>
        </div>
      </div>

      <div v-if="deleteConfirmItem" class="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="mdi:alert-circle-outline" class="size-10" />
          </div>
          <h4 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Delete Event?</h4>
          <p class="text-xs text-slate-500 mb-8 uppercase font-bold tracking-widest leading-relaxed">
            Removing the round on <br/>
            <span class="text-slate-800 dark:text-white">{{ getFullDate(deleteConfirmItem.iso) }}</span>
          </p>
          <div class="grid gap-2">
            <button @click="deleteEvent" class="w-full py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-lg shadow-red-600/20 active:scale-95">
              Delete Forever
            </button>
            <button @click="deleteConfirmItem = null" class="w-full py-4 text-slate-400 font-black uppercase text-[10px]">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-full"
        enter-to-class="translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0"
        leave-to-class="translate-y-full"
      >
        <div v-if="isGameDropdownOpen" class="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-4">
          <div @click="isGameDropdownOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-400">Select Games</h4>
              <button @click="isGameDropdownOpen = false" class="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm"><Icon name="mdi:check" class="text-emerald-600 size-5" /></button>
            </div>
            <div class="p-2 max-h-[60vh] overflow-y-auto">
              <button v-for="game in gameOptions" :key="game" @click="toggleGame(game)" :class="eventEditor.data.games.includes(game) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' : 'bg-transparent border-transparent'" class="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all">
                <span class="font-bold text-sm uppercase tracking-tight" :class="eventEditor.data.games.includes(game) ? 'text-emerald-600' : 'text-slate-600'">{{ game }}</span>
                <div :class="eventEditor.data.games.includes(game) ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-200'" class="w-6 h-6 rounded-full border-2 flex items-center justify-center">
                  <Icon v-if="eventEditor.data.games.includes(game)" name="mdi:check" class="text-white size-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, addDoc, deleteDoc, where, serverTimestamp } from "firebase/firestore";
import { useData } from '~/stores/data';

const route = useRoute();
const { $db } = useNuxtApp();
const { isAdminOf } = useAuth();
const dataStore = useData();
const toast = useToast();

const leagueName = ref('Loading...');
const leagueData = ref(null);
const allItems = ref([]);
const selectedYear = ref('');
const loading = ref(true);
const isEditMode = ref(false);
const deleteConfirmItem = ref(null);
const isGameDropdownOpen = ref(false);
const statusEditor = ref({ isOpen: false, item: null });

const gameOptions = ['Stroke Play', 'Chicago Points', 'Modified Chicago', 'Net Skins', 'Gross Skins', 'Deuce Pot', 'Blind Best Ball'];

const eventEditor = ref({
  isOpen: false,
  isNew: false,
  data: { id: null, iso: '', course: '', tees: '', games: [], holes: 18, per: 20, money: 1 }
});

const courses = computed(() => Array.from(dataStore.courses.values()));
const availableTees = computed(() => {
  const match = courses.value.find(c => c.name === eventEditor.value.data.course);
  if (match && match.tees) {
    if (typeof match.tees === 'object' && !Array.isArray(match.tees)) {
      return Object.keys(match.tees);
    }
    return match.tees;
  }
  return [];
});

const availableYears = computed(() => {
  const years = allItems.value.map(item => item.iso.substring(0, 4));
  return [...new Set(years)].sort((a, b) => b.localeCompare(a));
});

const filteredItems = computed(() => {
  if (!selectedYear.value) return [];
  return allItems.value.filter(i => i.iso.startsWith(selectedYear.value)).sort((a,b) => a.iso.localeCompare(b.iso));
});

const isAdmin = computed(() => leagueData.value ? isAdminOf(leagueData.value.leagueID) : false);

// Data Fetching
const fetchCalendar = async () => {
  const leagueId = route.params.id;
  const leagueSnap = await getDoc(doc($db, "leagues", leagueId));
  if (leagueSnap.exists()) {
    leagueData.value = leagueSnap.data();
    leagueName.value = leagueData.value.shortName;
  }
  const q = query(collection($db, "leagues", leagueId, "calendar"), orderBy("iso", "desc"));
  const snap = await getDocs(q);
  allItems.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (availableYears.value.length > 0) selectedYear.value = availableYears.value[0];
  loading.value = false;
};

// UI Triggers
const openEventEditor = (item = null) => {
  if (item) {
    eventEditor.value = { isOpen: true, isNew: false, data: { ...item, games: item.game || [] } };
  } else {
    eventEditor.value = { isOpen: true, isNew: true, data: { id: null, iso: new Date().toISOString().split('T')[0], course: leagueData.value?.course || '', tees: leagueData.value?.tees || '', games: ['Stroke Play'], holes: 18, per: 20, money: 1 } };
  }
};

const openStatusEditor = (item) => {
  statusEditor.value = { isOpen: true, item };
};

// Action: Save Event
const saveEvent = async () => {
  const leagueId = route.params.id;
  const selectedCourse = courses.value.find(c => c.name === eventEditor.value.data.course);
  
  const payload = {
    iso: eventEditor.value.data.iso,
    course: eventEditor.value.data.course,
    courseID: selectedCourse?.id || null,
    tees: eventEditor.value.data.tees,
    teesID: selectedCourse?.tees?.[eventEditor.value.data.tees]?.id || null,
    game: eventEditor.value.data.games,
    holes: eventEditor.value.data.holes,
    leagueID: leagueId,
    type: leagueData.value?.type || leagueId,
    money: eventEditor.value.data.money || 1,
    per: eventEditor.value.data.per || 20
  };

  try {
    if (eventEditor.value.isNew) {
      await addDoc(collection($db, "leagues", leagueId, "calendar"), payload);
    } else {
      await updateDoc(doc($db, "leagues", leagueId, "calendar", eventEditor.value.data.id), payload);
    }

    await dataStore.refreshLeagueRound(leagueId);
    await fetchCalendar();
    
    eventEditor.value.isOpen = false;
    toast.show("Calendar Updated", "success");
  } catch (error) {
    console.error("Save error:", error);
    toast.show("Failed to save event", "error");
  }
};

// Action: Status Update & Sweeper
const updateStatus = async (statusIcon) => {
  const item = statusEditor.value.item;
  const leagueId = route.params.id;
  loading.value = true;
  statusEditor.value.isOpen = false; 

  try {
    const q = query(collection($db, "live_rounds"), where("eventId", "==", item.id));
    const liveSnap = await getDocs(q);

    if (!liveSnap.empty) {
      const sweepPromises = liveSnap.docs.map(async (liveDoc) => {
        const data = liveDoc.data();
        
        const playerPromises = data.players.map(async (p) => {
          const playerRoundRef = collection($db, "players", p.id, "rounds");
          return addDoc(playerRoundRef, {
            course: data.course, 
            courseID: data.courseID, 
            courseSnapshot: data.courseSnapshot || null,
            date: data.date,
            tees: data.tees, 
            holes: data.holes, 
            leagueId: leagueId,
            eventId: item.id, 
            type: data.type, 
            index: p.index,
            scores: data.scores[p.id],
            total: data.scores[p.id].reduce((a, b) => a + (parseInt(b) || 0), 0),
            createdAt: serverTimestamp(),
            archiveEventStatus: statusIcon 
          });
        });

        await Promise.all(playerPromises);
        return deleteDoc(doc($db, "live_rounds", liveDoc.id));
      });

      await Promise.all(sweepPromises);
    }

    await updateDoc(doc($db, "leagues", leagueId, "calendar", item.id), {
      status: statusIcon 
    });

    toast.show("Event Archived & Status Updated", "success");
    await fetchCalendar();
  } catch (err) {
    console.error("Status Update Error:", err);
    toast.show("Error updating status", "error");
  } finally {
    loading.value = false;
  }
};

// Action: Delete Event
const confirmDelete = (item) => { deleteConfirmItem.value = item; };

const deleteEvent = async () => {
  if (!deleteConfirmItem.value) return;
  const leagueId = route.params.id;
  await deleteDoc(doc($db, "leagues", leagueId, "calendar", deleteConfirmItem.value.id));
  await dataStore.refreshLeagueRound(leagueId);
  await fetchCalendar();
  deleteConfirmItem.value = null;
  toast.show("Event Removed", "success");
};

// Helpers
const toggleGame = (game) => {
  const idx = eventEditor.value.data.games.indexOf(game);
  idx === -1 ? eventEditor.value.data.games.push(game) : eventEditor.value.data.games.splice(idx, 1);
};

const getFullDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

onMounted(fetchCalendar);
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>