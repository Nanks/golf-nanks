<template>
  <!-- Use a fixed overlay to ensure it appears on top of everything -->
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div v-click-outside="close" class="bg-white dark:bg-slate-800 w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center">
      <h3 class="text-slate-400 uppercase text-xs font-black tracking-widest mb-6">Hole {{ holeNumber }} Score</h3>
      
      <div class="flex items-center justify-between mb-8">
        <button @click="update(-1)" class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 text-3xl font-bold hover:bg-emerald-100 transition">-</button>
        <!-- Use .value for the model since it's a ref inside <script setup> -->
        <span class="text-6xl font-black text-emerald-600 tabular-nums">{{ score }}</span>
        <button @click="update(1)" class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 text-3xl font-bold hover:bg-emerald-100 transition">+</button>
      </div>

      <button @click="close" class="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200">
        Done
      </button>
    </div>
  </div>
</template>

<script setup>
// defineModel handles the two-way binding 'score' and 'update:score' automatically
const score = defineModel()
const props = defineProps(['holeNumber'])
const emit = defineEmits(['close'])

const update = (val) => {
  const next = score.value + val
  if (next >= 1) score.value = next
}

const close = () => {
  emit('close')
}
</script>
