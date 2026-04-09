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