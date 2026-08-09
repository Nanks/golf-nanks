import { ref, watch, onUnmounted } from 'vue';
import { collection, collectionGroup, query, where, getDocs } from "firebase/firestore";
import { useData } from '~/stores/data';
import { useUIStore } from '~/stores/ui';
import { calcRounds, runLeaguePass } from '~/utils/gameLogic';
import { useNuxtApp } from '#app';

export const useLeaderboardData = (leagueId, iso, mode, isAppManaged, isPreviewingPairings) => {
  const { $db } = useNuxtApp();
  const dataStore = useData();
  const uiStore = useUIStore();

  const roundsSource = ref([]);
  const eventDetails = ref(null);
  const winnersLog = ref({ blindBestBall: [] });
  const availableTabs = ref(['Net Score']);

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
      .filter(r => r.iso === iso && r.leagueId === leagueId)
      .flatMap(r => r.players.map(p => ({
        ...p,
        name: p.name || `${p.fname} ${p.lname}`,
        iso: r.iso,
        course: r.course,
        courseSnapshot: r.courseSnapshot,
        scores: r.scores?.[p.id] || Array(18).fill(0)
      })));
  };

  const fetchHistoryRounds = async () => {
    try {
      const q = query(collectionGroup($db, "rounds"), where("leagueId", "==", leagueId), where("iso", "==", iso));
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
          ...data
        };
      });
      
      processLeaderboard(flatHistoryPlayers);
    } catch (err) {
      console.error("History Fetch Error:", err);
    }
  };

  const initLeaderboard = async (leagueGames = []) => {
    uiStore.setLoading(true, "Syncing...");
    try {
      const q = query(collection($db, "leagues", leagueId, "calendar"), where("iso", "==", iso));
      const snap = await getDocs(q);
      eventDetails.value = snap.empty ? { iso, status: 'active', game: [] } : snap.docs[0].data();

      const allPossibleGames = [...new Set([...leagueGames, ...(eventDetails.value.game || [])])];
      availableTabs.value = [
        'Net Score', 
        ...allPossibleGames.filter(g => ['Modified Chicago', 'Chicago Points', 'Blind BestBall', 'Blind Best Ball', 'birds', 'deuces'].includes(g))
      ];

      if (mode === 'live') {
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
    processLeaderboard(mode === 'live' ? normalizeLiveRounds(dataStore.liveRounds) : roundsSource.value);
  });

  // Cleanup live listeners when user leaves
  onUnmounted(() => {
    if (mode === 'live') dataStore.startLiveListener({ myRoundsOnly: true });
  });

  // UI trigger to finalize the event
  const lockEventAndProcess = () => {
    if (eventDetails.value) eventDetails.value.status = 'complete';
    if (mode === 'live') processLeaderboard(normalizeLiveRounds(dataStore.liveRounds));
  };

  return {
    eventDetails,
    roundsSource,
    winnersLog,
    availableTabs,
    initLeaderboard,
    lockEventAndProcess
  };
};