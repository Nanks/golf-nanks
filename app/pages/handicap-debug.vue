<template>
  <div class="max-w-2xl mx-auto pb-32 pt-8 px-4 space-y-6">
    <div class="text-center mb-2">
      <h1 class="text-3xl font-black text-primary">League Handicap Debug</h1>
    </div>

    <div class="card-base p-6 space-y-4">
      <div>
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">League</label>
        <select
          v-model="selectedLeagueId"
          @change="onLeagueChange"
          class="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black uppercase text-sm dark:text-white outline-none focus:border-emerald-500 transition-all"
        >
          <option value="" disabled>Select a league</option>
          <option v-for="l in dataStore.leagues" :key="l.id" :value="l.id">{{ l.shortName || l.name }}</option>
        </select>
      </div>

      <div>
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Player</label>
        <select
          v-model="selectedPlayerId"
          :disabled="!selectedLeagueId || rosterLoading"
          class="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black uppercase text-sm dark:text-white outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
        >
          <option value="" disabled>{{ rosterLoading ? 'Loading roster...' : 'Select a player' }}</option>
          <option v-for="p in roster" :key="p.id" :value="p.id">{{ p.fname }} {{ p.lname }}</option>
        </select>
      </div>

      <button
        @click="runPreview"
        :disabled="!selectedLeagueId || !selectedPlayerId || loading"
        class="w-full py-3.5 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50"
      >
        {{ loading ? 'Calculating...' : 'Calculate (Read-Only, Does Not Save)' }}
      </button>
    </div>

    <div v-if="diagnostics" class="card-base p-6 text-left">
      <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Match Diagnostics</p>
      <div class="text-center">
        <span class="text-2xl font-black text-primary block tabular-nums">{{ diagnostics.matchingRounds }}</span>
        <span class="text-[9px] uppercase text-secondary">Rounds for this Player + League (leagueId match)</span>
      </div>
      <p v-if="diagnostics.matchingRounds === 0" class="text-[10px] text-amber-600 dark:text-amber-500 mt-3">
        No rounds under this player carry a <code>leagueId</code> matching this league &mdash; that's why the
        calculator falls back to a GHIN&minus;3 placeholder for every slot.
      </p>
    </div>

    <div v-if="allRounds" class="card-base p-4 text-left">
      <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-2">
        Rounds for this Player + League ({{ allRounds.length }})
      </p>
      <div class="space-y-1.5">
        <div
          v-for="row in allRounds" :key="row.id"
          class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-2"
        >
          <div class="min-w-0">
            <p class="text-xs font-black text-primary truncate">{{ row.date || 'No Date' }}</p>
            <p class="text-[9px] text-slate-400 truncate">type: {{ row.type || '—' }}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0 text-right">
            <div>
              <p class="text-[8px] uppercase text-slate-400 font-bold leading-none">Status</p>
              <p class="text-[11px] font-black italic">{{ row.eventStatus || '—' }}</p>
            </div>
            <div>
              <p class="text-[8px] uppercase text-slate-400 font-bold leading-none">Diff</p>
              <p class="text-[11px] font-black italic">{{ row.differential !== null ? row.differential.toFixed(3) : '—' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="result" class="card-base p-6 space-y-4">
      <div class="text-center">
        <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Calculated League Handicap</p>
        <p class="text-4xl font-black text-emerald-600 dark:text-emerald-400 italic tabular-nums">{{ Number(result.hcp).toFixed(3) }}</p>
      </div>

      <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">
        Full Audit ({{ result.audit.length }} slots)
      </p>

      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="(round, idx) in result.audit" :key="idx"
          :class="round.isPadding
            ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30'
            : bestIndices.has(idx)
              ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
              : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30'"
          class="flex flex-col justify-between p-2 rounded-xl border transition-all relative"
        >
          <div v-if="bestIndices.has(idx)" class="absolute top-1 right-1">
            <Icon name="mdi:check-circle" class="size-2.5 text-emerald-500" />
          </div>

          <div class="flex flex-col mb-1">
            <span class="text-[8px] text-slate-400 font-black uppercase tracking-tighter truncate">
              {{ round.isPadding ? 'Placeholder' : formatDate(round.date) }}
            </span>
          </div>

          <div class="flex justify-between items-end">
            <div>
              <p class="text-[6px] uppercase text-slate-400 font-bold leading-none">Adj Gross</p>
              <p :class="bestIndices.has(idx) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'" class="text-[11px] font-black italic">
                {{ round.adjustedGross ?? '—' }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[6px] uppercase text-slate-400 font-bold leading-none">Diff</p>
              <p :class="bestIndices.has(idx) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'" class="text-[11px] font-black italic">
                {{ round.differential?.toFixed(3) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { useNuxtApp } from '#imports';
import { useAuthStore } from '~/stores/auth';
import { useData } from '~/stores/data';
import { useHandicap } from '~/composables/useHandicap';
import { calcPops, calcAdjustedGross, calcDifferential } from '~/utils/gameLogic';

const { $db } = useNuxtApp();
const authStore = useAuthStore();
const dataStore = useData();
const { calculateLeagueHandicap } = useHandicap();

// Default to SSC if present, but the dropdown can select any league
const selectedLeagueId = ref('vcx75B9fY6uqgAuNo0rL');
const selectedPlayerId = ref('');

const roster = ref([]);
const rosterLoading = ref(false);

const loading = ref(false);
const result = ref(null);
const diagnostics = ref(null);
const allRounds = ref(null);

const bestIndices = computed(() => {
  if (!result.value?.audit?.length) return new Set();
  const sorted = result.value.audit
    .map((r, idx) => ({ ...r, idx }))
    .sort((a, b) => a.differential - b.differential);
  return new Set(sorted.slice(0, 4).map(r => r.idx));
});

const formatDate = (d) => {
  if (!d) return 'Est. Round';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Same math the real calculator uses, applied to every round regardless of
// whether it matches this league -- purely so the raw table shows something.
const computeDifferential = (round) => {
  const teeData = round.courseSnapshot?.tees?.[round.teesId];
  if (!teeData || !round.scores || round.scores.includes(0)) return null;

  const pops = calcPops({ index: round.index }, teeData);
  const adjustedGross = calcAdjustedGross(round.scores, teeData.pars, pops);
  if (!adjustedGross) return null;

  return calcDifferential(adjustedGross, teeData.rating, teeData.slope);
};

const loadRoster = async () => {
  if (!selectedLeagueId.value) return;

  rosterLoading.value = true;
  selectedPlayerId.value = '';
  roster.value = [];

  try {
    const q = query(collection($db, 'players'), where('leagues', 'array-contains', selectedLeagueId.value));
    const snap = await getDocs(q);

    roster.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.lname || '').localeCompare(b.lname || ''));

    // Default to the logged-in user if they're on this roster, else the first player
    const me = roster.value.find(p => p.id === authStore.userProfile?.id);
    selectedPlayerId.value = me?.id || roster.value[0]?.id || '';
  } finally {
    rosterLoading.value = false;
  }
};

const onLeagueChange = () => {
  result.value = null;
  diagnostics.value = null;
  allRounds.value = null;
  loadRoster();
};

const runPreview = async () => {
  if (!selectedLeagueId.value || !selectedPlayerId.value) return;

  loading.value = true;
  result.value = null;
  diagnostics.value = null;
  allRounds.value = null;

  try {
    const playerId = selectedPlayerId.value;
    const player = roster.value.find(p => p.id === playerId);

    // Pre-fetch this league's calendar as iso -> { id, status }, used to
    // resolve event status for rounds that belong to this league.
    const calSnap = await getDocs(collection($db, 'leagues', selectedLeagueId.value, 'calendar'));
    const calendarByIso = new Map();
    calSnap.docs.forEach(d => {
      const data = d.data();
      if (data.iso) calendarByIso.set(data.iso, { id: d.id, status: data.status || null });
    });

    // Only find rounds for this exact player + league -- same filter the
    // real calculator uses.
    const roundsQ = query(
      collection($db, 'players', playerId, 'rounds'),
      where('leagueId', '==', selectedLeagueId.value)
    );
    const roundsSnap = await getDocs(roundsQ);
    const rawRounds = roundsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    diagnostics.value = { matchingRounds: rawRounds.length };

    // Resolve event status per round: prefer a direct eventId lookup, fall
    // back to matching this league's calendar by iso.
    const eventDocCache = new Map();
    const resolveEventStatus = async (round) => {
      if (round.eventId) {
        if (!eventDocCache.has(round.eventId)) {
          const eventSnap = await getDoc(doc($db, 'leagues', selectedLeagueId.value, 'calendar', round.eventId));
          eventDocCache.set(round.eventId, eventSnap.exists() ? (eventSnap.data().status || null) : null);
        }
        return eventDocCache.get(round.eventId);
      }

      if (round.iso) return calendarByIso.get(round.iso)?.status || null;
      return null;
    };

    const enrichedRounds = [];
    for (const round of rawRounds) {
      enrichedRounds.push({
        ...round,
        date: round.iso || round.date || null,
        differential: computeDifferential(round),
        eventStatus: await resolveEventStatus(round)
      });
    }
    enrichedRounds.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    allRounds.value = enrichedRounds;

    result.value = await calculateLeagueHandicap(playerId, selectedLeagueId.value, player?.ghin || 0);
  } finally {
    loading.value = false;
  }
};

onMounted(loadRoster);
</script>
