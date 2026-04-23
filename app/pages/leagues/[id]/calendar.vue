<template>
  <div class="max-w-2xl mx-auto select-none pb-32">
    <template v-if="leagueData">
      <LeagueHeader 
        :title="leagueData.shortName || leagueData.name" 
        :is-admin="isAdmin"
        :back-to="`/leagues/${route.params.id}/menu`"
        back-text="League Menu"
      >
        <template #action>
          <ClientOnly>
            <button 
              v-if="isAdmin"
              @click="isAdminMode = !isAdminMode" 
              :class="isAdminMode ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800'"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
              <Icon :name="isAdminMode ? 'mdi:lock-open-variant' : 'mdi:cog'" class="size-3.5" />
              <span>{{ isAdminMode ? 'Finish' : 'Manage' }}</span>
            </button>
          </ClientOnly>
        </template>
      </LeagueHeader>

      <div class="flex items-center justify-center gap-8 mb-6">
        <button @click="prevYear" :disabled="selectedYear <= 2016" class="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800 disabled:opacity-20 text-slate-400 active:scale-90 active:text-emerald-500">
          <Icon name="mdi:chevron-left" class="size-6" />
        </button>
        <div class="text-center min-w-[80px]">
          <span class="text-primary text-3xl tabular-nums">{{ selectedYear }}</span>
        </div>
        <button @click="nextYear" :disabled="selectedYear >= currentYear" class="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800 disabled:opacity-20 text-slate-400 active:scale-90 active:text-emerald-500">
          <Icon name="mdi:chevron-right" class="size-6" />
        </button>
      </div>

      <div class="space-y-3 px-1">
        <ClientOnly>
          <button v-if="isAdminMode" @click="openAddModal" class="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 active:border-emerald-500 active:text-emerald-500 flex items-center justify-center gap-2 mb-4">
            <Icon name="mdi:plus-circle-outline" class="size-4" /> Add Event
          </button>
        </ClientOnly>

        <div v-for="event in events" :key="event.id" 
          @click="handleCardClick(event)"
          class="card-base flex items-center p-3 gap-4 transition-all group"
          :class="{ 'active:scale-[0.98] active:bg-slate-50 dark:active:bg-slate-900/50 cursor-pointer': isClickable(event) }"
        >
          <div class="w-12 shrink-0 text-center flex flex-col items-center justify-center">
            <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">{{ getEventMonth(event.iso) }}</span>
            <span class="text-primary text-2xl tabular-nums leading-none">{{ getEventDay(event.iso) }}</span>
          </div>

          <div class="w-px h-10 bg-slate-200 dark:bg-slate-800 shrink-0"></div>

          <div class="flex-1 min-w-0">
            <h3 class="text-2xl text-primary leading-none">{{ event.tees || 'TBD' }}</h3>
            <div v-if="event.game?.length" class="flex gap-1.5 flex-wrap mt-2">
              <div v-for="g in event.game.filter(g => g.toLowerCase() !== 'stroke play')" :key="g"
                class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {{ event.game.length > 2 ? getInitials(g) : g }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div v-if="getStatusUI(event.status, event.iso)" :class="getStatusUI(event.status, event.iso).color">
              <Icon :name="getStatusUI(event.status, event.iso).icon" class="size-6" />
            </div>
            
            <ClientOnly>
              <div v-if="isAdminMode" class="flex gap-1">
                <button @click.stop="openEditModal(event)" class="p-1.5 text-slate-300 active:text-amber-500"><Icon name="mdi:pencil-circle" class="size-7" /></button>
                <button @click.stop="promptDelete(event)" class="p-1.5 text-slate-300 active:text-red-500"><Icon name="mdi:close-circle-outline" class="size-6" /></button>
              </div>
              <Icon v-else-if="isClickable(event)"
                :name="(event.iso === todayISO && dataStore.isLeagueLiveToday(route.params.id)) ? 'mdi:poker-chip' : 'mdi:chevron-right'" 
                :class="(event.iso === todayISO && dataStore.isLeagueLiveToday(route.params.id)) ? 'text-emerald-500 animate-pulse' : 'text-slate-300 dark:text-slate-600'"
                class="size-6 transition-colors group-active:text-emerald-500" 
              />
            </ClientOnly>
          </div>
        </div>

        <div v-if="events.length === 0" class="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Icon name="mdi:calendar-blank" class="size-12 text-slate-200 dark:text-slate-800 mb-3 mx-auto" />
          <p class="text-secondary text-xs">No events for {{ selectedYear }}</p>
        </div>
      </div>
    </template>

    <ClientOnly>
      <CalendarEventModal :is-open="isModalOpen" :event="activeEvent" :league="leagueData" @close="isModalOpen = false" @save="handleSaveEvent" />
      <ConfirmModal :is-open="isDeleteModalOpen" title="Delete Event?" confirm-text="Delete" icon="mdi:calendar-remove" @close="cancelDelete" @confirm="executeDelete" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { useUIStore, useAuthStore, useData } from "#imports"

const { $db } = useNuxtApp()
const route = useRoute()
const ui = useUIStore(); const authStore = useAuthStore(); const dataStore = useData()

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear); const events = ref([]); const isAdminMode = ref(false)
const isModalOpen = ref(false); const activeEvent = ref(null); const isDeleteModalOpen = ref(false); const eventToDelete = ref(null)
let currentUnsub = null

