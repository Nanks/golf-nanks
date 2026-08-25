import { ref, computed, watch, onUnmounted } from 'vue';
import { collectionGroup, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { useData } from '~/stores/data';
import { useUIStore } from '~/stores/ui';
import { calcRounds, runLeaguePass } from '~/utils/gameLogic';
import { isEventFinished } from '~/utils/leagueActions';
import { useNuxtApp } from '#app';

export const useLeaderboardData = (leagueId, eventId, isAppManaged, isPreviewingPairings) => {
  const { $db } = useNuxtApp();
  const dataStore = useData();
  const uiStore = useUIStore();

  const roundsSource = ref([]);
  const eventDetails = ref(null);
  const winnersLog = ref({ blindBestBall: [] });
  const availableTabs = ref(['Net Score']);

  // Derived, not passed in -- an event is "live" until its own status says
  // otherwise (complete/rain/handicap/practice), so there's no separate mode
  // to keep in sync with reality.
  const isLive = computed(() => !!eventDetails.value && !isEventFinished(eventDetails.value.status));

  const processLeaderboard = (flatPlayersArray) => {
    if (!eventDetails.value || !flatPlayersArray?.length) {
      roundsSource.value = flatPlayersArray || [];
      return;
    }

    // Inject preview status and handicap settings into the simulation
    const simulationEvent = {
      ...eventDetails.value,
      status: isPreviewingPairings.value ? 'complete' : eventDetails.value.status,
      appHandicap: isAppManaged.value
    };

    const calculatedRounds = calcRounds(flatPlayersArray, simulationEvent);
    const res = runLeaguePass(calculatedRounds, simulationEvent);

    winnersLog.value = res.winnersLog || { blindBestBall: [] };
    roundsSource.value = res.players || [];
  };

  const normalizeLiveRounds = (liveRounds) => {
    return liveRounds
      .filter(r => r.eventId === eventId)
      .flatMap(r => r.players.map(p => ({
        ...p,
        name: p.name || `${p.fname} ${p.lname}`,
        iso: r.iso,
        course: r.course,
        courseSnapshot: r.courseSnapshot,
        scores: r.scores?.[p.id] || Array(18).fill(0),
        // Which live_rounds doc this player belongs to -- needed to know where
        // to write when an admin edits/removes them from the leaderboard.
        liveRoundId: r.id
      })));
  };

  const fetchHistoryRounds = async () => {
    try {
      const q = query(collectionGroup($db, "rounds"), where("eventId", "==", eventId));
      const snap = await getDocs(q);

      if (snap.empty) return processLeaderboard([]);

      const flatHistoryPlayers = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.playerKey || doc.ref.parent.parent?.id || doc.id,
          name: data.name || "Unknown Player",
          iso: data.iso,
          course: data.course || "Course TBD",
          courseSnapshot: data.courseSnapshot || { tees: {} },
          teesId: data.teesId || data.tees || "fallback",
          scores: data.scores || Array(18).fill(0),
          index: data.index || 0,
          ...data,
          // The round doc's own id (players/{playerId}/rounds/{roundDocId}) --
          // distinct from `id` above, which is the *player's* id.
          roundDocId: doc.id
        };
      });

      processLeaderboard(flatHistoryPlayers);
    } catch (err) {
      // Let the caller (initLeaderboard, and the page beyond that) decide
      // how to surface this -- swallowing it here used to leave the board
      // silently empty/stale with no indication anything went wrong.
      console.error("History Fetch Error:", err);
      throw err;
    }
  };

  const initLeaderboard = async (leagueGames = []) => {
    uiStore.setLoading(true, "Syncing...");
    try {
      const eventSnap = await getDoc(doc($db, "events", eventId));
      eventDetails.value = eventSnap.exists() ? { id: eventSnap.id, ...eventSnap.data() } : null;

      if (!eventDetails.value) return;

      const allPossibleGames = [...new Set([...leagueGames, ...(eventDetails.value.game || [])])];
      availableTabs.value = [
        'Net Score',
        ...allPossibleGames.filter(g => ['Modified Chicago', 'Chicago Points', 'Blind BestBall', 'Blind Best Ball', 'birds', 'deuces'].includes(g))
      ];

      if (isLive.value) {
        dataStore.startLiveListener({ leagueId });
        watch(() => dataStore.liveRounds, (newLiveRounds) => {
          processLeaderboard(normalizeLiveRounds(newLiveRounds));
        }, { immediate: true, deep: true });
      } else {
        await fetchHistoryRounds();
      }
    } finally {
      uiStore.setLoading(false);
    }
  };

  // Watch for the preview toggle
  watch(isPreviewingPairings, () => {
    processLeaderboard(isLive.value ? normalizeLiveRounds(dataStore.liveRounds) : roundsSource.value);
  });

  // Cleanup live listeners when user leaves
  onUnmounted(() => {
    if (isLive.value) dataStore.startLiveListener({ myRoundsOnly: true });
  });

  return {
    eventDetails,
    roundsSource,
    winnersLog,
    availableTabs,
    isLive,
    initLeaderboard
  };
};
