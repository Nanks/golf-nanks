<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="isOpen" class="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div @click="$emit('update:isOpen', false)" class="absolute inset-0"></div>

          <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-[32px] sm:rounded-b-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85dvh] h-full sm:h-auto overflow-hidden">
            
            <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Select Players</h3>
                <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                  {{ selectedPlayers.length }} / 5 Selected
                </p>
              </div>
              <button @click="$emit('update:isOpen', false)" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full">
                <Icon name="mdi:check-bold" class="size-5 text-emerald-600" />
              </button>
            </div>

            <div class="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 shrink-0">
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

            <div class="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar min-h-[100px]">
              
              <div v-if="selectedPlayers.length > 0">
                <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">In Your Group</h4>
                <div class="grid gap-2">
                  <button 
                    v-for="p in selectedPlayers" :key="p.id"
                    @click="$emit('toggle', p)"
                    class="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 rounded-2xl transition-all"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                        {{ p.fname?.[0] || '' }}{{ p.lname?.[0] || '' }}
                      </div>
                      <span class="font-bold text-sm text-emerald-900 dark:text-emerald-100">{{ p.fname }} {{ p.lname }}</span>
                    </div>
                    <Icon name="mdi:minus-circle" class="text-emerald-600 size-5" />
                  </button>
                </div>
              </div>

              <div v-if="recentList.length > 0 && !searchQuery">
                <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Recently Played</h4>
                <div class="grid gap-2">
                  <button 
                    v-for="p in recentList" :key="p.id"
                    @click="$emit('toggle', p)"
                    class="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-300 transition-all"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-[10px] uppercase">
                        {{ p.fname?.[0] || '' }}{{ p.lname?.[0] || '' }}
                      </div>
                      <span class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ p.fname }} {{ p.lname }}</span>
                    </div>
                    <Icon name="mdi:plus-circle-outline" class="text-slate-300 size-5" />
                  </button>
                </div>
              </div>

              <div v-if="searchQuery.length >= 3">
                <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Search Results</h4>
                
                <div v-if="filteredResults.length === 0 && !isSearching" class="text-center py-4 text-xs text-slate-500 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  No members found matching "{{ searchQuery }}"
                </div>
                
                <div class="grid gap-2">
                  <button 
                    v-for="p in filteredResults" :key="p.id"
                    @click="$emit('toggle', p)"
                    class="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-300 transition-all shadow-sm"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-[10px] uppercase">
                        {{ p.fname?.[0] || '' }}{{ p.lname?.[0] || '' }}
                      </div>
                      <span class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ p.fname }} {{ p.lname }}</span>
                    </div>
                    <Icon name="mdi:plus-circle-outline" class="text-slate-300 size-5" />
                  </button>
                </div>
              </div>

            </div>

            <div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button @click="$emit('update:isOpen', false)" class="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase tracking-widest text-xs active:scale-95 transition-all">
                Done Selecting
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuthStore } from '~/stores/auth';

const props = defineProps(['isOpen', 'selectedPlayers']);
const emit = defineEmits(['update:isOpen', 'toggle']);

const { $db } = useNuxtApp();
const authStore = useAuthStore();

const searchQuery = ref('');
const searchResults = ref([]); // Must be a ref of an array
const isSearching = ref(false);
const recentPlayersProfiles = ref([]);

// 1. Fetch profiles for the "Recent Players" IDs on mount
onMounted(async () => {
  const ids = authStore.userProfile?.recentPlayers || [];
  if (ids.length > 0) {
    try {
      const q = query(collection($db, "players"), where("__name__", "in", ids));
      const snap = await getDocs(q);
      recentPlayersProfiles.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error("Failed to load recent players:", e);
    }
  }
});

// 2. Filter Recents
const recentList = computed(() => {
  const selectedIds = new Set(props.selectedPlayers.map(p => p.id));
  return recentPlayersProfiles.value.filter(p => !selectedIds.has(p.id));
});

// 3. Search Logic with Console Logs
watch(searchQuery, async (newQuery) => {
  console.log("🔍 WATCH TRIGGERED: Search Query Changed:", newQuery);
  const trimmed = newQuery?.trim();

  if (!trimmed || trimmed.length < 3) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  try {
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    console.log("🎯 QUERYING DB FOR:", capitalized);
    
    const q = query(
      collection($db, "players"),
      where("fname", ">=", capitalized),
      where("fname", "<=", capitalized + '\uf8ff'),
      limit(8)
    );

    const snap = await getDocs(q);
    console.log("📦 DB RETURNED DOCS:", snap.docs.length);

    // Map docs into a fresh array
    const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // FORCE REACTIVITY: Reassign the entire array using spread operator
    searchResults.value = [...docs];
    console.log("✅ STATE UPDATED: searchResults.value length is now:", searchResults.value.length);

  } catch (e) {
    console.error("❌ Search error:", e);
  } finally {
    isSearching.value = false;
  }
});

// 4. Filter Search Results with Console Log
const filteredResults = computed(() => {
  // Grab current search results
  const results = searchResults.value || [];
  const selectedIds = new Set(props.selectedPlayers.map(p => p.id));
  
  // Filter out people already selected
  const final = results.filter(p => !selectedIds.has(p.id));
  
  console.log("⚡ COMPUTED FIRED: filteredResults length is:", final.length);
  
  return final;
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>