const todayISO = new Date().toISOString().split('T')[0]
const leagueData = computed(() => dataStore.leagues.find(l => l.id === route.params.id))
const isAdmin = computed(() => leagueData.value && authStore.isAdminForLeague(leagueData.value.type))

const loadEventsForYear = (year) => {
  if (currentUnsub) currentUnsub()
  const q = query(collection($db, "leagues", route.params.id, "calendar"), where("iso", ">=", `${year}-01-01`), where("iso", "<=", `${year}-12-31`), orderBy("iso", "asc"))
  currentUnsub = onSnapshot(q, (snap) => { events.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) })
}

const handleCardClick = (event) => {
  if (!isClickable(event)) return
  const type = leagueData.value?.type || 'casual'
  const path = (event.iso === todayISO && dataStore.isLeagueLiveToday(route.params.id)) 
    ? `/leaderboard/${type}/${event.iso}/live?from=calendar` 
    : `/leaderboard/${type}/${event.iso}/history`
  navigateTo(path)
}

const isClickable = (event) => {
  if (isAdminMode.value) return false
  const status = (event.status || '').toLowerCase().replace(/^mdi-/, 'mdi:')
  const finished = ['complete', 'mdi:check-bold', 'rain', 'handicap', 'practice'].includes(status)
  return finished || event.iso <= todayISO
}

const getStatusUI = (status, iso) => {
  if (!status) return iso < todayISO ? { icon: 'mdi:check-circle-outline', color: 'text-slate-400' } : null
  const s = status.toLowerCase().replace(/^mdi-/, 'mdi:')
  if (['complete', 'mdi:check-bold'].includes(s)) return { icon: 'mdi:check-circle', color: 'text-emerald-500' }
  if (['practice', 'mdi:alpha-p-circle-outline'].includes(s)) return { icon: 'mdi:flag-triangle', color: 'text-blue-500' }
  if (['rain', 'mdi:weather-pouring', 'mdi:cancel'].includes(s)) return { icon: 'mdi:weather-pouring', color: 'text-slate-400' }
  if (s === 'handicap') return { icon: 'mdi:calculator', color: 'text-amber-500' }
  return s.startsWith('mdi:') ? { icon: s, color: 'text-slate-400' } : (iso < todayISO ? { icon: 'mdi:check-circle-outline', color: 'text-slate-400' } : null)
}

const openAddModal = () => { activeEvent.value = null; isModalOpen.value = true }
const openEditModal = (event) => { activeEvent.value = { ...event }; isModalOpen.value = true }
const handleSaveEvent = async (data) => {
  ui.setLoading(true, "Saving...")
  try {
    const ref = activeEvent.value?.id ? doc($db, "leagues", route.params.id, "calendar", activeEvent.value.id) : collection($db, "leagues", route.params.id, "calendar")
    activeEvent.value?.id ? await updateDoc(ref, { ...data, lastUpdated: new Date().toISOString() }) : await addDoc(ref, { ...data, lastUpdated: new Date().toISOString() })
    isModalOpen.value = false
  } finally { ui.setLoading(false) }
}
const promptDelete = (event) => { eventToDelete.value = event; isDeleteModalOpen.value = true }
const cancelDelete = () => { isDeleteModalOpen.value = false; eventToDelete.value = null }
const executeDelete = async () => {
  ui.setLoading(true, "Deleting...")
  try { await deleteDoc(doc($db, "leagues", route.params.id, "calendar", eventToDelete.value.id)); cancelDelete() } finally { ui.setLoading(false) }
}

const getInitials = (s) => s ? s.split(' ').map(w => w[0]).join('').toUpperCase() : ''
const nextYear = () => { selectedYear.value = Math.min(selectedYear.value + 1, currentYear) }
const prevYear = () => { selectedYear.value = Math.max(selectedYear.value - 1, 2016) }
const getEventMonth = (iso) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD'
const getEventDay = (iso) => iso ? new Date(iso + 'T12:00:00').getDate() : '-'

onMounted(() => { loadEventsForYear(selectedYear.value); dataStore.startLiveListener({ leagueId: route.params.id }) })
onUnmounted(() => { if (currentUnsub) currentUnsub() })
watch(selectedYear, (v) => loadEventsForYear(v))
</script>