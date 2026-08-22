<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-2xl mx-auto pb-24">
    <header class="mb-8">
      <h1 class="text-4xl font-black text-emerald-600 uppercase tracking-tighter leading-none">
        My Profile
      </h1>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Personalize your Experience</p>
    </header>

    <div v-if="authStore.userProfile" class="space-y-6">
      
      <section class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <Icon name="mdi:cog" class="text-emerald-600 size-5" />
          <h2 class="font-black uppercase tracking-tight text-slate-800 dark:text-white">Round Defaults</h2>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Favorite Course</label>
          <Listbox v-model="localPrefs.favCourseId">
            <div class="relative">
              <ListboxButton class="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-left text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors">
                <span class="block truncate uppercase">{{ localPrefs.favCourse || 'None Selected' }}</span>
                <Icon name="mdi:chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none size-5" />
              </ListboxButton>

              <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <ListboxOptions class="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-slate-900 py-2 text-sm shadow-xl ring-1 ring-black/5 focus:outline-none border border-slate-200 dark:border-slate-800">
                  <ListboxOption v-slot="{ active, selected }" value="">
                    <li :class="[active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300', 'relative cursor-pointer select-none py-2.5 pl-4 pr-10 transition-colors']">
                      <span :class="[selected ? 'font-black' : 'font-bold', 'block truncate uppercase']">None Selected</span>
                      <Icon v-if="selected" name="mdi:check-circle" class="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 size-5 text-emerald-500" />
                    </li>
                  </ListboxOption>
                  <ListboxOption v-for="c in courses" :key="c.id" v-slot="{ active, selected }" :value="c.id">
                    <li :class="[active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300', 'relative cursor-pointer select-none py-2.5 pl-4 pr-10 transition-colors']">
                      <span :class="[selected ? 'font-black' : 'font-bold', 'block truncate uppercase']">{{ c.name }}</span>
                      <Icon v-if="selected" name="mdi:check-circle" class="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 size-5 text-emerald-500" />
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </div>
          </Listbox>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between items-center ml-1">
             <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Tees</label>
             <span v-if="authStore.userProfile?.tee_type" class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{{ authStore.userProfile.tee_type }} Only</span>
          </div>
          <Listbox v-model="localPrefs.favTeesId" :disabled="!currentCourseTees.length">
            <div class="relative">
              <ListboxButton class="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-left text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50">
                <span class="block truncate uppercase">{{ localPrefs.favTees || (localPrefs.favCourseId ? 'None Selected' : 'Select a course first') }}</span>
                <Icon name="mdi:chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none size-5" />
              </ListboxButton>

              <transition leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <ListboxOptions class="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-slate-900 py-2 text-sm shadow-xl ring-1 ring-black/5 focus:outline-none border border-slate-200 dark:border-slate-800">
                  <ListboxOption v-slot="{ active, selected }" value="">
                    <li :class="[active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300', 'relative cursor-pointer select-none py-2.5 pl-4 pr-10 transition-colors']">
                      <span :class="[selected ? 'font-black' : 'font-bold', 'block truncate uppercase']">None Selected</span>
                      <Icon v-if="selected" name="mdi:check-circle" class="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 size-5 text-emerald-500" />
                    </li>
                  </ListboxOption>
                  <ListboxOption v-for="t in currentCourseTees" :key="t.id" v-slot="{ active, selected }" :value="t.id">
                    <li :class="[active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300', 'relative cursor-pointer select-none py-2.5 pl-4 pr-10 transition-colors']">
                      <span :class="[selected ? 'font-black' : 'font-bold', 'block truncate uppercase']">{{ t.name }}</span>
                      <Icon v-if="selected" name="mdi:check-circle" class="absolute inset-y-0 right-4 top-1/2 -translate-y-1/2 size-5 text-emerald-500" />
                    </li>
                  </ListboxOption>
                </ListboxOptions>
              </transition>
            </div>
          </Listbox>
        </div>
      </section>

      <section class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="flex items-center gap-2">
              <Icon name="mdi:star" class="text-amber-500 size-5" />
              <h2 class="font-black uppercase tracking-tight text-slate-800 dark:text-white">Playing Partners</h2>
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-7">
              {{ localPrefs.favPartners?.length || 0 }} Starred
            </p>
          </div>
          
          <button 
            @click="isPartnerModalOpen = true"
            class="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 active:scale-90 transition-all shadow-sm"
          >
            <Icon name="mdi:pencil" class="size-4" />
          </button>
        </div>

        <div v-if="localPrefs.favPartners?.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div 
            v-for="pId in localPrefs.favPartners" :key="pId" 
            class="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl"
          >
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 text-xs shadow-sm border border-slate-100 dark:border-slate-700">
                {{ getPlayerInitials(pId) }}
              </div>
              <span class="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                {{ getPlayerFullName(pId) }}
              </span>
            </div>
            <button @click="togglePartner(pId)" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors active:scale-90">
              <Icon name="mdi:close-circle" class="size-5" />
            </button>
          </div>
        </div>

        <div v-else class="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">No favorites yet</p>
          <button 
            @click="isPartnerModalOpen = true"
            class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 rounded-lg active:scale-95 transition-all shadow-sm"
          >
            Add Partners
          </button>
        </div>
      </section>

      <div class="pt-4">
        <button 
          @click="savePreferences"
          :disabled="isSaving"
          class="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
        >
          <Icon v-if="isSaving" name="mdi:loading" class="animate-spin size-5" />
          {{ isSaving ? 'Saving Changes...' : 'Update Profile' }}
        </button>
      </div>
    </div>

    <LazyPlayerPicker
      :is-open="isPartnerModalOpen"
      :selected-players="favoritePlayerObjects"
      :exclude-id="authStore.userProfile?.id"
      mode="favorites"
      @update:is-open="isPartnerModalOpen = $event"
      @toggle="(p) => togglePartner(p.id)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { collection, query, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { useAuthStore } from '~/stores/auth';
