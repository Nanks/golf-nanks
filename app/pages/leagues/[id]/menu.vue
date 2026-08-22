<template>
  <div class="px-2 max-w-lg mx-auto pb-32">
    <LeagueHeader 
        :title="leagueName"
        subtitle="Menu" 
        :is-admin="isAdmin"
        :back-to="'/'"
        back-text="Back to Home"
      >
    </LeagueHeader>

    <div class="grid gap-2">
      
      <div 
        v-if="activeRoundId" 
        @click="navigateTo(`/rounds/${activeRoundId}`)"
        class="card-interactive flex items-center justify-between p-5 !border-amber-500/30"
      >
        <div class="flex items-center gap-4">
          <div class="bg-amber-500 text-black p-2 rounded-xl shadow-lg shadow-amber-500/10">
            <Icon name="mdi:calculator" class="size-6" />
          </div>
          <div>
            <h3 class="font-black text-xl italic uppercase text-amber-700 dark:text-amber-500">Resume Round</h3>
          </div>
        </div>
        <Icon name="mdi:chevron-right" class="text-amber-600/50 dark:text-amber-500" />
      </div>

      <div 
        v-else-if="hasEventToday && isPlayerInLeague" 
        @click="startRound"
        class="card-interactive flex items-center justify-between p-5 !border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
      >
        <div class="flex items-center gap-4">
          <div class="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20">
            <Icon name="mdi:golf-tee" class="size-6" />
          </div>
          <div class="flex flex-col">
            <h3 class="font-black text-xl italic uppercase text-emerald-700 dark:text-emerald-400 leading-none mb-1">Start Round</h3>
            <p class="text-[9px] font-black uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              {{ nextActiveEvent?.course || 'Course TBD' }} • 
              <template v-if="nextActiveEvent?.teesId === 'mixed'">
                M: {{ nextActiveEvent?.mensTees }} / L: {{ nextActiveEvent?.ladiesTees }}
              </template>
              <template v-else>
                {{ nextActiveEvent?.tees || 'Tees TBD' }}
              </template>
            </p>
          </div>
        </div>
        <Icon name="mdi:chevron-right" class="text-emerald-600/50 dark:text-emerald-400" />
      </div>

      <div
        v-if="isLive && nextActiveEvent?.id"
        @click="navigateTo(`/leaderboard/${leagueId}/${nextActiveEvent.id}`)"
        class="card-interactive flex items-center justify-between p-5 !border-emerald-500/30"
      >
        <div class="flex items-center gap-4">
          <div class="bg-emerald-500 text-black p-2 rounded-xl shadow-lg shadow-emerald-500/10">
            <Icon name="mdi:trophy-outline" class="size-6" />
          </div>
          <div>
            <h3 class="font-black text-xl italic uppercase text-emerald-700 dark:text-emerald-500">Live Leaderboard</h3>
          </div>
        </div>
        <Icon name="mdi:chevron-right" class="text-emerald-600/50 dark:text-emerald-400" />
      </div>

      <div 
        v-for="game in yearlyGames" 
        :key="game"
        @click="navigateTo(`/leagues/${leagueId}/${game}`)"
        class="card-interactive flex items-center justify-between p-5"
      >
        <div class="flex items-center gap-4">
          <div class="bg-slate-200 dark:bg-stone-900 text-slate-500 p-2 rounded-xl">
            <Icon name="mdi:medal-outline" class="size-6" />
          </div>
          <h3 class="text-primary text-xl">{{ game }}</h3>
        </div>
        <Icon name="mdi:chevron-right" class="text-slate-400" />
      </div>

      <div 
        @click="navigateTo(`/leagues/${leagueId}/calendar`)"
        class="card-interactive flex items-center justify-between p-5"
      >
        <div class="flex items-center gap-4">
          <div class="bg-slate-200 dark:bg-stone-900 text-slate-500 p-2 rounded-xl">
            <Icon name="mdi:calendar-month-outline" class="size-6" />
          </div>
          <h3 class="text-primary text-xl">Calendar</h3>
        </div>
        <Icon name="mdi:chevron-right" class="text-slate-400" />
      </div>

      <div 
        @click="navigateTo(`/leagues/${leagueId}/roster`)"
        class="card-interactive flex items-center justify-between p-5"
      >
        <div class="flex items-center gap-4">
          <div class="bg-slate-200 dark:bg-stone-900 text-slate-500 p-2 rounded-xl">
            <Icon name="mdi:account-group-outline" class="size-6" />
          </div>
          <h3 class="text-primary text-xl">Roster</h3>
        </div>
        <Icon name="mdi:chevron-right" class="text-slate-400" />
      </div>

      <template v-if="isAdmin">
        <div class="mt-8 mb-2 px-1 flex items-center justify-between">
          <h2 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Tools</h2>
          <div class="h-px flex-1 bg-slate-200 dark:bg-slate-800 ml-4"></div>
        </div>

        <div 
          @click="isAnnouncementModalOpen = true"
          class="card-interactive flex items-center justify-between p-5 border-2 border-dashed !border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all group"
        >
          <div class="flex items-center gap-4">
            <div class="bg-blue-500 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20 group-active:scale-95 transition-transform">
              <Icon name="mdi:bullhorn-outline" class="size-6" />
            </div>
            <div>
              <h3 class="font-black text-xl italic uppercase text-blue-700 dark:text-blue-500">Send Announcement</h3>
            </div>
          </div>
          <Icon name="mdi:chevron-right" class="text-blue-600/50 dark:text-blue-400" />
        </div>
      </template>

    </div>

    <ClientOnly>
      <LazyAnnouncementModal
        v-if="isAdmin"
        :is-open="isAnnouncementModalOpen" 
        @close="isAnnouncementModalOpen = false"
        @send="handleSendAnnouncement"
      />
    </ClientOnly>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'
