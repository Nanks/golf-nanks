/**
 * Shared helper to calculate handicap "pops" (strokes) per hole
 * UPGRADED: Supports fractional pop decimals for Yearly Leagues
 */
export const calcPops = (scores, courseHandicaps, playerIndex, isFractional = false) => {
  const holes = scores?.length || 18;
  const arr = new Array(holes).fill(0);
  if (!courseHandicaps || courseHandicaps.length === 0) return arr;

  const idx = isFractional ? (parseFloat(playerIndex) || 0) : Math.round(parseFloat(playerIndex) || 0);
  const isPlus = idx < 0;
  const absIdx = Math.abs(idx);
  const baseIdx = Math.floor(absIdx);
  const remainder = absIdx - baseIdx;

  const loops = Math.floor(baseIdx / 18);
  const remBase = baseIdx % 18;

  for (let i = 0; i < holes; i++) {
      const hHcp = courseHandicaps[i];
      if (!hHcp) continue;
      
      let pop = loops;
      if (!isPlus) {
        if (hHcp <= remBase) pop += 1;
        if (remainder > 0 && hHcp === remBase + 1) pop += remainder;
        arr[i] = pop;
      } else {
        if (hHcp > 18 - remBase) pop += 1;
        if (remainder > 0 && hHcp === 18 - remBase) pop += remainder;
        arr[i] = -pop; 
      }
  }
  return arr;
};

/**
 * Calculates Net Relative Score (+/- Par)
 */
export const calcNetRelative = (scores, pops, pars) => {
  let rel = 0;
  let holesPlayed = 0;
  scores.forEach((score, i) => {
    if (score > 0) {
      holesPlayed++;
      rel += ((score - pops[i]) - pars[i]);
    }
  });
  return { rel, holesPlayed };
};

export const calcBirds = (round, cal, teeData, isFractional = false) => {
  const pops = calcPops(round.scores, teeData.hnds, round.index || 0, isFractional);
  const ddHoles = (cal?.type === 'vegas' && cal?.ddHole) ? cal.ddHole : [];
  const birdMult = (cal?.type === 'mbWed' && cal?.birdMult) ? cal.birdMult : 1;

  return round.scores.map((score, i) => {
    if (score <= 0) return 0;
    const isDoubleDown = ddHoles.includes(i + 1) ? 2 : 1;
    const par = teeData.pars[i];
    const pop = pops[i];
    const bird = (score > par) ? ((par - (score - pop)) * 0.5) * isDoubleDown : ((par - score) + (pop * 0.5)) * isDoubleDown;
    return Math.max(0, bird * birdMult);
  });
};

export const calcDeuces = (round, teeData, isFractional = false) => {
  const pops = calcPops(round.scores, teeData.hnds, round.index || 0, isFractional);
  return round.scores.map((score, i) => {
    if (!score || score <= 0) return 0;
    const hasPop = pops[i] > 0 ? 1 : 0;
    return (score - hasPop <= 2) ? 1 : 0;
  });
};

export const calcChicago = (round, teeData, isModified = false) => {
  return round.scores.map((score, i) => {
    if (score <= 0) return 0;
    const parDiff = teeData.pars[i] - score;
    if (parDiff > -2) return 2 * Math.pow(2, parDiff);
    return isModified ? -1 : 0;
  });
};

export const getTotals = (values) => {
  const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);
  return [ sum(values.slice(0, 9)), sum(values.slice(9, 18)), sum(values) ];
};

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