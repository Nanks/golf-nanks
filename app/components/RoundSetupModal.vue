<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="modelValue.isOpen" class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90dvh]">
          
          <div class="flex justify-between items-start mb-6">
            <div>
              <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                {{ modelValue.isLeague ? (modelValue.type === 'yearly' ? 'Yearly League' : 'Weekly League') : 'Casual Round' }}
              </p>
              <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                {{ modelValue.isLeague ? modelValue.leagueName : 'Setup Round' }}
              </h3>
            </div>
            <button @click="closeModal" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="mdi:close" class="size-5" />
            </button>
          </div>

          <div v-if="isLoadingCourses" class="py-16 flex flex-col items-center justify-center space-y-4">
            <Icon name="svg-spinners:ring-resize" class="size-8 text-emerald-500" />
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Courses...</span>
          </div>

          <div v-else class="overflow-y-auto space-y-6 pb-4 no-scrollbar">
            
            <div v-if="modelValue.isLeague" class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Course</span>
                <span class="font-black dark:text-white">{{ modelValue.data.course }}</span>
              </div>
              <div class="flex justify-between items-center pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Group Tees</span>
                <span class="font-black dark:text-white">{{ modelValue.data.tees }}</span>
              </div>
              <div v-if="modelValue.data.game === 'Vegas' && modelValue.data.ddHole?.length" class="flex justify-between items-center pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                <span class="text-[10px] uppercase font-black text-slate-400 tracking-widest text-amber-500">DD Holes</span>
                <span class="font-black dark:text-amber-400">{{ modelValue.data.ddHole.join(' & ') }}</span>
              </div>
            </div>

            <div v-else class="space-y-4">
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
                      :disabled="modelValue.isLeague || modelValue.isYearly"
                      :class="modelValue.isYearly ? 'opacity-50 bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-900 text-emerald-600 border-slate-200 dark:border-slate-700 active:scale-95 hover:border-emerald-300'"
                      class="px-3 py-1.5 border-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                    >
                      {{ p.tee || modelValue.data.tees || 'Tee...' }}
                    </button>
                    <button @click="togglePlayer(p)" class="text-slate-300 hover:text-red-500 transition-colors">
                      <Icon name="mdi:close-circle" class="size-5" />
                    </button>
                  </div>
                </div>
              </div>

              <button @click="isPlayerPickerOpen = true" class="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                + Add Players
              </button>
            </div>
          </div>

          <button 
            v-if="!isLoadingCourses" 
            @click="handleStartScoring" 
            :disabled="!modelValue.data.course || !modelValue.data.tees || modelValue.players.length === 0" 
            class="w-full mt-4 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Start Scoring
          </button>
        </div>
      </div>

      <Transition name="slide-up">
        <div v-if="picker.isOpen" class="fixed inset-0 z-[300] flex items-end justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[70dvh]">
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
                  v-for="c in localCourses" :key="c.id || c.name" 
                  @click="selectCourse(c.name || c.id)" 
                  :class="modelValue.data.course === (c.name || c.id) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'" 
                  class="w-full p-4 rounded-2xl border-2 text-left font-bold text-sm uppercase transition-all flex justify-between items-center"
                >
                  {{ c.name || c.id }} 
                  <Icon v-if="modelValue.data.course === (c.name || c.id)" name="mdi:check-circle" class="size-5" />
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

      <PlayerPicker 
        v-model:is-open="isPlayerPickerOpen"
        :selected-players="modelValue.players"
        @toggle="togglePlayer"
      />
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { calcCourseHandicap } from '~/utils/gameLogic'

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue', 'start']);

const { $db } = useNuxtApp();
const auth = useAuthStore();
const ui = useUIStore();

const picker = ref({ isOpen: false, type: 'course', targetPlayerId: null });
const isPlayerPickerOpen = ref(false);
const localCourses = ref([]);
const isLoadingCourses = ref(false);
const isSubmitting = ref(false);

const fetchCourses = async () => {
  if (localCourses.value.length > 0) return; 
  isLoadingCourses.value = true;
  try {
    const coursesMap = await fetchFullCourseData($db);
    localCourses.value = Array.from(coursesMap.values());
  } catch (e) {
    console.error("Failed to load courses:", e);
  } finally {
    isLoadingCourses.value = false;
  }
};

watch(() => props.modelValue.isOpen, (isOpen) => {
  if (isOpen) fetchCourses();
});

const availableTees = computed(() => {
  if (!localCourses.value.length || !props.modelValue?.data?.course) return [];
  const match = localCourses.value.find(c => (c.name || c.id) === props.modelValue.data.course);
  if (!match || !match.tees) return [];
  return typeof match.tees === 'object' && !Array.isArray(match.tees) 
    ? Object.keys(match.tees).filter(t => match.tees[t]?.active === true)
    : Array.isArray(match.tees) ? match.tees : [];
});

