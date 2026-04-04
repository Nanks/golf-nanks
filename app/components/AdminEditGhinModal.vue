<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Update GHIN</h3>
        <p class="text-lg font-black text-emerald-600 mb-6 uppercase tracking-tighter">{{ player?.fname }} {{ player?.lname }}</p>
        
        <input 
          v-model="localGhin" 
          type="number" 
          placeholder="0.0" 
          class="w-full p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 font-black text-center text-3xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
        />
        
        <div class="flex gap-2">
          <button @click="modelValue = false" class="flex-1 py-3 text-xs font-bold text-slate-400 uppercase hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
          <button @click="handleSave" class="flex-1 py-3 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition">Save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ player: Player | null }>();
const modelValue = defineModel<boolean>();
const emit = defineEmits(['save']);

const localGhin = ref<number | string>('');

// Sync local value when modal opens
watch(() => props.player, (newVal) => {
  if (newVal) localGhin.value = newVal.ghin || '';
}, { immediate: true });

const handleSave = () => {
  emit('save', Number(localGhin.value));
};
</script>
