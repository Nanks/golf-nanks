<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen && event" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
        <div @click="$emit('close')" class="absolute inset-0"></div>

        <div class="relative bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85dvh] flex flex-col">
          <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0 sm:hidden"></div>

          <div class="px-6 pt-3 pb-4 sm:pt-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0">
            <div class="min-w-0 pr-2">
              <h3 class="font-black text-slate-900 dark:text-white italic uppercase tracking-tighter text-lg leading-none">RSVPs</h3>
              <p class="text-[10px] font-black uppercase text-emerald-500 tracking-widest mt-1 truncate">{{ eventLabel }}</p>
            </div>
            <button @click="$emit('close')" class="modal-close-btn shrink-0">
              <Icon name="mdi:close" class="size-5" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
            <div v-for="group in groups" :key="group.key">
              <div class="flex items-center justify-between mb-2 px-1">
                <h4 class="text-[10px] font-black uppercase tracking-widest" :class="group.textClass">
                  {{ group.label }} ({{ group.players.length }})
                </h4>
                <button
                  v-if="group.key === 'unanswered' && group.players.length > 0"
                  @click="$emit('nudge', event)"
                  class="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1 active:opacity-60 transition-opacity"
                >
                  <Icon name="mdi:bell-ring" class="size-3" /> Nudge
                </button>
              </div>

              <div v-if="group.players.length === 0" class="text-center py-3 text-[10px] text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                None
              </div>
              <div v-else class="space-y-1.5">
                <div v-for="p in group.players" :key="p.id" class="card-base px-4 py-2.5">
                  <span class="text-primary text-sm">{{ p.fname }} {{ p.lname }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  event: { type: Object, default: null },
  players: { type: Array, default: () => [] }
})

defineEmits(['close', 'nudge'])

const eventLabel = computed(() => {
  if (!props.event?.iso) return ''
  const date = new Date(props.event.iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${props.event.course || 'Event'} • ${date}`
})

const sortedByName = (list) => [...list].sort((a, b) => (a.lname || '').localeCompare(b.lname || ''))

const groups = computed(() => {
  const rsvps = props.event?.rsvps || {}
  const inList = [], outList = [], unansweredList = []

  props.players.forEach(p => {
    const status = rsvps[p.id]
    if (status === 'in') inList.push(p)
    else if (status === 'out') outList.push(p)
    else unansweredList.push(p)
  })

  return [
    { key: 'in', label: 'In', textClass: 'text-emerald-600 dark:text-emerald-500', players: sortedByName(inList) },
    { key: 'out', label: 'Out', textClass: 'text-red-600 dark:text-red-500', players: sortedByName(outList) },
    { key: 'unanswered', label: 'Unanswered', textClass: 'text-slate-400', players: sortedByName(unansweredList) }
  ]
})
</script>
