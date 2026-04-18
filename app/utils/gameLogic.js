export const calcPops = (round, teeData) => {
  return teeData.hnds.map((hnd) => {
    let pop = (Math.floor(Math.round(round.index) / 18) + ((Math.round(round.index) % 18 >= hnd) ? 1 : 0))
    return (pop > 0) ? pop : 0
  })
}

export const calcGames = (round, cal, teeData, pops) => {

  const ddHoles = (cal?.type === 'vegas' && cal?.ddHole) ? cal.ddHole : [];

  const birds =  round.scores.map((score, i) => {
    if (score <= 0) return 0;
    const isDoubleDown = ddHoles.includes(i + 1) ? 2 : 1;
    const par = teeData.pars[i];
    const pop = pops[i];
    const bird = (score > par) ? ((par - (score - pop)) * 0.5) * isDoubleDown : ((par - score) + (pop * 0.5)) * isDoubleDown;
    return Math.max(0, bird);
  });

  const totalBirds = birds.reduce((sum, val) => sum + val, 0);

  const deuces =  round.scores.map((score, i) => {
    if (!score || score <= 0) return 0;
    const hasPop = pops[i] > 0 ? 1 : 0;
    return (score - hasPop <= 2) ? 1 : 0;
  });

  const totalDeuces = deuces.reduce((sum, val) => sum + val, 0);

  const chicago = round.scores.map((score, i) => {
    if (score <= 0) return 0;
    const parDiff = teeData.pars[i] - score;
    if (parDiff > -2) return 2 * Math.pow(2, parDiff);
    return 0;
  });
  const totalChicago = (round.index - 36) + chicago.reduce((sum, val) => sum + val, 0)

  const modChicago = round.scores.map((score, i) => {
    if (score <= 0) return 0;
    const parDiff = teeData.pars[i] - score;
    if (parDiff > -2) return 2 * Math.pow(2, parDiff);
    return -1;
  });

  const totalModChicago = (round.index - 36) + modChicago.reduce((sum, val) => sum + val, 0);

  const net = round.scores.map((score, i) => {
    if (round.type === 'vegas' || round.type === 'mbWed') {
        return (score > 0) ? score - teeData.pars[i] - (round.index / 18) : 0
    } else {
        return (score > 0) ? score - teeData.pars[i] - pops[i] : 0
    }
  });

  const totalNet = net.reduce((sum, val) => sum + val, 0);

  const holesPlayed = round.scores.filter(n => n > 0).length;

  const grossUnder = round.scores.map((score, i) => {
    return (score > 0) ? score - teeData.pars[i] : 0
  });

  const totalGrossUnder = grossUnder.reduce((sum, val) => sum + val, 0);

  const totalGross = round.scores.reduce((a, b) => a + (Number(b) || 0), 0);

  return { pops, birds, totalBirds, deuces, totalDeuces, chicago, totalChicago, modChicago, totalModChicago, net, totalNet, holesPlayed, grossUnder, totalGrossUnder, totalGross }
};

export const getTotals = (values) => {
  const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);
  return [ sum(values.slice(0, 9)), sum(values.slice(9, 18)), sum(values) ];
};

export const calcRounds = (rounds, cal) => {
  return rounds.map(round => {
    const teeData = round.courseSnapshot?.tees?.[round.tees];
    const pops = calcPops(round, teeData);
    return {
      ...round,
      games: calcGames(round, cal, teeData, pops),
    };
  });
}

/**
 * Calculates a player's Course Handicap based on USGA formula
 */
export const calcCourseHandicap = (handicapIndex, slopeRating, courseRating, par) => {
  if (!handicapIndex || !slopeRating) return 0;
  // USGA Formula: (Handicap Index * (Slope Rating / 113)) + (Course Rating - par)
  const courseHcp = (handicapIndex * (slopeRating / 113)) + (courseRating - par);
  return Math.round(courseHcp); 
};

/**
 * Compares two players' net scores to determine Match Play status
 * Returns an array of statuses per hole (1 = P1 wins, -1 = P2 wins, 0 = Halved)
 */
