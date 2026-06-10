// Scoring system
// ----------------------------------------------------------
// Exact score ........................ 5 pts
// Correct outcome (win/draw/loss) .... 2 pts
// Each correct scorer named (max 3) .. +3 pts each
// Scorer multiplier .................. all named scorers correct AND
//                                      at least 2 named -> match pts x1.5
// First-goal half bonus bet .......... +2 pts if correct, -1 if wrong
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

  if (pred.first_goal_half === 1 || pred.first_goal_half === 2) {
    const notes = safeParse(match.notes);
    const actualHalf = notes && notes.first_goal_half;
    if (actualHalf) pts += pred.first_goal_half === actualHalf ? 2 : -1;
  }

  if (pred.boost) pts *= 2;
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
