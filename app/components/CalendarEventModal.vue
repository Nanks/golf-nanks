<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div @click="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase mb-6">
          {{ isEditing ? 'Edit' : 'Add' }} {{ isWeekly ? 'Weekly' : 'Yearly' }} Event
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Date (ISO)</label>
            <input v-model="localEvent.iso" type="date" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:border-emerald-500" />
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Course</label>
              <select v-model="localEvent.course" @mousedown="ensureCoursesFetched" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500 appearance-none">
                <option v-if="!hasFetchedCourses && localEvent.course" :value="localEvent.course">{{ localEvent.course }}</option>
                <option v-for="c in coursesList" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Tees</label>
              <select v-model="localEvent.tees" @mousedown="ensureCoursesFetched" :disabled="!localEvent.course" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500 appearance-none disabled:opacity-50">
                <option v-for="(data, teeName) in selectedCourseObj?.tees" :key="teeName" :value="teeName">{{ teeName }}</option>
              </select>
            </div>
          </div>

          <div v-if="!isWeekly">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Status</label>
            <div class="grid grid-cols-4 gap-2">
              <button 
                v-for="s in statusOptions" :key="s.value"
                @click="localEvent.status = s.value"
                :class="localEvent.status === s.value ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'"
                class="flex flex-col items-center justify-center p-2 rounded-xl transition-all"
              >
                <Icon :name="s.icon" class="size-4 mb-1" />
                <span class="text-[8px] font-black uppercase">{{ s.label }}</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Game</label>
              <select v-model="localEvent.game" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500 appearance-none">
                <option v-for="g in availableGames" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Multiplier</label>
              <input v-model.number="localEvent.money" type="number" step="0.5" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div v-if="localEvent.game === 'Vegas'">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">DD Holes (Max 2)</label>
            <div class="flex gap-2">
              <input v-model.number="ddInput" type="number" min="1" max="18" placeholder="Hole #" class="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500" />
              <button @click="addDDHole" :disabled="localEvent.ddHole.length >= 2" class="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-xs uppercase disabled:opacity-30">Add</button>
            </div>
            <div class="flex gap-2 mt-2">
              <span v-for="h in localEvent.ddHole" :key="h" @click="removeDDHole(h)" class="px-3 py-1 bg-amber-500 text-white rounded-full text-[10px] font-black cursor-pointer">Hole {{ h }} ×</span>
            </div>
          </div>

          <div v-if="isWeekly" class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Holes</label>
              <select v-model="localEvent.holes" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500 appearance-none">
                <option :value="9">9 Holes</option>
                <option :value="18">18 Holes</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Per Payout</label>
              <select v-model="localEvent.per" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500 appearance-none">
                <option :value="5">$5</option>
                <option :value="10">$10</option>
                <option :value="20">$20</option>
              </select>
            </div>
          </div>
        </div>

        <button @click="handleSave" :disabled="!localEvent.iso || !localEvent.course" class="w-full mt-6 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
          {{ isEditing ? 'Save Changes' : 'Create Event' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { collection, getDocs } from "firebase/firestore";

const props = defineProps({
  isOpen: Boolean,
  event: Object, 
  isWeekly: Boolean,
  defaultCourse: String,
  defaultTees: String
});

const emit = defineEmits(['close', 'save']);
const { $db } = useNuxtApp();

const coursesList = ref([]);
const hasFetchedCourses = ref(false);
const ddInput = ref(null);

const availableGames = ['Stroke Play', 'Chicago Points', 'Vegas', 'Best Ball', 'Skins', 'Stableford', 'Scramble', 'Match Play'];

const statusOptions = [
  { label: 'Complete', value: 'mdi-check-bold', icon: 'mdi:check-bold' },
  { label: 'Hcp', value: 'Handicap', icon: 'mdi:calculator' },
  { label: 'Practice', value: 'mdi-alpha-p-circle-outline', icon: 'mdi:alpha-p-circle-outline' },
  { label: 'Rain', value: 'Rainout', icon: 'mdi:weather-rainy' }
];

const localEvent = ref({
  iso: '', course: '', tees: '', game: 'Stroke Play', status: null, money: 1, year: null, ddHole: [], holes: 18, per: 10
});

const ensureCoursesFetched = async () => {
  if (hasFetchedCourses.value) return;
  const snap = await getDocs(collection($db, "courses"));
  coursesList.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  hasFetchedCourses.value = true;
};

const selectedCourseObj = computed(() => coursesList.value.find(c => c.name === localEvent.value.course));
const isEditing = computed(() => !!props.event?.id);

const addDDHole = () => {
  if (ddInput.value && !localEvent.value.ddHole.includes(ddInput.value)) {
    localEvent.value.ddHole.push(ddInput.value);
    ddInput.value = null;
  }
};

const removeDDHole = (h) => {
  localEvent.value.ddHole = localEvent.value.ddHole.filter(item => item !== h);
};

watch(() => props.isOpen, (opened) => {
  if (!opened) return;
  if (props.event) {
    localEvent.value = { ...props.event, ddHole: props.event.ddHole || [] };
  } else {
    localEvent.value = {
      iso: new Date().toISOString().split('T')[0],
      course: props.defaultCourse || '', 
      tees: props.defaultTees || '',
      game: 'Stroke Play', status: null, money: 1, ddHole: [],
      holes: 18, per: 10
    };
  }
});

const handleSave = () => {
  const year = parseInt(localEvent.value.iso.split('-')[0]);
  emit('save', { ...localEvent.value, year });
};
</script>