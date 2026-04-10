<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
        <div @click.stop class="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8 overflow-hidden relative">
          
          <div class="mb-8">
            <p class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Update Handicap</p>
            <h2 class="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              {{ player.fname }} {{ player.lname }}
            </h2>
          </div>

          <div class="space-y-6">
            <div class="relative">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-4 bg-white dark:bg-slate-900 px-2">
                GHIN Index
              </label>
              <input 
                v-model="localGhin"
                type="number" 
                step="0.1"
                placeholder="e.g. 12.4"
                class="w-full bg-transparent border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 pt-5 text-2xl font-black focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div class="flex gap-3">
              <button 
                @click="close" 
                class="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
              >
                Cancel
              </button>
              <button 
                @click="handleSave"
                :disabled="loading"
                class="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
              >
                {{ loading ? 'Saving...' : 'Save Index' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { doc, updateDoc } from 'firebase/firestore';

const props = defineProps({
  isOpen: Boolean,
  player: Object // Expects { id, fname, lname, ghin }
});

const emit = defineEmits(['close', 'updated']);
const { $db } = useNuxtApp();
const loading = ref(false);
const localGhin = ref(props.player?.ghin || '');

// Keep local value in sync if prop changes
watch(() => props.player, (newVal) => {
  if (newVal) localGhin.value = newVal.ghin;
}, { immediate: true });

const handleSave = async () => {
  if (!props.player?.id) return;
  
  loading.value = true;
  try {
    const playerRef = doc($db, "players", props.player.id);
    await updateDoc(playerRef, {
      ghin: parseFloat(localGhin.value)
    });
    
    emit('updated', parseFloat(localGhin.value));
    close();
  } catch (error) {
    console.error("Update failed:", error);
  } finally {
    loading.value = false;
  }
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>