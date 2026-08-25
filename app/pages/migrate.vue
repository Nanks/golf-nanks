<template>
  <div class="max-w-2xl mx-auto select-none pb-32 pt-8 px-4 space-y-6">

    <div class="text-center mb-2">
      <h1 class="text-3xl font-black text-primary">Database Migrations</h1>
    </div>

    <!-- ============================================================ -->
    <!-- Player Archive Cleanup                                       -->
    <!-- ============================================================ -->
    <div class="card-base p-8 flex flex-col items-center text-center gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-900">

      <div class="space-y-2">
        <h2 class="text-xl font-black text-primary">Player Archive Cleanup</h2>
        <p class="text-secondary text-sm">2025+ Activity</p>
      </div>

      <div v-if="status === 'idle'" class="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 p-4 rounded-xl text-xs max-w-md border border-amber-200 dark:border-amber-800/50">
        This will scan all players. If their leagues array is empty OR they have no rounds since Jan 1, 2025, they will be marked as inactive.
      </div>

      <div v-if="status === 'running'" class="flex flex-col items-center gap-4 py-4">
        <Icon name="mdi:loading" class="size-10 text-emerald-500 animate-spin" />
        <p class="text-emerald-600 font-black tracking-widest text-xs uppercase animate-pulse">
          Processing {{ processedCount }} / {{ totalCount }} Players...
        </p>
      </div>

      <div v-if="status === 'complete'" class="flex flex-col items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 w-full p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
        <Icon name="mdi:check-circle" class="size-12 text-emerald-500" />

        <div class="grid grid-cols-2 gap-8 w-full max-w-xs mt-2">
          <div class="flex flex-col items-center">
            <span class="text-4xl font-black text-emerald-600 tabular-nums italic">{{ activeCount }}</span>
            <span class="text-[10px] font-black uppercase text-emerald-800/50 dark:text-emerald-200/50 tracking-widest mt-1">Active</span>
          </div>

          <div class="flex flex-col items-center border-l border-emerald-200 dark:border-emerald-800/50">
            <span class="text-4xl font-black text-amber-500 tabular-nums italic">{{ archivedCount }}</span>
            <span class="text-[10px] font-black uppercase text-amber-700/50 dark:text-amber-300/50 tracking-widest mt-1">Archived</span>
          </div>
        </div>
      </div>

      <button
        v-if="status === 'idle'"
        @click="runMigration"
        class="mt-4 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all w-full sm:w-auto"
      >
        Begin Migration
      </button>

      <button
        v-if="status === 'complete'"
        @click="status = 'idle'"
        class="mt-4 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
      >
        Reset
      </button>

    </div>

    <!-- ============================================================ -->
    <!-- Calendar Status Normalization                                 -->
    <!-- ============================================================ -->
    <div class="card-base p-8 flex flex-col items-center text-center gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-900">

      <div class="space-y-2">
        <h2 class="text-xl font-black text-primary">Calendar Status Normalization</h2>
        <p class="text-secondary text-sm">Legacy Icon Values &rarr; complete / rain / handicap / practice</p>
      </div>

      <div v-if="statusMigration.state === 'idle'" class="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 p-4 rounded-xl text-xs max-w-md border border-amber-200 dark:border-amber-800/50 text-left">
        Scans every league's <code>calendar</code> sub-collection and rewrites old icon-name statuses
        (e.g. <code>mdi-check-bold</code>, <code>mdi-alpha-h-circle-outline</code>) to the current values:
        <code>complete</code>, <code>rain</code>, <code>handicap</code>, <code>practice</code>.
        Events already on a canonical value (or unset/"Live") are left untouched. Anything it doesn't
        recognize is skipped and reported below rather than guessed at.
      </div>

      <div v-if="statusMigration.state === 'running'" class="flex flex-col items-center gap-4 py-4">
        <Icon name="mdi:loading" class="size-10 text-emerald-500 animate-spin" />
        <p class="text-emerald-600 font-black tracking-widest text-xs uppercase animate-pulse">
          Scanned {{ statusMigration.processed }} events...
        </p>
      </div>

      <div v-if="statusMigration.state === 'complete'" class="flex flex-col items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 w-full p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
        <Icon name="mdi:check-circle" class="size-12 text-emerald-500" />

        <div class="grid grid-cols-2 gap-8 w-full max-w-xs mt-2">
          <div class="flex flex-col items-center">
            <span class="text-4xl font-black text-emerald-600 tabular-nums italic">{{ statusMigration.updated }}</span>
            <span class="text-[10px] font-black uppercase text-emerald-800/50 dark:text-emerald-200/50 tracking-widest mt-1">Updated</span>
          </div>

          <div class="flex flex-col items-center border-l border-emerald-200 dark:border-emerald-800/50">
            <span class="text-4xl font-black text-slate-500 tabular-nums italic">{{ statusMigration.processed }}</span>
            <span class="text-[10px] font-black uppercase text-slate-500/50 tracking-widest mt-1">Scanned</span>
          </div>
        </div>

        <div v-if="statusMigration.unrecognized.length > 0" class="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-left space-y-2">
          <p class="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest">
            {{ statusMigration.unrecognized.length }} Unrecognized (Skipped)
          </p>
          <div v-for="item in statusMigration.unrecognized" :key="`${item.leagueId}-${item.eventId}`" class="text-[11px] font-mono text-red-700 dark:text-red-400">
            {{ item.leagueId }} / {{ item.eventId }}: <span class="font-black">"{{ item.raw }}"</span>
          </div>
        </div>
      </div>

      <button
        v-if="statusMigration.state === 'idle'"
        @click="runStatusMigration"
        class="mt-4 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all w-full sm:w-auto"
      >
        Begin Migration
      </button>

      <button
        v-if="statusMigration.state === 'complete'"
        @click="statusMigration.state = 'idle'"
        class="mt-4 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
      >
        Reset
      </button>

    </div>

    <!-- ============================================================ -->
    <!-- Round eventId Backfill                                       -->
    <!-- ============================================================ -->
    <div class="card-base p-8 flex flex-col items-center text-center gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-900">

      <div class="space-y-2">
        <h2 class="text-xl font-black text-primary">Round eventId Backfill</h2>
        <p class="text-secondary text-sm">players/*/rounds &rarr; leagues/*/calendar</p>
      </div>

      <div v-if="eventIdBackfill.state === 'idle'" class="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 p-4 rounded-xl text-xs max-w-md border border-amber-200 dark:border-amber-800/50 text-left">
        Scans every player's <code>rounds</code> sub-collection for docs missing <code>eventId</code>.
        Rounds with <code>type</code> of <code>casual</code> or <code>other</code> are skipped. The league
        is resolved via the round's <code>leagueId</code> if present, otherwise by matching the round's
        <code>type</code> to a league's <code>type</code>. The matching calendar event is then found by
        matching <code>iso</code>. Anything ambiguous (no match, or more than one) is skipped and
        reported below rather than guessed at.
      </div>

      <div v-if="eventIdBackfill.state === 'running'" class="flex flex-col items-center gap-4 py-4">
        <Icon name="mdi:loading" class="size-10 text-emerald-500 animate-spin" />
        <p class="text-emerald-600 font-black tracking-widest text-xs uppercase animate-pulse">
          Scanned {{ eventIdBackfill.scanned }} rounds...
        </p>
      </div>

      <div v-if="eventIdBackfill.state === 'complete'" class="flex flex-col items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 w-full p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
        <Icon name="mdi:check-circle" class="size-12 text-emerald-500" />

        <div class="grid grid-cols-4 gap-4 w-full mt-2">
          <div class="flex flex-col items-center">
            <span class="text-2xl font-black text-emerald-600 tabular-nums italic">{{ eventIdBackfill.updated }}</span>
            <span class="text-[9px] font-black uppercase text-emerald-800/50 dark:text-emerald-200/50 tracking-widest mt-1">Updated</span>
          </div>
          <div class="flex flex-col items-center border-l border-emerald-200 dark:border-emerald-800/50">
            <span class="text-2xl font-black text-slate-500 tabular-nums italic">{{ eventIdBackfill.alreadySet }}</span>
            <span class="text-[9px] font-black uppercase text-slate-500/50 tracking-widest mt-1">Already Set</span>
          </div>
          <div class="flex flex-col items-center border-l border-emerald-200 dark:border-emerald-800/50">
            <span class="text-2xl font-black text-slate-500 tabular-nums italic">{{ eventIdBackfill.skippedType }}</span>
            <span class="text-[9px] font-black uppercase text-slate-500/50 tracking-widest mt-1">Casual/Other</span>
          </div>
          <div class="flex flex-col items-center border-l border-emerald-200 dark:border-emerald-800/50">
            <span class="text-2xl font-black text-amber-500 tabular-nums italic">{{ eventIdBackfill.unresolved.length }}</span>
            <span class="text-[9px] font-black uppercase text-amber-700/50 dark:text-amber-300/50 tracking-widest mt-1">Unresolved</span>
          </div>
        </div>

        <div v-if="eventIdBackfill.unresolved.length > 0" class="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-left space-y-2 max-h-72 overflow-y-auto">
          <p class="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest">
            {{ eventIdBackfill.unresolved.length }} Unresolved (Skipped)
          </p>
          <div v-for="(item, idx) in eventIdBackfill.unresolved.slice(0, 100)" :key="idx" class="text-[11px] font-mono text-red-700 dark:text-red-400">
            players/{{ item.playerId }}/rounds/{{ item.roundId }} &mdash; <span class="font-black">{{ item.reason }}</span>
            <span v-if="item.leagueId"> (leagueId: {{ item.leagueId }})</span>
            <span v-if="item.type"> (type: {{ item.type }})</span>
            <span v-if="item.iso"> (iso: {{ item.iso }})</span>
          </div>
          <p v-if="eventIdBackfill.unresolved.length > 100" class="text-[10px] text-red-500 italic">
            +{{ eventIdBackfill.unresolved.length - 100 }} more not shown
          </p>
        </div>
      </div>

      <button
        v-if="eventIdBackfill.state === 'idle'"
        @click="runEventIdBackfill"
        class="mt-4 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all w-full sm:w-auto"
      >
        Begin Migration
      </button>

      <button
        v-if="eventIdBackfill.state === 'complete'"
        @click="eventIdBackfill.state = 'idle'"
        class="mt-4 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
      >
        Reset
      </button>

    </div>

    <!-- ============================================================ -->
    <!-- Round Name Mismatch Check (read-only)                        -->
    <!-- ============================================================ -->
    <div class="card-base p-8 flex flex-col items-center text-center gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-900">

      <div class="space-y-2">
        <h2 class="text-xl font-black text-primary">Round Name Mismatch Check</h2>
        <p class="text-secondary text-sm">Read-Only &mdash; Reports Only, Fixes Nothing</p>
      </div>

      <div v-if="nameCheck.state === 'idle'" class="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 p-4 rounded-xl text-xs max-w-md border border-amber-200 dark:border-amber-800/50 text-left">
        Scans every player's <code>rounds</code> sub-collection, narrowed to <code>iso == {{ TARGET_ISO }}</code>,
        and compares each round's stored <code>name</code> field against that player's current
        <code>fname</code> + <code>lname</code>. This is read-only &mdash; it doesn't touch any data,
        since it's not clear whether the round's name or the player's current name is the one that's
        wrong. Just a list to review.
      </div>

      <div v-if="nameCheck.state === 'running'" class="flex flex-col items-center gap-4 py-4">
        <Icon name="mdi:loading" class="size-10 text-emerald-500 animate-spin" />
        <p class="text-emerald-600 font-black tracking-widest text-xs uppercase animate-pulse">
          Scanned {{ nameCheck.scanned }} rounds...
        </p>
      </div>

      <div v-if="nameCheck.state === 'complete'" class="flex flex-col items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 w-full p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
        <Icon name="mdi:check-circle" class="size-12 text-emerald-500" />

        <div class="grid grid-cols-2 gap-8 w-full max-w-xs mt-2">
          <div class="flex flex-col items-center">
            <span class="text-4xl font-black text-slate-500 tabular-nums italic">{{ nameCheck.scanned }}</span>
            <span class="text-[10px] font-black uppercase text-slate-500/50 tracking-widest mt-1">Scanned</span>
          </div>
          <div class="flex flex-col items-center border-l border-emerald-200 dark:border-emerald-800/50">
            <span class="text-4xl font-black text-amber-500 tabular-nums italic">{{ nameCheck.mismatches.length }}</span>
            <span class="text-[10px] font-black uppercase text-amber-700/50 dark:text-amber-300/50 tracking-widest mt-1">Mismatches</span>
          </div>
        </div>

        <div v-if="nameCheck.mismatches.length > 0" class="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-left space-y-2 max-h-72 overflow-y-auto">
          <p class="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest">
            {{ nameCheck.mismatches.length }} Mismatch{{ nameCheck.mismatches.length === 1 ? '' : 'es' }}
          </p>
          <div v-for="(item, idx) in nameCheck.mismatches.slice(0, 100)" :key="idx" class="text-[11px] font-mono text-red-700 dark:text-red-400">
            players/{{ item.playerId }}/rounds/{{ item.roundId }}
            (iso: {{ item.iso || '—' }}) &mdash;
            round name: <span class="font-black">"{{ item.roundName || '—' }}"</span>
            vs player: <span class="font-black">"{{ item.playerName }}"</span>
          </div>
          <p v-if="nameCheck.mismatches.length > 100" class="text-[10px] text-red-500 italic">
            +{{ nameCheck.mismatches.length - 100 }} more not shown
          </p>
        </div>
      </div>

      <button
        v-if="nameCheck.state === 'idle'"
        @click="runNameCheck"
        class="mt-4 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all w-full sm:w-auto"
      >
        Run Check
      </button>

      <button
        v-if="nameCheck.state === 'complete'"
        @click="nameCheck.state = 'idle'"
        class="mt-4 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
      >
        Reset
      </button>

    </div>

    <!-- ============================================================ -->
    <!-- Round Lookup by eventId (read-only)                          -->
    <!-- ============================================================ -->
    <div class="card-base p-8 flex flex-col items-center text-center gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-900">

      <div class="space-y-2">
        <h2 class="text-xl font-black text-primary">Round Lookup by eventId</h2>
        <p class="text-secondary text-sm">Read-Only &mdash; collectionGroup('rounds') scan</p>
      </div>

      <div class="w-full text-left">
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">eventId</label>
        <input
          v-model="eventLookup.eventId"
          type="text"
          class="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-mono text-sm dark:text-white outline-none focus:border-emerald-500 transition-all"
        />
      </div>

      <p class="text-secondary text-xs">
        Finds every round doc (across all players) with this <code>eventId</code>, and shows which
        player doc each one actually lives under (<code>doc.ref.parent.parent.id</code>) alongside
        that player's current name, so a round nested under the wrong player is easy to spot.
      </p>

      <div v-if="eventLookup.state === 'running'" class="flex flex-col items-center gap-4 py-4">
        <Icon name="mdi:loading" class="size-10 text-emerald-500 animate-spin" />
        <p class="text-emerald-600 font-black tracking-widest text-xs uppercase animate-pulse">Searching...</p>
      </div>

      <div v-if="eventLookup.state === 'complete'" class="w-full text-left space-y-2">
        <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          {{ eventLookup.rows.length }} Round{{ eventLookup.rows.length === 1 ? '' : 's' }} Found
        </p>

        <div v-if="eventLookup.rows.length === 0" class="text-center text-xs text-slate-400 py-8 uppercase font-black tracking-widest">
          No rounds found with this eventId
        </div>

        <div
          v-for="row in eventLookup.rows" :key="row.roundId"
          class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-[11px] font-mono space-y-1"
        >
          <div class="text-primary text-sm font-sans font-black">{{ row.roundName || '(no name field)' }}</div>
          <div>parent player doc: <span class="text-emerald-600 dark:text-emerald-400">players/{{ row.parentPlayerId }}</span></div>
          <div>parent player's current name: <span class="font-black">{{ row.parentPlayerName || '—' }}</span></div>
          <div>round doc id: {{ row.roundId }}</div>
          <div>round.playerKey: {{ row.playerKey || '—' }}</div>
          <div>iso: {{ row.iso || '—' }} &middot; leagueId: {{ row.leagueId || '—' }} &middot; teesId: {{ row.teesId || '—' }}</div>
          <div>scores: {{ row.scores ? row.scores.join(',') : '—' }}</div>
        </div>
      </div>

      <button
        @click="runEventLookup"
        :disabled="!eventLookup.eventId || eventLookup.state === 'running'"
        class="mt-4 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all w-full sm:w-auto disabled:opacity-50"
      >
        Run Lookup
      </button>

    </div>

    <!-- ============================================================ -->
    <!-- Calendar -> Events Migration                                  -->
    <!-- ============================================================ -->
    <div class="card-base p-8 flex flex-col items-center text-center gap-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-900">

      <div class="space-y-2">
        <h2 class="text-xl font-black text-primary">Calendar &rarr; Events Migration</h2>
        <p class="text-secondary text-sm">leagues/*/calendar &rarr; top-level events collection</p>
      </div>

      <div v-if="eventsMigration.state === 'idle'" class="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 p-4 rounded-xl text-xs max-w-md border border-amber-200 dark:border-amber-800/50 text-left">
        Copies every league's <code>calendar</code> sub-collection docs into a new top-level
        <code>events</code> collection, preserving the exact same doc id and stamping a
        <code>leagueId</code> field onto each. Non-destructive (the original
        <code>leagues/*/calendar</code> docs are never touched or deleted) and safe to run
        more than once (each doc is upserted with <code>merge: true</code>, keyed by its
        existing id) -- re-run it to pick up anything added or edited since the last run.
      </div>

      <div v-if="eventsMigration.state === 'running'" class="flex flex-col items-center gap-4 py-4">
        <Icon name="mdi:loading" class="size-10 text-emerald-500 animate-spin" />
        <p class="text-emerald-600 font-black tracking-widest text-xs uppercase animate-pulse">
          Migrated {{ eventsMigration.migrated }} events across {{ eventsMigration.leaguesScanned }} leagues...
        </p>
      </div>

      <div v-if="eventsMigration.state === 'complete'" class="flex flex-col items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 w-full p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
        <Icon name="mdi:check-circle" class="size-12 text-emerald-500" />

        <div class="grid grid-cols-2 gap-8 w-full max-w-xs mt-2">
          <div class="flex flex-col items-center">
            <span class="text-4xl font-black text-emerald-600 tabular-nums italic">{{ eventsMigration.migrated }}</span>
            <span class="text-[10px] font-black uppercase text-emerald-800/50 dark:text-emerald-200/50 tracking-widest mt-1">Events Migrated</span>
          </div>

          <div class="flex flex-col items-center border-l border-emerald-200 dark:border-emerald-800/50">
            <span class="text-4xl font-black text-slate-500 tabular-nums italic">{{ eventsMigration.leaguesScanned }}</span>
            <span class="text-[10px] font-black uppercase text-slate-500/50 tracking-widest mt-1">Leagues Scanned</span>
          </div>
        </div>

        <div v-if="eventsMigration.errors.length > 0" class="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-left space-y-2">
          <p class="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest">
            {{ eventsMigration.errors.length }} League{{ eventsMigration.errors.length === 1 ? '' : 's' }} Failed
          </p>
          <div v-for="err in eventsMigration.errors" :key="err.leagueId" class="text-[11px] font-mono text-red-700 dark:text-red-400">
            {{ err.leagueName }} ({{ err.leagueId }}): <span class="font-black">{{ err.message }}</span>
          </div>
        </div>
      </div>

      <button
        v-if="eventsMigration.state === 'idle'"
        @click="runEventsMigration"
        class="mt-4 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all w-full sm:w-auto"
      >
        Begin Migration
      </button>

      <button
        v-if="eventsMigration.state === 'complete'"
        @click="eventsMigration.state = 'idle'"
        class="mt-4 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
      >
        Reset
      </button>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { collection, collectionGroup, getDocs, getDoc, query, where, writeBatch, doc } from 'firebase/firestore';
