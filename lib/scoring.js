// Scoring system
// ----------------------------------------------------------
// Exact score ........................ 5 pts
// Correct outcome (win/draw/loss) .... 2 pts
// Each correct scorer named (max 3) .. +3 pts each
// Scorer multiplier .................. all named scorers correct AND
//                                      at least 2 named -> match pts x1.5
// First-goal half bonus bet .......... +2 pts if correct, -1 if wrong
// Side bets (each optional, -1 if wrong):
//   Both teams to score (yes/no) ..... +2
//   Over/under 2.5 goals ............. +2
//   Red card shown (long shot) ....... +3
//   Penalty awarded .................. +2
//   Hat-trick scored (long shot) ..... +5
// Against the crowd .................. +3 for a correct outcome that the
//                                      league majority predicted differently
// Daily boost ........................ doubles the match total (one per day)
// Overall winner pick ................ 25 pts (locked at knockout rounds)
// Golden Boot pick ................... 15 pts (locked at knockout rounds)
// ----------------------------------------------------------

export const WINNER_PICK_POINTS = 25;
export const TOP_SCORER_POINTS = 15;

// Per-bet breakdown of a finished match: [{ label, pts }, ...] summing to the
// match total. Multiplicative steps (scorer multiplier, boost) appear as the
// points they added. Returns null while the match has no result.
export function breakdownMatchPrediction(pred, match) {
  if (match.home_score === null || match.home_score === undefined) return null;

  const items = [];
  let pts = 0;
  const add = (label, p) => { items.push({ label, pts: p }); pts += p; };

  const exact =
    pred.home_score === match.home_score && pred.away_score === match.away_score;
  const outcome =
    Math.sign(pred.home_score - pred.away_score) ===
    Math.sign(match.home_score - match.away_score);

  if (exact) add('🎯 Exact score', 5);
  else if (outcome) add('✅ Correct outcome', 2);

  const notes0 = safeParse(match.notes) || {};
  // crowd_outcome ('H'|'D'|'A') is the league's majority prediction, stored
  // on the result when there's a clear majority among 3+ predictions
  if (outcome && notes0.crowd_outcome) {
    const sign = Math.sign(pred.home_score - pred.away_score);
    const mine = sign > 0 ? 'H' : sign < 0 ? 'A' : 'D';
    if (mine !== notes0.crowd_outcome) add('🦄 Against the crowd', 3);
  }

  const actualScorers = normalize(JSON.parse(match.scorers || '[]'));
  const predScorers = normalize(JSON.parse(pred.scorers || '[]'));
  let correctScorers = 0;
  for (const p of predScorers) {
    if (actualScorers.includes(p)) correctScorers++;
  }
  if (correctScorers > 0) {
    add(`⚽ ${correctScorers} scorer${correctScorers > 1 ? 's' : ''} right`, correctScorers * 3);
  }
  if (predScorers.length >= 2 && correctScorers === predScorers.length) {
    add('✨ All scorers right ×1.5', Math.round(pts * 1.5) - pts);
  }

  const notes = notes0;

  if (pred.first_goal_half === 1 || pred.first_goal_half === 2) {
    const actualHalf = notes.first_goal_half;
    if (actualHalf) {
      add('🥅 First-goal half bet', pred.first_goal_half === actualHalf ? 2 : -1);
    }
  }

  const bets = safeParse(pred.side_bets) || {};
  const total = match.home_score + match.away_score;

  if (bets.btts === true || bets.btts === false) {
    const btts = match.home_score > 0 && match.away_score > 0;
    add('🎰 Both teams to score', bets.btts === btts ? 2 : -1);
  }
  if (bets.goals === 'over' || bets.goals === 'under') {
    add(`🎰 ${bets.goals === 'over' ? 'Over' : 'Under'} 2.5 goals`,
      bets.goals === (total > 2.5 ? 'over' : 'under') ? 2 : -1);
  }
  // Long shots only grade once the admin recorded them on the result;
  // notes flags are true/false when entered, absent on old results.
  const longShots = [
    ['red_card', '🟥 Red card bet', 3],
    ['penalty', '🎯 Penalty bet', 2],
    ['hat_trick', '🎩 Hat-trick bet', 5],
  ];
  for (const [key, label, win] of longShots) {
    if (bets[key] === true && typeof notes[key] === 'boolean') {
      add(label, notes[key] ? win : -1);
    }
  }

  if (pred.boost) add('⚡ Daily boost ×2', pts);
  return items;
}

export function scoreMatchPrediction(pred, match) {
  const items = breakdownMatchPrediction(pred, match);
  if (items === null) return null;
  return items.reduce((sum, i) => sum + i.pts, 0);
}

// Golden Boot: top scorer(s) so far, computed from the scorers entered on
// results. Returns a Set of normalized names (ties all count).
export function computeTopScorers(matches) {
  const tally = {};
  for (const m of matches) {
    if (m.home_score === null || m.home_score === undefined) continue;
    for (const s of normalize(JSON.parse(m.scorers || '[]'))) {
      tally[s] = (tally[s] || 0) + 1;
    }
  }
  const max = Math.max(0, ...Object.values(tally));
  return new Set(
    max > 0 ? Object.keys(tally).filter((s) => tally[s] === max) : []
  );
}

function normalize(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((s) => String(s).trim().toLowerCase())
    .filter(Boolean);
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
