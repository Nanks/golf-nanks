// composables/useHandicap.js
import { collection, query, where, getDocs } from "firebase/firestore";
import { calcPops, calcAdjustedGross, calcDifferential, calcRawGross, calcLeagueHandicap } from '~/utils/gameLogic';

export const useHandicap = () => {
  const { $db } = useNuxtApp();

  // Recalculates a player's league handicap from their finalized round history
  // for this league (players/{playerId}/rounds where leagueId === leagueId).
  // Those docs are written by the `archiveLeagueRound` cloud function once an
  // event's status flips to "complete", each carrying a minimized courseSnapshot
  // for the tee actually played.
  const calculateLeagueHandicap = async (playerId, leagueId, currentGhin) => {
    try {
      const roundsRef = collection($db, "players", playerId, "rounds");
      const roundsSnap = await getDocs(query(roundsRef, where("leagueId", "==", leagueId)));

      // Sorted/limited client-side rather than via orderBy()+limit() in the
      // query itself, so this doesn't depend on a Firestore composite index
      // existing for (leagueId, iso) on this subcollection.
      const mostRecentRounds = roundsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.iso || '').localeCompare(a.iso || ''))
        .slice(0, 10);

      const realAudits = [];

      for (const round of mostRecentRounds) {
        const teeData = round.courseSnapshot?.tees?.[round.teesId];
        if (!teeData || !round.scores || round.scores.includes(0)) continue;

        const pops = calcPops({ index: round.index }, teeData);
        const adjustedGross = calcAdjustedGross(round.scores, teeData.pars, pops);
        if (!adjustedGross) continue;

        const differential = calcDifferential(adjustedGross, teeData.rating, teeData.slope);

        realAudits.push({
          adjustedGross,
          courseRating: teeData.rating,
          slopeRating: teeData.slope,
          date: round.iso || null,
          differential,
          isPadding: false,
          rawGross: calcRawGross(round.scores),
          roundId: round.id
        });
      }

      // Pad out to 10 slots with a GHIN-3 placeholder differential where history is short
      const placeholderDiff = Number((Number(currentGhin) - 3).toFixed(3));
      const finalAudit = [...realAudits];
      while (finalAudit.length < 10) {
        finalAudit.push({
          adjustedGross: null,
          courseRating: null,
          slopeRating: null,
          date: null,
          differential: placeholderDiff,
          isPadding: true,
          rawGross: null,
          roundId: null
        });
      }

      // calcLeagueHandicap already rounds to 3 decimals; keep it a Number
      // (not a .toFixed() string) so leagueHandicaps stays consistent with
      // what the archiveLeagueRound cloud function writes.
      const hcp = calcLeagueHandicap(finalAudit.map(a => a.differential), 4, 10);

      return { hcp, audit: finalAudit };
    } catch (err) {
      console.error("HANDICAP ERROR:", err);
      return { hcp: Number((Number(currentGhin) - 3).toFixed(3)), audit: [] };
    }
  };

  return { calculateLeagueHandicap };
};
