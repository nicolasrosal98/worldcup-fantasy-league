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
// Daily boost ........................ doubles the match total (one per day)
// Overall winner pick ................ 25 pts (locked at tournament kickoff)
// ----------------------------------------------------------

export const WINNER_PICK_POINTS = 25;

export function scoreMatchPrediction(pred, match) {
  if (match.home_score === null || match.home_score === undefined) return null;

  let pts = 0;
  const exact =
    pred.home_score === match.home_score && pred.away_score === match.away_score;
  const outcome =
    Math.sign(pred.home_score - pred.away_score) ===
    Math.sign(match.home_score - match.away_score);

  if (exact) pts += 5;
  else if (outcome) pts += 2;

  const actualScorers = normalize(JSON.parse(match.scorers || '[]'));
  const predScorers = normalize(JSON.parse(pred.scorers || '[]'));
  let correctScorers = 0;
  for (const p of predScorers) {
    if (actualScorers.includes(p)) correctScorers++;
  }
  pts += correctScorers * 3;

  if (predScorers.length >= 2 && correctScorers === predScorers.length) {
    pts = Math.round(pts * 1.5);
  }

  const notes = safeParse(match.notes);

  if (pred.first_goal_half === 1 || pred.first_goal_half === 2) {
    const actualHalf = notes && notes.first_goal_half;
    if (actualHalf) pts += pred.first_goal_half === actualHalf ? 2 : -1;
  }

  pts += scoreSideBets(safeParse(pred.side_bets) || {}, match, notes || {});

  if (pred.boost) pts *= 2;
  return pts;
}

function scoreSideBets(bets, match, notes) {
  let pts = 0;
  const total = match.home_score + match.away_score;

  if (bets.btts === true || bets.btts === false) {
    const btts = match.home_score > 0 && match.away_score > 0;
    pts += bets.btts === btts ? 2 : -1;
  }
  if (bets.goals === 'over' || bets.goals === 'under') {
    pts += bets.goals === (total > 2.5 ? 'over' : 'under') ? 2 : -1;
  }
  // Long shots only grade once the admin recorded them on the result;
  // notes flags are true/false when entered, absent on old results.
  const longShots = { red_card: 3, penalty: 2, hat_trick: 5 };
  for (const [key, win] of Object.entries(longShots)) {
    if (bets[key] === true && typeof notes[key] === 'boolean') {
      pts += notes[key] ? win : -1;
    }
  }
  return pts;
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
