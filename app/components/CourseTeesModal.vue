<template>
  <Transition name="slide-up">
    <div v-if="isOpen" class="fixed inset-0 z-[300] flex items-end justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div @click="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80dvh]">
        
        <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-2">
            <button 
              v-if="step === 'tees'" 
              @click="step = 'course'" 
              class="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-emerald-500 active:scale-95 transition-all"
            >
              <Icon name="mdi:arrow-left" class="size-4" />
              <span class="text-[9px] font-black uppercase tracking-widest pr-1">Back to Courses</span>
            </button>
            
            <h4 v-else class="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Select Course
            </h4>
          </div>
          <button @click="$emit('close')" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400">
            <Icon name="mdi:close" class="size-4" />
          </button>
        </div>

        <div class="p-4 overflow-y-auto space-y-2 no-scrollbar min-h-[300px]">
          <div v-if="loading" class="py-12 flex flex-col items-center gap-3">
            <Icon name="svg-spinners:ring-resize" class="size-6 text-emerald-500" />
            <span class="text-[8px] font-black uppercase text-slate-400 tracking-widest">Loading...</span>
          </div>

          <template v-else>
            <template v-if="step === 'course'">
              <button 
                v-for="c in courses" :key="c.id" 
                @click="handleCourseSelect(c)"
                :class="selectedCourse === c.name ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800'"
                class="w-full p-4 rounded-2xl border-2 text-left transition-all flex justify-between items-center group bg-white dark:bg-slate-900"
              >
                <span class="font-black text-xs uppercase" :class="selectedCourse === c.name ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'">
                  {{ c.name }}
                </span>
                <Icon name="mdi:chevron-right" class="size-5 text-slate-300 group-hover:text-emerald-500" />
              </button>
            </template>

            <template v-if="step === 'tees'">
              
              <div v-if="leagueTeesType !== 'mixed'" class="space-y-2">
                <button 
                  v-for="t in standardTees" :key="t.id" 
                  @click="handleStandardTeeSelect(t)"
                  :class="selectedTee === t.name ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'"
                  class="w-full p-4 rounded-2xl border-2 text-left font-black text-xs uppercase transition-all flex justify-between items-center"
                >
                  <span :class="selectedTee === t.name ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'">
                    {{ t.name }}
                  </span>
                  <Icon v-if="selectedTee === t.name" name="mdi:check-circle" class="size-5 text-emerald-500" />
                </button>
                <p v-if="standardTees.length === 0" class="text-center text-xs text-slate-400 py-8 uppercase font-black tracking-widest">No matching tees found</p>
              </div>

              <div v-else class="space-y-6 pb-2">
                
                <div>
                  <h5 class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500 mb-2 px-1 flex items-center gap-1.5">
                    <Icon name="mdi:gender-male" class="size-3.5" /> Mens Tees
                  </h5>
                  <div class="space-y-2">
                    <button 
                      v-for="t in mixedMensTees" :key="'m'+t.id" 
                      @click="selectedMixedMens = t"
                      :class="selectedMixedMens?.id === t.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'"
                      class="w-full p-3.5 rounded-xl border-2 text-left font-black text-xs uppercase transition-all flex justify-between items-center"
                    >
                      <span :class="selectedMixedMens?.id === t.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'">{{ t.name }}</span>
                      <Icon v-if="selectedMixedMens?.id === t.id" name="mdi:check-circle" class="size-4 text-emerald-500" />
                    </button>
                  </div>
                </div>

                <div>
                  <h5 class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2 px-1 flex items-center gap-1.5">
                    <Icon name="mdi:gender-female" class="size-3.5" /> Ladies Tees
                  </h5>
                  <div class="space-y-2">
                    <button 
                      v-for="t in mixedLadiesTees" :key="'l'+t.id" 
                      @click="selectedMixedLadies = t"
                      :class="selectedMixedLadies?.id === t.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'"
                      class="w-full p-3.5 rounded-xl border-2 text-left font-black text-xs uppercase transition-all flex justify-between items-center"
                    >
                      <span :class="selectedMixedLadies?.id === t.id ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'">{{ t.name }}</span>
                      <Icon v-if="selectedMixedLadies?.id === t.id" name="mdi:check-circle" class="size-4 text-amber-500" />
                    </button>
                  </div>
                </div>

              </div>
            </template>
          </template>
        </div>

        <div v-if="step === 'tees' && leagueTeesType === 'mixed'" class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <button 
            @click="confirmMixedTees" 
            :disabled="!selectedMixedMens || !selectedMixedLadies"
            class="w-full py-3.5 bg-emerald-600 text-white font-black rounded-xl uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            Confirm Group Tees
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { collection, getDocs } from "firebase/firestore";