const selectCourse = (name) => {
  emit('update:modelValue', { ...props.modelValue, data: { ...props.modelValue.data, course: name, tees: '' } });
  picker.value.type = 'tees';
};

const openGlobalTeePicker = () => picker.value = { isOpen: true, type: 'tees', targetPlayerId: null };
const openPlayerTeePicker = (playerId) => { 
  if (!props.modelValue.data.course || props.modelValue.isYearly) return; 
  picker.value = { isOpen: true, type: 'tees', targetPlayerId: playerId }; 
};

const selectTee = (name) => {
  if (picker.value.targetPlayerId) {
    const updatedPlayers = props.modelValue.players.map(p => p.id === picker.value.targetPlayerId ? { ...p, tee: name } : p);
    emit('update:modelValue', { ...props.modelValue, players: updatedPlayers });
  } else {
    const updatedPlayers = props.modelValue.players.map(p => ({ ...p, tee: name }));
    emit('update:modelValue', { ...props.modelValue, players: updatedPlayers, data: { ...props.modelValue.data, tees: name } });
  }
  picker.value.isOpen = false;
};

const togglePlayer = (player) => {
  const currentPlayers = [...props.modelValue.players];
  const idx = currentPlayers.findIndex(p => p.id === player.id);
  if (idx > -1) {
    currentPlayers.splice(idx, 1);
  } else if (currentPlayers.length < 5) {
    currentPlayers.push({ ...player, tee: props.modelValue.data.tees || '' });
  }
  emit('update:modelValue', { ...props.modelValue, players: currentPlayers });
};

const closeModal = () => {
  emit('update:modelValue', { ...props.modelValue, isOpen: false });
  picker.value.isOpen = false;
  isPlayerPickerOpen.value = false;
};

const handleStartScoring = async () => {
  if (isSubmitting.value || ui.isGlobalLoading || !props.modelValue.data.course) return;
  isSubmitting.value = true;
  ui.setLoading(true, "Preparing Scorecard...");

  try {
    const courseObj = localCourses.value.find(c => (c.name || c.id) === props.modelValue.data.course);
    const teeData = courseObj?.tees?.[props.modelValue.data.tees];
    const initialScores = {};
    const holeCount = props.modelValue.data.holes || 18;

    const mappedPlayers = props.modelValue.players.map(p => {
      let finalHcp = 0;
      if (props.modelValue.isLeague && p.leagueHandicaps?.[props.modelValue.leagueId]) {
        finalHcp = p.leagueHandicaps[props.modelValue.leagueId];
      } else {
        const rawIndex = parseFloat(p.ghin) || 0;
        finalHcp = teeData ? calcCourseHandicap(rawIndex, teeData.slope, teeData.rating, teeData.par || 72) : Math.round(rawIndex);
      }

      initialScores[p.id] = new Array(holeCount).fill(0);

      return {
        id: p.id,
        fname: p.fname,
        lname: p.lname,
        name: `${p.fname} ${p.lname}`, // Align with historical Name lookup
        ghin: p.ghin || 0,
        index: finalHcp,               // Align with historical Index lookup
        tee: p.tee || props.modelValue.data.tees
      };
    });

    const newRound = {
      status: 'live',
      iso: props.modelValue.data.iso || new Date().toISOString().split('T')[0],
      year: String((props.modelValue.data.iso || new Date().toISOString()).split('-')[0]), // Align with historical year: string
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      createdBy: auth.user?.uid || 'anonymous',
      course: props.modelValue.data.course,
      courseSnapshot: {
        name: courseObj?.name || props.modelValue.data.course,
        tees: courseObj?.tees || {}
      },
      tees: props.modelValue.data.tees,
      holes: holeCount,
      type: props.modelValue.isLeague ? props.modelValue.type : 'casual',
      leagueId: props.modelValue.leagueId || null,
      players: mappedPlayers,
      scores: initialScores,
      participantUids: props.modelValue.players.flatMap(p => p.uids || []).filter(u => !!u)
    };

    const docRef = await addDoc(collection($db, "live_rounds"), newRound);

    // Update Recents
    if (auth.user?.uid) {
      const partnerIds = props.modelValue.players.map(p => p.id).filter(id => id !== auth.user.uid);
      if (partnerIds.length > 0) {
        const updatedRecent = [...new Set([...partnerIds, ...(auth.userProfile?.recentPlayers || [])])].slice(0, 5);
        await updateDoc(doc($db, "players", auth.user.uid), { recentPlayers: updatedRecent });
        if (auth.userProfile) auth.userProfile.recentPlayers = updatedRecent;
      }
    }

    closeModal();
    navigateTo(`/rounds/${docRef.id}`);
  } catch (err) {
    console.error(err);
    isSubmitting.value = false;
    ui.setLoading(false);
  }
};
</script>