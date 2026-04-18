<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div @click="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
            {{ isEditing ? 'Manage' : 'Add' }} Event
          </h3>
          <button @click="$emit('close')" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
            <Icon name="mdi:close" class="size-5" />
          </button>
        </div>
        
        <div class="space-y-6">
          <div>
            <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Event Date</label>
            <div class="relative">
              <input 
                v-model="localEvent.iso" 
                type="date" 
                class="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase text-xs dark:text-white outline-none focus:border-emerald-500 transition-all appearance-none" 
              />
              <Icon name="mdi:calendar" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 shadow-inner">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Course & Group Tees</p>
                <p class="font-black dark:text-white uppercase italic text-sm tracking-tighter">
                  {{ localEvent.course || 'TBD' }} <span class="text-slate-300 dark:text-slate-700 mx-1">/</span> {{ localEvent.tees || 'TBD' }}
                </p>
              </div>
              <button @click="isPickerOpen = true" class="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all">
                <Icon name="mdi:pencil" class="size-4 text-emerald-500" />
              </button>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2 ml-1">
              <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <button @click="localEvent.status = null" class="text-[8px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors">Clear</button>
            </div>
            <div class="grid grid-cols-5 gap-1.5">
              <button 
                v-for="s in statusOptions" :key="s.value" 
                @click="localEvent.status = s.value"
                :class="localEvent.status === s.value ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-100 dark:border-slate-800'"
                class="flex flex-col items-center p-2 rounded-xl border-2 transition-all active:scale-95 shadow-sm"
              >
                <Icon :name="s.icon" class="size-4 mb-1" />
                <span class="text-[7px] font-black uppercase text-center leading-tight">{{ s.label }}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Active Games</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-for="g in gameOptions" :key="g" 
                @click="toggleGame(g)"
                :class="localEvent.game?.includes(g) ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-800' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-100 dark:border-slate-800'"
                class="p-3 rounded-xl border-2 text-[8px] font-black uppercase transition-all flex items-center justify-center text-center leading-tight"
              >
                {{ g }}
              </button>
            </div>
          </div>

          <div v-if="isEditing && localEvent.game?.includes('Blind Best Ball')" class="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
             </div>
        </div>

        <button @click="handleSave" :disabled="!localEvent.course || !localEvent.iso" class="w-full mt-8 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50">
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
  { label: 'Live', value: null, icon: 'mdi:golf' }, // Reset to planned/live
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
      bbb_pairings: props.event.bbb_pairings || []
    };
  } else {
    // Defaults from League Doc or fallback
    localEvent.value = {
      iso: new Date().toISOString().split('T')[0],
      course: props.league?.course || 'Elks', 
      tees: props.league?.tees || 'Blue',
      game: ['Gross Skins', 'Net Skins', 'Deuce Pot', 'Blind Best Ball'],
      status: null, 
      money: 1, 
      holes: 18, 
      per: 20,
      bbb_pairings: []
    };
  }
});
</script>