const props = defineProps({
  isOpen: Boolean,
  selectedCourse: String,
  selectedTee: String,
  leagueTeesType: { type: String, default: 'mens' } // Receives 'mens', 'ladies', or 'mixed'
});

const emit = defineEmits(['close', 'pick']);
const { $db } = useNuxtApp();

// --- STATE ---
const step = ref('course');
const loading = ref(false);
const courses = ref([]);
const tees = ref([]);

// Mixed Picker State
const selectedMixedMens = ref(null);
const selectedMixedLadies = ref(null);

// --- COMPUTED FILTERS ---
// For standard leagues, only show tees containing the exact tee_type ('mens' or 'ladies')
const standardTees = computed(() => {
  const typeToCheck = props.leagueTeesType === 'ladies' ? 'ladies' : 'mens';
  return tees.value.filter(t => (t.types || []).includes(typeToCheck));
});

// For mixed leagues, split the tees based on the array
const mixedMensTees = computed(() => tees.value.filter(t => (t.types || []).includes('mens')));
const mixedLadiesTees = computed(() => tees.value.filter(t => (t.types || []).includes('ladies')));


// --- DATA FETCHING ---
const fetchCourses = async () => {
  if (courses.value.length > 0) return;
  loading.value = true;
  try {
    const snap = await getDocs(collection($db, "courses"));
    courses.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Fetch Courses Error:", err);
  } finally {
    loading.value = false;
  }
};

const fetchTeesForCourse = async (courseId) => {
  loading.value = true;
  try {
    const teeRef = collection($db, "courses", courseId, "tees");
    const snap = await getDocs(teeRef);
    tees.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(t => t.active !== false)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } finally {
    loading.value = false;
  }
};


// --- ACTIONS ---
const handleCourseSelect = async (course) => {
  // Clear previous tee selections when changing course
  selectedMixedMens.value = null;
  selectedMixedLadies.value = null;
  
  emit('pick', { course: course.name, tees: '', teesId: '' });
  await fetchTeesForCourse(course.id);
  step.value = 'tees';
};

// Standard League Selection
const handleStandardTeeSelect = (tee) => {
  emit('pick', { course: props.selectedCourse, tees: tee.name, teesId: tee.id });
  emit('close');
};

// Mixed League Confirmation
const confirmMixedTees = () => {
  if (!selectedMixedMens.value || !selectedMixedLadies.value) return;
  
  emit('pick', { 
    course: props.selectedCourse, 
    tees: 'Mixed Tees', 
    teesId: 'mixed', 
    mensTees: selectedMixedMens.value.name,
    mensTeesId: selectedMixedMens.value.id,
    ladiesTees: selectedMixedLadies.value.name,
    ladiesTeesId: selectedMixedLadies.value.id
  });
  
  emit('close');
};

// --- LIFECYCLE / WATCHERS ---
watch(() => props.isOpen, async (open) => {
  if (open) {
    // Reset mixed state on open
    selectedMixedMens.value = null;
    selectedMixedLadies.value = null;

    await fetchCourses();
    
    if (props.selectedCourse) {
      const match = courses.value.find(c => c.name === props.selectedCourse);
      if (match) {
        await fetchTeesForCourse(match.id);
        step.value = 'tees';
        return;
      }
    }
    step.value = 'course';
  }
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>