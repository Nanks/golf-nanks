<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase">
            {{ isEditing ? 'Edit' : 'Add' }} Event
          </h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
            <Icon name="mdi:close" class="size-6" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Date</label>
            <input v-model="localEvent.iso" type="date" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white outline-none focus:border-emerald-500" />
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Course</label>
              <input v-model="localEvent.course" placeholder="e.g. Elks" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Tees</label>
              <input v-model="localEvent.tees" placeholder="e.g. Blue" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Game Format</label>
            <select v-model="localEvent.game" class="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold dark:text-white text-sm outline-none focus:border-emerald-500 appearance-none">
              <option value="Stroke Play">Stroke Play</option>
              <option value="Chicago Points">Chicago Points</option>
              <template v-if="isWeekly">
                <option value="Scramble">Scramble</option>
                <option value="Best Ball">Best Ball</option>
                <option value="Alternate Shot">Alternate Shot</option>
                <option value="Match Play">Match Play</option>
                <option value="Stableford">Stableford</option>
                <option value="Skins">Skins</option>
              </template>
            </select>
          </div>

          <div v-if="isWeekly">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Holes Played</label>
            <div class="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
              <button 
                v-for="n in ['Front 9', 'Back 9', '18 Holes']" :key="n"
                @click="localEvent.ninePlayed = n"
                :class="localEvent.ninePlayed === n ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'"
                class="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                {{ n }}
              </button>
            </div>
          </div>
        </div>

        <button @click="handleSave" :disabled="!localEvent.iso" class="w-full mt-6 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-emerald-900/20">
          {{ isEditing ? 'Save Changes' : 'Create Event' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { collection, getDocs } from "firebase/firestore";

const { $db } = useNuxtApp();

const props = defineProps({
  isOpen: Boolean,
  event: Object, 
  isWeekly: Boolean
});

const emit = defineEmits(['close', 'save']);

// Local State for Courses Database
const coursesList = ref([]);

// Fetch courses once directly from DB
onMounted(async () => {
  try {
    const snap = await getDocs(collection($db, "courses"));
    coursesList.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Failed to load courses for modal:", err);
  }
});

// Editable Games Array
const availableGames = ref([
  'Stroke Play',
  'Chicago Points',
  'Scramble',
  'Best Ball',
  'Alternate Shot',
  'Match Play',
  'Stableford',
  'Skins'
]);

const isEditing = computed(() => !!props.event?.id);

const localEvent = ref({
  iso: new Date().toISOString().split('T')[0],
  course: '',
  tees: '',
  game: 'Stroke Play',
  ninePlayed: '18 Holes'
});

// Reactively calculate available tees based on selected course
const selectedCourseObj = computed(() => {
  return coursesList.value.find(c => c.name === localEvent.value.course);
});

const availableTees = computed(() => {
  if (!selectedCourseObj.value) return [];
  return selectedCourseObj.value.tees || [];
});

// Watch course changes to reset tees
watch(() => localEvent.value.course, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    localEvent.value.tees = '';
  }
});

// Sync incoming props to local state
watch(() => props.event, (newVal) => {
  if (newVal) {
    localEvent.value = { ...newVal };
  } else {
    localEvent.value = {
      iso: new Date().toISOString().split('T')[0],
      course: '', 
      tees: '',
      game: 'Stroke Play',
      ninePlayed: props.isWeekly ? 'Front 9' : '18 Holes'
    };
  }
}, { immediate: true });

const handleSave = () => {
  emit('save', { ...localEvent.value });
};
</script>