import { useNuxtApp } from '#imports';

const { $db } = useNuxtApp();

// ============================================================
// Player Archive Cleanup
// ============================================================
const status = ref('idle'); // idle, running, complete
const totalCount = ref(0);
const processedCount = ref(0);
const activeCount = ref(0);
const archivedCount = ref(0);

const runMigration = async () => {
  // Reset state
  status.value = 'running';
  processedCount.value = 0;
  activeCount.value = 0;
  archivedCount.value = 0;

  try {
    const playersRef = collection($db, 'players');
    const playersSnap = await getDocs(playersRef);

    totalCount.value = playersSnap.size;

    let batch = writeBatch($db);
    let batchCount = 0;

    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data();
      const playerId = playerDoc.id;
      let shouldArchive = false;

      // Condition 1: Empty or missing leagues array
      if (!data.leagues || !Array.isArray(data.leagues) || data.leagues.length === 0) {
        shouldArchive = true;
      } else {
        // Condition 2: No rounds with iso >= 2025-01-01 in their specific subcollection
        const roundsRef = collection($db, 'players', playerId, 'rounds');
        const roundsQuery = query(
          roundsRef,
          where('iso', '>=', '2025-01-01')
        );

        const roundsSnap = await getDocs(roundsQuery);

        if (roundsSnap.empty) {
          shouldArchive = true;
        }
      }

      // If they shouldn't be archived, they are active
      const newActiveState = !shouldArchive;

      // Log it for the UI totals
      newActiveState ? activeCount.value++ : archivedCount.value++;

      // Only queue a database write if the field actually needs to change or be created
      if (data.active !== newActiveState) {
        batch.update(doc($db, 'players', playerId), { active: newActiveState });
        batchCount++;

        // Commit if we hit the 500 limit just to be safe
        if (batchCount === 500) {
          await batch.commit();
          batch = writeBatch($db);
          batchCount = 0;
        }
      }

      processedCount.value++;
    }

    // Commit any remaining updates left in the queue
    if (batchCount > 0) {
      await batch.commit();
    }

    status.value = 'complete';

  } catch (error) {
    console.error("Migration failed:", error);
    alert("An error occurred. Check the console for details.");
    status.value = 'idle';
  }
};

