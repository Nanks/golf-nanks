<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        <header class="mb-6">
          <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">New Player</h3>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Add to League: {{ leagueId }}</p>
        </header>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name Row -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">First Name</label>
              <input v-model="form.fname" type="text" required placeholder="John" class="form-input" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Last Name</label>
              <input v-model="form.lname" type="text" required placeholder="Doe" class="form-input" />
            </div>
          </div>

          <!-- Phone -->
          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Mobile Phone</label>
            <input v-model="form.phone" type="tel" required placeholder="555 555 5555" class="form-input" />
          </div>

          <!-- GHIN & Tee -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">GHIN #</label>
              <input v-model.number="form.ghin" type="number" step="0.1" placeholder="10.4" class="form-input" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Tee Type</label>
              <select v-model="form.tee_type" class="form-input appearance-none">
                <option value="mens">Mens</option>
                <option value="ladies">Ladies</option>
              </select>
            </div>
          </div>

          <!-- Duplicate Warning -->
          <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
            <p class="text-[10px] font-black text-red-600 uppercase tracking-widest text-center leading-tight">{{ error }}</p>
          </div>

          <div class="flex flex-col gap-2 pt-4">
            <button 
              type="submit" 
              :disabled="isChecking"
              class="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition shadow-lg shadow-emerald-600/20 disabled:bg-slate-300"
            >
              <span v-if="isChecking">Checking...</span>
              <span v-else>Create Player</span>
            </button>
            <button type="button" @click="close" class="w-full py-2 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { collection, query, where, getDocs, limit, and } from "firebase/firestore";

const props = defineProps<{
  modelValue: boolean,
  leagueId: string
}>();
const emit = defineEmits(['update:modelValue', 'create']);
const { $db } = useNuxtApp();

const isChecking = ref(false);
const error = ref('');
const form = ref({
  fname: '',
  lname: '',
  phone: '',
  ghin: 0,
  tee_type: 'mens'
});

const close = () => {
  error.value = '';
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  error.value = '';
  isChecking.value = true;

  try {
    // 1. Format phone
    let digits = form.value.phone.replace(/\D/g, '');
    if (digits.length === 10) digits = `1${digits}`;
    const formattedPhone = `+${digits}`;

    const playersRef = collection($db, "players");

    // 2. Check Phone Duplicate
    const phoneQ = query(playersRef, where("phone", "==", formattedPhone), limit(1));
    const phoneSnap = await getDocs(phoneQ);

    if (!phoneSnap.empty) {
      error.value = "Phone number already exists.";
      isChecking.value = false;
      return;
    }

    // 3. Check Name Duplicate
    const nameQ = query(playersRef, and(where("fname", "==", form.value.fname), where("lname", "==", form.value.lname)), limit(1));
    const nameSnap = await getDocs(nameQ);

    if (!nameSnap.empty) {
      error.value = "A player with this name already exists.";
      isChecking.value = false;
      return;
    }

    // 4. Success
    emit('create', { ...form.value, phone: formattedPhone });
    form.value = { fname: '', lname: '', phone: '', ghin: 0, tee_type: 'mens' };
  } catch (err) {
    console.error(err);
    error.value = "Duplicate check failed.";
  } finally {
    isChecking.value = false;
  }
};
</script>

<style scoped>
.form-input {
  @apply w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition font-bold text-sm border-none text-slate-800 dark:text-slate-100;
}
</style>
