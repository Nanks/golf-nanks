<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="modelValue.isOpen" class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
          
          <div class="flex justify-between items-start mb-6">
            <div>
              <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                {{ modelValue.isLeague ? 'League Event' : 'Casual Round' }}
              </p>
              <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                {{ modelValue.isLeague ? modelValue.leagueName : 'Setup Round' }}
              </h3>
            </div>
            <button @click="closeModal" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="mdi:close" class="size-5" />
            </button>
          </div>

          <div class="overflow-y-auto space-y-6 pb-4 no-scrollbar">
            
            <div v-if="!modelValue.isLeague" class="space-y-4">
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Course</label>
                <button @click="picker.type = 'course'; picker.isOpen = true" class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl active:scale-[0.98] transition-all text-left">
                  <span :class="modelValue.data.course ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-400 font-medium'">
                    {{ modelValue.data.course || 'Select Course...' }}
                  </span>
                  <Icon name="mdi:chevron-right" class="text-slate-400 size-5" />
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Group Tees</label>
                  <button @click="modelValue.data.course ? openGlobalTeePicker() : null" :disabled="!modelValue.data.course" class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl active:scale-[0.98] transition-all text-left disabled:opacity-50">
                    <span :class="modelValue.data.tees ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-400 font-medium'">
                      {{ modelValue.data.tees || 'Tees...' }}
                    </span>
                    <Icon name="mdi:chevron-right" class="text-slate-400 size-4" />
                  </button>
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Holes</label>
                  <div class="flex bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-1 h-[56px]">
                    <button @click="modelValue.data.holes = 9" :class="modelValue.data.holes === 9 ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600 border-slate-200 dark:border-slate-700' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'" class="flex-1 text-xs font-black rounded-xl border transition-all">9</button>
                    <button @click="modelValue.data.holes = 18" :class="modelValue.data.holes === 18 ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600 border-slate-200 dark:border-slate-700' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300'" class="flex-1 text-xs font-black rounded-xl border transition-all">18</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Course</span>
                  <span class="font-black dark:text-white">{{ modelValue.data.course }}</span>
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Group Tees</span>
                  <span class="font-black dark:text-white">{{ modelValue.data.tees }}</span>
                </div>
            </div>

            <div>
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">Group ({{ modelValue.players.length }})</h4>
              
              <div class="space-y-2 mb-4">
                <div v-for="p in modelValue.players" :key="p.id" class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <div class="font-bold text-sm text-slate-800 dark:text-white">
                    {{ p.fname }} {{ p.lname?.charAt(0) }}.
                  </div>
                  <div class="flex items-center gap-3">
                    <button 
                      @click="openPlayerTeePicker(p.id)" 
                      :disabled="modelValue.isYearly"
                      :class="modelValue.isYearly ? 'opacity-50 bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-900 text-emerald-600 border-slate-200 dark:border-slate-700 active:scale-95 hover:border-emerald-300'"
                      class="px-3 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                    >
                      {{ p.tee || modelValue.data.tees || 'Tee...' }}
                    </button>
                    <button @click="$emit('toggle-player', p)" class="text-slate-300 hover:text-red-500 transition-colors">
                      <Icon name="mdi:close-circle" class="size-5" />
                    </button>
                  </div>
                </div>
              </div>

              <button @click="$emit('open-picker')" class="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                + Add Players
              </button>
            </div>
          </div>

          <button @click="$emit('start')" class="w-full mt-4 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all">
            Start Scoring
          </button>
        </div>
      </div>

      <Transition name="slide-up">
        <div v-if="picker.isOpen" class="fixed inset-0 z-[300] flex items-end justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[70vh]">
            <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h4 class="text-sm font-black uppercase tracking-widest text-slate-400">
                {{ picker.type === 'course' ? 'Select Course' : (picker.targetPlayerId ? 'Player Tee' : 'Group Tees') }}
              </h4>
              <button @click="picker.isOpen = false" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="mdi:close" class="size-4" />
              </button>
            </div>
            
            <div class="p-4 overflow-y-auto space-y-2 no-scrollbar">
              <template v-if="picker.type === 'course'">
                <button 
                  v-for="c in courses" :key="c.id" 
                  @click="selectCourse(c.name)" 
                  :class="modelValue.data.course === c.name ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'" 
                  class="w-full p-4 rounded-2xl border-2 text-left font-bold text-sm uppercase transition-all flex justify-between items-center"
                >
                  {{ c.name }} <Icon v-if="modelValue.data.course === c.name" name="mdi:check-circle" class="size-5" />
                </button>
              </template>

              <template v-if="picker.type === 'tees'">
                <button 
                  v-for="t in availableTees" :key="t" 
                  @click="selectTee(t)" 
                  class="w-full p-4 rounded-2xl border-2 text-left font-bold text-sm uppercase transition-all flex justify-between items-center border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                >
                  {{ t }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </Transition>

    </Teleport>
  </ClientOnly>
</template>

<script setup>
const props = defineProps(['modelValue', 'courses']);
const emit = defineEmits(['update:modelValue', 'toggle-player', 'open-picker', 'start']);

const picker = ref({ isOpen: false, type: 'course', targetPlayerId: null });

const availableTees = computed(() => {
  if (!props.courses || !props.modelValue?.data?.course) return [];
  const match = props.courses.find(c => c.name === props.modelValue.data.course);
  if (!match || !match.tees) return [];

  // Filter for Active Tees
  if (typeof match.tees === 'object' && !Array.isArray(match.tees)) {
    return Object.keys(match.tees).filter(t => match.tees[t]?.active === true);
  }
  return Array.isArray(match.tees) ? match.tees : [];
});

const selectCourse = (name) => {
  emit('update:modelValue', { ...props.modelValue, data: { ...props.modelValue.data, course: name, tees: '' } });
  picker.value.type = 'tees';
  picker.value.targetPlayerId = null;
};

// Controls the Global Tee Picker
const openGlobalTeePicker = () => {
  picker.value = { isOpen: true, type: 'tees', targetPlayerId: null };
};

// Controls a specific Player's Tee Picker
const openPlayerTeePicker = (playerId) => {
  // Prevent opening if no course is selected or if it's a locked Yearly League
  if (!props.modelValue.data.course || props.modelValue.isYearly) return; 
  picker.value = { isOpen: true, type: 'tees', targetPlayerId: playerId };
};

const selectTee = (name) => {
  if (picker.value.targetPlayerId) {
    // 1. Target Player Specific: Update only their tee
    const updatedPlayers = props.modelValue.players.map(p => 
      p.id === picker.value.targetPlayerId ? { ...p, tee: name } : p
    );
    emit('update:modelValue', { ...props.modelValue, players: updatedPlayers });
  } else {
    // 2. Global Selection: Set global AND cascade default to all players
    const updatedPlayers = props.modelValue.players.map(p => ({ ...p, tee: name }));
    emit('update:modelValue', { 
      ...props.modelValue, 
      players: updatedPlayers,
      data: { ...props.modelValue.data, tees: name } 
    });
  }
  picker.value.isOpen = false;
};

const closeModal = () => {
  emit('update:modelValue', { ...props.modelValue, isOpen: false });
  picker.value.isOpen = false;
};
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>