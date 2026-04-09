<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="isOpen" class="fixed inset-0 z-[300] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div @click="$emit('update:isOpen', false)" class="absolute inset-0"></div>

          <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-[32px] rounded-b-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
            
            <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1"></div>

            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Select Players</h3>
                <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                  {{ selectedPlayers.length }} / 5 Selected
                </p>
              </div>
              <button @click="$emit('update:isOpen', false)" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
                <Icon name="mdi:check-bold" class="size-5 text-emerald-600" />
              </button>
            </div>

            <div class="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <div class="relative">
                <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search members..." 
                  class="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all"
                />
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
              
              <div v-if="selectedPlayers.length > 0">
                <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">In Your Group</h4>
                <div class="grid gap-2">
                  <button 
                    v-for="p in selectedPlayers" :key="p.id"
                    @click="$emit('toggle', p)"
                    class="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 rounded-2xl transition-all"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {{ p.fname[0] }}{{ p.lname[0] }}
                      </div>
                      <span class="font-bold text-sm text-emerald-900 dark:text-emerald-100">{{ p.fname }} {{ p.lname }}</span>
                    </div>
                    <Icon name="mdi:minus-circle" class="text-emerald-600 size-5" />
                  </button>
                </div>
              </div>

              <div>
                <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Available Members</h4>
                <div class="grid gap-2">
                  <button 
                    v-for="p in filteredAvailable" :key="p.id"
                    @click="$emit('toggle', p)"
                    class="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all active:scale-[0.98]"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-xs uppercase">
                        {{ p.fname[0] }}{{ p.lname[0] }}
                      </div>
                      <span class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ p.fname }} {{ p.lname }}</span>
                    </div>
                    <Icon name="mdi:plus-circle-outline" class="text-slate-300 dark:text-slate-600 size-5" />
                  </button>
                </div>
              </div>
            </div>

            <div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <button @click="$emit('update:isOpen', false)" class="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase tracking-widest text-xs active:scale-95 transition-all">
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
import { useData } from '~/stores/data';

const props = defineProps(['isOpen', 'selectedPlayers', 'isLeague', 'leagueId']);
const emit = defineEmits(['update:isOpen', 'toggle']);

const dataStore = useData();
const searchQuery = ref('');

// Filter logic: Only show players not already in the group, filtered by search
const filteredAvailable = computed(() => {
  // 1. Log the state to your console (F12) to see if data is actually there
  // console.log('PlayerPicker Debug - Store Players:', dataStore.players);

  // 2. Safety check: If store or players is missing, return empty array
  if (!dataStore?.players) return [];

  const selectedIds = new Set(props.selectedPlayers.map(p => p.id));
  
  // 3. Robust conversion: Handle both Map and plain Object formats
  let list = [];
  if (dataStore.players instanceof Map) {
    list = Array.from(dataStore.players.values());
  } else {
    list = Object.values(dataStore.players);
  }

  // 4. Filter and Sort
  return list
    .filter(p => !selectedIds.has(p.id))
    .filter(p => {
      const fullName = `${p.fname} ${p.lname}`.toLowerCase();
      return fullName.includes(searchQuery.value.toLowerCase());
    })
    .sort((a, b) => a.fname.localeCompare(b.fname));
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>