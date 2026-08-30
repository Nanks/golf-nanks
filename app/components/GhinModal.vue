<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-6 pt-24 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">  <div @click.stop class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 overflow-hidden relative">
          <div class="mb-8">
            <p class="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.3em] mb-1">Update Handicap</p>
            <h2 class="text-3xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">
              {{ player.fname }} {{ player.lname }}
            </h2>
          </div>

          <div class="space-y-6">
            <div class="relative mt-2">
              <label class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest absolute -top-2 left-4 bg-white dark:bg-slate-900 px-2">
                GHIN Index
              </label>
              <input 
                v-model="localGhin"
                type="number" 
                step="0.1"
                placeholder="e.g. 12.4"
                class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-4 pt-5 text-3xl font-black text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all shadow-inner"
              />
            </div>

            <div class="flex gap-3 pt-2">
              <button 
                @click="close" 
                class="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95"
              >
                Cancel
              </button>
              
              <button
                @click="handleSave"
                :disabled="loading || !canEditThisPlayer"
                class="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95
                       text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30
                       shadow-[inset_0_0_12px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20 backdrop-blur-sm
                       disabled:opacity-50 disabled:text-slate-500 disabled:bg-slate-500/10 disabled:border-slate-500/20 disabled:shadow-none"
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
import { useAuthStore } from '~/stores/auth';
import { useData } from '~/stores/data';

const props = defineProps({
  isOpen: Boolean,
  player: Object // Expects { id, fname, lname, ghin, leagues }
});

const emit = defineEmits(['close', 'updated']);
const { $db } = useNuxtApp();
const authStore = useAuthStore();
const dataStore = useData();
const loading = ref(false);
const localGhin = ref(props.player?.ghin || '');

// Keep local value in sync if prop changes
watch(() => props.player, (newVal) => {
  if (newVal) localGhin.value = newVal.ghin;
}, { immediate: true });

// This modal is shared by index.vue (editing your own GHIN) and roster.vue
// (an admin editing a roster player's GHIN) -- both callers already gate
// which players show an edit affordance, but that's just hiding a button,
// not enforcement. Firestore rules for the players collection are
// deliberately permissive (any authenticated user), so this check is the
// actual authorization: your own record, an admin of any league this
// player belongs to, or the super admin.
const canEditThisPlayer = computed(() => {
  if (!props.player?.id) return false;
  if (authStore.userProfile?.id === props.player.id) return true;
  if (authStore.isSuperAdmin) return true;
  return (props.player.leagues || []).some(leagueId => {
    const league = dataStore.leagues.find(l => l.id === leagueId);
    return league && authStore.isAdminForLeague(league);
  });
});

const handleSave = async () => {
  if (!props.player?.id || !canEditThisPlayer.value) return;

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