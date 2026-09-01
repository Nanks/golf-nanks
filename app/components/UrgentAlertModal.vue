<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="currentAlert"
        :class="isUrgent ? 'bg-red-950/80' : 'bg-emerald-950/80'"
        class="fixed inset-0 z-[600] flex items-center justify-center p-6 backdrop-blur-sm transition-colors"
      >
        <div :class="isUrgent ? 'border-red-500/50' : 'border-emerald-500/50'" class="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border-2 p-8 text-center transition-colors">
          <div :class="isUrgent ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'" class="size-16 mx-auto mb-5 rounded-2xl border flex items-center justify-center transition-colors">
            <Icon :name="isUrgent ? 'mdi:alert-decagram' : 'mdi:information'" :class="isUrgent ? 'text-red-500' : 'text-emerald-500'" class="size-8" />
          </div>
          <p :class="isUrgent ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-500'" class="text-[10px] font-black uppercase tracking-[0.3em] mb-2 transition-colors">
            {{ currentAlert.leagueName || 'League' }} {{ isUrgent ? 'Alert' : 'Notice' }}
          </p>
          <p class="text-slate-900 dark:text-white text-lg font-bold leading-snug mb-6 whitespace-pre-wrap">
            {{ currentAlert.message }}
          </p>
          <button
            @click="dismiss"
            :class="isUrgent ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'"
            class="w-full py-4 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all active:scale-95"
          >
            Dismiss
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'
import { useData } from '~/stores/data'
import { getLocalIsoDate } from '~/utils/leagueActions'

const { $db } = useNuxtApp()
const route = useRoute()
const authStore = useAuthStore()
const dataStore = useData()

// An alert older than this when the app loads is stale, not urgent anymore
// -- don't surface it.
const ALERT_MAX_AGE_MS = 6 * 60 * 60 * 1000 // 6 hours
const DISMISSED_KEY = 'golf_nanks_dismissed_alerts'

const liveAlerts = ref([])
let unsub = null

const getDismissedIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

const markDismissed = (id) => {
  try {
    const ids = getDismissedIds()
    ids.add(id)
    // Cap so this doesn't grow forever -- worst case a very old dismissal
    // falls off and that alert (already 6+ hours stale by then anyway,
    // given ALERT_MAX_AGE_MS) could reshow once.
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids).slice(-50)))
  } catch { /* localStorage unavailable -- worst case an alert reshows */ }
}

// Bumped after each dismiss so pendingAlerts (which reads localStorage, an
// untracked source) re-evaluates -- Vue's reactivity can't see into
// localStorage on its own.
const dismissTick = ref(0)

// Alerts are tied to a specific event, not a whole league -- they should
// only reach a player who's actually engaged with that event: currently in
// a live_rounds doc for it, or on the round-setup page trying to start a
// round for it (setup has no eventId in the URL -- it resolves "today's
// scheduled event" for the league in route.query.leagueId, so match that).
const relevantEventIds = computed(() => {
  const ids = new Set()
  const myId = authStore.userProfile?.id

  if (myId) {
    dataStore.liveRounds.forEach(r => {
      if (r.eventId && r.players?.some(p => String(p.id) === String(myId))) ids.add(r.eventId)
    })
  }

  if (route.path === '/rounds/setup' && route.query.leagueId) {
    const league = dataStore.leagues.find(l => l.id === route.query.leagueId)
    const today = getLocalIsoDate()
    if (league?.nextRound?.iso === today && league.nextRound.id) ids.add(league.nextRound.id)
  }

  return Array.from(ids)
})

const startListener = () => {
  if (unsub) { unsub(); unsub = null }
  // Firestore 'in' supports up to 30 values -- comfortably covers how many
  // events one player could realistically be tied to at once.
  const eventIds = relevantEventIds.value.slice(0, 30)
  if (eventIds.length === 0) { liveAlerts.value = []; return }

  const q = query(collection($db, 'alerts'), where('eventId', 'in', eventIds))
  unsub = onSnapshot(q, (snap) => {
    liveAlerts.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

// .join(',') rather than a deep watch -- cheap way to react to the actual
// set of ids changing (a new live round, finishing one, navigating to/from
// the setup page) without re-subscribing on every unrelated store mutation.
watch(() => relevantEventIds.value.join(','), startListener, { immediate: true })

onUnmounted(() => { if (unsub) unsub() })

// Recent, undismissed alerts, oldest first -- shown one at a time so a
// second alert (rare, but possible) doesn't get buried behind the first.
const pendingAlerts = computed(() => {
  dismissTick.value
  const dismissed = getDismissedIds()
  const cutoff = Date.now() - ALERT_MAX_AGE_MS
  return liveAlerts.value
    .filter(a => !dismissed.has(a.id) && (a.postedAt?.toMillis?.() ?? 0) >= cutoff)
    .sort((a, b) => (a.postedAt?.toMillis?.() ?? 0) - (b.postedAt?.toMillis?.() ?? 0))
})

const currentAlert = computed(() => {
  const next = pendingAlerts.value[0]
  if (!next) return null
  const league = dataStore.leagues.find(l => l.id === next.leagueId)
  return { ...next, leagueName: league?.shortName || league?.name }
})

// Defaults to urgent styling for any older alert docs sent before severity
// existed.
const isUrgent = computed(() => (currentAlert.value?.severity ?? 'urgent') === 'urgent')

const dismiss = () => {
  if (!currentAlert.value) return
  markDismissed(currentAlert.value.id)
  dismissTick.value++
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
