<template>
  <Listbox v-model="proxyValue" :disabled="disabled">
    <div class="relative">
      <ListboxLabel 
        v-if="label" 
        class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1"
      >
        {{ label }}
      </ListboxLabel>
      
      <ListboxButton 
        :class="[
          dense ? 'py-2 px-3 text-[11px]' : 'py-3 px-4 text-sm',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          'relative w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
        ]"
      >
        <span class="block truncate font-bold" :class="proxyValue ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'">
          {{ selectedLabel || placeholder }}
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <Icon name="mdi:chevron-down" class="size-4 text-slate-400" />
        </span>
      </ListboxButton>

      <transition 
        leave-active-class="transition duration-100 ease-in" 
        leave-from-class="opacity-100" 
        leave-to-class="opacity-0"
      >
        <ListboxOptions 
          class="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-slate-900 py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-200 dark:border-slate-800"
        >
          <ListboxOption
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            as="template"
            v-slot="{ active, selected }"
          >
            <li :class="[
              active ? 'bg-emerald-500 text-white' : 'text-slate-900 dark:text-slate-200',
              'relative cursor-pointer select-none py-2.5 px-4 mx-1 rounded-lg transition-colors mb-0.5 last:mb-0'
            ]">
              <div class="flex items-center justify-between">
                <span :class="[selected ? 'font-black' : 'font-medium', 'block truncate text-xs uppercase tracking-tight']">
                  {{ option.label }}
                </span>
                <Icon v-if="selected" name="mdi:check" class="size-3" />
              </div>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<script setup>
import { 
  Listbox, 
  ListboxLabel, 
  ListboxButton, 
  ListboxOptions, 
  ListboxOption 
} from '@headlessui/vue'

const props = defineProps({
  modelValue: [String, Number, Object],
  options: {
    type: Array,
    default: () => [] // Expects Array of { label: 'String', value: 'Any' }
  },
  placeholder: {
    type: String,
    default: 'Select...'
  },
  label: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  dense: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Syncs the internal Listbox state with the parent v-model
const proxyValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Finds the label for the currently selected value to display on the button
const selectedLabel = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)?.label
})
</script>

<style scoped>
/* Optional: Hide scrollbar for a cleaner mobile look */
ul::-webkit-scrollbar {
  display: none;
}
</style>