export const calcMatchPlay = (p1Scores, p2Scores, p1Pops, p2Pops) => {
  let p1Status = 0;
  return p1Scores.map((score, i) => {
    if (!score || !p2Scores[i]) return p1Status; // Skip unplayed holes
    
    const p1Net = score - (p1Pops[i] || 0);
    const p2Net = p2Scores[i] - (p2Pops[i] || 0);
    
    if (p1Net < p2Net) p1Status++;
    else if (p2Net < p1Net) p1Status--;
    
    return p1Status;
  });
};

/**
 * Determines if a player won a skin on a specific hole
 * scoresMatrix is an array of all players' net scores for the hole
 */
export const isSkin = (playerNetScore, allNetScoresForHole) => {
  if (!playerNetScore) return false;
  const lowestScore = Math.min(...allNetScoresForHole.filter(s => s > 0));
  const countOfLowest = allNetScoresForHole.filter(s => s === lowestScore).length;
  
  // It's a skin if this player has the lowest score AND they are the only one who has it
  return playerNetScore === lowestScore && countOfLowest === 1;
};

/**
 * Calculates the new L-HCP based on an array of past differentials.
 * Explicitly uses Best X of Last Y (e.g., Best 4 of last 10).
 */
export const calcLeagueHandicap = (differentials, bestX = 4, lastY = 10) => {
  if (!differentials || differentials.length === 0) return 0;
  
  // 1. Take the last Y differentials (safety net, even though we already sliced to 10 in the script)
  const recentDiffs = differentials.slice(-lastY);
  
  // 2. Sort them lowest to highest to find the best ones
  const sortedDiffs = [...recentDiffs].sort((a, b) => a - b);
  
  // 3. Grab the best X (if they have less than X rounds, just use all they have)
  const scoresToUse = Math.min(bestX, sortedDiffs.length);
  const bestScores = sortedDiffs.slice(0, scoresToUse);
  
  // 4. Average them and apply standard 96% allowance
  const avg = bestScores.reduce((acc, val) => acc + val, 0) / scoresToUse;
  const leagueHcp = avg //* 0.96;
  
  // Return formatted to exactly 3 decimal places
  return Number(leagueHcp.toFixed(3)); 
};

/**
 * Calculates a round differential.
 * Formula: (Gross Score - Course Rating) x (113 / Slope Rating)
 */
export const calcDifferential = (grossScore, courseRating, slopeRating) => {
  if (!courseRating || !slopeRating) return 0;
  const diff = ((grossScore - courseRating) * 113) / slopeRating;
  return Number(diff.toFixed(3)); // Keep it exact for the history array
};

/**
 * Calculates the Adjusted Gross Score (AGS) by capping scores at Net Double Bogey.
 * Net Double Bogey = Par + 2 + Handicap Strokes Received (Pops)
 * Returns 0 if the round is incomplete (contains a 0 in scores).
 */
export const calcAdjustedGross = (scores, pars, pops) => {
  // Requirement: Throw out any round with a 0 in the scores array
  if (!scores || scores.length === 0 || scores.includes(0)) return 0;

  return scores.reduce((total, score, i) => {
    const numScore = Number(score) || 0;
    const par = Number(pars[i]) || 4;
    const pop = Number(pops[i]) || 0;
    
    // Cap at Par + 2 + Pops
    const maxScore = par + 2 + pop;
    return total + Math.min(numScore, maxScore);
  }, 0);
};

/**
 * Helper to get the raw gross (sum) while still validating for incomplete rounds.
 */
export const calcRawGross = (scores) => {
  if (!scores || scores.length === 0 || scores.includes(0)) return 0;
  return scores.reduce((a, b) => a + (Number(b) || 0), 0);
};