import { useUIStore } from '~/stores/ui'
import { useToast } from '~/composables/useToast'
import { getLocalIsoDate, isEventFinished } from '~/utils/leagueActions'
import AnnouncementModal from '~/components/AnnouncementModal.vue'

const { $db } = useNuxtApp()
const route = useRoute()
const authStore = useAuthStore()
const dataStore = useData()
const uiStore = useUIStore()
const toast = useToast()

const leagueId = route.params.id 
const todayIso = getLocalIsoDate()

const isAnnouncementModalOpen = ref(false)

// --- FETCH ON MOUNT ---
onMounted(async () => {
  await dataStore.fetchUpcomingEvents(leagueId)
})

const leagueData = computed(() => dataStore.leagues.find(l => l.id === leagueId))
const leagueName = computed(() => leagueData.value?.shortName || 'League')
const isAdmin = computed(() => authStore.isAdminForLeague?.(leagueData.value))
const isPlayerInLeague = computed(() => (authStore.userProfile?.leagues || []).includes(leagueId))
const yearlyGames = computed(() => leagueData.value?.yearly_games || [])

// --- NEXT ACTIVE EVENT LOGIC ---
const nextActiveEvent = computed(() => {
  const storeEvent = dataStore.getNextActiveEvent(leagueId)
  if (storeEvent) return storeEvent
  if (leagueData.value?.nextRound && !isEventFinished(leagueData.value.nextRound.status)) return leagueData.value.nextRound
  return null
})

// --- START / RESUME CHECKS ---
const hasEventToday = computed(() => nextActiveEvent.value?.iso === todayIso)
const isLive = computed(() => dataStore.liveRounds.some(r => r.leagueId === leagueId && r.iso === todayIso))
const activeRoundId = computed(() => {
  const myId = authStore.userProfile?.id
  if (!myId || !dataStore.liveRounds.length) return null
  const found = dataStore.liveRounds.find(r => r.leagueId === leagueId && r.iso === todayIso && r.players?.some(p => String(p.id) === String(myId)))
  return found?.id || null
})

const startRound = () => {
  navigateTo(`/rounds/setup?leagueId=${leagueId}&isLeague=true&from=menu`) 
}

// --- AD HOC MESSAGING LOGIC ---
const handleSendAnnouncement = async (payload) => {
  uiStore.setLoading(true, "Broadcasting...")
  try {
    const announcementsRef = collection($db, "leagues", leagueId, "announcements")
    
    await addDoc(announcementsRef, {
      title: payload.title,
      body: payload.body,
      createdBy: authStore.userProfile.id,
      authorName: `${authStore.userProfile.fname} ${authStore.userProfile.lname}`,
      createdAt: serverTimestamp()
    })

    toast.add("Announcement sent successfully!", "success")
    isAnnouncementModalOpen.value = false
  } catch (error) {
    console.error("Failed to send announcement:", error)
    toast.add("Failed to broadcast message", "error")
  } finally {
    uiStore.setLoading(false)
  }
}
</script>