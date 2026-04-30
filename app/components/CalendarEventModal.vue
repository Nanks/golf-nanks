<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div @click="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
            {{ isEditing ? 'Manage' : 'Add' }} Event
          </h3>
          <button @click="$emit('close')" class="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 active:scale-95 transition-transform">
            <Icon name="mdi:close" class="size-5" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label>
            <div class="relative">
              <input 
                v-model="localEvent.iso" 
                type="date" 
                class="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black uppercase text-sm dark:text-white outline-none focus:border-emerald-500 transition-all appearance-none" 
              />
              <Icon name="mdi:calendar" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 size-5 pointer-events-none" />
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 shadow-inner">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Course & Group Tees</p>
                <p class="font-black dark:text-white uppercase italic text-sm tracking-tighter">
                  {{ localEvent.course || 'TBD' }} <span class="text-slate-300 dark:text-slate-700 mx-1">/</span> {{ localEvent.tees || 'TBD' }}
                </p>
              </div>
              <button @click="isPickerOpen = true" class="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all">
                <Icon name="mdi:pencil" class="size-4 text-emerald-500" />
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Holes</label>
              <div class="flex gap-1 p-1 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl h-[46px]">
                <button 
                  @click="localEvent.holes = 9"
                  :class="localEvent.holes === 9 ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
                  class="flex-1 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                >9</button>
                <button 
                  @click="localEvent.holes = 18"
                  :class="localEvent.holes === 18 ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
                  class="flex-1 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all"
                >18</button>
              </div>
            </div>

            <div v-if="league?.cadence === 'weekly'">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">$ Per Player</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input 
                  v-model.number="localEvent.per" 
                  type="number" 
                  class="w-full py-3 pr-3 pl-7 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black text-sm dark:text-white outline-none focus:border-emerald-500 transition-all h-[46px]" 
                />
              </div>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5 ml-1">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <button @click="localEvent.status = null" class="text-[9px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Clear</button>
            </div>
            <div class="grid grid-cols-5 gap-1.5">
              <button 
                v-for="s in statusOptions" :key="s.value" 
                @click="localEvent.status = s.value"
                :class="localEvent.status === s.value 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[inset_0_0_8px_rgba(16,185,129,0.1)]' 
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-100 dark:border-slate-800'"
                class="relative flex flex-col items-center p-2 rounded-xl border-2 transition-all active:scale-95"
              >
                <Icon v-if="localEvent.status === s.value" name="mdi:check-circle" class="absolute top-0.5 right-0.5 size-2.5 text-emerald-500" />
                <Icon :name="s.icon" class="size-4 mb-1" />
                <span class="text-[8px] font-black uppercase text-center leading-tight">{{ s.label }}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Active Games</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-for="g in gameOptions" :key="g" 
                @click="toggleGame(g)"
                :class="localEvent.game?.includes(g) 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 shadow-[inset_0_0_8px_rgba(16,185,129,0.1)]' 
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800'"
                class="p-2.5 rounded-xl border-2 transition-all flex items-center justify-start gap-2 active:scale-[0.98]"
              >
                <Icon 
                  :name="localEvent.game?.includes(g) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" 
                  :class="localEvent.game?.includes(g) ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'"
                  class="size-4 shrink-0 transition-colors" 
                />
                <span class="text-[9px] font-black uppercase leading-tight text-left">{{ g }}</span>
              </button>
            </div>
          </div>

          <div v-if="isEditing && localEvent.game?.includes('Blind Best Ball')" class="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
             </div>
        </div>

        <button @click="handleSave" :disabled="!localEvent.course || !localEvent.iso" class="w-full mt-6 py-3.5 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50">
          {{ isEditing ? 'Update Event' : 'Create Event' }}
        </button>
      </div>

      <CourseTeesModal 
        :is-open="isPickerOpen"
        :selected-course="localEvent.course"
        :selected-tee="localEvent.tees"
        @close="isPickerOpen = false"
        @pick="(val) => { localEvent.course = val.course; localEvent.tees = val.tees }"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  event: Object, 
  league: Object
});

const emit = defineEmits(['close', 'save']);

// --- STATE ---
const isPickerOpen = ref(false);
const localEvent = ref({
  iso: '', course: '', tees: '', game: [], status: null, money: 1, holes: 18, per: 20, bbb_pairings: []
});

const statusOptions = [
  { label: 'Live', value: null, icon: 'mdi:golf' }, 
  { label: 'Complete', value: 'complete', icon: 'mdi:check-bold' },
  { label: 'Practice', value: 'practice', icon: 'mdi:alpha-p-circle-outline' },
  { label: 'Hcp', value: 'handicap', icon: 'mdi:calculator' },
  { label: 'Rain', value: 'rain', icon: 'mdi:weather-pouring' }
];

const gameOptions = [
  'Gross Skins', 'Net Skins', 'Deuce Pot', 'Blind Best Ball', 
  'Chicago Points', 'Modified Chicago'
];

// --- COMPUTED ---
const isEditing = computed(() => !!props.event?.id);

// --- METHODS ---
const toggleGame = (g) => {
  if (!Array.isArray(localEvent.value.game)) localEvent.value.game = [];
  const idx = localEvent.value.game.indexOf(g);
  idx > -1 ? localEvent.value.game.splice(idx, 1) : localEvent.value.game.push(g);
};

const handleSave = () => {
  emit('save', { ...localEvent.value });
};

// --- WATCHERS ---
watch(() => props.isOpen, (opened) => {
  if (!opened) return;
  
  if (props.event) {
    localEvent.value = { 
      ...props.event, 
      game: Array.isArray(props.event.game) ? props.event.game : [],
      bbb_pairings: props.event.bbb_pairings || [],
      // Use existing values, fallback to league defaults, ultimate fallback to static numbers
      holes: props.event.holes || props.league?.holes || 18,
      per: props.event.per || props.league?.per || 20
    };
  } else {
    localEvent.value = {
      iso: new Date().toISOString().split('T')[0],
      course: props.league?.course || 'Elks', 
      tees: props.league?.tees || 'Blue',
      game: ['Gross Skins', 'Net Skins', 'Deuce Pot', 'Blind Best Ball'],
      status: null, 
      money: 1, 
      // Populate defaults from the league document
      holes: props.league?.holes || 18, 
      per: props.league?.per || 20,
      bbb_pairings: []
    };
  }
});
</script>