// ============================================================
// Calendar Status Normalization
// ============================================================
const statusMigration = ref({
  state: 'idle', // idle, running, complete
  processed: 0,
  updated: 0,
  unrecognized: [] // [{ leagueId, eventId, raw }]
});

// Legacy icon-name values (as they were stored directly on the `status` field,
// with either a `mdi-` or `mdi:` prefix) mapped to the current canonical values.
const LEGACY_STATUS_MAP = {
  'mdi-check-bold': 'complete',
  'mdi:check-bold': 'complete',
  'mdi-alpha-h-circle-outline': 'handicap',
  'mdi:alpha-h-circle-outline': 'handicap',
  'mdi-alpha-p-circle-outline': 'practice',
  'mdi:alpha-p-circle-outline': 'practice',
  'mdi-weather-pouring': 'rain',
  'mdi:weather-pouring': 'rain',
};

const CANONICAL_STATUSES = new Set(['complete', 'rain', 'handicap', 'practice', 'canceled']);

// Returns { value, changed, unrecognized } -- never mutates in place, and never
// guesses: anything not explicitly known is left alone and flagged.
const normalizeStatus = (raw) => {
  if (raw === null || raw === undefined || raw === '') {
    return { value: raw, changed: false, unrecognized: false };
  }
  if (typeof raw !== 'string') {
    return { value: raw, changed: false, unrecognized: true };
  }
  if (CANONICAL_STATUSES.has(raw)) {
    return { value: raw, changed: false, unrecognized: false };
  }
  const mapped = LEGACY_STATUS_MAP[raw.toLowerCase()];
  if (mapped) {
    return { value: mapped, changed: true, unrecognized: false };
  }
  return { value: raw, changed: false, unrecognized: true };
};

