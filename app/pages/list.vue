<template>
  <div class="p-8 flex flex-col items-center">
    <button 
      @click="startShuffling" 
      :disabled="isShuffling"
      class="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
    >
      {{ isShuffling ? `Shuffling (${count})...` : 'Start Sorting' }}
    </button>

    <TransitionGroup 
      name="list" 
      tag="ul" 
      class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl"
    >
      <li 
        v-for="name in names" 
        :key="name" 
        class="p-4 bg-white shadow border rounded-md text-center font-medium text-gray-700"
      >
        {{ name }}
      </li>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const names = ref([
  'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 
  'Fiona', 'George', 'Hannah', 'Ian', 'Julia',
  'Kevin', 'Lara', 'Mason', 'Nora', 'Oliver', 
  'Paula', 'Quinn', 'Riley', 'Sophia', 'Thomas'
]);

const isShuffling = ref(false);
const count = ref(0);

const shuffleArray = () => {
  // Simple random sort
  names.value = [...names.value].sort(() => Math.random() - 0.5);
};

const startShuffling = () => {
  if (isShuffling.value) return;
  
  isShuffling.value = true;
  count.value = 0;

  const interval = setInterval(() => {
    shuffleArray();
    count.value++;

    if (count.value >= 10) {
      clearInterval(interval);
      isShuffling.value = false;
    }
  }, 1000); // 1 second delay
};
</script>

<style scoped>
/* Fade transition for entering/leaving/moving */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Ensure leaving items are taken out of layout flow so move 
   animation can calculate correctly */
.list-leave-active {
  position: absolute;
}
</style>