export const runLeaguePass = (players, eventDetails) => {
  const totalHoles = eventDetails?.holes || 18;
  const gameKeys = eventDetails?.game || [];
  const numPlayers = players?.length || 0;
  
  const isComplete = ['complete', 'mdi-check-bold'].includes(eventDetails?.status?.toLowerCase());

  const winnersLog = {
    grossSkins: [],
    netSkins: [],
    deuces: [],
    blindBestBall: [] // Always initialized!
  };

  const per = eventDetails?.per || 0;
  const money = eventDetails?.money || 0;
  const potPerGame = ((per * money) / (gameKeys.length || 1)) * numPlayers;

  // 1. Hole-by-Hole Games (Skins & Deuces)
  for (let i = 0; i < totalHoles; i++) {
    const holeNum = i + 1;
    const holeScores = players.map(p => ({
      id: p.id,
      name: p.name,
      gross: p.scores?.[i] || 0,
      net: (p.scores?.[i] || 0) - (p.games?.pops?.[i] || 0)
    })).filter(s => s.gross > 0);

    if (holeScores.length < numPlayers || numPlayers === 0) continue;

    const minGross = Math.min(...holeScores.map(s => s.gross));
    const gWinners = holeScores.filter(s => s.gross === minGross);
    if (gWinners.length === 1) winnersLog.grossSkins.push({ hole: holeNum, player: gWinners[0].name, score: gWinners[0].gross, id: gWinners[0].id });

    const minNet = Math.min(...holeScores.map(s => s.net));
    const nWinners = holeScores.filter(s => s.net === minNet);
    if (nWinners.length === 1) winnersLog.netSkins.push({ hole: holeNum, player: nWinners[0].name, score: nWinners[0].net, id: nWinners[0].id });

    holeScores.forEach(s => {
      if (s.gross === 2) winnersLog.deuces.push({ hole: holeNum, player: s.name, score: 2, id: s.id });
    });
  }

  // 2. Blind Best Ball (Team Logic) - ALWAYS run this if we have players
  if (numPlayers > 1) {
    let pairings = [];
    const officialPairings = eventDetails?.bbb_pairings || [];

    if (officialPairings.length > 0) {
      // OVERRIDE: Admin saved pairs
      officialPairings.forEach(pair => {
        const p1 = players.find(p => p.id === pair.p1?.id);
        const p2 = players.find(p => p.id === pair.p2?.id);
        if (p1 && p2) {
          let teamTotalNet = 0;
          for (let h = 0; h < totalHoles; h++) {
            const p1Net = p1.scores?.[h] > 0 ? p1.scores[h] - (p1.games?.pops?.[h] || 0) : 99;
            const p2Net = p2.scores?.[h] > 0 ? p2.scores[h] - (p2.games?.pops?.[h] || 0) : 99;
            const bestNet = Math.min(p1Net, p2Net);
            if (bestNet < 90) teamTotalNet += bestNet; 
          }
          pairings.push({ player: `${p1.name} / ${p2.name}`, score: teamTotalNet, id: `${p1.id}-${p2.id}`, hole: 'Team' });
        }
      });
    } else {
      // AUTO-PAIRING SCRAMBLE
      const getSeededValue = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        return hash;
      };

      const shuffled = [...players].sort((a, b) => {
        if (!isComplete) return Math.random() - 0.5; // LIVE CHAOS
        return getSeededValue(a.id + (eventDetails?.iso || '')) - getSeededValue(b.id + (eventDetails?.iso || ''));
      });

      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          const p1 = shuffled[i];
          const p2 = shuffled[i + 1];
          
          let teamTotalNet = 0;
          for (let h = 0; h < totalHoles; h++) {
            const p1Net = p1.scores?.[h] > 0 ? p1.scores[h] - (p1.games?.pops?.[h] || 0) : 99;
            const p2Net = p2.scores?.[h] > 0 ? p2.scores[h] - (p2.games?.pops?.[h] || 0) : 99;
            const bestNet = Math.min(p1Net, p2Net);
            if (bestNet < 90) teamTotalNet += bestNet; 
          }

          pairings.push({
            player: `${p1.name} / ${p2.name}`,
            score: teamTotalNet,
            id: `${p1.id}-${p2.id}`, // Unique ID for Vue transition
            hole: 'Team'
          });
        }
      }
    }

    winnersLog.blindBestBall = pairings.sort((a, b) => a.score - b.score);
  }

  // 3. Final Payout Safety
  const applyPayouts = (list) => {
    if (!list || list.length === 0) return [];
    const payoutPerWinner = potPerGame / list.length;
    return list.map(w => ({ ...w, money: payoutPerWinner }));
  };

  // CRITICAL: Ensure blindBestBall is actually returned!
  return {
    grossSkins: applyPayouts(winnersLog.grossSkins),
    netSkins: applyPayouts(winnersLog.netSkins),
    deuces: applyPayouts(winnersLog.deuces),
    blindBestBall: applyPayouts(winnersLog.blindBestBall) 
  };
};