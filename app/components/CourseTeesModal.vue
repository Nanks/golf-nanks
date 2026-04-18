<template>
  <Transition name="slide-up">
    <div v-if="isOpen" class="fixed inset-0 z-[300] flex items-end justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div @click="$emit('close')" class="absolute inset-0"></div>
      
      <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[70dvh]">
        
        <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
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
                class="w-full p-4 rounded-2xl border-2 text-left transition-all flex justify-between items-center group"
              >
                <span class="font-black text-xs uppercase" :class="selectedCourse === c.name ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'">
                  {{ c.name }}
                </span>
                <Icon name="mdi:chevron-right" class="size-5 text-slate-300 group-hover:text-emerald-500" />
              </button>
            </template>

            <template v-if="step === 'tees'">
              <button 
                v-for="t in tees" :key="t.id" 
                @click="handleTeeSelect(t.name)"
                :class="selectedTee === t.name ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800'"
                class="w-full p-4 rounded-2xl border-2 text-left font-black text-xs uppercase transition-all flex justify-between items-center"
              >
                <span :class="selectedTee === t.name ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'">
                  {{ t.name }}
                </span>
                <Icon v-if="selectedTee === t.name" name="mdi:check-circle" class="size-5 text-emerald-500" />
              </button>
            </template>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { collection, getDocs } from "firebase/firestore";

const props = defineProps({
  isOpen: Boolean,
  selectedCourse: String,
  selectedTee: String
});

const emit = defineEmits(['close', 'pick']);
const { $db } = useNuxtApp();

const step = ref('course');
const loading = ref(false);
const courses = ref([]);
const tees = ref([]);

const fetchCourses = async () => {
  if (courses.value.length > 0) return;
  loading.value = true;
  try {
    const snap = await getDocs(collection($db, "courses"));
    // Fixed: variable name was changed from coursesList to courses
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

const handleCourseSelect = async (course) => {
  emit('pick', { course: course.name, tees: '' });
  await fetchTeesForCourse(course.id);
  step.value = 'tees';
};

const handleTeeSelect = (teeName) => {
  emit('pick', { course: props.selectedCourse, tees: teeName });
  emit('close');
};

watch(() => props.isOpen, async (open) => {
  if (open) {
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