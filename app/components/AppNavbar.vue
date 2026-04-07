<template>
  <nav class="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between z-[100]">
    <NuxtLink @click="isOpen = false" to="/" class="text-xl font-black text-emerald-600 tracking-tighter uppercase ml-1">
      Golf Nanks
    </NuxtLink>

    <button 
      @click="isOpen = !isOpen" 
      class="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-slate-600 dark:text-slate-300 z-[110] active:scale-95 transition-all shadow-sm hover:border-emerald-500"
    >
      <div class="w-5 h-3.5 flex flex-col justify-between items-end">
        <span :class="{'w-5 rotate-45 translate-y-1.5 bg-emerald-600': isOpen, 'w-5': !isOpen}" class="h-0.5 bg-current transition-all duration-300 rounded-full"></span>
        <span :class="{'opacity-0': isOpen, 'w-3.5': !isOpen}" class="h-0.5 bg-current transition-all duration-300 rounded-full"></span>
        <span :class="{'w-5 -rotate-45 -translate-y-1.5 bg-emerald-600': isOpen, 'w-4': !isOpen}" class="h-0.5 bg-current transition-all duration-300 rounded-full"></span>
      </div>
    </button>

    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div v-if="isOpen" class="fixed inset-0 top-16 bg-white dark:bg-slate-950 z-[105] p-8 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div class="space-y-4">
          
          <NuxtLink @click="isOpen = false" to="/" class="nav-item group">
            <div class="nav-icon-circle">
              <Icon name="mdi:home-variant" class="size-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
            </div>
            <span class="nav-link-text">Home</span>
          </NuxtLink>
          
          <template v-if="isLoggedIn">
            <NuxtLink @click="isOpen = false" to="/rounds" class="nav-item group">
              <div class="nav-icon-circle">
                <Icon name="mdi:golf" class="size-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
              </div>
              <span class="nav-link-text">My Rounds</span>
            </NuxtLink>

            <NuxtLink @click="isOpen = false" to="/profile" class="nav-item group">
              <div class="nav-icon-circle">
                <Icon name="mdi:account-cog" class="size-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
              </div>
              <span class="nav-link-text">My Profile</span>
            </NuxtLink>
            
            <div v-if="player?.admin" class="pt-6 mt-2 border-t border-slate-100 dark:border-slate-800">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Admin</p>
              <NuxtLink @click="isOpen = false" :to="`/admin/leagues/${player.admin}/players`" class="nav-item group">
                <div class="nav-icon-circle bg-emerald-50 dark:bg-emerald-900/20 group-hover:border-emerald-500">
                  <Icon name="mdi:account-group" class="size-6 text-emerald-600" />
                </div>
                <span class="nav-link-text text-emerald-600">Manage Roster</span>
              </NuxtLink>
            </div>
          </template>

          <div class="pt-6 border-t border-slate-100 dark:border-slate-800">
             <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Appearance</p>
             <button @click="toggleDarkMode" class="nav-item w-full group">
               <div class="nav-icon-circle">
                 <Icon :name="isDarkMode ? 'mdi:weather-night' : 'mdi:weather-sunny'" 
                       class="size-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
               </div>
               <span class="nav-link-text">{{ isDarkMode ? 'Dark Mode' : 'Light Mode' }}</span>
             </button>
          </div>
        </div>

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
</script>

<style scoped>
@reference "@/assets/css/main.css";

.nav-item {
  @apply flex items-center gap-4 transition-all active:scale-[0.97] text-left;
}

.nav-icon-circle {
  @apply w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 transition-colors group-hover:border-emerald-500;
}

.nav-link-text {
  @apply text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter group-hover:text-emerald-600 transition-colors;
}
</style>