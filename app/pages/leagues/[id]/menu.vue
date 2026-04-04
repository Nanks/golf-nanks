<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pt-24 max-w-md mx-auto">
    <header class="mb-10">
      <NuxtLink to="/" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition">
        ← All Leagues
      </NuxtLink>
      <h1 class="text-3xl font-black text-emerald-600 uppercase tracking-tighter mt-2">{{ league?.name || 'Loading...' }}</h1>
      <div v-if="isAdmin" class="inline-block mt-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
        <span class="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">League Admin</span>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-4">
      <!-- Standard Player Options -->
      <NuxtLink :to="`/leagues/${route.params.id}`" class="menu-card">
        <div class="icon-box">📅</div>
        <div class="text-left">
          <p class="title">Calendar</p>
          <p class="subtitle">View schedule & tee times</p>
        </div>
      </NuxtLink>

      <NuxtLink :to="`/leagues/${route.params.id}/standings`" class="menu-card">
        <div class="icon-box">🏆</div>
        <div class="text-left">
          <p class="title">Standings</p>
          <p class="subtitle">Season points & rankings</p>
        </div>
      </NuxtLink>

      <!-- Admin Only Options -->
      <template v-if="isAdmin">
        <div class="mt-4 mb-2">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Management</p>
        </div>
        
        <NuxtLink :to="`/admin/leagues/${route.params.id}/players`" class="menu-card admin-card">
          <div class="icon-box">👥</div>
          <div class="text-left">
            <p class="title">Roster</p>
            <p class="subtitle">Add or edit league players</p>
          </div>
        </NuxtLink>

        <button class="menu-card admin-card text-left">
          <div class="icon-box">⚙️</div>
          <div class="text-left">
            <p class="title">Settings</p>
            <p class="subtitle">Edit league info & rules</p>
          </div>
        </button>
      </template>
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
    // Check if the current user is an admin for this specific leagueID
    isAdmin.value = isAdminOf(league.value.leagueID);
  }
});
</script>

<style scoped>
.menu-card {
  @apply flex items-center gap-5 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all active:scale-[0.98];
}
.admin-card {
  @apply border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10;
}
.icon-box {
  @apply w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl;
}
.title {
  @apply font-black text-slate-800 dark:text-white uppercase tracking-tight;
}
.subtitle {
  @apply text-[10px] font-bold text-slate-400 uppercase tracking-wide;
}
</style>
