export const calcPops = (round, teeData) => {
  return teeData.hnds.map((hnd) => {
    let pop = (Math.floor(Math.round(round.index) / 18) + ((Math.round(round.index) % 18 >= hnd) ? 1 : 0))
    return (pop > 0) ? pop : 0
  })
}

export const calcGames = (round, cal, teeData, pops) => {

  const ddHoles = (cal?.type === 'vegas' && cal?.ddHole) ? cal.ddHole : [];

  const pars = teeData.pars;
  const hnds = teeData.hnds;
  const roundType = cal.type;
  const leagueId = cal.leagueID || cal.leagueId;

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
    if (cal.appHandicap) {
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

  const adjusted = round.scores.map((score, i) => {
    const maxScore = (score > 0) ? pars[i] + 2 + pops[i] : 0;
    return Math.min(score, maxScore);
  });

  const totalAdjusted = adjusted.reduce((sum, val) => sum + val, 0);

  return { pops, pars, hnds, roundType, leagueId,
    birds, totalBirds, 
    deuces, totalDeuces, 
    chicago, totalChicago, 
    modChicago, totalModChicago, 
    net, totalNet, 
    holesPlayed, 
    grossUnder, totalGrossUnder,
    adjusted, totalAdjusted, 
    totalGross }
};

export const getTotals = (values) => {
  const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);
  return [ sum(values.slice(0, 9)), sum(values.slice(9, 18)), sum(values) ];
};

