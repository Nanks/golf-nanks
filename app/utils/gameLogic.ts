/**
 * Shared helper to calculate handicap "pops" (strokes) per hole
 */
export const calcPops = (scores: number[], courseHandicaps: number[], playerIndex: number): number[] => {
  const roundedIndex = Math.round(playerIndex);
  const basePop = Math.floor(roundedIndex / 18);
  const remainder = roundedIndex % 18;

  return courseHandicaps.map((hnd) => {
    const pop = basePop + (remainder >= hnd ? 1 : 0);
    return Math.max(0, pop);
  });
};

/**
 * Calculates Birds (Points based on score vs par + pops)
 */
export const calcBirds = (round: any, cal: any, teeData: any): number[] => {
  const pops = calcPops(round.scores, teeData.hnds, round.index || 0);
  const ddHoles = cal?.type === 'vegas' && cal?.ddHole ? cal.ddHole : [];
  const birdMult = cal?.type === 'mbWed' && cal?.birdMult ? cal.birdMult : 1;

  return round.scores.map((score: number, i: number) => {
    if (score <= 0) return 0;
    
    const isDoubleDown = ddHoles.includes(i + 1) ? 2 : 1;
    const par = teeData.pars[i];
    const pop = pops[i];

    // Original Logic: ((Par - (Score - Pops)) * 0.5) OR ((Par - Score) + (Pops * 0.5))
    const bird = (score > par) 
      ? ((par - (score - pop)) * 0.5) * isDoubleDown 
      : ((par - score) + (pop * 0.5)) * isDoubleDown;
    return Math.max(0, bird * birdMult);
  });
};

/**
 * Calculates Deuces (Natural or Net 2s)
 */
export const calcDeuces = (round: any, teeData: any): number[] => {
  const pops = calcPops(round.scores, teeData.hnds, round.index || 0);
  return round.scores.map((score: number, i: number) => {
    if (!score) return 0;
    const hasPop = pops[i] > 0 ? 1 : 0;
    // Returns 1 if (Gross Score - 1 pop) <= 2
    return (score - hasPop <= 2) ? 1 : 0;
  });
};

/**
 * Calculates Chicago Points (2, 4, 8... based on relationship to par)
 */
export const calcChicago = (round: any, teeData: any, isModified = false): number[] => {
  return round.scores.map((score: number, i: number) => {
    if (score <= 0) return 0;
    const parDiff = teeData.pars[i] - score;
    
    if (parDiff > -2) {
      return 2 * Math.pow(2, parDiff);
    }
    return isModified ? -1 : 0;
  });
};

/**
 * Standard Totals (Front 9, Back 9, Total)
 */
export const getTotals = (values: number[]) => {
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  return [
    sum(values.slice(0, 9)),
    sum(values.slice(9, 18)),
    sum(values)
  ];
};
