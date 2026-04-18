<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="modelValue.isOpen" class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div @click.self="closeModal" class="absolute inset-0"></div>
        
        <div class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90dvh]">
          
          <div class="flex justify-between items-start mb-6">
            <div>
              <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                {{ modelValue.isLeague ? (modelValue.cadence === 'yearly' ? 'Yearly League' : 'Weekly League') : 'Casual Round' }}
              </p>
              <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none italic">
                {{ modelValue.isLeague ? modelValue.leagueName : 'Setup Round' }}
              </h3>
            </div>
            <button @click="closeModal" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="mdi:close" class="size-5" />
            </button>
          </div>

          <div class="overflow-y-auto space-y-6 pb-4 no-scrollbar">
            
            <div class="space-y-4">
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Course & Group Tees</label>
                <button @click="isCoursePickerOpen = true" class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl active:scale-[0.98] transition-all text-left">
                  <div class="flex flex-col">
                    <span class="font-black text-xs uppercase italic" :class="modelValue.data.course ? 'text-slate-800 dark:text-white' : 'text-slate-400'">
                      {{ modelValue.data.course || 'Select Course...' }}
                    </span>
                    <span v-if="modelValue.data.tees" class="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                      {{ modelValue.data.tees }}
                    </span>
                  </div>
                  <Icon name="mdi:pencil-circle" class="text-slate-400 size-6" />
                </button>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Holes to Play</label>
                <div class="flex bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-1 h-[56px]">
                  <button @click="modelValue.data.holes = 9" :class="modelValue.data.holes === 9 ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600 border-slate-200 dark:border-slate-700' : 'text-slate-400 border-transparent'" class="flex-1 text-xs font-black rounded-xl border transition-all">9</button>
                  <button @click="modelValue.data.holes = 18" :class="modelValue.data.holes === 18 ? 'bg-white dark:bg-slate-900 shadow-sm text-emerald-600 border-slate-200 dark:border-slate-700' : 'text-slate-400 border-transparent'" class="flex-1 text-xs font-black rounded-xl border transition-all">18</button>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 italic">
                Group ({{ modelValue.players.length }})
              </h4>
              
              <div class="space-y-2 mb-4">
                <div v-for="p in modelValue.players" :key="p.id" class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <div class="font-bold text-sm text-slate-800 dark:text-white uppercase">
                    {{ p.fname }} {{ p.lname?.charAt(0) }}.
                  </div>
                  <div class="flex items-center gap-3">
                    <button 
                      @click="openPlayerTeePicker(p)" 
                      class="px-3 py-1.5 bg-white dark:bg-slate-900 text-emerald-600 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
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
            @click="handleStartScoring" 
            :disabled="!modelValue.data.course || !modelValue.data.tees || modelValue.players.length === 0" 
            class="w-full mt-4 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Start Scoring
          </button>
        </div>
      </div>

      <CourseTeesModal 
        :is-open="isCoursePickerOpen"
        :selected-course="modelValue.data.course"
        :selected-tee="modelValue.data.tees"
        @close="isCoursePickerOpen = false"
        @pick="handleGroupPickerSelect"
      />

      <CourseTeesModal 
        :is-open="isPlayerTeePickerOpen"
        :selected-course="modelValue.data.course"
        :selected-tee="targetPlayer?.tee"
        @close="isPlayerTeePickerOpen = false"
        @pick="handlePlayerTeeSelect"
      />

      <PlayerPicker 
        v-model:is-open="isPlayerPickerOpen"
        :selected-players="modelValue.players"
        :can-create="false"
        mode="setup"
        @toggle="togglePlayer"
      />
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { ref, watch } from 'vue'
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'
import { useUIStore } from '~/stores/ui'
import { calcUSGACourseHandicap } from '~/utils/handicap'

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const { $db } = useNuxtApp();
const auth = useAuthStore();
const ui = useUIStore();

const isCoursePickerOpen = ref(false);
const isPlayerTeePickerOpen = ref(false);
const isPlayerPickerOpen = ref(false);
const isSubmitting = ref(false);
const targetPlayer = ref(null);

const handleGroupPickerSelect = (val) => {
  const updatedData = { ...props.modelValue.data, course: val.course, tees: val.tees };
  const updatedPlayers = props.modelValue.players.map(p => ({ ...p, tee: val.tees }));
  emit('update:modelValue', { ...props.modelValue, data: updatedData, players: updatedPlayers });
};

