<template>
  <nav class="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-[100]">
    <NuxtLink @click="isOpen = false" to="/" class="text-xl font-black text-emerald-600 tracking-tighter uppercase">
      Golf Nanks
    </NuxtLink>

    <!-- Hamburger Toggle -->
    <button @click="isOpen = !isOpen" class="p-2 text-slate-600 dark:text-slate-300 z-[110]">
      <div class="w-6 h-5 flex flex-col justify-between items-end">
        <span :class="{'w-6 rotate-45 translate-y-2': isOpen, 'w-6': !isOpen}" class="h-0.5 bg-current transition-all duration-300 rounded-full"></span>
        <span :class="{'opacity-0': isOpen, 'w-4': !isOpen}" class="h-0.5 bg-current transition-all duration-300 rounded-full"></span>
        <span :class="{'w-6 -rotate-45 -translate-y-2': isOpen, 'w-5': !isOpen}" class="h-0.5 bg-current transition-all duration-300 rounded-full"></span>
      </div>
    </button>

    <!-- Slide-out Menu -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <!-- Solid background fixes transparency -->
      <div v-if="isOpen" class="fixed inset-0 top-16 bg-white dark:bg-slate-950 z-[105] p-8 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div class="space-y-6">
          <NuxtLink @click="isOpen = false" to="/" class="nav-link">🏠 Home</NuxtLink>
          
          <!-- Auth-based links -->
          <template v-if="isLoggedIn">
            <NuxtLink @click="isOpen = false" to="/rounds" class="nav-link">⛳ My Rounds</NuxtLink>
            
            <div v-if="player?.admin" class="pt-6 border-t border-slate-100 dark:border-slate-800">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-left">Admin</p>
              <NuxtLink @click="isOpen = false" :to="`/admin/leagues/${player.admin}/players`" class="nav-link text-emerald-600">👥 Manage Roster</NuxtLink>
            </div>
          </template>

          <!-- Theme Toggle moved inside the list -->
          <div class="pt-6 border-t border-slate-100 dark:border-slate-800">
             <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-left">Appearance</p>
             <button @click="toggleDarkMode" class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 transition">
               <span class="text-sm font-bold uppercase tracking-tight dark:text-white">
                 {{ isDarkMode ? 'Dark Mode' : 'Light Mode' }}
               </span>
               <span class="text-xl">{{ isDarkMode ? '🌙' : '☀️' }}</span>
             </button>
          </div>
        </div>

        <!-- Dynamic Login/Logout Button -->
        <div class="pt-8">
          <button 
            v-if="isLoggedIn"
            @click="handleSignOut" 
            class="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black rounded-2xl uppercase text-xs tracking-widest active:scale-95 transition"
          >
            Sign Out
          </button>
          <NuxtLink 
            v-else
            @click="isOpen = false"
            to="/login" 
            class="w-full py-4 bg-emerald-600 text-white flex items-center justify-center font-black rounded-2xl uppercase text-xs tracking-widest active:scale-95 transition"
          >
            Sign In
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
const { logout, player, isLoggedIn } = useAuth();
const isDarkMode = useState('darkMode');
const isOpen = ref(false);

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  if (process.client) {
    localStorage.theme = isDarkMode.value ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', isDarkMode.value as boolean);
  }
};

const handleSignOut = async () => {
  isOpen.value = false;
  await logout();
};

watch(isLoggedIn, (newVal) => {
  console.log("Navbar Auth Change:", newVal);
});

</script>

<!-- <style scoped>
.nav-link {
  @apply block text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter hover:text-emerald-600 transition text-left;
}
</style> -->
