<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <header>
          <h2 class="text-xl font-black text-emerald-600 uppercase tracking-tight">New Player</h2>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create and add to league</p>
        </header>

        <div class="space-y-4">
          <input v-model="form.fname" placeholder="First Name" class="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold" />
          <input v-model="form.lname" placeholder="Last Name" class="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold" />
          <input v-model="form.phone" placeholder="Phone (e.g. +16055551234)" class="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold" />
        </div>

        <div class="flex gap-3 pt-2">
          <button @click="modelValue = false" class="flex-1 py-4 font-bold text-slate-400 uppercase text-xs hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
          <button @click="handleCreate" class="flex-1 py-4 bg-emerald-600 text-white font-black rounded-xl uppercase text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition">Create & Add</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const modelValue = defineModel<boolean>();
const emit = defineEmits(['create']);

const form = ref({ fname: '', lname: '', phone: '', leagues: [], ghin: 0, admin: '' });

const handleCreate = () => {
  emit('create', { ...form.value });
  // Reset form
  form.value = { fname: '', lname: '', phone: '', leagues: [], ghin: 0, admin: '' };
};
</script>