const runStatusMigration = async () => {
  statusMigration.value.state = 'running';
  statusMigration.value.processed = 0;
  statusMigration.value.updated = 0;
  statusMigration.value.unrecognized = [];

  try {
    const leaguesSnap = await getDocs(collection($db, 'leagues'));

    let batch = writeBatch($db);
    let batchCount = 0;

    for (const leagueDoc of leaguesSnap.docs) {
      const calSnap = await getDocs(collection($db, 'leagues', leagueDoc.id, 'calendar'));

      for (const eventDoc of calSnap.docs) {
        const raw = eventDoc.data().status;
        const { value, changed, unrecognized } = normalizeStatus(raw);

        if (unrecognized) {
          statusMigration.value.unrecognized.push({ leagueId: leagueDoc.id, eventId: eventDoc.id, raw });
        } else if (changed) {
          batch.update(eventDoc.ref, { status: value });
          batchCount++;
          statusMigration.value.updated++;

          if (batchCount === 500) {
            await batch.commit();
            batch = writeBatch($db);
            batchCount = 0;
          }
        }

        statusMigration.value.processed++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    statusMigration.value.state = 'complete';

  } catch (error) {
    console.error("Status migration failed:", error);
    alert("An error occurred. Check the console for details.");
    statusMigration.value.state = 'idle';
  }
};

// ============================================================
// Round eventId Backfill
// ============================================================
const IGNORED_ROUND_TYPES = new Set(['casual', 'other']);

const eventIdBackfill = ref({
  state: 'idle', // idle, running, complete
  scanned: 0,
  updated: 0,
  alreadySet: 0,
  skippedType: 0,
  unresolved: [] // [{ playerId, roundId, reason, leagueId?, type?, iso? }]
});

const runEventIdBackfill = async () => {
  eventIdBackfill.value.state = 'running';
  eventIdBackfill.value.scanned = 0;
  eventIdBackfill.value.updated = 0;
  eventIdBackfill.value.alreadySet = 0;
  eventIdBackfill.value.skippedType = 0;
  eventIdBackfill.value.unresolved = [];

  try {
    // Pre-load every league once, keyed both by id (direct leagueId match) and
    // by its `type` field (fallback match when a round has no leagueId).
    const leaguesSnap = await getDocs(collection($db, 'leagues'));
    const leaguesById = new Map();
    const leagueIdsByType = new Map();

    leaguesSnap.docs.forEach(leagueDoc => {
      const data = leagueDoc.data();
      leaguesById.set(leagueDoc.id, data);
      if (data.type) {
        if (!leagueIdsByType.has(data.type)) leagueIdsByType.set(data.type, []);
        leagueIdsByType.get(data.type).push(leagueDoc.id);
      }
    });

    // Lazily-loaded, cached per league: iso -> [calendar eventId,...]
    const calendarCacheByLeague = new Map();
    const getCalendarIsoMap = async (leagueId) => {
      if (calendarCacheByLeague.has(leagueId)) return calendarCacheByLeague.get(leagueId);

      const calSnap = await getDocs(collection($db, 'leagues', leagueId, 'calendar'));
      const isoMap = new Map();
      calSnap.docs.forEach(eventDoc => {
        const iso = eventDoc.data().iso;
        if (!iso) return;
        if (!isoMap.has(iso)) isoMap.set(iso, []);
        isoMap.get(iso).push(eventDoc.id);
      });

      calendarCacheByLeague.set(leagueId, isoMap);
      return isoMap;
    };

    const playersSnap = await getDocs(collection($db, 'players'));

    let batch = writeBatch($db);
    let batchCount = 0;

    for (const playerDoc of playersSnap.docs) {
      const roundsSnap = await getDocs(collection($db, 'players', playerDoc.id, 'rounds'));

      for (const roundDoc of roundsSnap.docs) {
        const round = roundDoc.data();
        eventIdBackfill.value.scanned++;

        if (round.eventId) {
          eventIdBackfill.value.alreadySet++;
          continue;
        }

        if (IGNORED_ROUND_TYPES.has(round.type)) {
          eventIdBackfill.value.skippedType++;
          continue;
        }

        // 1. Resolve the league: prefer leagueId, fall back to matching type
        let leagueId = round.leagueId || null;

        if (leagueId && !leaguesById.has(leagueId)) {
          eventIdBackfill.value.unresolved.push({
            playerId: playerDoc.id, roundId: roundDoc.id,
            reason: 'leagueId on round does not match any league', leagueId
          });
          continue;
        }

        if (!leagueId) {
          const candidates = leagueIdsByType.get(round.type) || [];
          if (candidates.length === 1) {
            leagueId = candidates[0];
          } else {
            eventIdBackfill.value.unresolved.push({
              playerId: playerDoc.id, roundId: roundDoc.id,
              reason: candidates.length === 0
                ? 'no leagueId and no league matches round type'
                : 'no leagueId and multiple leagues match round type',
              type: round.type
            });
            continue;
          }
        }

        // 2. Resolve the calendar event via iso
        if (!round.iso) {
          eventIdBackfill.value.unresolved.push({
            playerId: playerDoc.id, roundId: roundDoc.id,
            reason: 'round has no iso to match against the calendar', leagueId
          });
          continue;
        }

        const isoMap = await getCalendarIsoMap(leagueId);
        const eventMatches = isoMap.get(round.iso) || [];

        if (eventMatches.length !== 1) {
          eventIdBackfill.value.unresolved.push({
            playerId: playerDoc.id, roundId: roundDoc.id,
            reason: eventMatches.length === 0
              ? 'no calendar event found for iso'
              : 'multiple calendar events found for iso',
            leagueId, iso: round.iso
          });
          continue;
        }

        // 3. Write the resolved eventId
        batch.update(roundDoc.ref, { eventId: eventMatches[0] });
        batchCount++;
        eventIdBackfill.value.updated++;

        if (batchCount === 500) {
          await batch.commit();
          batch = writeBatch($db);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    eventIdBackfill.value.state = 'complete';

  } catch (error) {
    console.error("Round eventId backfill failed:", error);
    alert("An error occurred. Check the console for details.");
    eventIdBackfill.value.state = 'idle';
  }
};

// ============================================================
// Round Name Mismatch Check (read-only)
// ============================================================
const TARGET_ISO = '2026-08-09';

const nameCheck = ref({
  state: 'idle', // idle, running, complete
  scanned: 0,
  mismatches: [] // [{ playerId, playerName, roundId, roundName, iso }]
});

const normalizeName = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

const runNameCheck = async () => {
  nameCheck.value.state = 'running';
  nameCheck.value.scanned = 0;
  nameCheck.value.mismatches = [];

  try {
    const playersSnap = await getDocs(collection($db, 'players'));

    for (const playerDoc of playersSnap.docs) {
      const player = playerDoc.data();
      const playerName = `${player.fname || ''} ${player.lname || ''}`.trim();
      const normalizedPlayerName = normalizeName(playerName);

      const roundsQ = query(collection($db, 'players', playerDoc.id, 'rounds'), where('iso', '==', TARGET_ISO));
      const roundsSnap = await getDocs(roundsQ);

      for (const roundDoc of roundsSnap.docs) {
        const round = roundDoc.data();
        nameCheck.value.scanned++;

        if (normalizeName(round.name) !== normalizedPlayerName) {
          nameCheck.value.mismatches.push({
            playerId: playerDoc.id,
            playerName,
            roundId: roundDoc.id,
            roundName: round.name || null,
            iso: round.iso || null
          });
        }
      }
    }

    nameCheck.value.state = 'complete';

  } catch (error) {
    console.error("Round name check failed:", error);
    alert("An error occurred. Check the console for details.");
    nameCheck.value.state = 'idle';
  }
};

// ============================================================
// Round Lookup by eventId (read-only)
// ============================================================
const eventLookup = ref({
  eventId: 'ZZFVXYOUAvqaJxyvX25P',
  state: 'idle', // idle, running, complete
  rows: [] // [{ roundId, parentPlayerId, parentPlayerName, roundName, playerKey, iso, leagueId, teesId, scores }]
});

const runEventLookup = async () => {
  if (!eventLookup.value.eventId) return;

  eventLookup.value.state = 'running';
  eventLookup.value.rows = [];

  try {
    const q = query(collectionGroup($db, 'rounds'), where('eventId', '==', eventLookup.value.eventId));
    const snap = await getDocs(q);

    const playerNameCache = new Map();
    const getPlayerName = async (playerId) => {
      if (!playerId) return null;
      if (playerNameCache.has(playerId)) return playerNameCache.get(playerId);

      const playerSnap = await getDoc(doc($db, 'players', playerId));
      const name = playerSnap.exists()
        ? `${playerSnap.data().fname || ''} ${playerSnap.data().lname || ''}`.trim()
        : '(player doc not found)';

      playerNameCache.set(playerId, name);
      return name;
    };

    const rows = [];
    for (const roundDoc of snap.docs) {
      const round = roundDoc.data();
      const parentPlayerId = roundDoc.ref.parent.parent?.id || null;

      rows.push({
        roundId: roundDoc.id,
        parentPlayerId,
        parentPlayerName: await getPlayerName(parentPlayerId),
        roundName: round.name || null,
        playerKey: round.playerKey || null,
        iso: round.iso || null,
        leagueId: round.leagueId || null,
        teesId: round.teesId || null,
        scores: round.scores || null
      });
    }

    eventLookup.value.rows = rows;
    eventLookup.value.state = 'complete';

  } catch (error) {
    console.error("Event lookup failed:", error);
    alert("An error occurred. Check the console for details.");
    eventLookup.value.state = 'idle';
  }
};

// ============================================================
// Calendar -> Events Migration
// ============================================================
const eventsMigration = ref({
  state: 'idle', // idle, running, complete
  leaguesScanned: 0,
  migrated: 0,
  errors: [] // [{ leagueId, leagueName, message }]
});

const runEventsMigration = async () => {
  eventsMigration.value.state = 'running';
  eventsMigration.value.leaguesScanned = 0;
  eventsMigration.value.migrated = 0;
  eventsMigration.value.errors = [];

  try {
    const leaguesSnap = await getDocs(collection($db, 'leagues'));

    // One batch (and one try/catch) per league rather than one combined
    // batch across all leagues -- Firestore batches are all-or-nothing, so
    // a single league the caller isn't an admin on (e.g. a test/inactive
    // league) would otherwise silently take down every other league's
    // writes bundled into the same batch, with no indication which one was
    // actually the problem.
    for (const leagueDoc of leaguesSnap.docs) {
      try {
        const calSnap = await getDocs(collection($db, 'leagues', leagueDoc.id, 'calendar'));

        let batch = writeBatch($db);
        let batchCount = 0;

        for (const eventDoc of calSnap.docs) {
          // Same doc id preserved -- live_rounds.eventId and players/*/rounds.eventId
          // already reference these ids, so nothing else needs to change. merge:true
          // makes this safe to re-run (re-syncs any edits since the last run).
          const eventRef = doc($db, 'events', eventDoc.id);
          batch.set(eventRef, { ...eventDoc.data(), leagueId: leagueDoc.id }, { merge: true });
          batchCount++;

          if (batchCount === 500) {
            await batch.commit();
            batch = writeBatch($db);
            batchCount = 0;
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }

        eventsMigration.value.migrated += calSnap.docs.length;
      } catch (leagueError) {
        console.error(`Events migration failed for league ${leagueDoc.id}:`, leagueError);
        eventsMigration.value.errors.push({
          leagueId: leagueDoc.id,
          leagueName: leagueDoc.data()?.shortName || leagueDoc.data()?.name || leagueDoc.id,
          message: leagueError?.message || String(leagueError)
        });
      }

      eventsMigration.value.leaguesScanned++;
    }

    eventsMigration.value.state = 'complete';

  } catch (error) {
    console.error("Events migration failed:", error);
    alert("An error occurred. Check the console for details.");
    eventsMigration.value.state = 'idle';
  }
};
</script>