export const calcRounds = (rounds, cal) => {
  return rounds.map(round => {
    const teeData = round.courseSnapshot?.tees?.[round.teesId];
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


/**
 * Internal helper for USGA tie-breaker (Countback)
 * Compares Last 9, 6, 3, 18, then 17 back to 1.
 */
export const getTieBreakerValue = (scores, isHigherBetter = false) => {
  if (!scores || scores.length < 18) return Array(22).fill(0);

  const last9 = scores.slice(9, 18).reduce((a, b) => a + (Number(b) || 0), 0);
  const last6 = scores.slice(12, 18).reduce((a, b) => a + (Number(b) || 0), 0);
  const last3 = scores.slice(15, 18).reduce((a, b) => a + (Number(b) || 0), 0);
  const reversedHoles = [...scores].reverse();

  // Create sequence: [L9, L6, L3, H18, H17, ..., H1]
  const values = [last9, last6, last3, ...reversedHoles];
  
  // For Net (lower is better), negate values so the highest "negated" value wins
  return isHigherBetter ? values : values.map(v => -v);
};

export const runLeaguePass = (players, eventDetails) => {
  const totalHoles = eventDetails?.holes || 18;
  const gameKeys = eventDetails?.game || [];
  const numPlayers = players?.length || 0;

  const winnersLog = {
    grossSkins: [],
    netSkins: [],
    deuces: [],
    blindBestBall: [] 
  };

  const per = eventDetails?.per || 0;
  const money = eventDetails?.money || 0;
  const potPerGame = ((per * money) / (gameKeys.length || 1)) * numPlayers;

  // ==========================================================
  // 1. HOLE-BY-HOLE GAMES (Skins & Deuces)
  // ==========================================================
  for (let i = 0; i < totalHoles; i++) {
    const holeNum = i + 1;
    
    const holeScores = players.map(p => ({
      id: p.id,
      name: p.name,
      gross: p.scores?.[i] || 0,
      // Actual net score for this hole (gross adjusted for handicap
      // pops/allowance), not net-relative-to-par -- p.games.net[i] is
      // already net-to-par, so adding the hole's par back out recovers the
      // real net stroke count. This also happens to be the more correct
      // basis for a skins winner in a mixed-tee league, where players can
      // be on tees with different pars for the same hole number: comparing
      // net-to-par would let a par difference between tees swing who wins,
      // whereas actual net strokes is tee-difficulty-neutral.
      net: (p.games?.net?.[i] ?? 99) + (p.games?.pars?.[i] ?? 0)
    })).filter(s => s.gross > 0);

    if (holeScores.length < numPlayers || numPlayers === 0) continue;

    if (gameKeys.includes('Gross Skins')) {
      const minGross = Math.min(...holeScores.map(s => s.gross));
      const gWinners = holeScores.filter(s => s.gross === minGross);
      if (gWinners.length === 1) {
        winnersLog.grossSkins.push({ hole: holeNum, player: gWinners[0].name, score: gWinners[0].gross, id: gWinners[0].id });
      }
    }

    if (gameKeys.includes('Net Skins')) {
      const minNet = Math.min(...holeScores.map(s => s.net));
      const nWinners = holeScores.filter(s => s.net === minNet);
      if (nWinners.length === 1) {
        winnersLog.netSkins.push({ hole: holeNum, player: nWinners[0].name, score: nWinners[0].net, id: nWinners[0].id });
      }
    }

    if (gameKeys.includes('Deuce Pot')) {
      holeScores.forEach(s => { 
        if (s.gross === 2) winnersLog.deuces.push({ hole: holeNum, player: s.name, score: 2, id: s.id }); 
      });
    }
  }

  // ==========================================================
  // 2. BLIND BEST BALL (Team Logic)
  // ==========================================================
  if (numPlayers > 1 && gameKeys.includes('Blind Best Ball')) {
    let pairings = [];
    const officialPairings = eventDetails?.bbb_pairings || [];

    const getPairingData = (p1, p2) => {
      let teamTotalNetRel = 0;
      let teamHoleScores = [];

      for (let h = 0; h < totalHoles; h++) {
        const p1Net = p1.games?.net?.[h] ?? 99;
        const p2Net = p2.games?.net?.[h] ?? 99;

        const bestNet = Math.min(p1Net, p2Net);
        teamHoleScores.push(bestNet < 50 ? bestNet : 0);
        if (bestNet < 50) teamTotalNetRel += bestNet; 
      }

      return {
        player: `${p1.name} / ${p2.name}`,
        score: teamTotalNetRel,
        id: `${p1.id}|${p2.id}`,
        p1: p1,
        p2: p2,
        tieBreaker: getTieBreakerValue(teamHoleScores, false)
      };
    };

    // Pairing Assignment
    if (officialPairings.length > 0) {
      officialPairings.forEach(pair => {
        const p1 = players.find(p => p.id === pair.p1?.id);
        const p2 = players.find(p => p.id === pair.p2?.id);
        if (p1 && p2) pairings.push(getPairingData(p1, p2));
      });
    } else {
      // Seeded Fisher-Yates shuffle. The previous approach (sort players by
      // hash(playerId + iso)) looked randomized but wasn't: iso is always
      // exactly 10 characters ("YYYY-MM-DD"), and for this style of
      // polynomial rolling hash that makes hash(id + iso) reduce to
      // hash(id)*K + C, where K and C are the *same* fixed constants for
      // every player on every event (K depends only on iso's length, which
      // never changes; C is an additive offset that cancels out entirely
      // when comparing two players' values). So the date had essentially no
      // effect on sort order -- the same set of players produced the same
      // pairings week after week. A real seeded PRNG driving Fisher-Yates
      // doesn't have that degenerate-to-a-constant problem: each swap
      // genuinely depends on the seed and how far the shuffle has already
      // progressed.
      const stringToSeed = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        return hash;
      };

      // mulberry32 -- small, fast, well-distributed seeded PRNG.
      const mulberry32 = (seed) => {
        let state = seed | 0;
        return () => {
          state = state + 0x6D2B79F5 | 0;
          let t = Math.imul(state ^ state >>> 15, 1 | state);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
      };

      // eventDetails.id (the event's own doc id) is unconditionally unique
      // per event, unlike iso which is only unique per league-day -- falls
      // back to iso if id is somehow missing. Salted differently per group
      // (M/W) so the men's and women's shuffles don't advance the same PRNG
      // sequence in lockstep.
      const seedBase = eventDetails?.id || eventDetails?.iso || '';
      const seededShuffle = (group, salt) => {
        const rand = mulberry32(stringToSeed(seedBase + salt));
        const result = [...group];
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
      };

      // Bucket by ladies vs. everyone else (mens, senior, or unset) rather than
      // requiring an exact 'mens' match -- tee_type can be 'senior' (a valid,
      // commonly-used category per PlayerCreateModal/PlayerPicker), and an
      // exact-match check silently dropped those players from every pairing,
      // including the leftover fallback, since they landed in neither bucket.
      const isLadies = (p) => (p.tee_type || '').toLowerCase() === 'ladies';
      const women = players.filter(isLadies);
      const men = players.filter(p => !isLadies(p));

      const shuffledMen = seededShuffle(men, 'M');
      const shuffledWomen = seededShuffle(women, 'W');

      const maxPairs = Math.max(shuffledMen.length, shuffledWomen.length);
      const leftovers = [];

      for (let i = 0; i < maxPairs; i++) {
        const man = shuffledMen[i];
        const woman = shuffledWomen[i];
        if (man && woman) pairings.push(getPairingData(man, woman));
        else leftovers.push(man || woman);
      }

      for (let i = 0; i < leftovers.length; i += 2) {
        if (leftovers[i] && leftovers[i+1]) pairings.push(getPairingData(leftovers[i], leftovers[i+1]));
      }
    }

    winnersLog.blindBestBall = [...pairings].sort((a, b) => {
      if (Math.abs(a.score - b.score) > 0.0001) return a.score - b.score;
      for (let i = 0; i < a.tieBreaker.length; i++) {
        if (a.tieBreaker[i] !== b.tieBreaker[i]) return b.tieBreaker[i] - a.tieBreaker[i];
      }
      return 0;
    });
  }

  // ==========================================================
  // 3. APPLY PAYOUTS & WIN MAP
  // ==========================================================
  const applyPayouts = (list) => {
    if (!list || list.length === 0) return [];
    const payoutPerWinner = potPerGame / list.length;
    return list.map(w => ({ ...w, money: payoutPerWinner }));
  };

  const finalWinnersLog = {
    grossSkins: applyPayouts(winnersLog.grossSkins),
    netSkins: applyPayouts(winnersLog.netSkins),
    deuces: applyPayouts(winnersLog.deuces),
    blindBestBall: applyPayouts(winnersLog.blindBestBall) 
  };

  const winMap = {};
  // abbr is the compact on-card badge label (G/N/D + score + hole, e.g.
  // "N3·14") -- category is a stable key for filtering (PlayerCard's
  // shouldShowBadge) instead of parsing the label text, which broke the
  // moment the label stopped starting with the full game name.
  const categories = [
    { key: 'grossSkins', abbr: 'G', color: 'bg-amber-500/10 text-amber-600' },
    { key: 'netSkins', abbr: 'N', color: 'bg-emerald-500/10 text-emerald-600' },
    { key: 'deuces', abbr: 'D', color: 'bg-blue-500/10 text-blue-600' }
  ];

  categories.forEach(({ key, abbr, color }) => {
    (finalWinnersLog[key] || []).forEach(win => {
      if (!winMap[win.id]) {
        winMap[win.id] = { individualBadges: [], totalMoney: 0 };
      }
      winMap[win.id].individualBadges.push({ label: `${abbr}${win.score}·${win.hole}`, category: key, color });
      winMap[win.id].totalMoney += (win.money || 0);
    });
  });

  const augmentedPlayers = players.map(p => ({
    ...p,
    winStats: winMap[p.id] || { individualBadges: [], totalMoney: 0 }
  }));

  return {
    winnersLog: finalWinnersLog,
    players: augmentedPlayers
  };
};

/**
 * Calculates the total par for a tee based on its pars array.
 */
export const getTeePar = (teeData) => {
  return teeData?.pars?.reduce((sum, val) => sum + Number(val), 0) || teeData?.par || 72
}

/**
 * Resolves the correct Tee ID for a player based on hierarchy.
 */
export const getDefaultTeeId = (player, course, isLeague, currentLeague, scheduledEvent = null) => {
  if (!course) return ''
  const pType = (player.tee_type || 'mens').toLowerCase()

  if (scheduledEvent?.teesId && scheduledEvent.tees !== 'Mixed') return scheduledEvent.teesId
  if (isLeague && currentLeague?.tees !== 'Mixed' && currentLeague?.teesId) return currentLeague.teesId
  if (course.tee_types && course.tee_types[pType]) return course.tee_types[pType]
  
  const targetName = TEE_MAPPING[pType] || 'Blue'
  const teesArray = Array.isArray(course.tees) 
    ? course.tees 
    : Object.entries(course.tees || {}).map(([id, t]) => ({ id, ...t }))
  
  const foundTee = teesArray.find(t => t.name === targetName)
  if (foundTee) return foundTee.id

  return teesArray[0]?.id || ''
}

/**
 * Creates the official Player Snapshot for a live_rounds document.
 */
export const createPlayerSnapshot = (player, teeId, course, isAppManaged, leagueId) => {
  const tees = course.tees || {}
  const teeData = Array.isArray(tees) ? tees.find(t => t.id === teeId) : tees[teeId]
  const teePar = getTeePar(teeData)
  
  let finalIndex = 0
  let finalCourseHcp = 0

  if (isAppManaged) {
    const rawLeagueHcp = player.leagueHandicaps?.[leagueId] ?? ((player.ghin ?? 0) - 3)
    finalIndex = parseFloat(rawLeagueHcp)
    finalCourseHcp = parseFloat(finalIndex.toFixed(3))
  } else {
    finalIndex = player.ghin ?? 0
    finalCourseHcp = calcCourseHandicap(finalIndex, teeData?.slope || 113, teeData?.rating || 72, teePar)
  }

  return {
    id: player.id,
    fname: player.fname,
    lname: player.lname,
    ghin: finalIndex, 
    index: finalCourseHcp, 
    teesId: teeId,
    tees: teeData?.name || teeId, 
    tee_type: player.tee_type || 'mens'
  }
}