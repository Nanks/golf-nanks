<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">

      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="$emit('close')"></div>

      <div class="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">

        <div :class="severity === 'urgent' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'" class="border-b px-6 py-4 flex items-center justify-between transition-colors">
          <div class="flex items-center gap-3">
            <div :class="severity === 'urgent' ? 'bg-red-500' : 'bg-emerald-500'" class="text-white p-1.5 rounded-lg shadow-sm transition-colors">
              <Icon :name="severity === 'urgent' ? 'mdi:alert-decagram' : 'mdi:information'" class="size-5" />
            </div>
            <h2 :class="severity === 'urgent' ? 'text-red-700 dark:text-red-500' : 'text-emerald-700 dark:text-emerald-500'" class="text-xl font-black italic uppercase tracking-tight transition-colors">Send Alert</h2>
          </div>
          <button @click="$emit('close')" class="modal-close-btn">
            <Icon name="mdi:close" class="size-5" />
          </button>
        </div>

        <div class="p-6 space-y-5">
          <p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
            Shows as a popup every league member has to physically dismiss. Not a
            push notification, so it only reaches players with the app open.
          </p>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Urgency</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="severity = 'info'"
                :class="severity === 'info'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'"
                class="flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-black uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                <Icon name="mdi:information-outline" class="size-4" /> Info
              </button>
              <button
                @click="severity = 'urgent'"
                :class="severity === 'urgent'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'"
                class="flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-black uppercase tracking-widest text-xs transition-all active:scale-95"
              >
                <Icon name="mdi:alert-decagram-outline" class="size-4" /> Urgent
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Message</label>
            <textarea
              v-model="message"
              rows="4"
              placeholder="e.g. Lightning in the area -- please leave the course immediately."
              :class="severity === 'urgent' ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'"
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-primary focus:outline-none focus:ring-1 transition-all resize-none"
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
            :class="isValid
              ? (severity === 'urgent' ? 'bg-red-600 shadow-red-900/20 active:scale-95 hover:bg-red-500' : 'bg-emerald-600 shadow-emerald-900/20 active:scale-95 hover:bg-emerald-500') + ' text-white shadow-md'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'"
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

defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'send'])

const message = ref('')
// Defaults to 'urgent' -- the feature exists for the weather/evacuation
// case, so an admin should have to deliberately pick 'info' rather than
// accidentally send something critical styled as routine.
const severity = ref('urgent')

const isValid = computed(() => message.value.trim().length > 0)

const submit = () => {
  if (!isValid.value) return
  emit('send', { message: message.value.trim(), severity: severity.value })
  message.value = ''
  severity.value = 'urgent'
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
