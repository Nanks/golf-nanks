<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-2xl mx-auto pb-24">
    <header class="mb-8">
      <h1 class="text-4xl font-black text-emerald-600 uppercase tracking-tighter leading-none">
        My Profile
      </h1>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Personalize your Experience</p>
    </header>

    <div v-if="player" class="space-y-6">
      
      <section class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <Icon name="mdi:cog" class="text-emerald-600 size-5" />
          <h2 class="font-black uppercase tracking-tight text-slate-800 dark:text-white">Round Defaults</h2>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Favorite Course</label>
          <div class="relative">
            <select 
              v-model="localPrefs.favCourse" 
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 appearance-none focus:border-emerald-500 outline-none"
            >
              <option value="">None Selected</option>
              <option v-for="c in courses" :key="c.id" :value="c.name">{{ c.name }}</option>
            </select>
            <Icon name="mdi:chevron-down" class="absolute right-4 bottom-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Tees</label>
          <div class="relative">
            <select 
              v-model="localPrefs.favTees" 
              :disabled="!currentCourseTees.length"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 appearance-none focus:border-emerald-500 outline-none disabled:opacity-50"
            >
              <option value="">None Selected</option>
              <option v-for="t in currentCourseTees" :key="t" :value="t">{{ t }}</option>
            </select>
            <Icon name="mdi:chevron-down" class="absolute right-4 bottom-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </section>

      <section class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <Icon name="mdi:star" class="text-amber-500 size-5" />
            <h2 class="font-black uppercase tracking-tight text-slate-800 dark:text-white">Playing Partners</h2>
          </div>
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {{ localPrefs.favPartners?.length || 0 }} Starred
          </span>
        </div>

        <button 
          @click="isPartnerModalOpen = true"
          class="w-full bg-slate-50 dark:bg-slate-800 border border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-4 flex flex-col items-center gap-1 group hover:border-emerald-500 transition-colors"
        >
          <Icon name="mdi:account-star-outline" class="size-6 text-slate-300 group-hover:text-emerald-500" />
          <span class="text-[10px] font-black uppercase text-slate-400 group-hover:text-emerald-600">Manage Favorites</span>
        </button>

        <div class="flex flex-wrap gap-2">
          <div v-for="pId in localPrefs.favPartners" :key="pId" class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded-full text-[10px] font-black uppercase">
            {{ getPlayerName(pId) }}
            <button @click="togglePartner(pId)" class="hover:text-red-500">
              <Icon name="mdi:close-circle" class="size-4" />
            </button>
          </div>
        </div>
      </section>

      <div class="pt-4">
        <button 
          @click="savePreferences"
          :disabled="isSaving"
          class="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Icon v-if="isSaving" name="mdi:loading" class="animate-spin size-5" />
          {{ isSaving ? 'Saving Changes...' : 'Update Profile' }}
        </button>
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
        <div v-if="isPartnerModalOpen" class="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-4">
          <div @click="isPartnerModalOpen = false" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[70vh]">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-400">Star Favorites</h4>
              <button @click="isPartnerModalOpen = false" class="text-emerald-600 font-black text-[10px] uppercase">Done</button>
            </div>
            
            <div class="p-3 overflow-y-auto flex-1 space-y-2">
              <button 
                v-for="p in roster" :key="p.id"
                @click="togglePartner(p.id)"
                class="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]"
                :class="localPrefs.favPartners?.includes(p.id) ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-transparent'"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">
                    {{ p.fname[0] }}{{ p.lname[0] }}
                  </div>
                  <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">{{ p.fname }} {{ p.lname }}</p>
                </div>
                <Icon 
                  :name="localPrefs.favPartners?.includes(p.id) ? 'mdi:star' : 'mdi:star-outline'" 
                  :class="localPrefs.favPartners?.includes(p.id) ? 'text-amber-500' : 'text-slate-300'"
                  class="size-6" 
                />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { collection, query, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";

const { player, updatePlayerLocal } = useAuth(); // Assuming your auth composable allows local state update
const { $db } = useNuxtApp();
const toast = useToast();

const courses = ref([]);
const roster = ref([]);
const isSaving = ref(false);
const isPartnerModalOpen = ref(false);

const localPrefs = ref({
  favCourse: player.value?.prefs?.favCourse || '',
  favTees: player.value?.prefs?.favTees || '',
  favPartners: player.value?.prefs?.favPartners ? [...player.value.prefs.favPartners] : []
});

// Logic to filter tees based on the selected favCourse
const currentCourseTees = computed(() => {
  const match = courses.value.find(c => c.name === localPrefs.favCourse);
  return match ? match.tees : [];
});

const getPlayerName = (id) => {
  const p = roster.value.find(r => r.id === id);
  return p ? `${p.fname} ${p.lname[0]}.` : 'Unknown';
};

const togglePartner = (id) => {
  const index = localPrefs.value.favPartners.indexOf(id);
  if (index > -1) {
    localPrefs.value.favPartners.splice(index, 1);
  } else {
    localPrefs.value.favPartners.push(id);
  }
};

const savePreferences = async () => {
  isSaving.value = true;
  try {
    const userRef = doc($db, "players", player.value.uid);
    await updateDoc(userRef, {
      prefs: { ...localPrefs.value }
    });
    
    // Sync local state so the home page updates instantly
    player.value.prefs = { ...localPrefs.value };
    toast.show("Preferences Updated!", "success");
  } catch (e) {
    console.error(e);
    toast.show("Failed to save", "error");
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  // 1. Fetch Courses & Tees
  const cSnap = await getDocs(query(collection($db, 'courses'), orderBy('name')));
  const cData = [];
  for (const d of cSnap.docs) {
    const tSnap = await getDocs(collection($db, `courses/${d.id}/tees`));
    cData.push({ 
      id: d.id, 
      name: d.data().name, 
      tees: tSnap.docs.map(t => t.data().name) 
    });
  }
  courses.value = cData;

  // 2. Fetch Full Roster for Partner Picking
  const pSnap = await getDocs(query(collection($db, 'players'), orderBy('fname')));
  roster.value = pSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.id !== player.value.uid);
});
</script>