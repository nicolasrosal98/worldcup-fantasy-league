// Leaderboard-time bonuses computed from existing predictions/matches.
// ----------------------------------------------------------
// Perfect day ......... +5 for calling the outcome of EVERY match on a
//                       day with 2+ finished matches (must predict all)
// Daily duel .......... each matchday you're paired with another player
//                       (round-robin rotation); most points from that
//                       day's matches wins +3 (ties: nobody)
// ----------------------------------------------------------

export const PERFECT_DAY_POINTS = 5;
export const DUEL_WIN_POINTS = 3;

const outcomeOf = (h, a) => Math.sign(h - a);

// Groups finished matches by UTC kickoff date -> [match, ...]
function finishedByDay(matches) {
  const days = {};
  for (const m of matches) {
    if (m.home_score === null || m.home_score === undefined) continue;
    (days[m.kickoff.slice(0, 10)] ||= []).push(m);
  }
  return days;
}

// Map of user_id -> { perfectDays, duelWins, bonus }
export function computeDailyBonuses(userIds, matches, predictions) {
  const days = finishedByDay(matches);
  const allByDay = {};
  for (const m of matches) {
    (allByDay[m.kickoff.slice(0, 10)] ||= []).push(m);
  }
  const predByUserMatch = new Map(
    predictions.map((p) => [`${p.user_id}:${p.match_id}`, p])
  );

  const out = new Map(
    userIds.map((id) => [id, { perfectDays: 0, duelWins: 0, bonus: 0 }])
  );

  for (const [day, finished] of Object.entries(days)) {
    // Both bonuses only settle once the whole matchday is played
    if (allByDay[day].length !== finished.length) continue;

    // Perfect day
    if (finished.length >= 2) {
      for (const uid of userIds) {
        const perfect = finished.every((m) => {
          const p = predByUserMatch.get(`${uid}:${m.id}`);
          return p && outcomeOf(p.home_score, p.away_score) ===
            outcomeOf(m.home_score, m.away_score);
        });
        if (perfect) {
          const u = out.get(uid);
          u.perfectDays++;
          u.bonus += PERFECT_DAY_POINTS;
        }
      }
    }

    // Daily duel
    const pairs = duelPairs(userIds, day);
    const dayPts = (uid) =>
      finished.reduce(
        (s, m) => s + (predByUserMatch.get(`${uid}:${m.id}`)?.points || 0), 0
      );
    for (const [a, b] of pairs) {
      if (a > b) continue; // each pair once
      const pa = dayPts(a);
      const pb = dayPts(b);
      if (pa === pb) continue;
      const winner = out.get(pa > pb ? a : b);
      winner.duelWins++;
      winner.bonus += DUEL_WIN_POINTS;
    }
  }
  return out;
}

// Deterministic round-robin pairing for a given day: every player gets one
// opponent (odd player count -> one person rests). Returns Map id -> id.
export function duelPairs(userIds, dayIso) {
  const ids = [...userIds].sort((a, b) => a - b);
  if (ids.length < 2) return new Map();
  if (ids.length % 2) ids.push(null); // bye
  const n = ids.length;
  const r = hash(dayIso) % (n - 1);

  const map = new Map();
  for (let i = 0; i < n / 2; i++) {
    const a = ids[i === 0 ? n - 1 : (r + i) % (n - 1)];
    const b = ids[(r + (n - 1) - i) % (n - 1)];
    if (a !== null && b !== null) {
      map.set(a, b);
      map.set(b, a);
    }
  }
  return map;
}

function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
