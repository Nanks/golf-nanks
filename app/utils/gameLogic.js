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

  const totalChicago = chicago.reduce((sum, val) => sum + val, 0);

  const modChicago = round.scores.map((score, i) => {
    if (score <= 0) return 0;
    const parDiff = teeData.pars[i] - score;
    if (parDiff > -2) return 2 * Math.pow(2, parDiff);
    return -1;
  });

  const totalModChicago = chicago.reduce((sum, val) => sum + val, 0);

  const net = round.scores.map((score, i) => {
    if (round.type === 'vegas' || round.type === 'mbWed') {
        return (score > 0) ? score - teeData.pars[i] - (round.index / 18) : 0
    } else {
        return (score > 0) ? score - teeData.pars[i] - pops[i] : 0
    }
  });

  const totalNet = net.reduce((sum, val) => sum + val, 0);

  const holesPlayed = round.scores.filter(n => n > 0).length;

  return { pops, birds, totalBirds, deuces, totalDeuces, chicago, totalChicago, modChicago, totalModChicago, net, totalNet, holesPlayed }
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


export const flattenAndCalculate = (rounds, league, event, isYearly = false) => {
  const players = [];

  // 1. Flatten into a uniform list
  rounds.forEach(round => {
    if (round.players) {
      // Live/Foursome format
      round.players.forEach(p => {
        players.push({
          ...p,
          id: p.id,
          scores: round.scores?.[p.id] || new Array(round.holes || 18).fill(0),
          courseSnapshot: round.courseSnapshot,
          name: p.name || `${p.fname} ${p.lname}`,
          holes: round.holes || 18
        });
      });
    } else {
      // Historic/Individual format
      players.push({ ...round, name: round.name || `${round.fname} ${round.lname}` });
    }
  });

  // 2. Run the math
  return players.map(p => {
    const teeData = p.courseSnapshot?.tees?.[p.tee];
    if (!teeData) return { ...p, netRel: 0, holesPlayed: 0, birds: 0, deuces: 0, chicago: 0 };

    const pops = calcPops(p.scores, teeData.hnds, p.index, isYearly);
    const { rel, holesPlayed } = calcNetRelative(p.scores, pops, teeData.pars);

    return {
      ...p,
      holesPlayed,
      netRel: rel,
      birds: calcBirds(p, event, teeData, isYearly).reduce((a, b) => a + b, 0),
      deuces: calcDeuces(p, teeData, isYearly).reduce((a, b) => a + b, 0),
      chicago: calcChicago(p, teeData).reduce((a, b) => a + b, 0),
    };
  });
};