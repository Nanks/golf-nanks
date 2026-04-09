<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 max-w-2xl mx-auto">
    <header class="mb-10">
      <NuxtLink to="/" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
        ← All Leagues
      </NuxtLink>
      <h1 class="text-4xl font-black text-emerald-600 uppercase tracking-tighter mt-2 leading-none">
        {{ league?.shortName || 'Loading...' }}
      </h1>
      
      <div v-if="isAdmin" class="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800">
        <Icon name="mdi:shield-check" class="text-emerald-600 size-3" />
        <span class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">League Admin</span>
      </div>
    </header>

    <div class="space-y-1.5">
      <!-- Calendar -->
      <NuxtLink :to="`/leagues/${route.params.id}/calendar`" class="menu-item group">
        <div class="flex items-center gap-3">
          <div class="icon-circle">
            <Icon name="mdi:calendar-month" class="size-4 text-slate-600 group-hover:text-emerald-600 transition" />
          </div>
          <p class="menu-title">Calendar</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

      <NuxtLink 
        v-if="league?.cadence === 'yearly' || league?.yearly_games?.includes('Birds')"
        :to="`/leagues/${route.params.id}/birds`" 
        class="menu-item group"
      >
        <div class="flex items-center gap-3">
          <div class="icon-circle">
            <Icon name="mdi:bird" class="size-4 text-slate-600 group-hover:text-emerald-600 transition" />
          </div>
          <p class="menu-title">Birds</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

      <NuxtLink 
        v-if="league?.cadence === 'yearly' || league?.yearly_games?.includes('Deuces')"
        :to="`/leagues/${route.params.id}/deuces`" 
        class="menu-item group"
      >
        <div class="flex items-center gap-3">
          <div class="icon-circle">
            <Icon name="mdi:numeric-2-circle" class="size-4 text-slate-600 group-hover:text-emerald-600 transition" />
          </div>
          <p class="menu-title">Deuces</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

      <!-- Roster -->
      <NuxtLink :to="`/leagues/${route.params.id}/roster`" class="menu-item group">
        <div class="flex items-center gap-3">
          <div class="icon-circle">
            <Icon name="mdi:account-group" class="size-4 text-slate-600 group-hover:text-emerald-600 transition" />
          </div>
          <p class="menu-title">Roster</p>
        </div>
        <Icon name="mdi:chevron-right" class="arrow-icon" />
      </NuxtLink>

    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc } from "firebase/firestore";

const route = useRoute();
const { $db } = useNuxtApp();
const { isAdminOf } = useAuth();

const league = ref<any>(null);
const isAdmin = ref(false);

onMounted(async () => {
  const docRef = doc($db, "leagues", route.params.id as string);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    league.value = snap.data();
    isAdmin.value = isAdminOf(league.value.leagueID);
  }
});
</script>

<style scoped>
  @reference "@/assets/css/main.css"; 

.menu-item {
  @apply flex items-center justify-between p-2.5 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all active:scale-[0.99];
}
.icon-circle {
  @apply w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl transition;
}
.menu-title {
  @apply font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-tight;
}
.arrow-icon {
  @apply text-slate-300 group-hover:text-emerald-500 transition-colors size-4;
}
</style>
