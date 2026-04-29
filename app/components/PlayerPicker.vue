<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-show="isOpen" class="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm">
          <div @click="closePicker" class="absolute inset-0"></div>

          <div class="relative bg-white dark:bg-stone-900 w-full max-w-sm rounded-t-[32px] sm:rounded-b-[32px] shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[85dvh] h-full sm:h-auto overflow-hidden">
            
            <div class="w-12 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>

            <div class="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center shrink-0">
              <div>
                <h3 class="text-xl font-black text-stone-800 dark:text-white uppercase tracking-tight italic">
                  {{ isCreatingManual ? 'New Player' : (mode === 'setup' ? 'Select Group' : 'Add to Roster') }}
                </h3>
                <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                  {{ isCreatingManual ? 'Adding to Database' : selectedPlayers.length + ' Selected' }}
                </p>
              </div>
              
              <button 
                @click="isCreatingManual ? isCreatingManual = false : closePicker()" 
                :class="isCreatingManual 
                  ? 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700' 
                  : 'text-emerald-700 dark:text-emerald-500 bg-emerald-500/15 border border-emerald-500/30'"
                class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-transform shadow-sm"
              >
                <template v-if="isCreatingManual">
                  <Icon name="mdi:arrow-left" class="size-3.5" />
                  <span>Back</span>
                </template>
                <template v-else>
                  <span>Done</span>
                  <Icon name="mdi:check-bold" class="size-3.5" />
                </template>
              </button>
            </div>

            <div v-if="!isCreatingManual && selectedPlayers.length > 0" class="px-4 py-2.5 bg-stone-50 dark:bg-stone-800/30 border-b border-stone-100 dark:border-stone-800 shrink-0 shadow-sm z-10">
              <h4 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                <Icon name="mdi:check-circle" class="size-3" /> In Your Group
              </h4>
              <div class="grid gap-1 max-h-[35vh] overflow-y-auto no-scrollbar">
                <button 
                  v-for="p in selectedPlayers" :key="p.id"
                  @click="$emit('toggle', p)"
                  class="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg w-full active:scale-[0.98] transition-transform text-left"
                >
                  <span class="font-black italic text-sm text-emerald-700 dark:text-emerald-400 uppercase tracking-tight truncate pr-4">
                    {{ p.lname }}, {{ p.fname }}
                  </span>
                  <Icon name="mdi:minus-circle" class="text-emerald-500 size-4 shrink-0" />
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 no-scrollbar">
              
              <div v-if="isCreatingManual" class="space-y-4 pt-2 pb-6">
                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1">First Name</label>
                    <input v-model="form.fname" type="text" class="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-sm dark:text-white outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1">Last Name</label>
                    <input v-model="form.lname" type="text" class="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-sm dark:text-white outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1">Phone Number</label>
                  <input v-model="form.phone" type="tel" placeholder="(555) 000-0000" class="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-sm dark:text-white outline-none focus:border-emerald-500 transition-colors" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1">GHIN Index</label>
                    <input v-model="form.ghin" type="number" step="0.1" class="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-sm dark:text-white outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-1">Tee Type</label>
                    <div class="flex gap-1 p-1 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl h-[52px]">
                      <button 
                        type="button"
                        @click="form.tee_type = 'mens'"
                        :class="[
                          'flex-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                          form.tee_type === 'mens' ? 'bg-white dark:bg-stone-800 text-emerald-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                        ]"
                      >Mens</button>
                      <button 
                        type="button"
                        @click="form.tee_type = 'ladies'"
                        :class="[
                          'flex-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                          form.tee_type === 'ladies' ? 'bg-white dark:bg-stone-800 text-emerald-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                        ]"
                      >Ladies</button>
                    </div>
                  </div>
                </div>

                <button @click="submitManual" class="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs mt-4 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                  Create & Add to List
                </button>
              </div>

              <div v-else class="pb-4">
                <div class="flex items-center justify-between mb-2.5 px-1">
                  <h4 class="text-[10px] font-black text-stone-400 uppercase tracking-widest">Available Players</h4>
                  
                  <button 
                    v-if="canCreate" 
                    @click="startManualCreate" 
                    class="text-[9px] font-black text-amber-700 dark:text-amber-500 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-transform shadow-sm"
                  >
                    <Icon name="mdi:account-plus" class="size-3.5" /> New
                  </button>
                </div>

                <div v-if="isLoading" class="py-8 text-center">
                  <Icon name="svg-spinners:ring-resize" class="size-6 text-emerald-500" />
                </div>

                <div v-else-if="availablePlayers.length === 0" class="py-8 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                  <p class="text-[10px] font-black uppercase tracking-widest text-stone-400">No players found</p>
                </div>

                <div v-else class="grid gap-1">
                  <button 
                    v-for="p in availablePlayers" :key="p.id"
                    @click="$emit('toggle', p)"
                    class="flex items-center justify-between px-3 py-2 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/50 rounded-lg w-full active:scale-[0.98] transition-transform text-left"
                  >
                    <span class="font-bold text-sm text-stone-700 dark:text-stone-200 uppercase tracking-tight truncate pr-4">
                      {{ p.lname }}, {{ p.fname }}
                    </span>
                    <Icon name="mdi:plus-circle-outline" class="text-stone-400 size-4 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  selectedPlayers: Array,
  canCreate: { type: Boolean, default: false },
  mode: { type: String, default: 'manage' },
  defaultTeeType: { type: String, default: 'mens' },
  leagueId: { type: String, default: null } 
});

const emit = defineEmits(['update:isOpen', 'toggle', 'create-new']);

const { $db } = useNuxtApp();

const allPlayers = ref([]);
const isLoading = ref(false);

// --- FORM STATE ---
const isCreatingManual = ref(false);
const form = ref({ 
  fname: '', 
  lname: '', 
  phone: '', 
  ghin: 0.0, 
  tee_type: props.defaultTeeType === 'ladies' ? 'ladies' : 'mens' 
});

const startManualCreate = () => {
  form.value = { 
    fname: '', 
    lname: '', 
    phone: '', 
    ghin: 0.0,
    tee_type: props.defaultTeeType === 'ladies' ? 'ladies' : 'mens'
  };
  isCreatingManual.value = true;
};

const submitManual = () => {
  if (!form.value.fname || !form.value.lname) return alert("Full name required.");
  emit('create-new', { ...form.value });
  isCreatingManual.value = false;
};

const closePicker = () => {
  isCreatingManual.value = false;
  emit('update:isOpen', false);
};

// --- DATA FETCHING ---
watch(() => props.isOpen, async (opened) => {
  if (opened && allPlayers.value.length === 0) {
    isLoading.value = true;
    try {
      let qRef = collection($db, "players");

      if (props.leagueId) {
        qRef = query(qRef, where("leagues", "array-contains", props.leagueId));
      }

      const snap = await getDocs(qRef);
      
      allPlayers.value = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (a.lname || '').localeCompare(b.lname || ''));
        
    } catch (e) {
      console.error("Error fetching players:", e);
    } finally {
      isLoading.value = false;
    }
  }
});

const availablePlayers = computed(() => {
  const selectedIds = new Set(props.selectedPlayers.map(p => p.id));
  return allPlayers.value.filter(p => !selectedIds.has(p.id));
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>