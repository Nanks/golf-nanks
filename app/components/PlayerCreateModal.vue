<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="fade">
        <div class="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm select-none">
          <div @click="$emit('close')" class="absolute inset-0"></div>
          
          <div class="relative bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6">
            
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-black text-stone-800 dark:text-white uppercase tracking-tight italic">
                {{ isEditMode ? 'Edit Player' : 'New Player' }}
              </h3>
              <button @click="$emit('close')" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                <Icon name="mdi:close-circle" class="size-6" />
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <input v-model="form.fname" placeholder="First Name" class="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
                <input v-model="form.lname" placeholder="Last Name" class="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
              </div>
              
              <input 
                v-model="form.phone" 
                type="tel" 
                @input="formatDisplay"
                placeholder="Phone (555) 000-0000" 
                class="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500 font-mono transition-colors" 
              />
              
              <div class="flex gap-1 p-1 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl">
                <button v-for="type in ['mens', 'senior', 'ladies']" :key="type"
                  @click="setTeeType(type)"
                  :class="['flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all', form.tee_type === type ? 'bg-white dark:bg-stone-800 shadow-sm text-emerald-600 dark:text-emerald-500' : 'text-stone-400']"
                >{{ type }}</button>
              </div>

              <input 
                v-model.number="form.ghin" 
                type="number" 
                step="0.1" 
                placeholder="GHIN Index" 
                class="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-sm font-bold outline-none focus:border-emerald-500 transition-colors" 
              />
            </div>

            <button @click="submit" :disabled="isLoading" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white disabled:text-stone-400 rounded-2xl font-black uppercase tracking-widest text-xs mt-6 active:scale-95 transition-all shadow-lg shadow-emerald-900/10">
              <span v-if="isLoading" class="flex justify-center items-center gap-2">
                 <Icon name="mdi:loading" class="size-4 animate-spin" /> Saving...
              </span>
              <span v-else>{{ isEditMode ? 'Save Changes' : 'Create Player' }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNuxtApp } from '#app';
import { useToast } from '~/composables/useToast';

const { $db } = useNuxtApp();
const toast = useToast();

// Pass `player` if editing, leave null/undefined if creating
const props = defineProps(['course', 'defaultTeeType', 'player']);
const emit = defineEmits(['close', 'saved']);

const isLoading = ref(false);
const isEditMode = computed(() => !!props.player);

const form = ref({ 
  fname: '', 
  lname: '', 
  phone: '', 
  ghin: 0.0, 
  tee_type: props.defaultTeeType || 'mens', 
  teesId: '' 
});

// Hydrate form if we are in Edit Mode
const hydrateForm = () => {
  if (isEditMode.value && props.player) {
    form.value.fname = props.player.fname || '';
    form.value.lname = props.player.lname || '';
    form.value.ghin = props.player.ghin || 0.0;
    form.value.tee_type = props.player.tee_type || 'mens';
    form.value.teesId = props.player.teesId || '';
    
    // Parse DB phone to display phone
    let digits = (props.player.phone || '').replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) digits = digits.slice(1);
    form.value.phone = digits;
    formatDisplay();
  }
};

onMounted(hydrateForm);
watch(() => props.player, hydrateForm, { deep: true });

// Phone Formatter
const formatDisplay = () => {
  let x = form.value.phone.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
  if (!x) {
    form.value.phone = '';
    return;
  }
  form.value.phone = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
};

const forceDouble = (val) => {
  let num = parseFloat(val) || 0.0;
  return num % 1 === 0 ? num + 0.00000000000001 : num;
};

const setTeeType = (type) => {
  form.value.tee_type = type;
  form.value.teesId = props.course?.tee_types?.[type] || Object.values(props.course?.tees || {})[0]?.id || '';
};

const submit = async () => {
  const digits = form.value.phone.replace(/\D/g, '');
  if (digits && digits.length !== 10) {
    toast.add({ title: 'Validation Error', description: 'Phone must be exactly 10 digits.', color: 'red' });
    return;
  }

  isLoading.value = true;
  const normalize = (val) => val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase();
  
  const payload = { 
    ...form.value, 
    fname: normalize(form.value.fname), 
    lname: normalize(form.value.lname), 
    phone: digits ? `+1${digits}` : '', // E.164
    ghin: forceDouble(form.value.ghin) 
  };
  
  try {
    if (isEditMode.value) {
      // UPDATE EXISTING
      const docRef = doc($db, "players", props.player.id);
      await updateDoc(docRef, payload);
      toast.add({ title: 'Success', description: 'Player updated.', color: 'green' });
      emit('saved', { id: props.player.id, ...payload });
    } else {
      // CREATE NEW
      payload.active = true;
      payload.createdAt = serverTimestamp();
      const docRef = await addDoc(collection($db, "players"), payload);
      toast.add({ title: 'Success', description: 'Player created.', color: 'green' });
      emit('saved', { id: docRef.id, ...payload });
    }
  } catch (err) {
    console.error("Save failed:", err);
    toast.add({ title: 'Error', description: 'Failed to save player.', color: 'red' });
  } finally {
    isLoading.value = false;
    emit('close');
  }
};
</script>