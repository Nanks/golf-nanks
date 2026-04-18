<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-show="isOpen" class="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div @click="closePicker" class="absolute inset-0"></div>

          <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-[32px] sm:rounded-b-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh] h-full sm:h-auto overflow-hidden">
            
            <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">
                  {{ isCreatingManual ? 'New Player' : (mode === 'setup' ? 'Select Group' : 'Add to Roster') }}
                </h3>
                <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                  {{ isCreatingManual ? 'Adding to Database' : selectedPlayers.length + ' Selected' }}
                </p>
              </div>
              <button 
                @click="isCreatingManual ? isCreatingManual = false : closePicker()" 
                class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full active:scale-95 transition-transform"
              >
                <Icon :name="isCreatingManual ? 'mdi:arrow-left' : 'mdi:check-bold'" class="size-5 text-emerald-600" />
              </button>
            </div>

            <div v-if="!isCreatingManual" class="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div class="relative">
                <Icon :name="isSearching ? 'svg-spinners:ring-resize' : 'mdi:magnify'" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search members by name..." 
                  class="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-9 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all"
                />
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 no-scrollbar min-h-[150px]">
              
              <div v-if="mode === 'setup' && selectedPlayers.length > 0 && !isCreatingManual" class="mb-6">
                <h4 class="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 ml-1">Current Group</h4>
                <div class="grid gap-2">
                  <div 
                    v-for="p in selectedPlayers" :key="p.id"
                    class="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                        {{ p.fname?.[0] }}{{ p.lname?.[0] }}
                      </div>
                      <span class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ p.fname }} {{ p.lname }}</span>
                    </div>
                    <button @click="$emit('toggle', p)" class="text-emerald-500 active:scale-90 transition-transform">
                      <Icon name="mdi:minus-circle" class="size-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="isCreatingManual" class="space-y-4 pt-2 pb-6">
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[9px] font-black uppercase text-slate-400 ml-1">First Name</label>
                    <input v-model="form.fname" type="text" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[9px] font-black uppercase text-slate-400 ml-1">Last Name</label>
                    <input v-model="form.lname" type="text" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] font-black uppercase text-slate-400 ml-1">Phone Number</label>
                  <input v-model="form.phone" type="tel" placeholder="(555) 000-0000" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div class="space-y-1">
                  <label class="text-[9px] font-black uppercase text-slate-400 ml-1">GHIN Index</label>
                  <input v-model="form.ghin" type="number" step="0.1" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <button @click="submitManual" class="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs mt-4 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
                  Create & Add to Roster
                </button>
              </div>

              <div v-else class="space-y-6">
                <div v-if="recentList.length > 0 && !searchQuery">
                  <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Available</h4>
                  <div class="grid gap-2">
                    <button 
                      v-for="p in recentList" :key="p.id"
                      @click="$emit('toggle', p)"
                      class="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-300 transition-all"
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-[10px] uppercase">
                          {{ p.fname?.[0] }}{{ p.lname?.[0] }}
                        </div>
                        <span class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ p.fname }} {{ p.lname }}</span>
                      </div>
                      <Icon name="mdi:plus-circle-outline" class="text-slate-300 size-5" />
                    </button>
                  </div>
                </div>

                <div v-if="searchQuery.length >= 3">
                  <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Search Results</h4>
                  <div v-if="filteredResults.length === 0 && !isSearching" class="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl mb-4">
                     <p class="text-xs text-slate-400 italic font-medium">No matches found.</p>
                  </div>
                  <div class="grid gap-2">
                    <button 
                      v-for="p in filteredResults" :key="p.id"
                      @click="$emit('toggle', p)"
                      class="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-300 transition-all shadow-sm"
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-[10px] uppercase">
                          {{ p.fname?.[0] }}{{ p.lname?.[0] }}
                        </div>
                        <span class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ p.fname }} {{ p.lname }}</span>
                      </div>
                      <Icon name="mdi:plus-circle-outline" class="text-slate-300 size-5" />
                    </button>
                  </div>

                  <div v-if="canCreate && mode !== 'setup'" class="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
                    <button 
                      @click="startManualCreate"
                      class="w-full py-4 border-2 border-dashed border-emerald-500/30 rounded-2xl flex items-center justify-center gap-2 group hover:border-emerald-500 transition-all"
                    >
                      <Icon name="mdi:account-plus" class="size-5 text-emerald-500" />
                      <span class="text-xs font-black uppercase text-emerald-600">Add "{{ searchQuery }}" Manually</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button 
                @click="closePicker" 
                class="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase tracking-widest text-xs active:scale-95 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuthStore } from '~/stores/auth';

const props = defineProps({
  isOpen: Boolean,
  selectedPlayers: Array,
  canCreate: { type: Boolean, default: false },
  mode: { type: String, default: 'manage' } // 'manage' (roster) or 'setup' (round)
});

const emit = defineEmits(['update:isOpen', 'toggle', 'create-new']);

const { $db } = useNuxtApp();
const authStore = useAuthStore();

const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const recentPlayersProfiles = ref([]);

// --- FORM STATE ---
const isCreatingManual = ref(false);
const form = ref({ fname: '', lname: '', phone: '', ghin: 0.0 });

const startManualCreate = () => {
  const [f, ...l] = searchQuery.value.split(' ');
  form.value = { fname: f || '', lname: l.join(' ') || '', phone: '', ghin: 0.0 };
  isCreatingManual.value = true;
};

const submitManual = () => {
  if (!form.value.fname || !form.value.lname) return alert("Full name required.");
  emit('create-new', { ...form.value });
  isCreatingManual.value = false;
  searchQuery.value = '';
};

const closePicker = () => {
  isCreatingManual.value = false;
  searchQuery.value = '';
  emit('update:isOpen', false);
};

// --- RECENT PLAYERS ---
const fetchRecentProfiles = async (ids) => {
  if (!ids?.length) return;
  try {
    const q = query(collection($db, "players"), where("__name__", "in", ids));
    const snap = await getDocs(q);
    recentPlayersProfiles.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { console.error(e); }
};

watch(() => authStore.userProfile?.recentPlayers, (ids) => {
  if (ids) fetchRecentProfiles(ids);
}, { immediate: true });

const recentList = computed(() => {
  const selectedIds = new Set(props.selectedPlayers.map(p => p.id));
  return recentPlayersProfiles.value.filter(p => !selectedIds.has(p.id));
});

// --- SEARCH LOGIC ---
watch(searchQuery, async (q) => {
  const trimmed = q?.trim();
  if (!trimmed || trimmed.length < 3) {
    searchResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const qSnap = await getDocs(query(
      collection($db, "players"),
      where("fname", ">=", capitalized),
      where("fname", "<=", capitalized + '\uf8ff'),
      limit(10)
    ));
    searchResults.value = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } finally {
    isSearching.value = false;
  }
});

const filteredResults = computed(() => {
  const selectedIds = new Set(props.selectedPlayers.map(p => p.id));
  return searchResults.value.filter(p => !selectedIds.has(p.id));
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>