import { useData } from '~/stores/data';
import { useConfirm } from '~/composables/useConfirm';

const { $db } = useNuxtApp();
const authStore = useAuthStore();
const dataStore = useData();
const confirm = useConfirm();

const roster = ref([]);
const isSaving = ref(false);
const isPartnerModalOpen = ref(false);

// Initialize with Names AND IDs
const localPrefs = ref({
  favCourse: authStore.userProfile?.prefs?.favCourse || '',
  favCourseId: authStore.userProfile?.prefs?.favCourseId || '',
  favTees: authStore.userProfile?.prefs?.favTees || '',
  favTeesId: authStore.userProfile?.prefs?.favTeesId || '',
  favPartners: authStore.userProfile?.prefs?.favPartners ? [...authStore.userProfile.prefs.favPartners] : []
});

const courses = computed(() => dataStore.courses);

const currentCourseTees = computed(() => {
  // Use Course ID instead of Name for exact matching
  const match = courses.value.find(c => c.id === localPrefs.value.favCourseId);
  if (!match || !match.tees) return [];
  
  const playerTeeType = authStore.userProfile?.tee_type;
  
  return Object.values(match.tees)
    .filter(t => t.active !== false)
    .filter(t => {
      if (playerTeeType && t.types) {
        return t.types.includes(playerTeeType);
      }
      return true; 
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
});

// --- WATCHERS ---
// Keep names perfectly in sync when the IDs change
watch(() => localPrefs.value.favCourseId, (newId, oldId) => {
  // If the user changed the course explicitly, clear the tees
  if (oldId && newId !== oldId) {
    localPrefs.value.favTeesId = '';
    localPrefs.value.favTees = '';
  }
  const match = courses.value.find(c => c.id === newId);
  localPrefs.value.favCourse = match ? match.name : '';
});

watch(() => localPrefs.value.favTeesId, (newId) => {
  const match = currentCourseTees.value.find(t => t.id === newId);
  localPrefs.value.favTees = match ? match.name : '';
});


// --- METHODS ---
const favoritePlayerObjects = computed(() => {
  if (!roster.value.length) return [];
  return localPrefs.value.favPartners
    .map(id => roster.value.find(r => r.id === id))
    .filter(Boolean);
});

const getPlayerInitials = (id) => {
  const p = roster.value.find(r => r.id === id);
  return p ? `${p.fname[0]}${p.lname[0]}`.toUpperCase() : '??';
};

const getPlayerFullName = (id) => {
  const p = roster.value.find(r => r.id === id);
  return p ? `${p.fname} ${p.lname}` : 'Unknown Player';
};

const togglePartner = (id) => {
  if (!Array.isArray(localPrefs.value.favPartners)) {
    localPrefs.value.favPartners = [];
  }
  const index = localPrefs.value.favPartners.indexOf(id);
  if (index > -1) {
    localPrefs.value.favPartners.splice(index, 1);
  } else {
    localPrefs.value.favPartners.push(id);
  }
};

const savePreferences = async () => {
  if (!authStore.userProfile?.id) return;
  
  isSaving.value = true;
  try {
    const userRef = doc($db, "players", authStore.userProfile.id);
    await updateDoc(userRef, { prefs: { ...localPrefs.value } });
    authStore.userProfile.prefs = { ...localPrefs.value };
    
    await confirm.ask(
      "Profile Updated", 
      "Your default tees, course, and favorite partners have been saved successfully.", 
      {
        confirmText: "Got it",
        icon: "mdi:check-circle",
        iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
        iconColor: "text-emerald-500",
        confirmBtnClass: "bg-emerald-600 hover:bg-emerald-700"
      }
    );
  } catch (e) {
    console.error("Failed to save preferences:", e);
    await confirm.ask("Error", "There was an error saving your preferences.", {
        confirmText: "Close",
        icon: "mdi:alert-circle",
        iconBg: "bg-red-50 dark:bg-red-950/30",
        iconColor: "text-red-500",
        confirmBtnClass: "bg-red-600 hover:bg-red-700"
    });
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  // SILENT MIGRATION: Auto-fill IDs if the user only has legacy string names saved
  if (localPrefs.value.favCourse && !localPrefs.value.favCourseId) {
    const cMatch = courses.value.find(c => c.name === localPrefs.value.favCourse);
    if (cMatch) {
      localPrefs.value.favCourseId = cMatch.id;
      if (localPrefs.value.favTees) {
        const tMatch = Object.values(cMatch.tees).find(t => t.name === localPrefs.value.favTees);
        if (tMatch) localPrefs.value.favTeesId = tMatch.id;
      }
    }
  }

  try {
    const pSnap = await getDocs(query(collection($db, 'players'), orderBy('fname')));
    roster.value = pSnap.docs.map(d => ({ id: d.id, ...d.data() })); 
  } catch (err) {
    console.error("Error fetching roster for profile:", err);
  }
});
</script>