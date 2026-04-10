<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24 max-w-2xl mx-auto">
    <header class="mb-10 px-2">
      <NuxtLink to="/" class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-600 transition flex items-center gap-1">
        <Icon name="mdi:arrow-left" /> All Leagues
      </NuxtLink>
      
      <h1 class="text-4xl font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter mt-4 leading-none italic">
        {{ league?.shortName || league?.name || 'Loading...' }}
      </h1>
      
      <div v-if="isAdmin" class="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800">
        <Icon name="mdi:shield-check" class="text-emerald-600 size-3" />
        <span class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">League Admin</span>
      </div>
    </header>

    <div class="space-y-2">
      <NuxtLink :to="`/leagues/${route.params.id}/calendar`" class="menu-item group">
        <div class="flex items-center gap-4">
          <div class="icon-circle">
            <Icon name="mdi:calendar-month" class="size-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <p class="menu-title">Calendar</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

      <NuxtLink 
        v-if="hasGame('birds')"
        :to="`/leagues/${route.params.id}/birds`" 
        class="menu-item group"
      >
        <div class="flex items-center gap-4">
          <div class="icon-circle">
            <Icon name="mdi:bird" class="size-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <p class="menu-title">Birds Tracker</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

      <NuxtLink 
        v-if="hasGame('deuces')"
        :to="`/leagues/${route.params.id}/deuces`" 
        class="menu-item group"
      >
        <div class="flex items-center gap-4">
          <div class="icon-circle">
            <Icon name="mdi:numeric-2-circle" class="size-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <p class="menu-title">Deuces Tracker</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

      <NuxtLink :to="`/leagues/${route.params.id}/roster`" class="menu-item group">
        <div class="flex items-center gap-4">
          <div class="icon-circle">
            <Icon name="mdi:account-group" class="size-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 transition" />
          </div>
          <p class="menu-title">Roster & Handicaps</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

      <NuxtLink 
        v-if="isAdmin"
        :to="`/leagues/${route.params.id}/settings`" 
        class="menu-item group mt-6 border-dashed border-slate-300 dark:border-slate-700"
      >
        <div class="flex items-center gap-4">
          <div class="icon-circle bg-slate-200 dark:bg-slate-800">
            <Icon name="mdi:cog" class="size-5 text-slate-500" />
          </div>
          <p class="menu-title text-slate-500">League Settings</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

    </div>
  </div>
</template>

<script setup>
import { doc, getDoc } from "firebase/firestore";
import { useAuthStore } from "~/stores/auth";
import { useUIStore } from "~/stores/ui";

const route = useRoute();
const { $db } = useNuxtApp();
const authStore = useAuthStore();
const ui = useUIStore();

const league = ref(null);

// Permission Check: Super Admin or Admin of this specific type
const isAdmin = computed(() => {
  if (!league.value) return false;
  return authStore.isAdminForType(league.value.type);
});

// Case-insensitive game check
const hasGame = (gameName) => {
  if (league.value?.cadence === 'yearly') return true;
  return league.value?.yearly_games?.some(g => g.toLowerCase() === gameName.toLowerCase());
};

onMounted(async () => {
  ui.setLoading(true);
  try {
    const docRef = doc($db, "leagues", route.params.id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      league.value = snap.data();
    }
  } catch (error) {
    console.error("Error fetching league:", error);
  } finally {
    ui.setLoading(false);
  }
});
</script>

<style scoped>
@reference "tailwindcss";

.menu-item {
  @apply flex items-center justify-between p-3 px-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all active:scale-[0.98] shadow-sm;
}
.icon-circle {
  @apply w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950;
}
.menu-title {
  @apply font-black text-slate-800 dark:text-slate-100 uppercase text-[11px] tracking-widest;
}
.arrow-icon {
  @apply text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors size-5;
}
</style>