const openPlayerTeePicker = (player) => {
  if (!props.modelValue.data.course) return alert("Select a course first.");
  targetPlayer.value = player;
  isPlayerTeePickerOpen.value = true;
};

const handlePlayerTeeSelect = (val) => {
  const updatedPlayers = props.modelValue.players.map(p => 
    p.id === targetPlayer.value.id ? { ...p, tee: val.tees } : p
  );
  emit('update:modelValue', { ...props.modelValue, players: updatedPlayers });
};

const togglePlayer = (player) => {
  const current = [...props.modelValue.players];
  const idx = current.findIndex(p => p.id === player.id);
  if (idx > -1) {
    current.splice(idx, 1);
  } else if (current.length < 5) {
    current.push({ ...player, tee: props.modelValue.data.tees || '' });
  }
  emit('update:modelValue', { ...props.modelValue, players: current });
};

const closeModal = () => emit('update:modelValue', { ...props.modelValue, isOpen: false });

const handleStartScoring = async () => {
  if (isSubmitting.value || !props.modelValue.data.course) return;
  isSubmitting.value = true;
  ui.setLoading(true, "Capturing Course Data...");

  try {
    // 1. Resolve Course ID
    const courseQuery = query(collection($db, "courses"), where("name", "==", props.modelValue.data.course));
    const courseSnap = await getDocs(courseQuery);
    if (courseSnap.empty) throw new Error("Course not found");
    const courseId = courseSnap.docs[0].id;

    // 2. Fetch Tees Subcollection for Snapshot
    const teesSnap = await getDocs(collection($db, "courses", courseId, "tees"));
    const teesMap = {};
    teesSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.active !== false) {
        teesMap[data.name] = {
          active: data.active ?? true,
          hnds: data.hnds || [],
          name: data.name,
          rating: data.rating || 0,
          slope: data.slope || 0,
          pars: data.pars || [],
          old_rating: data.old_rating || data.rating,
          old_slope: data.old_slope || data.slope
        };
      }
    });

    // 3. Build Player Data & Map Handicaps
    const initialScores = {};
    const holeCount = props.modelValue.data.holes || 18;
    const selectedTeeName = props.modelValue.data.tees;

    const mappedPlayers = props.modelValue.players.map(p => {
      initialScores[p.id] = new Array(holeCount).fill(0);
      const teeInfo = teesMap[p.tee || selectedTeeName];
      let finalHcp = 0;
      
      if (props.modelValue.isLeague && p.leagueHandicaps?.[props.modelValue.leagueId]) {
        finalHcp = Math.round(p.leagueHandicaps[props.modelValue.leagueId]);
      } else {
        const rawIndex = parseFloat(p.ghin) || 0;
        // Calculate Total Par from snapshot array
        const totalPar = teeInfo?.pars ? teeInfo.pars.reduce((a,b) => a+b, 0) : 72;
        finalHcp = teeInfo 
          ? calcUSGACourseHandicap(rawIndex, teeInfo.slope, teeInfo.rating, totalPar) 
          : Math.round(rawIndex);
      }

      return {
        id: p.id,
        fname: p.fname,
        lname: p.lname,
        name: `${p.fname} ${p.lname}`,
        ghin: p.ghin || 0,
        index: finalHcp,
        tee: p.tee || selectedTeeName
      };
    });

    // 4. Submit Live Round
    const newRound = {
      status: 'live',
      iso: props.modelValue.data.iso || new Date().toISOString().split('T')[0],
      year: String((props.modelValue.data.iso || new Date().toISOString()).split('-')[0]),
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      createdBy: auth.user?.uid || 'anonymous',
      
      // League-specific logic
      type: props.modelValue.isLeague ? props.modelValue.type : 'casual',
      cadence: props.modelValue.isLeague ? (props.modelValue.cadence || 'weekly') : 'casual',
      leagueId: props.modelValue.leagueId || null,
      
      course: props.modelValue.data.course,
      tees: props.modelValue.data.tees,
      holes: holeCount,
      players: mappedPlayers,
      scores: initialScores,
      courseSnapshot: {
        name: props.modelValue.data.course,
        tees: teesMap
      },
      participantUids: props.modelValue.players.map(p => p.id).filter(id => !!id)
    };

    const docRef = await addDoc(collection($db, "live_rounds"), newRound);
    closeModal();
    navigateTo(`/rounds/${docRef.id}`);
  } catch (err) {
    console.error("Setup Error:", err);
    alert("Could not start round. Check course configuration.");
  } finally {
    isSubmitting.value = false;
    ui.setLoading(false);
  }
};
</script>