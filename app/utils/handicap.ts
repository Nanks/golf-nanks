import { collection, query, where, getDocs, orderBy, limit, collectionGroup, doc, getDoc } from "firebase/firestore";

export const fetchFullCourseData = async ($db: any) => {
  const coursesMap = new Map();
  
  // 1. Get all courses
  const coursesSnap = await getDocs(collection($db, "courses"));
  coursesSnap.docs.forEach(doc => {
    const data = doc.data();
    coursesMap.set(data.name, { ...data, id: doc.id, tees: {} });
  });

  // 2. Get ALL tees across all courses
  const teesSnap = await getDocs(collectionGroup($db, "tees"));
  teesSnap.docs.forEach(doc => {
    const data = doc.data();
    const parentCourseDoc = doc.ref.parent.parent;
    
    for (let course of coursesMap.values()) {
      if (course.id === parentCourseDoc?.id) {
        // CRITICAL FIX: Attach the doc.id to the object here!
        course.tees[data.name] = { ...data, id: doc.id };
        break;
      }
    }
  });

  return coursesMap;
};


export const calculateLeagueHandicap = async ($db: any, playerId: string, leagueDocId: string, currentGhin: number, coursesMap: Map<string, any>) => {
  try {
    
    // 1. Fetch the league document to get the internal 'leagueID' field
    const leagueSnap = await getDoc(doc($db, "leagues", leagueDocId));
    const targetLeagueId = leagueSnap.data()?.leagueID;

    if (!targetLeagueId) throw new Error("League ID not found");

    const calRef = collection($db, "leagues", leagueDocId, "calendar");
    const calSnap = await getDocs(query(calRef, where("status", "in", ["mdi-check-bold", "mdi-alpha-h-circle-outline"])));
    const calendarMap = new Map(calSnap.docs.map(d => [d.data().iso, d.data()]));

    const roundsRef = collection($db, "players", playerId, "rounds");
    
    // 2. Increase limit (e.g., 20) to provide a buffer for invalid rounds
    const roundsSnap = await getDocs(
      query(
        roundsRef, 
        where("type", "==", targetLeagueId), 
        orderBy("iso", "desc"), 
        limit(20) 
      )
    );

    const fullRounds: any[] = [];
    const placeholderDiff = Number(currentGhin) - 3;
   
    for (const d of roundsSnap.docs) {
      // Exit loop as soon as we hit our goal of 10 valid rounds
      if (fullRounds.length >= 10) break;

      const roundData = d.data();
      const calData = calendarMap.get(roundData.iso);

      // Validation: Must exist in calendar and have no zero scores
      if (calData && roundData.scores && !roundData.scores.includes(0)) {
        const course = coursesMap.get(roundData.course);
        const teeData = course?.tees[roundData.tees];

        if (!teeData) continue;

        const { pars, hnds, rating, slope } = teeData;
        const roundHcp = Math.round(roundData.index || currentGhin);

        const pops = hnds.map((hnd: number) => {
          const basePop = Math.floor(roundHcp / 18);
          const extra = (roundHcp % 18 >= hnd) ? 1 : 0;
          return Math.max(0, basePop + extra);
        });

        const adjustedScores = roundData.scores.map((s: number, i: number) => {
          const limitValue = pars[i] + pops[i] + 2;
          return s > limitValue ? limitValue : s;
        });

        const adjGross = adjustedScores.reduce((a: number, b: number) => a + b, 0);
        const differential = (adjGross - rating) * (113 / slope);

        fullRounds.push({
          iso: roundData.iso,
          diff: differential,
          score: adjGross,
          isPlaceholder: false
        });
      }
    }
    // [Placeholder and Sorting logic remains same...]
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
