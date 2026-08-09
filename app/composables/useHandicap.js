// composables/useHandicap.js
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { useData } from '~/stores/data';
import { calcDifferential } from '~/utils/gameLogic';

export const useHandicap = () => {
  const { $db } = useNuxtApp();
  const dataStore = useData();

  const calculateLeagueHandicap = async (playerId, leagueDocId, currentGhin) => {
    try {
      // 1. Use local Pinia store instead of passing maps around!
      const courses = dataStore.courses;
      
      const leagueSnap = await getDoc(doc($db, "leagues", leagueDocId));
      const targetLeagueId = leagueSnap.data()?.type;
      if (!targetLeagueId) throw new Error("League ID not found");

      const calRef = collection($db, "leagues", leagueDocId, "calendar");
      const calSnap = await getDocs(query(calRef, where("status", "in", ["mdi-check-bold", "mdi-alpha-h-circle-outline"])));
      const calendarMap = new Map(calSnap.docs.map(d => [d.data().iso, d.data()]));

      const roundsRef = collection($db, "players", playerId, "rounds");
      const roundsSnap = await getDocs(
        query(roundsRef, where("type", "==", targetLeagueId), orderBy("iso", "desc"), limit(20))
      );

      const fullRounds = [];
      const placeholderDiff = Number(currentGhin) - 3;
     
      for (const d of roundsSnap.docs) {
        if (fullRounds.length >= 10) break;

        const roundData = d.data();
        const calData = calendarMap.get(roundData.iso);

        if (calData && roundData.scores && !roundData.scores.includes(0)) {
          const course = courses.find(c => c.name === roundData.course);
          const teeData = course?.tees[roundData.teesId] || course?.tees[roundData.tees]; // Safety fallback

          if (!teeData) continue;

          const { pars, hnds, rating, slope } = teeData;
          const roundHcp = Math.round(roundData.index || currentGhin);

          // ... your existing pops and adjusted gross logic ...
          const pops = hnds.map(hnd => {
            const basePop = Math.floor(roundHcp / 18);
            const extra = (roundHcp % 18 >= hnd) ? 1 : 0;
            return Math.max(0, basePop + extra);
          });

          const adjustedScores = roundData.scores.map((s, i) => {
            const limitValue = pars[i] + pops[i] + 2;
            return s > limitValue ? limitValue : s;
          });

          const adjGross = adjustedScores.reduce((a, b) => a + b, 0);
          
          // Use your pure math utility!
          const differential = calcDifferential(adjGross, rating, slope);

          fullRounds.push({ iso: roundData.iso, diff: differential, score: adjGross, isPlaceholder: false });
        }
      }

      const auditList = [...fullRounds];
      while (auditList.length < 10) {
        auditList.push({ iso: `PH-${auditList.length}`, diff: placeholderDiff, score: 0, isPlaceholder: true });
      }
      
      const sortedByDiff = [...auditList].sort((a, b) => a.diff - b.diff);
      const bestIsos = sortedByDiff.slice(0, 4).map(r => r.iso);
      const finalAudit = auditList.map(r => ({ ...r, isBest: bestIsos.includes(r.iso) }));
      
      const avgDiff = sortedByDiff.slice(0, 4).reduce((sum, r) => sum + r.diff, 0) / 4;
      const finalHcp = avgDiff > 36 ? 35.999 : avgDiff;

      return { hcp: finalHcp.toFixed(3), audit: finalAudit };
    } catch (err) {
      console.error("HANDICAP ERROR:", err);
      return { hcp: (currentGhin - 3).toFixed(3), audit: [] };
    }
  };

  return { calculateLeagueHandicap };
};