<template>
  <div class="min-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 px-1 pb-28">
    <div class="max-w-md mx-auto pt-2">
      
      <LeagueHeader 
        :back-to="backRoute" 
        :back-text="backText"
        :is-admin="isAdmin"
      >
        <template #title>
          <span class="block text-2xl">
            {{ isLeague ? 'League' : 'Casual' }}
            <span class="text-stone-400 dark:text-stone-600 italic">Round</span>
          </span>
        </template>
      </LeagueHeader>

      <p v-if="leagueName" class="px-2 -mt-2 mb-4 text-emerald-500 font-black uppercase text-xs tracking-[0.15em]">
        {{ leagueName }}
      </p>

      <div v-if="dataStore.loading" class="py-12 text-center">
        <Icon name="svg-spinners:ring-resize" class="size-8 text-emerald-500 mb-2" />
      </div>

      <div v-else class="space-y-3 px-2">
        
        <section class="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <BaseSelect 
            v-model="selectedCourseId"
            label="1. Select Course"
            :options="sortedCourses"
            placeholder="Choose a course..."
            :disabled="isLeague"
          />
        </section>

        <section v-show="selectedCourseId" class="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <label class="text-[11px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">2. Players & Tees</label>
            <button 
              @click="showPlayerPicker = true" 
              class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all shadow-[inset_0_0_8px_rgba(16,185,129,0.1)]"
            >
              <Icon name="mdi:account-plus" class="size-4" /> Add
            </button>
          </div>

          <div v-if="players.length === 0" class="py-8 text-center border-2 border-dashed border-stone-300 dark:border-stone-800 rounded-2xl flex flex-col items-center gap-2">
            <Icon name="mdi:golf-tee" class="size-6 text-stone-300 dark:text-stone-700" />
            <p class="text-[9px] font-black uppercase tracking-widest text-stone-400">No players added</p>
          </div>

          <div v-else class="space-y-2.5 mt-2">
            <SetupPlayerCard
              v-for="(player, index) in players"
              :key="player.id"
              :player="player"
              :is-app-managed="isAppManaged"
              :is-league="isLeague"
              :is-mixed-tees="isMixedTees"
              :available-tees="getAvailableTees(player)"
              @remove="removePlayer(index)"
            />
          </div>
        </section>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 pt-4 pb-4 px-3 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-stone-950 dark:via-stone-950/95 z-40 backdrop-blur-[2px]">
      <div class="max-w-md mx-auto px-1">
        <button 
          @click="startRound" 
          :disabled="!canStart || uiStore.isGlobalLoading" 
          class="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm active:scale-[0.98] transition-all text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)] backdrop-blur-md disabled:opacity-60 disabled:text-stone-500 disabled:bg-stone-500/10 disabled:border-stone-500/20 disabled:shadow-none"
        >
          <div class="flex items-center justify-center gap-2">
            <Icon v-if="uiStore.isGlobalLoading" name="svg-spinners:ring-resize" class="size-5" />
            <span>{{ uiStore.isGlobalLoading ? 'Setting up...' : 'Start Round' }}</span>
          </div>
        </button>
      </div>
    </div>

    <LazyPlayerPicker
      v-model:is-open="showPlayerPicker"
      :selected-players="players" 
      mode="setup" 
      :league-id="isLeague ? leagueId : null" 
      :can-create="isAdmin"
      :course="selectedCourse" 
      @toggle="togglePlayer" 
      @create-new="addManualPlayer" 
    />
  </div>
</template>

<script setup>
import { useRoundSetup } from '~/composables/useRoundSetup'

// 1. Destructure exactly what the template needs from our unified brain
const {
  showPlayerPicker, selectedCourseId, players,
  isLeague, leagueId, leagueName, isAdmin, isAppManaged, isMixedTees,
  backRoute, backText, sortedCourses, canStart,
  getAvailableTees, togglePlayer, addManualPlayer, removePlayer, startRound,
  dataStore, uiStore
} = useRoundSetup()
</script>