<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-4">
        <div @click="$emit('update:isOpen', false)" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[75vh]">
          <div class="p-5 border-b flex justify-between items-center bg-slate-50">
            <h4 class="text-xs font-black uppercase text-slate-400">Select Players</h4>
            <button @click="$emit('update:isOpen', false)" class="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-full"><Icon name="mdi:check" class="size-5" /></button>
          </div>
          <div v-if="isLoading" class="flex-1 flex justify-center items-center"><div class="w-8 h-8 border-4 border-t-emerald-600 rounded-full animate-spin"></div></div>
          <div v-else class="p-3 overflow-y-auto flex-1 space-y-6">
            <div v-if="selectedPlayers.length > 0">
              <p class="text-[10px] font-black text-emerald-600 uppercase mb-2">In Your Group</p>
              <button v-for="p in selectedPlayers" :key="p.id" @click="$emit('toggle', p)" class="w-full flex justify-between p-4 rounded-2xl border-2 bg-emerald-50 border-emerald-200 mb-2">
                <p class="text-emerald-700 font-bold">{{ p.fname }} {{ p.lname }}</p>
                <div class="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center"><Icon name="mdi:check" class="text-white size-4" /></div>
              </button>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase mb-2">Available</p>
              <button v-for="p in unselectedRoster" :key="p.id" @click="$emit('toggle', p)" class="w-full flex justify-between p-4 rounded-2xl border-2 border-transparent hover:bg-slate-50 mb-2">
                <p class="text-slate-800 font-bold">{{ p.fname }} {{ p.lname }}</p>
                <div class="w-6 h-6 rounded-full border-2 border-slate-200"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { collection, query, getDocs, where } from "firebase/firestore";
const props = defineProps(['isOpen', 'selectedPlayers', 'isLeague', 'leagueId']);
const emit = defineEmits(['update:isOpen', 'toggle']);
const { $db } = useNuxtApp();

const isLoading = ref(false);
const availableRoster = ref([]);
const unselectedRoster = computed(() => availableRoster.value.filter(p => !props.selectedPlayers.map(s => s.id).includes(p.id)));

watch(() => props.isOpen, async (newVal) => {
  if (newVal && availableRoster.value.length === 0) {
    isLoading.value = true;
    const q = props.isLeague ? query(collection($db, "players"), where("leagues", "array-contains", props.leagueId)) : query(collection($db, "players"));
    const snap = await getDocs(q);
    availableRoster.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    isLoading.value = false;
  }
});
</script>