<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
      
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="$emit('close')"></div>

      <div class="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        
        <div class="bg-blue-500/10 border-b border-blue-500/20 px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-blue-500 text-white p-1.5 rounded-lg shadow-sm">
              <Icon name="mdi:bullhorn" class="size-5" />
            </div>
            <h2 class="text-xl font-black italic uppercase text-blue-700 dark:text-blue-500 tracking-tight">Broadcast Message</h2>
          </div>
          <button @click="$emit('close')" class="modal-close-btn">
            <Icon name="mdi:close" class="size-5" />
          </button>
        </div>

        <div class="p-6 space-y-5">
          <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
            This will send a push notification to all players in the league.
          </p>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Message Title</label>
            <input 
              v-model="form.title" 
              type="text" 
              placeholder="e.g. Cart Path Only Today" 
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Message Body</label>
            <textarea 
              v-model="form.body" 
              rows="4"
              placeholder="Type your announcement here..." 
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            ></textarea>
          </div>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button @click="$emit('close')" class="px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button 
            @click="submit" 
            :disabled="!isValid"
            :class="isValid ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 active:scale-95 hover:bg-blue-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'"
            class="px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-2"
          >
            <Icon name="mdi:send" class="size-4" />
            Send Now
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'send'])

const form = ref({
  title: '',
  body: ''
})

const isValid = computed(() => form.value.title.trim().length > 0 && form.value.body.trim().length > 0)

const submit = () => {
  if (!isValid.value) return
  emit('send', { ...form.value })
  // Reset form after sending
  form.value = { title: '', body: '' }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>